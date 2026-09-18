import { parentPort } from 'node:worker_threads';
import { compressImage } from './compress.js';

/**
 * Runs compressImage() inside a worker_thread instead of the main thread.
 * jsquash's WASM encoders (and oxipng) are synchronous, CPU-bound calls —
 * they block whatever thread runs them for their entire duration. On the
 * main thread that means blocking Express's event loop, which stalls every
 * other concurrent request (health checks, other users' uploads, everything)
 * for as long as one compression takes. Confirmed this was a real risk, not
 * theoretical: a single large-image request at a high oxipng optimization
 * level took the whole server unresponsive for 90+ seconds. Isolating the
 * work here (see compressPool.js) keeps the main thread free regardless.
 */
parentPort.on('message', async ({ id, inputBuffer, format, quality }) => {
  try {
    const { buffer, mime, resizedFrom } = await compressImage(inputBuffer, { format, quality });
    parentPort.postMessage({ id, buffer, mime, resizedFrom });
  } catch (err) {
    parentPort.postMessage({ id, error: err.message });
  }
});
