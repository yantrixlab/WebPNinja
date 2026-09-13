<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WebPNinja_Compressor {

	public function __construct() {
		add_filter( 'wp_generate_attachment_metadata', [ $this, 'compress_on_upload' ], 10, 2 );
	}

	public function compress_on_upload( $metadata, $attachment_id ) {
		$mime = get_post_mime_type( $attachment_id );

		if ( ! in_array( $mime, [ 'image/jpeg', 'image/png', 'image/webp' ], true ) ) {
			return $metadata;
		}

		$quality    = (int) get_option( 'webpninja_quality', 82 );
		$upload_dir = wp_upload_dir();
		$base_dir   = $upload_dir['basedir'];

		$paths = [];

		// Original file.
		$original = get_attached_file( $attachment_id );
		if ( $original && file_exists( $original ) ) {
			$paths[] = $original;
		}

		// Generated sizes.
		if ( ! empty( $metadata['sizes'] ) && ! empty( $metadata['file'] ) ) {
			$sub_dir = trailingslashit( $base_dir . '/' . dirname( $metadata['file'] ) );
			foreach ( $metadata['sizes'] as $size ) {
				$path = $sub_dir . $size['file'];
				if ( file_exists( $path ) ) {
					$paths[] = $path;
				}
			}
		}

		$total_saved = 0;

		foreach ( $paths as $path ) {
			$before = filesize( $path );
			$ok     = $this->compress( $path, $quality, $mime );
			if ( $ok ) {
				clearstatcache( true, $path );
				$after        = filesize( $path );
				$total_saved += max( 0, $before - $after );
			}
		}

		if ( $total_saved > 0 ) {
			update_post_meta( $attachment_id, '_webpninja_bytes_saved', $total_saved );
		}

		return $metadata;
	}

	private function compress( $path, $quality, $mime ) {
		if ( extension_loaded( 'imagick' ) ) {
			return $this->compress_imagick( $path, $quality, $mime );
		}
		return $this->compress_gd( $path, $quality, $mime );
	}

	private function compress_imagick( $path, $quality, $mime ) {
		try {
			$img = new Imagick( $path );
			$img->setImageCompressionQuality( $quality );
			$img->stripImage();

			if ( $mime === 'image/png' ) {
				// PNG quality in Imagick maps to zlib level (0-9). Scale 1-100 → 0-9.
				$img->setImageCompression( Imagick::COMPRESSION_ZIP );
				$img->setImageCompressionQuality( (int) round( ( 100 - $quality ) / 100 * 9 ) );
			}

			$img->writeImage( $path );
			$img->destroy();
			return true;
		} catch ( Exception $e ) {
			return false;
		}
	}

	private function compress_gd( $path, $quality, $mime ) {
		switch ( $mime ) {
			case 'image/jpeg':
				$img = imagecreatefromjpeg( $path );
				if ( ! $img ) {
					return false;
				}
				return imagejpeg( $img, $path, $quality );

			case 'image/png':
				$img = imagecreatefrompng( $path );
				if ( ! $img ) {
					return false;
				}
				imagesavealpha( $img, true );
				// PNG compression 0-9; invert quality scale.
				$level = (int) round( ( 100 - $quality ) / 100 * 9 );
				return imagepng( $img, $path, $level );

			case 'image/webp':
				if ( ! function_exists( 'imagecreatefromwebp' ) ) {
					return false;
				}
				$img = imagecreatefromwebp( $path );
				if ( ! $img ) {
					return false;
				}
				return imagewebp( $img, $path, $quality );
		}

		return false;
	}
}
