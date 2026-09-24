<?php
/**
 * Plugin Name:       WebP Ninja Image Compressor
 * Plugin URI:        https://webpninja.com
 * Description:       Compresses JPEG, PNG and WebP images on upload with Imagick or GD. Privacy-first — all compression happens on your own server.
 * Version:           1.1.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            WebP Ninja
 * Author URI:        https://webpninja.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       webpninja
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WEBPNINJA_VERSION', '1.1.0' );
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
	set_transient( 'webpninja_activated', 1, MINUTE_IN_SECONDS * 10 );
} );

$webpninja_compressor = new WebPNinja_Compressor();
new WebPNinja_Settings( $webpninja_compressor );
new WebPNinja_Media_Column( $webpninja_compressor );
