/// <reference lib="webworker" />
/**
 * Runs the exact same jsquash/image-q compression pipeline as the browser
 * tool previously ran on the main thread — but inside a dedicated Worker.
 *
 * The jsquash WASM encoders (and image-q's quantization) are synchronous,
 * CPU-bound calls: `await`ing them doesn't yield to the event loop, so on
 * the main thread a large or highly-complex image can block all rendering
 * for the entire encode (confirmed: even a screenshot request timed out
 * mid-encode on a 3000×3000 noise image). Moving the work here keeps the
 * tab responsive — the spinner keeps animating and phase/progress labels
 * keep painting — no matter how long the actual encode takes.
 */

declare const self: DedicatedWorkerGlobalScope;

// Same ceiling as the main thread's pre-flight header check (Compressor.astro)
// — kept here too as a safety net for formats that check can't recognize.
const MAX_CANVAS_PIXELS = 200_000_000;

// image-q's quantization is pure JS with no internal memory ceiling of its
// own — unlike the jsquash WASM encoders, which fail with a catchable error
// once they hit their fixed allocation, a large image here just keeps
// consuming heap until the tab hits a fatal, uncatchable OOM (this is the
// same failure mode fixed server-side in api/src/lib/compress.js — this is
// the client-side mirror of that fix, which had been missed here). Past
// this threshold, skip straight to the browser's native canvas PNG encoder
// instead, which has no such risk (at the cost of no lossy quantization).
const PNG_QUANTIZE_MAX_PIXELS = 40_000_000;

let _jpegEncode: ((d: ImageData, o?: any) => Promise<ArrayBuffer>) | null = null;
let _webpEncode: ((d: ImageData, o?: any) => Promise<ArrayBuffer>) | null = null;
let _avifEncode: ((d: ImageData, o?: any) => Promise<ArrayBuffer>) | null = null;
let _pngEncode:  ((d: ImageData) => Promise<ArrayBuffer>) | null = null;
let _oxipng:     ((d: ArrayBuffer, o?: any) => Promise<ArrayBuffer>) | null = null;

/** `flattenWhite` composites onto white first — for JPEG output, which has no
 *  alpha: the encoder would otherwise read transparent pixels' (usually
 *  black) RGB values and turn a transparent background black. */
async function decodeToImageData(file: File, flattenWhite = false): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  if (!width || !height) {
    bitmap.close();
    throw new Error('Browser could not decode this image (0×0 dimensions reported)');
  }
  if (width * height > MAX_CANVAS_PIXELS) {
    bitmap.close();
    throw new Error(`Image is ${width}×${height}px — too large for your browser to process (limit ~${MAX_CANVAS_PIXELS.toLocaleString()}px total)`);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  if (flattenWhite) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, width, height);
}

/* Same pngquant-style quantization as the main thread previously ran:
   quality 0-100 maps to 8-256 colors, Wu quantization + Floyd-Steinberg dither. */
async function quantizeImageData(imageData: ImageData, quality: number): Promise<ImageData> {
  const iq = await import('image-q');
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
  return new ImageData(new Uint8ClampedArray(rgba.buffer), imageData.width, imageData.height);
}

async function canvasFallback(file: File, q: number, mime: string): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  if (mime === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const qArg = mime === 'image/png' ? undefined : q / 100;
  return canvas.convertToBlob({ type: mime, quality: qArg });
}

