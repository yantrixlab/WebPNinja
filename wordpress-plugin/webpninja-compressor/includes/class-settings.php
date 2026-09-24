<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WebPNinja_Settings {

	/** @var WebPNinja_Compressor */
	private $compressor;

	public function __construct( WebPNinja_Compressor $compressor ) {
		$this->compressor = $compressor;

		add_action( 'admin_menu', [ $this, 'add_menu' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
		add_filter( 'plugin_action_links_' . plugin_basename( WEBPNINJA_FILE ), [ $this, 'action_links' ] );
		add_action( 'admin_notices', [ $this, 'activation_notice' ] );
		add_action( 'wp_ajax_webpninja_bulk_next', [ $this, 'ajax_bulk_next' ] );
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
		foreach ( [ 'webpninja_auto', 'webpninja_png_lossy' ] as $option ) {
			register_setting( 'webpninja_group', $option, [
				'type'              => 'boolean',
				'default'           => 1,
				'sanitize_callback' => function ( $v ) {
					return $v ? 1 : 0;
				},
			] );
		}
	}

	public function action_links( $links ) {
		$url = admin_url( 'options-general.php?page=webpninja' );
		array_unshift(
			$links,
			'<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'webpninja' ) . '</a>',
			'<a href="' . esc_url( $url . '#webpninja-bulk' ) . '">' . esc_html__( 'Compress existing images', 'webpninja' ) . '</a>'
		);
		return $links;
	}

	/** One-time pointer shown right after activation, so nobody has to hunt for the plugin. */
	public function activation_notice() {
		if ( ! current_user_can( 'manage_options' ) || ! get_transient( 'webpninja_activated' ) ) {
			return;
		}
		delete_transient( 'webpninja_activated' );
		$pending = $this->pending_count();
		?>
		<div class="notice notice-success is-dismissible">
			<p>
				<strong><?php esc_html_e( 'WebP Ninja is active.', 'webpninja' ); ?></strong>
				<?php esc_html_e( 'New uploads are now compressed automatically.', 'webpninja' ); ?>
				<?php if ( $pending ) : ?>
					<a href="<?php echo esc_url( admin_url( 'options-general.php?page=webpninja#webpninja-bulk' ) ); ?>">
						<?php
						/* translators: %d: number of images */
						echo esc_html( sprintf( _n( 'Compress your %d existing image →', 'Compress your %d existing images →', $pending, 'webpninja' ), $pending ) );
						?>
					</a>
				<?php endif; ?>
			</p>
		</div>
		<?php
	}

	/* ─────────── Bulk "compress existing images" ─────────── */

	/** Supported images with no WebP Ninja result recorded yet. */
	private function pending_query_args( $limit ) {
		return [
			'post_type'              => 'attachment',
			'post_status'            => 'inherit',
			'post_mime_type'         => WebPNinja_Compressor::MIMES,
			'posts_per_page'         => $limit,
			'fields'                 => 'ids',
			'orderby'                => 'ID',
			'order'                  => 'DESC',
			'no_found_rows'          => false,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- admin-only, run on demand.
			'meta_query'             => [
				'relation' => 'AND',
				[ 'key' => WebPNinja_Compressor::META_KEY, 'compare' => 'NOT EXISTS' ],
				[ 'key' => WebPNinja_Compressor::SAVED_META_KEY, 'compare' => 'NOT EXISTS' ],
			],
		];
	}

	public function pending_count() {
		$query = new WP_Query( $this->pending_query_args( 1 ) );
		return (int) $query->found_posts;
	}

	/** Compresses the next pending image; the settings page calls this in a loop. */
	public function ajax_bulk_next() {
		check_ajax_referer( 'webpninja', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [ 'message' => __( 'Permission denied.', 'webpninja' ) ], 403 );
		}

		$query = new WP_Query( $this->pending_query_args( 1 ) );
		if ( ! $query->posts ) {
			wp_send_json_success( [ 'remaining' => 0 ] );
		}

		$id     = (int) $query->posts[0];
		$result = $this->compressor->compress_attachment( $id );

		wp_send_json_success( [
			'remaining' => max( 0, (int) $query->found_posts - 1 ),
			'title'     => get_the_title( $id ),
			'saved'     => max( 0, ( $result['before'] ?? 0 ) - ( $result['after'] ?? 0 ) ),
		] );
	}

	private function total_saved() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- aggregate over our own meta key; no API equivalent.
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT SUM(meta_value) FROM {$wpdb->postmeta} WHERE meta_key = %s", WebPNinja_Compressor::SAVED_META_KEY ) );
	}

	/* ─────────── Page ─────────── */

	public function render_page() {
		$quality   = WebPNinja_Compressor::quality();
		$auto      = (int) get_option( 'webpninja_auto', 1 );
		$png_lossy = (int) get_option( 'webpninja_png_lossy', 1 );
		$engine    = WebPNinja_Compressor::engine();
		$pending   = $this->pending_count();
		$saved     = $this->total_saved();
		$webp_ok   = 'imagick' === $engine ? in_array( 'WEBP', Imagick::queryFormats( 'WEBP' ), true ) : function_exists( 'imagewebp' );
		?>
		<div class="wrap webpninja-wrap">
			<div class="webpninja-header">
				<h1><?php esc_html_e( 'WebP Ninja Image Compressor', 'webpninja' ); ?></h1>
				<p class="webpninja-tagline">
					<?php esc_html_e( 'Compresses every image on upload. All processing happens on your server — no files ever leave your WordPress install.', 'webpninja' ); ?>
				</p>
			</div>

			<div class="webpninja-card webpninja-stats">
				<div>
					<span class="webpninja-stat"><?php echo esc_html( size_format( $saved, 1 ) ?: '0 B' ); ?></span>
					<span class="webpninja-muted"><?php esc_html_e( 'saved so far', 'webpninja' ); ?></span>
				</div>
				<div>
					<span class="webpninja-stat"><?php echo esc_html( number_format_i18n( $pending ) ); ?></span>
					<span class="webpninja-muted"><?php esc_html_e( 'images not compressed yet', 'webpninja' ); ?></span>
				</div>
			</div>

			<div class="webpninja-card" id="webpninja-bulk">
				<h2><?php esc_html_e( 'Compress existing images', 'webpninja' ); ?></h2>
				<p><?php esc_html_e( 'Images uploaded before WebP Ninja was active are not compressed automatically. Run this once to catch up — keep this tab open until it finishes.', 'webpninja' ); ?></p>
				<?php if ( $pending ) : ?>
					<p>
						<button type="button" class="button button-primary" id="webpninja-bulk-start" data-total="<?php echo (int) $pending; ?>">
							<?php
							/* translators: %d: number of images */
							echo esc_html( sprintf( _n( 'Compress %d image', 'Compress %d images', $pending, 'webpninja' ), $pending ) );
							?>
						</button>
					</p>
					<div class="webpninja-progress" hidden><div class="webpninja-progress-bar"></div></div>
					<p class="webpninja-bulk-log webpninja-muted" aria-live="polite"></p>
				<?php else : ?>
					<p class="webpninja-good"><?php esc_html_e( 'All images are compressed.', 'webpninja' ); ?></p>
				<?php endif; ?>
				<p class="description">
					<?php esc_html_e( 'Tip: you can also compress single images from Media → Library (list view) or the image details panel.', 'webpninja' ); ?>
				</p>
			</div>

			<form method="post" action="options.php">
				<?php settings_fields( 'webpninja_group' ); ?>

				<div class="webpninja-card">
					<h2><?php esc_html_e( 'Compression settings', 'webpninja' ); ?></h2>

					<p>
						<label>
							<input type="checkbox" name="webpninja_auto" value="1" <?php checked( $auto ); ?>>
							<?php esc_html_e( 'Compress new uploads automatically', 'webpninja' ); ?>
						</label>
					</p>

					<h3><label for="webpninja_quality"><?php esc_html_e( 'Quality', 'webpninja' ); ?></label></h3>
					<p><?php esc_html_e( 'Higher values preserve more detail; lower values produce smaller files. 80–85 is a great balance for most sites.', 'webpninja' ); ?></p>
					<div class="webpninja-slider-row">
						<input type="range" id="webpninja_quality" name="webpninja_quality" min="1" max="100" value="<?php echo esc_attr( $quality ); ?>">
						<span class="webpninja-quality-val" id="webpninja_quality_val"><?php echo esc_html( $quality ); ?></span>
					</div>

					<p>
						<label>
							<input type="checkbox" name="webpninja_png_lossy" value="1" <?php checked( $png_lossy ); ?>>
							<?php esc_html_e( 'Smart PNG compression (reduce colors, like TinyPNG) — much smaller PNGs, visually near-identical', 'webpninja' ); ?>
						</label>
					</p>
				</div>

				<?php submit_button( __( 'Save Settings', 'webpninja' ) ); ?>
			</form>

			<div class="webpninja-card">
				<h2><?php esc_html_e( 'Server check', 'webpninja' ); ?></h2>
				<table class="widefat striped webpninja-check">
					<tbody>
						<tr>
							<td><?php esc_html_e( 'Image engine', 'webpninja' ); ?></td>
							<td>
								<?php if ( 'imagick' === $engine ) : ?>
									<span class="webpninja-good">✓ Imagick</span>
								<?php elseif ( 'gd' === $engine ) : ?>
									<span class="webpninja-good">✓ GD</span>
									<span class="webpninja-muted"><?php esc_html_e( '(Imagick gives slightly better results and keeps color profiles)', 'webpninja' ); ?></span>
								<?php else : ?>
									<span class="webpninja-bad"><?php esc_html_e( '✗ Neither Imagick nor GD is installed — ask your host to enable one.', 'webpninja' ); ?></span>
								<?php endif; ?>
							</td>
						</tr>
						<tr>
							<td><?php esc_html_e( 'WebP support', 'webpninja' ); ?></td>
							<td><?php echo $webp_ok ? '<span class="webpninja-good">✓</span>' : '<span class="webpninja-bad">✗</span> <span class="webpninja-muted">' . esc_html__( 'WebP uploads will be skipped', 'webpninja' ) . '</span>'; ?></td>
						</tr>
						<tr>
							<td><?php esc_html_e( 'PHP memory limit', 'webpninja' ); ?></td>
							<td><?php echo esc_html( ini_get( 'memory_limit' ) ); ?></td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="webpninja-footer">
				<?php
				printf(
					/* translators: %s: link to webpninja.com */
					esc_html__( 'Need AVIF, exact file sizes (e.g. under 50 KB) or batch conversion? Try %s — free and browser-based.', 'webpninja' ),
					'<a href="https://webpninja.com/tools" target="_blank" rel="noopener">webpninja.com</a>'
				);
				?>
			</div>
		</div>
		<?php
	}
}
