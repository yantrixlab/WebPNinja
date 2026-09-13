import sharp from 'sharp';
import * as iq from 'image-q';
import jpegEncode from '@jsquash/jpeg/encode.js';
import webpEncode from '@jsquash/webp/encode.js';
import avifEncode from '@jsquash/avif/encode.js';
import pngEncode from '@jsquash/png/encode.js';
import oxipng from '@jsquash/oxipng/optimise.js';
import { ensureCodecsInitialized } from './wasmInit.js';

export const SUPPORTED_FORMATS = ['webp', 'jpeg', 'png', 'avif'];

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
  const { data, info } = await sharp(inputBuffer)
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
  const imageData = await decodeToImageData(inputBuffer);

  let buffer;
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
      const quantized = await quantizeImageData(imageData, q);
      const pngBuf = await pngEncode(quantized);
      buffer = await oxipng(pngBuf, { level: 4 });
      break;
    }
  }

  return { buffer: Buffer.from(buffer), mime: MIME_BY_FORMAT[format] };
}
