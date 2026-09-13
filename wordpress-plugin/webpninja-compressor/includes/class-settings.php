<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WebPNinja_Settings {

	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_menu' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
	}

	public function add_menu() {
		add_options_page(
			__( 'WebP Ninja Settings', 'webpninja' ),
			__( 'WebP Ninja', 'webpninja' ),
			'manage_options',
			'webpninja',
			[ $this, 'render_page' ]
		);
	}

	public function register_settings() {
		register_setting( 'webpninja_group', 'webpninja_quality', [
			'type'              => 'integer',
			'default'           => 82,
			'sanitize_callback' => function ( $v ) {
				return max( 1, min( 100, (int) $v ) );
			},
		] );
	}

	public function enqueue_assets( $hook ) {
		if ( $hook !== 'settings_page_webpninja' ) {
			return;
		}
		wp_enqueue_style( 'webpninja-admin', WEBPNINJA_URL . 'assets/admin.css', [], WEBPNINJA_VERSION );
	}

	public function render_page() {
		$quality = (int) get_option( 'webpninja_quality', 82 );
		?>
		<div class="wrap webpninja-wrap">
			<div class="webpninja-header">
				<h1><?php esc_html_e( 'WebP Ninja Image Compressor', 'webpninja' ); ?></h1>
				<p class="webpninja-tagline">
					<?php esc_html_e( 'Auto-compress every image on upload. All processing happens on your server — no files ever leave your WordPress install.', 'webpninja' ); ?>
				</p>
			</div>

			<form method="post" action="options.php">
				<?php settings_fields( 'webpninja_group' ); ?>

				<div class="webpninja-card">
					<h2><?php esc_html_e( 'Compression Quality', 'webpninja' ); ?></h2>
					<p><?php esc_html_e( 'Higher values preserve more detail; lower values produce smaller files. 80–85 is a great balance for most sites.', 'webpninja' ); ?></p>

					<div class="webpninja-slider-row">
						<input
							type="range"
							id="webpninja_quality"
							name="webpninja_quality"
							min="1"
							max="100"
							value="<?php echo esc_attr( $quality ); ?>"
							oninput="document.getElementById('webpninja_quality_val').textContent = this.value"
						>
						<span class="webpninja-quality-val" id="webpninja_quality_val"><?php echo esc_html( $quality ); ?></span>
					</div>

					<p class="description">
						<?php
						printf(
							/* translators: %s: link to webpninja.com */
							esc_html__( 'Need lossless, AVIF, or GIF support? Try %s — free, browser-based, no upload limits.', 'webpninja' ),
							'<a href="https://webpninja.com" target="_blank" rel="noopener">webpninja.com</a>'
						);
						?>
					</p>
				</div>

				<?php submit_button( __( 'Save Settings', 'webpninja' ) ); ?>
			</form>

			<div class="webpninja-footer">
				<a href="https://webpninja.com" target="_blank" rel="noopener">webpninja.com</a>
				&mdash;
				<?php esc_html_e( 'Free browser-based image compression, no limits.', 'webpninja' ); ?>
			</div>
		</div>
		<?php
	}
}
