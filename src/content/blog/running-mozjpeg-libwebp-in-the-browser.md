---
title: "Running MozJPEG, libwebp and oxipng in the Browser Without Crashing the Tab"
description: "What it took to build a client-side image compressor with WebAssembly codecs: Web Workers, reading dimensions from header bytes, memory ceilings, stale results, and hitting an exact file size."
publishDate: 2026-10-06
tags: ["webassembly", "image-compression", "web-workers", "engineering"]
draft: true
---

WebP Ninja compresses images entirely in your browser. There's no upload step: the same encoders image CDNs run on their servers — MozJPEG, libwebp, libavif and oxipng — are compiled to WebAssembly (via [jSquash](https://github.com/jamsinclair/jSquash)) and run on your device.

Getting a first version working took an afternoon. Making it survive real-world files — 40-megapixel phone photos, 200-megapixel panoramas, someone dragging a quality slider mid-encode — took a lot longer. Here's what I learned. All the code is [on GitHub](https://github.com/yantrixlab/WebPNinja) under the MIT license.

## 1. Encoders are synchronous — put them in a Worker

The first version called the jSquash encoders from the main thread. They're `async` functions, so it looked fine in code review. But `await`ing a WASM call doesn't make it yield: the encoder is one long, CPU-bound, synchronous call. A 3000×3000 noise image froze the entire tab — spinner, progress text, even a screenshot request — until the encode finished.

The fix is boring and essential: the whole decode → quantize → encode pipeline lives in a dedicated [Web Worker](https://github.com/yantrixlab/WebPNinja/blob/master/src/lib/compressWorker.ts). The main thread only posts a `File` and receives progress labels ("Decoding…", "Quantizing colors…") and the final `Blob`. The tab stays responsive no matter how long an encode takes.

## 2. Don't decode a file to find out it's too big

Browsers refuse to allocate a canvas beyond roughly 2²⁸ pixels (Safari's limit is lower). Past that, decoding either throws a vague error or silently produces a blank image. So the tool needs to know an image's dimensions *before* decoding it.

The surprise was *where* the crash came from. It wasn't the compressor — it was the thumbnail. Pointing an `<img>` at a 200-megapixel file makes the browser's own decoder fully decode it just to paint a small preview, and that alone can take down the tab, outside any JavaScript error handling.

So the tool reads width and height straight from the file's header bytes, per format:

- **PNG** — the IHDR chunk sits at a fixed offset right after the 8-byte signature
- **GIF / BMP** — fixed little-endian fields
- **WebP** — three sub-formats (VP8, VP8L, VP8X), each packing dimensions differently, down to 14-bit fields
- **JPEG** — no fixed offset at all: you walk the marker segments until you hit a start-of-frame marker, skipping EXIF and ICC blobs that can be hundreds of KB

That's 33 bytes for most formats and at most 512 KB for JPEG. Oversized images get no live thumbnail and are never handed to a decoder.

## 3. Some libraries have no memory ceiling

PNG compression is mostly color quantization: reducing an image to an optimized palette of ≤256 colors (what pngquant and TinyPNG do), then encoding and running oxipng over the result. For quantization I use [image-q](https://github.com/ibezkrovnyi/image-quantization) — Wu's algorithm plus Floyd–Steinberg dithering.

The WASM encoders fail *politely* when they run out of their fixed memory: you get a catchable exception. image-q is pure JavaScript with no limit of its own, so a large enough image simply keeps growing the heap until the tab hits a fatal, uncatchable out-of-memory crash.

The fix is a hard threshold: past 40 megapixels, PNGs skip quantization and fall back to the browser's native PNG encoder plus a quick oxipng pass. That's much weaker compression, so the tool says so and offers the server-side path instead of silently under-delivering.

## 4. Throw away stale results

Every settings change re-compresses every image. If you drag the quality slider from 40 to 60 while an image is still encoding at 40, the slow 40 result can land *after* the 60 result and overwrite it.

Each image carries a generation counter. Every compression request bumps it and snapshots its own value; when a result comes back, it's discarded unless its generation still matches:

```ts
// simplified from Compressor.astro
const myGen = ++item.genId;
const blob = await compressInWorker(item.file, myQuality, mime);
if (item.genId !== myGen) return; // a newer request superseded this one
```

## 5. "Compress to 20 KB" is a search problem

Indian government and exam portals ask for photos under 20 KB or 50 KB, and signatures under 10–20 KB — a very specific, very common need. A quality slider doesn't solve it: users don't know which quality lands under the limit.

The max-file-size mode searches for it:

1. **Start at a sensible resolution.** A 12 MP phone photo can never fit in 20 KB at full size, and discovering that by encoding it repeatedly is slow. The search starts at a pixel count that suits the budget (about 8 pixels per byte).
2. **Binary-search quality** for the highest value that fits.
3. **Trade resolution for quality.** If the best fit is below quality 50, JPEG blocking starts to show on faces — a slightly smaller image at decent quality looks better — so it shrinks 20% and searches again (up to three times).
4. **Downscale in halvings.** A single 4000px → 300px `drawImage` skips most source pixels and aliases badly; thin signature strokes break up. Halving step by step keeps them clean.
5. **Target `KB × 1000` bytes.** Portals disagree on whether a KB is 1000 or 1024 bytes, so aim for the stricter one.

## 6. The honest caveat

"Your images never leave your device" is true for almost every file. The exception: when an image is too large for your browser to process at all, the tool *offers* — through an explicit confirmation dialog — to compress that one file on the server instead. It's processed in memory, discarded immediately, and rate-limited. If you decline, it isn't uploaded.

## 7. Choosing defaults with measurements, not vibes

The original default WebP quality was 20. It looked fine on screenshots and graphics, but when I measured it against the originals, photos told a different story:

| WebP quality | Photo (10.5 MB PNG) | SSIM | Screenshot SSIM |
|---|---|---|---|
| 20 | 279 KB | 0.856 | 0.982 |
| 40 | 428 KB | 0.909 | 0.985 |
| **60** | **607 KB** | **0.942** | 0.987 |
| 75 | 744 KB | 0.957 | 0.987 |

(SSIM here is the classic formula on luminance over 8×8 blocks, averaged over the whole image; 1.0 means identical.)

At 20 the photo visibly smears fine texture. The default is now 60: still about 94% smaller than the original photo, and close to indistinguishable at 100% zoom.

---

Try it at [webpninja.com](https://webpninja.com), and if you break it, I'd genuinely like to know how.