async function compress(file: File, q: number, mime: string, onPhase: (label: string) => void): Promise<Blob> {
  onPhase('Decoding…');
  const imageData = await decodeToImageData(file, mime === 'image/jpeg');
  let buffer: ArrayBuffer;

  try {
    onPhase('Compressing…');
    switch (mime) {
      case 'image/jpeg': {
        if (!_jpegEncode) _jpegEncode = (await import('@jsquash/jpeg/encode')).default;
        buffer = await _jpegEncode(imageData, { quality: q });
        break;
      }
      case 'image/webp': {
        if (!_webpEncode) _webpEncode = (await import('@jsquash/webp/encode')).default;
        buffer = await _webpEncode(imageData, { quality: q, method: 6, sns_strength: 90, filter_strength: 60 });
        break;
      }
      case 'image/avif': {
        if (!_avifEncode) _avifEncode = (await import('@jsquash/avif/encode')).default;
        buffer = await _avifEncode(imageData, { quality: q, speed: 6 });
        break;
      }
      case 'image/png': {
        if (imageData.width * imageData.height > PNG_QUANTIZE_MAX_PIXELS) {
          // The browser's native canvas PNG encoder does no palette
          // reduction and barely any compression effort — on its own it can
          // come out *larger* than the original. oxipng operates on the
          // already-encoded PNG bytes (lossless recompression), not the raw
          // pixel buffer, so it doesn't carry image-q's crash risk here.
          onPhase('Encoding (large image)…');
          const nativeBlob = await canvasFallback(file, q, mime);
          if (!_oxipng) _oxipng = (await import('@jsquash/oxipng/optimise')).default;
          onPhase('Optimizing…');
          // level 4's exhaustive filter-strategy search is fine on typical
          // output sizes, but on a highly-compressible large image (a smooth
          // gradient/screenshot, as opposed to noise) the search space blows
          // up — measured 3+ minutes on a 61-megapixel gradient at level 4
          // vs. seconds at level 1. This path exists to be the fast, safe
          // fallback, so it stays cheap even at the cost of a larger output
          // than the primary path would give.
          const optimized = await _oxipng(await nativeBlob.arrayBuffer(), { level: 1 });
          return new Blob([optimized], { type: mime });
        }
        if (!_pngEncode) _pngEncode = (await import('@jsquash/png/encode')).default;
        if (!_oxipng)    _oxipng    = (await import('@jsquash/oxipng/optimise')).default;
        onPhase('Quantizing colors…');
        const quantized = await quantizeImageData(imageData, q);
        onPhase('Encoding…');
        const pngBuf = await _pngEncode(quantized);
        onPhase('Optimizing…');
        buffer = await _oxipng(pngBuf, { level: 4 });
        break;
      }
      default:
        return canvasFallback(file, q, mime);
    }
  } catch (err) {
    console.warn('[compressWorker] codec failed, falling back to canvas:', err);
    return canvasFallback(file, q, mime);
  }

  return new Blob([buffer], { type: mime });
}

/* ══════════════ TARGET FILE SIZE ══════════════ */

/** Lossy-encodes already-decoded pixels for the target-size search. Uses
 *  slightly faster encoder presets than compress() above, since the search
 *  runs the encoder several times per image. */
async function encodeImageData(imageData: ImageData, q: number, mime: string): Promise<Blob> {
  let buffer: ArrayBuffer;
  switch (mime) {
    case 'image/jpeg': {
      if (!_jpegEncode) _jpegEncode = (await import('@jsquash/jpeg/encode')).default;
      buffer = await _jpegEncode(imageData, { quality: q });
      break;
    }
    case 'image/webp': {
      if (!_webpEncode) _webpEncode = (await import('@jsquash/webp/encode')).default;
      buffer = await _webpEncode(imageData, { quality: q, method: 4, sns_strength: 90, filter_strength: 60 });
      break;
    }
    case 'image/avif': {
      if (!_avifEncode) _avifEncode = (await import('@jsquash/avif/encode')).default;
      buffer = await _avifEncode(imageData, { quality: q, speed: 8 });
      break;
    }
    case 'image/png': {
      if (!_pngEncode) _pngEncode = (await import('@jsquash/png/encode')).default;
      if (!_oxipng)    _oxipng    = (await import('@jsquash/oxipng/optimise')).default;
      const quantized = await quantizeImageData(imageData, q);
      buffer = await _oxipng(await _pngEncode(quantized), { level: 2 });
      break;
    }
    default:
      throw new Error(`Unsupported output format: ${mime}`);
  }
  return new Blob([buffer], { type: mime });
}

/** Draws the bitmap at the given size, downscaling in successive halvings
 *  first — one large-ratio drawImage (e.g. 4000px → 300px) skips most source
 *  pixels and aliases badly, which ruins thin signature strokes. JPEG has no
 *  alpha, so transparent areas (common in signature PNGs) are flattened onto
 *  white instead of turning black. */
