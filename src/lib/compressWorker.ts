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

let _jpegEncode: ((d: ImageData, o?: any) => Promise<ArrayBuffer>) | null = null;
let _webpEncode: ((d: ImageData, o?: any) => Promise<ArrayBuffer>) | null = null;
let _avifEncode: ((d: ImageData, o?: any) => Promise<ArrayBuffer>) | null = null;
let _pngEncode:  ((d: ImageData) => Promise<ArrayBuffer>) | null = null;
let _oxipng:     ((d: ArrayBuffer, o?: any) => Promise<ArrayBuffer>) | null = null;

async function decodeToImageData(file: File): Promise<ImageData> {
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
  const imageData = await decodeToImageData(file);
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

interface CompressRequest {
  type: 'compress';
  reqId: string;
  file: File;
  quality: number;
  mime: string;
}

self.onmessage = async (e: MessageEvent<CompressRequest>) => {
  const { type, reqId, file, quality, mime } = e.data;
  if (type !== 'compress') return;

  try {
    const blob = await compress(file, quality, mime, (label) => {
      self.postMessage({ type: 'phase', reqId, label });
    });
    self.postMessage({ type: 'done', reqId, blob });
  } catch (err) {
    self.postMessage({ type: 'error', reqId, message: (err as Error)?.message || 'Compression failed' });
  }
};
