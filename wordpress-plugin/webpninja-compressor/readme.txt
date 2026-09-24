=== WebP Ninja Image Compressor ===
Contributors: webpninja
Tags: image compression, optimize images, compress jpeg, compress png, webp
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Convert uploads to WebP or AVIF and compress JPEG, PNG and WebP — on your own server. No API keys, no limits.

== Description ==

**WebP Ninja Image Compressor** automatically converts new uploads to WebP (or AVIF) and compresses every image the moment it's uploaded to your WordPress Media Library. No API keys. No external requests. Everything happens on your own server.

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
* Zero tracking, zero external calls

**Need more?** Visit [webpninja.com](https://webpninja.com) for free browser-based compression with AVIF, GIF, and no file size limits.

== Installation ==

1. Upload the `webpninja-compressor` folder to `/wp-content/plugins/`.
2. Activate the plugin in **Plugins → Installed Plugins**.
3. New uploads are now compressed automatically.
4. To compress images you uploaded earlier, go to **Settings → WebP Ninja** and click **Compress existing images**.
5. See the results in **Media → Library** — switch to *list view* for the WebP Ninja column, or open any image to see its savings.

== Frequently Asked Questions ==

= Does this send my images to an external server? =
No. All compression is done locally by PHP (Imagick or GD) on your own server.

= Which image formats are supported? =
JPEG, PNG, and WebP. GIF and AVIF require browser-side tools like [webpninja.com](https://webpninja.com).

= Which output format should I choose? =
**WebP** (the default) is supported by every modern browser and is typically 25–35% smaller than JPEG, with transparency. **AVIF** is smaller still but slower to encode and needs WordPress 6.5+. **JPEG** gives maximum compatibility. **Keep original** only compresses. Formats your server can't produce are disabled on the settings page.

= Are my existing images converted to WebP? =
No — only new uploads. Existing images are compressed but keep their format, because their URLs are already used in your posts and pages; converting them would break those links.

= Where do I see what was compressed? =
In **Media → Library**. In list view there is a *WebP Ninja* column; in grid view, click an image and look for the *WebP Ninja* row in the details panel. **Settings → WebP Ninja** shows the total saved.

= Will it compress images I uploaded before installing the plugin? =
Yes — go to **Settings → WebP Ninja** and click **Compress existing images**, or use the *Compress with WebP Ninja* bulk action in the Media Library list view.

= An image says "Already optimized". Is that a problem? =
No. WebP Ninja only replaces a file when the result is at least 3% smaller. Images that were already well compressed are left exactly as they were.

= Does it keep PNG transparency? =
Yes. With Imagick, transparent PNGs get full smart compression. With GD only, transparent PNGs are compressed losslessly (GD's color reduction can't keep transparency), and fully opaque PNGs get smart compression.

= What quality setting should I use? =
80–85 is ideal for most sites. Lower values give smaller files but more visible compression artifacts.

== Changelog ==

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
* New: "Compress with WebP Ninja" bulk action.
* New: server check (Imagick/GD, WebP support) and total savings on the settings page.
* New: thumbnails are generated at your quality setting in a single pass.
* New: animated WebP/PNG are skipped; color profiles are kept.
* New: uninstall removes all plugin data.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.2.0 =
New uploads are now converted to WebP by default. Choose AVIF, JPEG or "Keep original format" under Settings → WebP Ninja.

= 1.1.1 =
Shows correct file sizes in the Media Library after compression.

= 1.1.0 =
Fixes PNG compression and adds "Compress existing images". Recommended for all users.

= 1.0.0 =
Initial release.
