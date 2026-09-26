=== Yantrixlab Image Compressor – WebP & AVIF ===
Contributors: yantrixlab
Tags: image compression, optimize images, compress jpeg, compress png, webp
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.4.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Convert uploads to WebP or AVIF and compress JPEG, PNG and WebP — on your own server. No API keys, no limits.

== Description ==

**Yantrixlab Image Compressor** automatically converts new uploads to WebP (or AVIF) and compresses every image the moment it's uploaded to your WordPress Media Library. No API keys. No external requests by default. Everything happens on your own server.

**Features:**
* Converts new uploads to **WebP** by default — or AVIF, JPEG, or keep the original format
* Only converts when the result is smaller; transparency is kept for WebP and AVIF
* Auto-compress JPEG, PNG, WebP and AVIF on upload
* Smart PNG compression — reduces colors like TinyPNG for 60–80% smaller PNGs, transparency preserved
* Compresses the original file *and* every generated thumbnail
* "Compress existing images" — catch up on your whole Media Library in one click
* "Compress now" button on every image, plus a bulk action in the Media Library
* Never makes a file bigger — if an image is already optimized, it is left untouched
* Keeps color profiles, strips EXIF/GPS metadata
* Skips animated WebP/PNG so animations are never broken
* Adjustable quality setting (default 82 — a great balance of size vs. quality)
* Uses Imagick when available, falls back to GD
* No tracking and no external calls — unless you opt in to adding your image count to the public counter on webpninja.com

Made by Yantrixlab, who also run the free browser-based image compressor and developer API at [webpninja.com](https://webpninja.com).

== Installation ==

1. Upload the `webpninja-compressor` folder to `/wp-content/plugins/`.
2. Activate the plugin in **Plugins → Installed Plugins**.
3. New uploads are now compressed automatically.
4. To compress images you uploaded earlier, go to **Settings → Image Compressor** and click **Compress existing images**.
5. See the results in **Media → Library** — switch to *list view* for the *Compression* column, or open any image to see its savings.

== Frequently Asked Questions ==

= Does this send my images to an external server? =
No. All compression is done locally by PHP (Imagick or GD) on your own server.

= Which image formats are supported? =
JPEG, PNG, WebP and AVIF (AVIF needs WordPress 6.5+ and server support). GIFs and animated images are left untouched; for GIFs, use the browser tools at [webpninja.com](https://webpninja.com/tools).

= Which output format should I choose? =
**WebP** (the default) is supported by every modern browser and is typically 25–35% smaller than JPEG, with transparency. **AVIF** is smaller still but slower to encode and needs WordPress 6.5+. **JPEG** gives maximum compatibility. **Keep original** only compresses. Formats your server can't produce are disabled on the settings page.

= Are my existing images converted to WebP? =
No — only new uploads. Existing images are compressed but keep their format, because their URLs are already used in your posts and pages; converting them would break those links.

= Where do I see what was compressed? =
In **Media → Library**. In list view there is a *Compression* column; in grid view, click an image and look for the *Compression* row in the details panel. **Settings → Image Compressor** shows the total saved.

= Will it compress images I uploaded before installing the plugin? =
Yes — go to **Settings → Image Compressor** and click **Compress existing images**, or use the *Compress images* bulk action in the Media Library list view.

= An image says "Already optimized". Is that a problem? =
No. The plugin only replaces a file when the result is at least 3% smaller. Images that were already well compressed are left exactly as they were.

= Does it keep PNG transparency? =
Yes. With Imagick, transparent PNGs get full smart compression. With GD only, transparent PNGs are compressed losslessly (GD's color reduction can't keep transparency), and fully opaque PNGs get smart compression.

= What quality setting should I use? =
80–85 is ideal for most sites. Lower values give smaller files but more visible compression artifacts.

== External services ==

This plugin compresses and converts images entirely on your own server and makes **no external requests by default**.

It connects to one external service, and only if you switch it on under **Settings → Image Compressor → Public counter** (off by default):

* **Service:** the stats API at `https://api.webpninja.com/api/stats/increment`, which adds to the "images compressed" counter shown on webpninja.com.
* **What is sent:** a single number, how many images were compressed since the last report. No images, file names, URLs, site details or personal data. Like any web request, it also reveals your server's IP address to the service.
* **When:** at most once an hour, via WP-Cron. Turning the option off stops all reports and discards any count not yet sent.
* **Provider:** Yantrixlab, operator of webpninja.com — [Terms of Service](https://webpninja.com/terms), [Privacy Policy](https://webpninja.com/privacy).

== Changelog ==

= 1.4.0 =
* Renamed to Yantrixlab Image Compressor – WebP & AVIF. Settings, data and behaviour are unchanged; the settings page is now under Settings → Image Compressor.

= 1.3.1 =
* The one-time activation notice appears only on the Plugins screen, and the bulk-action result only in the Media Library.
* Removed the promotional link from the settings page.

= 1.3.0 =
* New: optional "Public counter" setting (off by default) that adds your compressed-image count to the live counter on webpninja.com. Only a number is sent, once an hour. See "External services".
* New: `webpninja_compressed` action fires after an image is made smaller.

= 1.2.0 =
* New: output format setting — convert new uploads to WebP (default), AVIF or JPEG, or keep the original format. Unsupported formats are detected and disabled.
* New: conversion only happens when the result is smaller; WebP/AVIF keep transparency, JPEG flattens it onto white.
* New: AVIF images are compressed too.
* New: the Media Library shows which format an image was converted from.

= 1.1.1 =
* Fix: the Media Library's "File size" now shows the compressed size (it showed the size before compression). Images compressed by 1.1.0 are corrected automatically.

= 1.1.0 =
* Fix: PNGs could come out larger than the original with Imagick. PNGs now get real smart (palette) compression.
* Fix: files are only replaced when the result is smaller — compression can never grow an image.
* New: "Compress existing images" on the settings page, with progress bar.
* New: "Compress now" button and status in the Media Library (list view column and image details panel).
* New: "Compress images" bulk action in the Media Library.
* New: server check (Imagick/GD, WebP support) and total savings on the settings page.
* New: thumbnails are generated at your quality setting in a single pass.
* New: animated WebP/PNG are skipped; color profiles are kept.
* New: uninstall removes all plugin data.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.4.0 =
The plugin has a new name. Nothing else changes: your settings and compressed images are kept.

= 1.3.0 =
Adds an optional, off-by-default setting to contribute your image count to the webpninja.com public counter.

= 1.2.0 =
New uploads are now converted to WebP by default. Choose AVIF, JPEG or "Keep original format" under Settings → Image Compressor.

= 1.1.1 =
Shows correct file sizes in the Media Library after compression.

= 1.1.0 =
Fixes PNG compression and adds "Compress existing images". Recommended for all users.

= 1.0.0 =
Initial release.
