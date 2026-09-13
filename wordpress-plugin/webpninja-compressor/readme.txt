=== WebP Ninja Image Compressor ===
Contributors: webpninja
Tags: image compression, optimize images, compress jpeg, compress png, webp
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Auto-compress images on upload. Privacy-first — all processing happens on your server with GD or Imagick.

== Description ==

**WebP Ninja Image Compressor** automatically shrinks every image the moment it's uploaded to your WordPress Media Library. No API keys. No external requests. Everything happens on your own server.

**Features:**
* Auto-compress JPEG, PNG, and WebP on upload
* Compresses the original file *and* every generated thumbnail
* Adjustable quality setting (default 82 — a great balance of size vs. quality)
* Uses Imagick when available, falls back to GD
* Media Library column shows how many bytes were saved per image
* Zero tracking, zero external calls

**Need more?** Visit [webpninja.com](https://webpninja.com) for free browser-based compression with AVIF, GIF, and no file size limits.

== Installation ==

1. Upload the `webpninja-compressor` folder to `/wp-content/plugins/`.
2. Activate the plugin in **Plugins → Installed Plugins**.
3. Go to **Settings → WebP Ninja** to adjust the quality level.
4. Upload any image — it will be compressed automatically.

== Frequently Asked Questions ==

= Does this send my images to an external server? =
No. All compression is done locally by PHP (Imagick or GD) on your own server.

= Which image formats are supported? =
JPEG, PNG, and WebP. GIF and AVIF require browser-side tools like [webpninja.com](https://webpninja.com).

= Will it recompress images I uploaded before installing the plugin? =
Not automatically. Only new uploads are compressed. To recompress existing images, regenerate thumbnails using a plugin like "Regenerate Thumbnails".

= What quality setting should I use? =
80–85 is ideal for most sites. Lower values give smaller files but more visible compression artifacts.

== Changelog ==

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
