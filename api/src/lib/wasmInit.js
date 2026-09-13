import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { simd } from 'wasm-feature-detect';

import { init as jpegInit } from '@jsquash/jpeg/encode.js';
import { init as webpInit } from '@jsquash/webp/encode.js';
import { init as avifInit } from '@jsquash/avif/encode.js';
import { init as pngInit } from '@jsquash/png/encode.js';
import { init as oxipngInit } from '@jsquash/oxipng/optimise.js';

const require = createRequire(import.meta.url);

// jsquash's own init() functions default to fetch()-ing their .wasm file
// relative to import.meta.url — a browser/bundler assumption that doesn't
// work under plain Node (no HTTP server, and Node's fetch() doesn't support
// file: URLs). Instead we read each .wasm file straight off disk, compile it
// ourselves, and hand the compiled WebAssembly.Module to each package's own
// init(module), which every jsquash encoder accepts for exactly this reason.
async function compileWasm(pkgRelativeWasmPath) {
  const bytes = await readFile(require.resolve(pkgRelativeWasmPath));
  return WebAssembly.compile(bytes);
}

let ready;

/** Idempotent — safe to call before every request; only compiles once. */
export function ensureCodecsInitialized() {
  if (!ready) {
    ready = (async () => {
      // Must match the same wasm-feature-detect check @jsquash/webp's own
      // init() runs internally, so we hand it the matching .wasm variant.
      const useSimd = await simd();
      const webpWasmPath = useSimd
        ? '@jsquash/webp/codec/enc/webp_enc_simd.wasm'
        : '@jsquash/webp/codec/enc/webp_enc.wasm';

      const [jpegWasm, webpWasm, avifWasm, pngWasm, oxipngWasm] = await Promise.all([
        compileWasm('@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm'),
        compileWasm(webpWasmPath),
        compileWasm('@jsquash/avif/codec/enc/avif_enc.wasm'), // @jsquash/avif always uses the single-threaded build in Node
        compileWasm('@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
        compileWasm('@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm'),
      ]);

      await Promise.all([
        jpegInit(jpegWasm),
        webpInit(webpWasm),
        avifInit(avifWasm),
        pngInit(pngWasm),
        oxipngInit(oxipngWasm),
      ]);
    })();
  }
  return ready;
}
