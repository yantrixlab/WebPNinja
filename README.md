# WebP Ninja

**Free image compressor that runs real codecs in your browser.** MozJPEG, libwebp, libavif and oxipng, compiled to WebAssembly, compress PNG, JPEG, WebP and AVIF on your own device — no upload, no sign-up, no file limits.

**→ [webpninja.com](https://webpninja.com)**

- Batch-compress hundreds of images, download them as one ZIP, or paste a screenshot with Ctrl+V
- Convert between WebP, AVIF, JPEG and PNG
- **Max file size** mode: get a photo under 20 KB / 50 KB / 100 KB for exam and passport forms, with quality and resolution chosen automatically
- A [WordPress plugin](https://webpninja.com/wordpress-plugin), a [Developer API](https://webpninja.com/docs) and SDKs for Python and Java (Node.js coming)

## How it works

The browser tool ([`src/components/Compressor.astro`](src/components/Compressor.astro)) hands each image to a dedicated Web Worker ([`src/lib/compressWorker.ts`](src/lib/compressWorker.ts)). The [jSquash](https://github.com/jamsinclair/jSquash) WASM encoders are synchronous and CPU-bound, so running them on the main thread would freeze the tab for the whole encode.

| Output | Pipeline |
|---|---|
| JPEG | MozJPEG |
| WebP | libwebp (`method 6`) |
| AVIF | libavif |
| PNG | [image-q](https://github.com/ibezkrovnyi/image-quantization) palette quantization (Wu + Floyd–Steinberg dithering) → PNG encode → oxipng |

Some details that took a while to get right:

- **No decode before a size check.** Image dimensions are read straight from the PNG / GIF / BMP / WebP / JPEG header bytes, so a 200-megapixel file is rejected (or offered to the server) before any decoder touches it. Even pointing an `<img>` at such a file for a thumbnail can crash the tab.
- **Quantization has a ceiling.** image-q has no memory limit of its own; past ~40 MP it can hit an uncatchable out-of-memory error, so larger PNGs fall back to a lossless canvas encode + oxipng.
- **Stale results are dropped.** Every compression carries a generation token, so moving the quality slider mid-encode can't let an older result overwrite a newer one.
- **Max file size** binary-searches quality at a resolution that suits the budget, trades a little resolution for quality when the fit is poor, and targets `KB × 1000` bytes so the file passes portals that count 1 KB as either 1000 or 1024 bytes.

**Privacy caveat, stated plainly:** if a file is too large for your browser to process, the tool *offers* — with an explicit confirmation dialog — to compress that one file on our server instead ([`api/src/routes/compress.js`](api/src/routes/compress.js), `/api/v1/compress/fallback`). It's processed in memory and discarded, and rate-limited. Nothing else is ever uploaded.

## Repository layout

| Path | What |
|---|---|
| `src/` | The site — [Astro](https://astro.build) + Tailwind. Landing pages per tool are generated from [`src/data/tools.ts`](src/data/tools.ts) |
| `api/` | Express API: the Developer API (`/api/v1/compress`), Google sign-in, API keys, Razorpay billing, global stats |
| `sdks/` | Official SDKs — see [`sdks/README.md`](sdks/README.md) |
| `wordpress-plugin/` | WordPress plugin: compresses and converts uploads on the WordPress server with Imagick or GD (GPL-2.0-or-later) |

## Running locally

Requires Node.js 22.12+.

```sh
npm install
npm run dev        # site at http://localhost:4321
npm run build      # static build in ./dist
```

The browser tool needs nothing else. For the API (`api/`), copy `api/.env.example` to `api/.env`, fill it in (PostgreSQL, Google client ID, secrets, Razorpay keys), load `api/schema.sql` and `api/seed.sql`, then:

```sh
cd api && npm install && npm run dev
```

Set `PUBLIC_API_URL` for the site to enable the server fallback, sign-in and live stats.

## License

[MIT](LICENSE), except the WordPress plugin in `wordpress-plugin/`, which is GPL-2.0-or-later as the WordPress.org directory requires. The bundled codecs keep their own licenses.
