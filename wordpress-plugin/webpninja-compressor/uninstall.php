<?php
/**
 * Removes WebP Ninja's settings and per-image records. Compressed image files
 * are left as they are — they're ordinary, valid images.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'webpninja_quality' );
delete_option( 'webpninja_auto' );
delete_option( 'webpninja_png_lossy' );
delete_option( 'webpninja_format' );
delete_option( 'webpninja_db_version' );
delete_transient( 'webpninja_activated' );

delete_post_meta_by_key( '_webpninja' );
delete_post_meta_by_key( '_webpninja_bytes_saved' );
