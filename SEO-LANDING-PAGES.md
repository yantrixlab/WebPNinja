# SEO landing pages

Before this change, every "Compress PNG / Convert to WebP" link pointed at `/#compressor`, so Google had only one page to rank. Each tool now has its own URL with a unique title, H1, meta description, copy, FAQ and schema, and the real compressor embedded above the fold.

- **Content:** all copy and keywords live in [`src/data/tools.ts`](src/data/tools.ts).
- **Rendering:** one template, [`src/pages/[tool].astro`](src/pages/[tool].astro), builds every page.
- **Adding a page:** add an entry to `tools.ts` and it's built, added to the sitemap, and linked from `/tools`, the homepage tools grid and related-tool links.

## Keyword map

| URL | Primary keyword | Secondary keyword | Tool preset |
|---|---|---|---|
| `/png-to-webp` | png to webp | convert png to webp | WebP, q20 |
| `/jpg-to-webp` | jpg to webp | jpeg to webp | WebP, q20 |
| `/webp-to-jpg` | webp to jpg | convert webp to jpg | JPEG, q82 |
| `/webp-to-png` | webp to png | convert webp to png | PNG, q90 |
| `/png-to-avif` | png to avif | convert png to avif | AVIF, q40 |
| `/compress-jpeg` | compress jpeg | reduce jpg size | JPEG, q70 |
| `/compress-png` | compress png | png compressor | PNG, q70 |
| `/compress-gif` | compress gif | reduce gif size | WebP, q60 (static GIFs only) |
| `/compress-image-to-20kb` | compress image to 20kb | reduce photo size to 20kb | JPEG, max 20 KB |
| `/compress-image-to-50kb` | compress image to 50kb | photo size 50kb | JPEG, max 50 KB |
| `/compress-image-to-100kb` | compress image to 100kb | reduce image size to 100kb | JPEG, max 100 KB |
| `/compress-image-to-200kb` | compress image to 200kb | reduce jpg to 200kb | JPEG, max 200 KB |
| `/compress-passport-photo` | passport size photo compressor | passport photo 50kb | JPEG, max 50 KB |
| `/compress-signature` | signature resize 20kb | compress signature online | JPEG, max 20 KB |
| `/tools` | (hub) free image tools | — | links to all of the above |

### Where the keywords go on each page

- **Primary keyword:** URL slug, `<title>` (at the front), H1, first paragraph, meta description.
- **Secondary keyword:** the H2 of the explanation section, the meta description, and at least one FAQ.
- **Schema:** `SoftwareApplication`, `FAQPage` and `BreadcrumbList` JSON-LD on every page, and `ItemList` on `/tools`.

## Internal linking

- **Footer:** "Convert", "Compress" and "Exact file size" columns link to every page.
- **Nav:** a "Tools" link points to the `/tools` hub.
- **Homepage:** a tools grid sits above the FAQ.
- **Tool pages:** each one ends with 4 related tools.

## Target file size mode

A new **Max size** control sits in the compressor bar on every page, including the homepage. The options are Off, 10 KB to 1 MB, plus the page's own preset. It works like this:

1. **Aims at 1000 × KB bytes.** The file passes whether a portal counts 1 KB as 1000 or 1024 bytes.
2. **Starts from a sensible size.** Large photos are first scaled to a resolution that suits the budget, at about 8 px per byte.
3. **Binary-searches quality.** It finds the highest quality that still fits.
4. **Trades resolution for quality.** If quality drops below 50, it shrinks the image 20% and retries, up to 3 times. A clean small image beats a big blocky one.
5. **Shrinks further if needed.** If even the lowest quality doesn't fit, it downscales by the square root of the size ratio and searches again.
6. **Keeps edges clean.** Downscaling happens in halving steps so signature strokes don't alias.
7. **Flattens transparency for JPEG.** Transparent areas become white, not black.

The result card shows ✓ Under X KB, the final pixel dimensions and the quality used. If the target can't be reached, it shows the smallest size it could get.

## Next steps (not done here)

1. **Search Console:** submit `sitemap-index.xml` again and request indexing for the 15 new URLs.
2. **More long-tail pages with the same template:** `/compress-image-to-10kb`, `/30kb`, `/500kb`, `/1mb`, `/jpg-to-png`, `/png-to-jpg`, `/heic-to-jpg`, `/avif-to-jpg`, `/resize-image`.
3. **Exam-specific pages:** for example `/ssc-photo-resize` and `/upsc-photo-signature`, only after checking each notification's exact limits. Those pages need to be kept up to date every year.
4. **Pixel-dimension presets:** add exact width × height (e.g. 200×230 px) to the passport and signature pages.
5. **Hindi versions** of the target-size pages (`/hi/...`) with `hreflang`. A lot of this search traffic is in Hindi.
6. **Blog backlinks:** link the existing posts to the matching tool pages. For example, "how to compress PNG" → `/compress-png` and "PNG vs WebP" → `/png-to-webp`.
