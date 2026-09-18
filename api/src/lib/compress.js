import sharp from 'sharp';
import * as iq from 'image-q';
import jpegEncode from '@jsquash/jpeg/encode.js';
import webpEncode from '@jsquash/webp/encode.js';
import avifEncode from '@jsquash/avif/encode.js';
import pngEncode from '@jsquash/png/encode.js';
import oxipng from '@jsquash/oxipng/optimise.js';
import { ensureCodecsInitialized } from './wasmInit.js';

export const SUPPORTED_FORMATS = ['webp', 'jpeg', 'png', 'avif'];

// sharp/libvips refuses to decode anything over ~268M px by default (a
// decompression-bomb guard) — but images too large for the browser to
// compress itself (the whole reason this server path exists) are exactly
// the ones likely to cross that line, and both decode paths below hit the
// same default, so raising it once here fixed a real oversized upload that
// failed identically on both the WASM and sharp-native paths. Still well
// short of `false` (fully unlimited) since the multer upload-size cap is the
// only other bound protecting this route from a crafted decompression bomb.
// (A real 27866×15682px/437MP upload is the reason this is as high as it is —
// raise further if a legitimate image ever exceeds this too.)
const SHARP_MAX_PIXELS = 1_000_000_000;

// WebP's bitstream and HEIF's (AVIF's container) both hard-cap dimensions —
// a format-level limit no encoder, WASM or native, can be configured around.
// Empirically confirmed against sharp/libvips directly: 16384×16384 encodes
// fine, 16385 on either side fails ("too large for the WebP/HEIF format").
// Rather than reject an oversized image outright, it's downscaled (never
// upscaled) to fit before encoding — still private, still compressed, just
// at a resolution the format can actually represent.
const MAX_DIMENSION_BY_FORMAT = { webp: 16383, avif: 16384 };

// image-q's quantization is pure JS with no internal memory ceiling of its
// own (unlike the WASM encoders below, which fail with a catchable error
// once they hit their fixed allocation) — past a certain size it just keeps
// consuming heap until V8 hits a fatal, generally *uncatchable* OOM that
// kills the whole process, not just this request. A real 20000×18000px
// upload crashed the server entirely at this step. Past this threshold we
// skip straight to sharp's native (libimagequant-backed) palette encoder,
// which does the same kind of quantization in native code with no such risk.
const PNG_QUANTIZE_MAX_PIXELS = 40_000_000;

const MIME_BY_FORMAT = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
};

/**
 * Decodes any input image sharp understands into an ImageData-shaped object
 * (data/width/height), mirroring the browser tool's <canvas> decode step —
 * jsquash's WASM encoders only read those three properties, so a plain
 * object stands in for the DOM's ImageData class here in Node.
 */
async function decodeToImageData(inputBuffer) {
  const { data, info } = await sharp(inputBuffer, { limitInputPixels: SHARP_MAX_PIXELS })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height };
}

/**
 * Same pngquant-style quantization as Compressor.astro's quantizeImageData:
 * quality 0-100 maps to 8-256 colors, Wu quantization + Floyd-Steinberg dither.
 */
async function quantizeImageData(imageData, quality) {
  const numColors = Math.max(8, Math.min(256, Math.round(8 + (quality / 100) * 248)));

  const inContainer = iq.utils.PointContainer.fromImageData(imageData);
  const palette = await iq.buildPalette([inContainer], {
    colors: numColors,
    colorDistanceFormula: 'euclidean',
    paletteQuantization: 'wuquant',
  });
  const outContainer = await iq.applyPalette(inContainer, palette, {
    colorDistanceFormula: 'euclidean',
    imageQuantization: 'floyd-steinberg',
  });

  const rgba = outContainer.toUint8Array();
  return { data: new Uint8ClampedArray(rgba.buffer), width: imageData.width, height: imageData.height };
}

/**
 * Encodes via sharp/libvips directly instead of the jsquash WASM codecs.
 * Used only as a fallback (see below) for images too large for those WASM
 * modules' fixed memory ceiling — libvips has no such ceiling, at the cost
 * of slightly different output characteristics than the WASM path.
 */