function drawScaled(bitmap: ImageBitmap, width: number, height: number, flattenWhite: boolean): ImageData {
  let source: ImageBitmap | OffscreenCanvas = bitmap;
  let sw = bitmap.width, sh = bitmap.height;
  while (sw / 2 >= width && sh / 2 >= height) {
    const step = new OffscreenCanvas(Math.round(sw / 2), Math.round(sh / 2));
    const sctx = step.getContext('2d')!;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(source, 0, 0, step.width, step.height);
    source = step; sw = step.width; sh = step.height;
  }
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  if (flattenWhite) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

interface TargetResult {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  /** False when even the smallest attempt couldn't get under the target —
   *  the blob is then the smallest result found. */
  hitTarget: boolean;
}

const TARGET_MIN_Q = 10;
const TARGET_MAX_Q = 92;
// Below this, JPEG blocking gets visible (faces go smeary). A slightly
// smaller image at a decent quality looks clearly better than a larger one
// full of artifacts, so a fit below this triggers a few shrink-and-retry
// rounds before it's accepted.
const TARGET_GOOD_Q = 50;
const TARGET_MAX_QUALITY_SHRINKS = 3;
// Past this the image stops being useful for anything, so stop shrinking
// and report the target as unreachable instead.
const TARGET_MIN_SIDE = 48;

/**
 * Finds a good encode that fits under `targetBytes`: binary search for the
 * highest quality that fits at the current size. When even the lowest
 * quality is too big, downscale (by the square root of the size ratio, since
 * bytes scale roughly with pixel count) and search again; when it fits only
 * at a poor quality, shrink a little to buy quality back.
 */
async function compressToTarget(file: File, targetBytes: number, mime: string, onPhase: (label: string) => void): Promise<TargetResult> {
  onPhase('Decoding…');
  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height) throw new Error('Browser could not decode this image (0×0 dimensions reported)');
    if (bitmap.width * bitmap.height > MAX_CANVAS_PIXELS) {
      throw new Error(`Image is ${bitmap.width}×${bitmap.height}px — too large for your browser to process (limit ~${MAX_CANVAS_PIXELS.toLocaleString()}px total)`);
    }

    const flatten = mime === 'image/jpeg';
    // A 12 MP phone photo can never fit a 20–200 KB budget at full size, and
    // encoding it over and over just to learn that is slow — so start from a
    // pixel count that suits the budget (~8 px per byte lands a typical photo
    // around JPEG quality 50–70) instead of full resolution.
    let scale = Math.min(1, Math.sqrt((targetBytes * 8) / (bitmap.width * bitmap.height)));
    let smallest: TargetResult | null = null;
    let qualityShrinks = 0;

    for (let round = 0; round < 10; round++) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      onPhase(round === 0 ? 'Finding best quality…' : `Resizing to ${width}×${height}…`);
      const imageData = drawScaled(bitmap, width, height, flatten);

      // Top of the range first: if even max quality fits, we're done.
      const top = await encodeImageData(imageData, TARGET_MAX_Q, mime);
      if (top.size <= targetBytes) return { blob: top, width, height, quality: TARGET_MAX_Q, hitTarget: true };

      let lo = TARGET_MIN_Q, hi = TARGET_MAX_Q - 1;
      let best: TargetResult | null = null;
      let floorSize = Infinity;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        onPhase(`Trying quality ${mid}…`);
        const blob = await encodeImageData(imageData, mid, mime);
        if (mid === TARGET_MIN_Q) floorSize = blob.size;
        if (blob.size <= targetBytes) {
          best = { blob, width, height, quality: mid, hitTarget: true };
          lo = mid + 1;
        } else {
          if (!smallest || blob.size < smallest.blob.size) smallest = { blob, width, height, quality: mid, hitTarget: false };
          hi = mid - 1;
        }
      }
      if (best) {
        const canShrink = Math.min(width, height) * 0.8 > TARGET_MIN_SIDE;
        if (best.quality >= TARGET_GOOD_Q || qualityShrinks >= TARGET_MAX_QUALITY_SHRINKS || !canShrink) return best;
        qualityShrinks++;
        scale *= 0.8;
        continue;
      }

      if (floorSize === Infinity) floorSize = smallest!.blob.size;
      if (Math.min(width, height) <= TARGET_MIN_SIDE) break;

      // Shrink so the lowest-quality encode should land comfortably under the
      // target — and always by at least 10% so the loop keeps making progress.
      scale *= Math.min(0.9, Math.sqrt(targetBytes / floorSize) * 0.92);
    }

    return smallest!;
  } finally {
    bitmap.close();
  }
}

interface CompressRequest {
  type: 'compress';
  reqId: string;
  file: File;
  quality: number;
  mime: string;
  /** When set, `quality` is ignored and the worker aims for this maximum
   *  output size instead, resizing if quality alone can't get there. */
  targetBytes?: number;
}

self.onmessage = async (e: MessageEvent<CompressRequest>) => {
  const { type, reqId, file, quality, mime, targetBytes } = e.data;
  if (type !== 'compress') return;
  const onPhase = (label: string) => self.postMessage({ type: 'phase', reqId, label });

  try {
    if (targetBytes) {
      const { blob, width, height, quality: usedQuality, hitTarget } = await compressToTarget(file, targetBytes, mime, onPhase);
      self.postMessage({ type: 'done', reqId, blob, target: { width, height, quality: usedQuality, hitTarget } });
      return;
    }

    let blob = await compress(file, quality, mime, onPhase);

    // Never hand back something bigger than the original for a same-format
    // request — quantization/dithering/canvas re-encoding can occasionally
    // backfire on an image that doesn't actually benefit from any of it
    // (confirmed: a highly regular test PNG came out ~8x larger through the
    // server's equivalent path). A "compressor" that grows the file has
    // failed at its one job, so fall back to the original bytes untouched.
    if (mime === 'image/png' && file.type === 'image/png' && blob.size >= file.size) {
      blob = file;
    }

    self.postMessage({ type: 'done', reqId, blob });
  } catch (err) {
    self.postMessage({ type: 'error', reqId, message: (err as Error)?.message || 'Compression failed' });
  }
};
