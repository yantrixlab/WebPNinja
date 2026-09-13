<?php
/**
 * Plugin Name:       WebP Ninja Image Compressor
 * Plugin URI:        https://webpninja.com
 * Description:       Auto-compress images on upload using GD / Imagick. Privacy-first — all compression happens on your server.
 * Version:           1.0.0
 * Author:            WebP Ninja
 * Author URI:        https://webpninja.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       webpninja
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WEBPNINJA_VERSION', '1.0.0' );
define( 'WEBPNINJA_PATH', plugin_dir_path( __FILE__ ) );
define( 'WEBPNINJA_URL', plugin_dir_url( __FILE__ ) );

require_once WEBPNINJA_PATH . 'includes/class-compressor.php';
require_once WEBPNINJA_PATH . 'includes/class-settings.php';
require_once WEBPNINJA_PATH . 'includes/class-media-column.php';

register_activation_hook( __FILE__, function () {
	if ( get_option( 'webpninja_quality' ) === false ) {
		add_option( 'webpninja_quality', 82 );
	}
} );

new WebPNinja_Compressor();
new WebPNinja_Settings();
new WebPNinja_Media_Column();
