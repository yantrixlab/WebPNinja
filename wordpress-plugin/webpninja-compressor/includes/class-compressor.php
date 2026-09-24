<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Compresses an attachment's files in place, on this server, with Imagick or GD.
 *
 * Every file is encoded to a temp file first and only swapped in when it
 * comes out meaningfully smaller — so compression can never grow a file or
 * leave a half-written one behind.
 */
class WebPNinja_Compressor {

	const META_KEY = '_webpninja';

	/** Legacy (1.0.x) meta key — still written so old data stays readable. */
	const SAVED_META_KEY = '_webpninja_bytes_saved';

	const MIMES = [ 'image/jpeg', 'image/png', 'image/webp' ];

	/**
	 * A re-encode that saves less than this isn't worth the generation loss
	 * of a lossy format, so the original bytes are kept.
	 */
	const MIN_SAVING_RATIO = 0.03;

	public function __construct() {
		add_filter( 'wp_generate_attachment_metadata', [ $this, 'compress_on_upload' ], 10, 2 );
		// Make WordPress itself generate JPEG/WebP thumbnails at our quality,
		// so they come out small in one pass instead of being encoded twice.
		add_filter( 'wp_editor_set_quality', [ $this, 'editor_quality' ], 10, 2 );
	}

	public static function quality() {
		return max( 1, min( 100, (int) get_option( 'webpninja_quality', 82 ) ) );
	}

	public static function engine() {
		if ( extension_loaded( 'imagick' ) && class_exists( 'Imagick' ) ) {
			return 'imagick';
		}
		if ( extension_loaded( 'gd' ) && function_exists( 'imagecreatefromjpeg' ) ) {
			return 'gd';
		}
		return '';
	}

	public function editor_quality( $quality, $mime = '' ) {
		if ( in_array( $mime, [ 'image/jpeg', 'image/webp' ], true ) ) {
			return self::quality();
		}
		return $quality;
	}

	public function compress_on_upload( $metadata, $attachment_id ) {
		if ( get_option( 'webpninja_auto', 1 ) ) {
			$this->compress_attachment( $attachment_id, $metadata );
			// Core measured the file sizes before this filter ran; refresh them
			// so "File size" in the Media Library shows the compressed size.
			$metadata = $this->refresh_filesizes( $attachment_id, $metadata );
		}
		return $metadata;
	}

	/**
	 * Updates the `filesize` values WordPress (6.0+) caches in attachment
	 * metadata for the main file and each generated size.
	 */
	public function refresh_filesizes( $attachment_id, $metadata ) {
		if ( ! is_array( $metadata ) ) {
			return $metadata;
		}
		$attached = get_attached_file( $attachment_id );
		if ( $attached && file_exists( $attached ) ) {
			clearstatcache( true, $attached );
			$metadata['filesize'] = (int) filesize( $attached );
			if ( ! empty( $metadata['sizes'] ) && is_array( $metadata['sizes'] ) ) {
				$dir = trailingslashit( dirname( $attached ) );
				foreach ( $metadata['sizes'] as $name => $size ) {
					if ( ! empty( $size['file'] ) && file_exists( $dir . $size['file'] ) ) {
						clearstatcache( true, $dir . $size['file'] );
						$metadata['sizes'][ $name ]['filesize'] = (int) filesize( $dir . $size['file'] );
					}
				}
			}
		}
		return $metadata;
	}

	/**
	 * Compresses an attachment that already exists (manual/bulk) and saves the
	 * refreshed file sizes to its metadata.
	 */
	public function compress_existing( $attachment_id ) {
		$result   = $this->compress_attachment( $attachment_id );
		$metadata = wp_get_attachment_metadata( $attachment_id );
		if ( is_array( $metadata ) && 'done' === $result['status'] && $result['after'] < $result['before'] ) {
			wp_update_attachment_metadata( $attachment_id, $this->refresh_filesizes( $attachment_id, $metadata ) );
		}
		return $result;
	}

