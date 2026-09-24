<?php
/**
 * Plugin Name:       WebP Ninja Image Compressor
 * Plugin URI:        https://webpninja.com/wordpress-plugin
 * Description:       Compresses JPEG, PNG and WebP images on upload with Imagick or GD. Privacy-first — all compression happens on your own server.
 * Version:           1.2.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            WebP Ninja
 * Author URI:        https://webpninja.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       webp-ninja-image-compressor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WEBPNINJA_VERSION', '1.2.0' );
define( 'WEBPNINJA_FILE', __FILE__ );
define( 'WEBPNINJA_PATH', plugin_dir_path( __FILE__ ) );
define( 'WEBPNINJA_URL', plugin_dir_url( __FILE__ ) );

require_once WEBPNINJA_PATH . 'includes/class-compressor.php';
require_once WEBPNINJA_PATH . 'includes/class-settings.php';
require_once WEBPNINJA_PATH . 'includes/class-media-column.php';

register_activation_hook( __FILE__, function () {
	add_option( 'webpninja_quality', 82 );
	add_option( 'webpninja_auto', 1 );
	add_option( 'webpninja_png_lossy', 1 );
	add_option( 'webpninja_format', 'webp' );
	set_transient( 'webpninja_activated', 1, MINUTE_IN_SECONDS * 10 );
} );

$webpninja_compressor = new WebPNinja_Compressor();
new WebPNinja_Settings( $webpninja_compressor );
new WebPNinja_Media_Column( $webpninja_compressor );

/*
 * One-time upgrade: 1.1.0 compressed files without refreshing the sizes
 * WordPress caches in attachment metadata, so "File size" in the Media
 * Library kept showing the pre-compression size. Only reads file sizes —
 * no image processing — so it's cheap even on large libraries.
 */
add_action( 'admin_init', function () use ( $webpninja_compressor ) {
	if ( version_compare( get_option( 'webpninja_db_version', '0' ), '1.1.1', '>=' ) ) {
		return;
	}
	$ids = get_posts( [
		'post_type'      => 'attachment',
		'post_status'    => 'inherit',
		'posts_per_page' => -1,
		'fields'         => 'ids',
		// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one-time upgrade.
		'meta_key'       => WebPNinja_Compressor::META_KEY,
	] );
	foreach ( $ids as $id ) {
		$metadata = wp_get_attachment_metadata( $id );
		if ( is_array( $metadata ) ) {
			wp_update_attachment_metadata( $id, $webpninja_compressor->refresh_filesizes( $id, $metadata ) );
		}
	}
	update_option( 'webpninja_db_version', '1.1.1' );
} );
