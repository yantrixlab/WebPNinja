# Launch kit

Launch schedule, final post copy and tracking links for the October 2026 launch.

## Schedule

| Date | Channel | Link to post |
|---|---|---|
| Tue Oct 6, ~8–9am US Eastern | Show HN | the site (the technical post goes in the first comment) |
| Wed Oct 7 | r/SideProject | site |
| Sat Oct 10 | r/webdev — Showoff Saturday only | site |
| Tue Oct 13, 12:01am Pacific | Product Hunt | site |
| Oct 13–16 | Indie Hackers, DevHunt | site / `/docs` |
| After WordPress.org approval | r/Wordpress | the wordpress.org plugin page |
| Anytime | India: answer existing "compress to 20KB" threads | the matching `/compress-image-to-*` page |

Ground rules:
- Never ask anyone to upvote. HN and Product Hunt detect vote rings.
- Post from your own long-standing account.
- Re-read each subreddit's self-promotion rules on the day you post.
- Reply to every comment for the first 4–6 hours.

## Before Oct 6

- [ ] Publish the technical post: set `draft: false` in `src/content/blog/running-mozjpeg-libwebp-in-the-browser.md` and deploy
- [ ] Before/after GIF: a 5–8 s screen recording of the homepage comparison slider
- [ ] Demo video, 30–45 s: drop 10 photos → compress → Download all → the 20 KB passport tool
- [ ] Product Hunt gallery: 4–5 images at 1270×760 (hero, batch results, max-size tool, WordPress plugin, API docs)
- [ ] Product Hunt thumbnail: mascot at 240×240
- [ ] Open the site on a phone and try a real photo end to end

## Tracking links

Google Analytics (`G-WXDD04RG4T`, live) reports these tags under **Acquisition → Traffic acquisition**. Canonical tags ignore query strings, so the tags don't affect SEO.

| Channel | Link |
|---|---|
| Hacker News | `https://webpninja.com/?utm_source=hackernews&utm_medium=social&utm_campaign=launch-2026-10` |
| Tech post (HN) | `https://webpninja.com/blog/running-mozjpeg-libwebp-in-the-browser/?utm_source=hackernews&utm_medium=social&utm_campaign=launch-2026-10` |
| Product Hunt | `https://webpninja.com/?utm_source=producthunt&utm_medium=social&utm_campaign=launch-2026-10` |
| r/SideProject | `https://webpninja.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch-2026-10&utm_content=sideproject` |
| r/webdev | `https://webpninja.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch-2026-10&utm_content=webdev` |
| r/Wordpress | *(use the wordpress.org plugin page; UTM tags don't apply there)* |
| Indie Hackers | `https://webpninja.com/?utm_source=indiehackers&utm_medium=social&utm_campaign=launch-2026-10` |
| DevHunt | `https://webpninja.com/docs?utm_source=devhunt&utm_medium=social&utm_campaign=launch-2026-10` |

On HN, submit the **plain** `https://webpninja.com` as the Show HN URL. A tracking-tagged URL looks spammy there, and HN readers are sensitive to it. Only the link inside your first comment should carry tags.

## Show HN

**Title:** `Show HN: WebP Ninja – MozJPEG, oxipng and libwebp in the browser via WASM`

**First comment:**

> Hi HN, I built WebP Ninja, an image compressor that runs the real codecs in your browser: MozJPEG, libwebp, libavif and oxipng compiled to WebAssembly (via jSquash), plus image-q for PNG color quantization. It's MIT-licensed: https://github.com/yantrixlab/WebPNinja
>
> Everything runs in a Web Worker so big images don't freeze the tab. The parts that were harder than expected:
> - reading dimensions straight from PNG/JPEG/WebP header bytes, so a 200 MP file is rejected before any decoder touches it (even an `<img>` thumbnail could crash the tab);
> - capping color quantization at 40 MP, because image-q has no memory ceiling and fails with an uncatchable OOM;
> - a "max file size" mode (e.g. under 20 KB for exam/passport forms) that binary-searches quality and trades a little resolution for quality when the fit is poor.
>
> Write-up with the details and quality measurements: [tech post link]
>
> One honest caveat: if a file is too big for your browser, it *offers* to compress that one file on my server (explicit prompt; processed in memory, discarded). Otherwise nothing is uploaded.
>
> Free, no limits, no account. There's also a paid API and a WordPress plugin. Feedback on output quality is very welcome.

**Likely questions:**
- **"Why not Squoosh?"** Squoosh is great, and I credit it. It works on one image at a time; this adds batch processing plus ZIP download, clipboard paste, exact file-size targets, an API and a WordPress plugin.
- **"Is it really client-side?"** Yes, except the opt-in fallback above. The code is public; point to `src/lib/compressWorker.ts`.
- **"Why WebP quality 60 by default?"** Measured: at 20, photos smear (SSIM 0.86); at 60, SSIM is 0.94 and the file is still about 94% smaller. The table is in the post.

## Product Hunt

- **Tagline:** `Compress & convert images in your browser — nothing uploaded`
- **Description:** `Shrink PNG, JPEG, WebP & AVIF up to 80% with MozJPEG, oxipng and libwebp running in your browser. Batch hundreds of images, hit exact sizes like 20 KB for forms, download as ZIP. Free, no sign-up, no limits. Plus a WordPress plugin and developer API.`
- **Topics:** Design Tools, Developer Tools, Productivity
- **Maker comment:**

> Hey Product Hunt! I built WebP Ninja because every image compressor I tried either uploaded my files or capped me at 20 images. This one runs the same codecs image CDNs use (MozJPEG, libwebp, oxipng), but inside your browser, so your photos never leave your device and there's no limit.
>
> My favorite feature: "Max size". Pick 20 KB or 50 KB and it finds the best quality that fits, which is great for passport and exam form uploads.
>
> It's free and open source (MIT). What format do you use most: WebP, AVIF, or still JPEG?

## Reddit (r/SideProject; r/webdev Showoff Saturday with more technical detail)

**Title:** `I built a free image compressor that runs MozJPEG/libwebp in your browser — no uploads, no limits`

> I got tired of image compressors that upload my files or stop at 20 images, so I built one that runs the actual codecs (MozJPEG, libwebp, libavif, oxipng) as WebAssembly in a Web Worker.
>
> - Batch as many images as you want, download a ZIP, or paste screenshots with Ctrl+V
> - Convert to WebP / AVIF / JPEG / PNG
> - "Max size" mode: get a photo under 20 KB / 50 KB for forms automatically
>
> Caveat: files too big for your browser can optionally be processed on my server (it asks first). It's MIT-licensed on GitHub.
>
> What would make it more useful for you?
>
> [link at the end]

## Indie Hackers

Tell the story rather than announce a product. Suggested title: *"Launched a free, open-source TinyPNG alternative: what building WASM image compression + a WordPress plugin taught me"*. Include real numbers from the HN launch (visitors, compressions, API sign-ups).

## DevHunt

Lead with the Developer API (`/docs`), the Python and Java SDKs, and the WordPress plugin.