	/**
	 * Compresses the attachment's main file and every generated size.
	 *
	 * @param int        $attachment_id Attachment post ID.
	 * @param array|null $metadata      Attachment metadata; read from the DB when null
	 *                                  (it isn't saved yet during the upload filter).
	 * @return array{status:string,before:int,after:int,files:int,message?:string}
	 */
	public function compress_attachment( $attachment_id, $metadata = null ) {
		$mime = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime, self::MIMES, true ) ) {
			return $this->save_result( $attachment_id, 'skipped', 0, 0, 0, __( 'Unsupported file type', 'webpninja' ) );
		}

		$engine = self::engine();
		if ( ! $engine ) {
			return $this->save_result( $attachment_id, 'failed', 0, 0, 0, __( 'Neither Imagick nor GD is available on this server', 'webpninja' ) );
		}

		if ( null === $metadata ) {
			$metadata = wp_get_attachment_metadata( $attachment_id );
		}

		$paths    = [];
		$attached = get_attached_file( $attachment_id );
		if ( $attached && file_exists( $attached ) ) {
			$paths[] = $attached;
		}
		if ( $attached && ! empty( $metadata['sizes'] ) && is_array( $metadata['sizes'] ) ) {
			$dir = trailingslashit( dirname( $attached ) );
			foreach ( $metadata['sizes'] as $size ) {
				if ( ! empty( $size['file'] ) && file_exists( $dir . $size['file'] ) ) {
					$paths[] = $dir . $size['file'];
				}
			}
		}
		$paths = array_unique( $paths );

		if ( ! $paths ) {
			return $this->save_result( $attachment_id, 'failed', 0, 0, 0, __( 'Image file not found on disk', 'webpninja' ) );
		}

		if ( $this->is_animated( $paths[0], $mime ) ) {
			return $this->save_result( $attachment_id, 'skipped', 0, 0, 0, __( 'Animated image — left untouched to keep the animation', 'webpninja' ) );
		}

		wp_raise_memory_limit( 'image' );

		// Pessimistic marker, overwritten below on completion. If PHP dies
		// mid-encode (memory/time limit), this image is recorded as failed
		// instead of being retried forever by the bulk "compress existing" loop.
		$this->save_result( $attachment_id, 'failed', 0, 0, 0, __( 'Did not finish — the server may have run out of memory or time', 'webpninja' ) );

		$quality = self::quality();
		$before  = 0;
		$after   = 0;
		foreach ( $paths as $path ) {
			$size_before = (int) filesize( $path );
			$before     += $size_before;
			$after      += $this->compress_file( $path, $mime, $quality, $engine );
		}

		return $this->save_result( $attachment_id, 'done', $before, $after, count( $paths ) );
	}

	/**
	 * Compresses one file in place.
	 *
	 * @return int The file's size afterwards (unchanged if compression didn't help).
	 */
	public function compress_file( $path, $mime, $quality, $engine ) {
		clearstatcache( true, $path );
		$original = (int) filesize( $path );
		$tmp      = $path . '.webpninja-tmp';

		try {
			$ok = 'imagick' === $engine
				? $this->encode_imagick( $path, $tmp, $mime, $quality )
				: $this->encode_gd( $path, $tmp, $mime, $quality );
		} catch ( Throwable $e ) {
			$ok = false;
		}

		clearstatcache( true, $tmp );
		$new = $ok && file_exists( $tmp ) ? (int) filesize( $tmp ) : 0;

		if ( $new > 0 && $new <= $original * ( 1 - self::MIN_SAVING_RATIO ) && @rename( $tmp, $path ) ) {
			return $new;
		}

		if ( file_exists( $tmp ) ) {
			wp_delete_file( $tmp );
		}
		return $original;
	}

	/** Maps the 1–100 quality setting to a PNG palette size. */
	public static function png_colors( $quality ) {
		return max( 32, min( 256, (int) round( $quality * 2.56 ) ) );
	}

	private function encode_imagick( $src, $dest, $mime, $quality ) {
		$img = new Imagick( $src );

		// Keep the color profile (stripping it shifts colors on wide-gamut
		// photos); drop everything else — EXIF, GPS, thumbnails, comments.
		$profiles = $img->getImageProfiles( 'icc', true );
		$img->stripImage();
		if ( ! empty( $profiles['icc'] ) ) {
			$img->profileImage( 'icc', $profiles['icc'] );
		}

		switch ( $mime ) {
			case 'image/jpeg':
				$img->setImageFormat( 'jpeg' );
				$img->setImageCompressionQuality( $quality );
				$img->setSamplingFactors( [ '2x2', '1x1', '1x1' ] );
				// Progressive JPEGs are typically a few percent smaller.
				$img->setInterlaceScheme( Imagick::INTERLACE_PLANE );
				break;

			case 'image/png':
				// The actual size win for PNG: reduce to an optimized palette
				// (like pngquant/TinyPNG), dithered so gradients stay smooth.
				// Plain zlib re-compression alone barely changes a PNG.
				if ( get_option( 'webpninja_png_lossy', 1 ) && $img->getImageColors() > self::png_colors( $quality ) ) {
					$img->quantizeImage( self::png_colors( $quality ), Imagick::COLORSPACE_SRGB, 0, true, false );
				}
				$img->setImageFormat( 'png' );
				$img->setOption( 'png:compression-level', '9' );
				$img->setOption( 'png:compression-filter', '5' );
				break;

			case 'image/webp':
				$img->setImageFormat( 'webp' );
				$img->setImageCompressionQuality( $quality );
				$img->setOption( 'webp:method', '6' );
				break;

			default:
				$img->destroy();
				return false;
		}

		$ok = $img->writeImage( $dest );
		$img->destroy();
		return $ok;
	}

	private function encode_gd( $src, $dest, $mime, $quality ) {
		switch ( $mime ) {
			case 'image/jpeg':
				$img = @imagecreatefromjpeg( $src );
				if ( ! $img ) {
					return false;
				}
				imageinterlace( $img, true );
				$ok = imagejpeg( $img, $dest, $quality );
				break;

			case 'image/png':
				$img = @imagecreatefrompng( $src );
				if ( ! $img ) {
					return false;
				}
				imagealphablending( $img, false );
				imagesavealpha( $img, true );
				// GD's palette conversion discards the alpha channel entirely
				// (transparent areas turn opaque), so it's only safe on fully
				// opaque images; transparent ones get lossless recompression.
				if ( get_option( 'webpninja_png_lossy', 1 ) && imageistruecolor( $img ) && ! $this->gd_has_transparency( $img, $src ) ) {
					imagetruecolortopalette( $img, true, self::png_colors( $quality ) );
				}
				$ok = imagepng( $img, $dest, 9 );
				break;

			case 'image/webp':
				if ( ! function_exists( 'imagecreatefromwebp' ) ) {
					return false;
				}
				$img = @imagecreatefromwebp( $src );
				if ( ! $img ) {
					return false;
				}
				imagealphablending( $img, false );
				imagesavealpha( $img, true );
				$ok = imagewebp( $img, $dest, $quality );
				break;

			default:
				return false;
		}

		imagedestroy( $img );
		return $ok;
	}

	/** Largest image whose pixels are scanned for transparency (measured ~0.04 s/MP, so ~1 s here). */
	const GD_ALPHA_SCAN_MAX_PIXELS = 25000000;

	/**
	 * Whether a PNG has any non-opaque pixel. The header's color type rules
	 * out most images for free (plain RGB/grayscale without a tRNS chunk);
	 * only RGBA/tRNS files — often fully opaque in practice — need a scan.
	 * Too large to scan means "assume transparent", the safe answer.
	 */
	private function gd_has_transparency( $img, $path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file, small read.
		$head       = (string) file_get_contents( $path, false, null, 0, 65536 );
		$color_type = strlen( $head ) > 25 ? ord( $head[25] ) : 6;
		if ( ! in_array( $color_type, [ 4, 6 ], true ) && false === strpos( $head, 'tRNS' ) ) {
			return false;
		}

		$width  = imagesx( $img );
		$height = imagesy( $img );
		if ( $width * $height > self::GD_ALPHA_SCAN_MAX_PIXELS ) {
			return true;
		}
		for ( $y = 0; $y < $height; $y++ ) {
			for ( $x = 0; $x < $width; $x++ ) {
				if ( ( imagecolorat( $img, $x, $y ) >> 24 ) & 0x7F ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Animated WebP/PNG would be flattened to one frame by a re-encode, so they
	 * are skipped. Detected from the container chunks in the first few KB.
	 */
	private function is_animated( $path, $mime ) {
		if ( 'image/jpeg' === $mime ) {
			return false;
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file, small read.
		$head = (string) file_get_contents( $path, false, null, 0, 4096 );
		return 'image/webp' === $mime ? false !== strpos( $head, 'ANIM' ) : false !== strpos( $head, 'acTL' );
	}

	private function save_result( $attachment_id, $status, $before, $after, $files, $message = '' ) {
		$result = [
			'status' => $status,
			'before' => (int) $before,
			'after'  => (int) $after,
			'files'  => (int) $files,
			'engine' => self::engine(),
			'time'   => time(),
		];
		if ( $message ) {
			$result['message'] = $message;
		}
		update_post_meta( $attachment_id, self::META_KEY, $result );
		update_post_meta( $attachment_id, self::SAVED_META_KEY, max( 0, $before - $after ) );
		return $result;
	}

	/** Result for an attachment, or null if it was never processed. */
	public static function get_result( $attachment_id ) {
		$result = get_post_meta( $attachment_id, self::META_KEY, true );
		if ( is_array( $result ) ) {
			return $result;
		}
		// Compressed by 1.0.x, which only recorded bytes saved.
		$legacy = (int) get_post_meta( $attachment_id, self::SAVED_META_KEY, true );
		return $legacy > 0 ? [ 'status' => 'done', 'saved' => $legacy ] : null;
	}
}