async function sharpNativeEncode(inputBuffer, format, quality) {
  const pipeline = sharp(inputBuffer, { limitInputPixels: SHARP_MAX_PIXELS });
  switch (format) {
    case 'jpeg': return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    case 'webp': return pipeline.webp({ quality }).toBuffer();
    case 'avif': return pipeline.avif({ quality }).toBuffer();
    case 'png': {
      // palette:true runs libimagequant (native, pngquant-style) instead of
      // a plain lossless re-encode — keeps output size comparable to the
      // primary image-q path this is standing in for.
      const numColors = Math.max(8, Math.min(256, Math.round(8 + (quality / 100) * 248)));
      return pipeline.png({ palette: true, quality, colors: numColors, effort: 8 }).toBuffer();
    }
    default:     throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Compresses inputBuffer to the given output format/quality using the exact
 * same jsquash calls and options as the browser tool (src/components/Compressor.astro),
 * so API output quality matches the free tool at the same settings.
 */
export async function compressImage(inputBuffer, { format, quality }) {
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }
  const q = Math.max(10, Math.min(100, Math.round(quality)));
  await ensureCodecsInitialized();

  // Cheap header read (no full pixel decode) so a genuinely oversized image
  // is rejected immediately with real dimensions in the message, instead of
  // wasting a decode attempt just to get sharp's generic "exceeds pixel
  // limit" string back with no size information in it at all.
  const meta = await sharp(inputBuffer, { limitInputPixels: false }).metadata();
  const totalPixels = (meta.width ?? 0) * (meta.height ?? 0);
  if (totalPixels > SHARP_MAX_PIXELS) {
    throw new Error(`Image is ${meta.width}×${meta.height}px (${Math.round(totalPixels / 1_000_000)} megapixels) — exceeds this server's ${Math.round(SHARP_MAX_PIXELS / 1_000_000)}MP processing limit`);
  }

  // Downscale up front if the target format can't represent these
  // dimensions at all — every codec attempt below would otherwise fail
  // identically regardless of memory, quality, or encoder used.
  let workingBuffer = inputBuffer;
  let resizedFrom = null;
  const maxDim = MAX_DIMENSION_BY_FORMAT[format];
  if (maxDim && (meta.width > maxDim || meta.height > maxDim)) {
    workingBuffer = await sharp(inputBuffer, { limitInputPixels: false })
      .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    resizedFrom = { width: meta.width, height: meta.height };
  }

  let imageData;
  let buffer;
  try {
    imageData = await decodeToImageData(workingBuffer);

    switch (format) {
      case 'jpeg':
        buffer = await jpegEncode(imageData, { quality: q });
        break;
      case 'webp':
        buffer = await webpEncode(imageData, { quality: q, method: 6, sns_strength: 90, filter_strength: 60 });
        break;
      case 'avif':
        buffer = await avifEncode(imageData, { quality: q, speed: 6 });
        break;
      case 'png': {
        if (imageData.width * imageData.height > PNG_QUANTIZE_MAX_PIXELS) {
          throw new Error(`Image too large (${imageData.width}×${imageData.height}px) for in-process PNG quantization`);
        }
        const quantized = await quantizeImageData(imageData, q);
        const pngBuf = await pngEncode(quantized);
        buffer = await oxipng(pngBuf, { level: 4 });
        break;
      }
    }
    buffer = Buffer.from(buffer);
  } catch (err) {
    // The WASM codecs decode the whole image into a raw RGBA buffer in
    // linear memory with a fixed ceiling well below what libvips can
    // handle — a very large image (this is the exact case the browser
    // tool's server-side fallback exists for) can decode fine and then
    // blow past that ceiling on encode.
    console.warn('[compressImage] WASM codec failed, falling back to sharp native encoder:', err.message);
    buffer = await sharpNativeEncode(workingBuffer, format, q);
  }

  // Palette quantization/dithering occasionally backfires on an image that
  // doesn't actually benefit from color reduction (e.g. one that's already
  // highly regular/well-compressed) — a "compressor" that hands back
  // something bigger than what came in has failed at its one job. Only
  // applies when the request wasn't already asking to convert formats,
  // since a same-size format conversion still has value on its own.
  if (format === 'png' && meta.format === 'png' && buffer.length >= workingBuffer.length) {
    try {
      const relossless = await sharp(workingBuffer, { limitInputPixels: SHARP_MAX_PIXELS })
        .png({ palette: false, compressionLevel: 9, effort: 10 })
        .toBuffer();
      if (relossless.length < buffer.length) buffer = relossless;
    } catch (err) {
      console.warn('[compressImage] lossless re-encode retry failed:', err.message);
    }
    // Still not smaller than the original? Don't pretend — hand it back
    // unchanged rather than shipping something larger under the guise of
    // "compression".
    if (buffer.length >= workingBuffer.length) buffer = workingBuffer;
  }

  return { buffer, mime: MIME_BY_FORMAT[format], resizedFrom };
}
