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
			__( 'WebP Ninja Settings', 'webp-ninja-image-compressor' ),
			__( 'WebP Ninja', 'webp-ninja-image-compressor' ),
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
		register_setting( 'webpninja_group', 'webpninja_format', [
			'type'              => 'string',
			'default'           => 'webp',
			'sanitize_callback' => function ( $v ) {
				return isset( WebPNinja_Compressor::OUTPUT_FORMATS[ $v ] ) ? $v : 'original';
			},
		] );
		register_setting( 'webpninja_group', WebPNinja_Stats::OPTION, [
			'type'              => 'boolean',
			'default'           => 0,
			'sanitize_callback' => function ( $v ) {
				return $v ? 1 : 0;
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
			'<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'webp-ninja-image-compressor' ) . '</a>',
			'<a href="' . esc_url( $url . '#webpninja-bulk' ) . '">' . esc_html__( 'Compress existing images', 'webp-ninja-image-compressor' ) . '</a>'
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
				<strong><?php esc_html_e( 'WebP Ninja is active.', 'webp-ninja-image-compressor' ); ?></strong>
				<?php esc_html_e( 'New uploads are now compressed automatically.', 'webp-ninja-image-compressor' ); ?>
				<?php if ( $pending ) : ?>
					<a href="<?php echo esc_url( admin_url( 'options-general.php?page=webpninja#webpninja-bulk' ) ); ?>">
						<?php
						/* translators: %d: number of images */
						echo esc_html( sprintf( _n( 'Compress your %d existing image →', 'Compress your %d existing images →', $pending, 'webp-ninja-image-compressor' ), $pending ) );
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
			wp_send_json_error( [ 'message' => __( 'Permission denied.', 'webp-ninja-image-compressor' ) ], 403 );
		}

		$query = new WP_Query( $this->pending_query_args( 1 ) );
		if ( ! $query->posts ) {
			wp_send_json_success( [ 'remaining' => 0 ] );
		}

		$id     = (int) $query->posts[0];
		$result = $this->compressor->compress_existing( $id );

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
		$format    = (string) get_option( 'webpninja_format', 'webp' );
		$supported = [];
		foreach ( WebPNinja_Compressor::OUTPUT_FORMATS as $key => $mime ) {
			$supported[ $key ] = WebPNinja_Compressor::format_supported( $mime );
		}
		$format_labels = [
			'webp'     => __( 'WebP (recommended) — about a third smaller than JPEG, keeps transparency', 'webp-ninja-image-compressor' ),
			'avif'     => __( 'AVIF — smallest files, slower to encode, keeps transparency', 'webp-ninja-image-compressor' ),
			'jpeg'     => __( 'JPEG — maximum compatibility (transparent areas become white)', 'webp-ninja-image-compressor' ),
			'original' => __( 'Keep original format — compress only', 'webp-ninja-image-compressor' ),
		];
		?>
		<div class="wrap webpninja-wrap">
			<div class="webpninja-header">
				<h1><?php esc_html_e( 'WebP Ninja Image Compressor', 'webp-ninja-image-compressor' ); ?></h1>
				<p class="webpninja-tagline">
					<?php esc_html_e( 'Compresses every image on upload. All processing happens on your server — no files ever leave your WordPress install.', 'webp-ninja-image-compressor' ); ?>
				</p>
			</div>

			<div class="webpninja-card webpninja-stats">
				<div>
					<span class="webpninja-stat"><?php echo esc_html( size_format( $saved, 1 ) ?: '0 B' ); ?></span>
					<span class="webpninja-muted"><?php esc_html_e( 'saved so far', 'webp-ninja-image-compressor' ); ?></span>
				</div>
				<div>
					<span class="webpninja-stat"><?php echo esc_html( number_format_i18n( $pending ) ); ?></span>
					<span class="webpninja-muted"><?php esc_html_e( 'images not compressed yet', 'webp-ninja-image-compressor' ); ?></span>
				</div>
			</div>

			<div class="webpninja-card" id="webpninja-bulk">
				<h2><?php esc_html_e( 'Compress existing images', 'webp-ninja-image-compressor' ); ?></h2>
				<p><?php esc_html_e( 'Images uploaded before WebP Ninja was active are not compressed automatically. Run this once to catch up — keep this tab open until it finishes.', 'webp-ninja-image-compressor' ); ?></p>
				<?php if ( $pending ) : ?>
					<p>
						<button type="button" class="button button-primary" id="webpninja-bulk-start" data-total="<?php echo (int) $pending; ?>">
							<?php
							/* translators: %d: number of images */
							echo esc_html( sprintf( _n( 'Compress %d image', 'Compress %d images', $pending, 'webp-ninja-image-compressor' ), $pending ) );
							?>
						</button>
					</p>
					<div class="webpninja-progress" hidden><div class="webpninja-progress-bar"></div></div>
					<p class="webpninja-bulk-log webpninja-muted" aria-live="polite"></p>
				<?php else : ?>
					<p class="webpninja-good"><?php esc_html_e( 'All images are compressed.', 'webp-ninja-image-compressor' ); ?></p>
				<?php endif; ?>
				<p class="description">
					<?php esc_html_e( 'Tip: you can also compress single images from Media → Library (list view) or the image details panel.', 'webp-ninja-image-compressor' ); ?>
				</p>
			</div>

			<form method="post" action="options.php">
				<?php settings_fields( 'webpninja_group' ); ?>

				<div class="webpninja-card">
					<h2><?php esc_html_e( 'Compression settings', 'webp-ninja-image-compressor' ); ?></h2>

					<p>
						<label>
							<input type="checkbox" name="webpninja_auto" value="1" <?php checked( $auto ); ?>>
							<?php esc_html_e( 'Compress new uploads automatically', 'webp-ninja-image-compressor' ); ?>
						</label>
					</p>

					<h3><?php esc_html_e( 'Output format for new uploads', 'webp-ninja-image-compressor' ); ?></h3>
					<fieldset class="webpninja-formats">
						<?php foreach ( $format_labels as $key => $label ) : ?>
							<?php $available = 'original' === $key || ! empty( $supported[ $key ] ); ?>
							<label class="<?php echo $available ? '' : 'webpninja-muted'; ?>">
								<input type="radio" name="webpninja_format" value="<?php echo esc_attr( $key ); ?>" <?php checked( $format, $key ); ?> <?php disabled( ! $available ); ?>>
								<?php echo esc_html( $label ); ?>
								<?php if ( ! $available ) : ?>
									<em><?php esc_html_e( '— not supported by this server', 'webp-ninja-image-compressor' ); ?></em>
								<?php endif; ?>
							</label>
						<?php endforeach; ?>
					</fieldset>
					<p class="description">
						<?php esc_html_e( 'JPEG, PNG and WebP uploads are converted to this format, and only when the result is smaller. Existing images keep their format (converting them would break links in posts that already use them). Animated images are never converted.', 'webp-ninja-image-compressor' ); ?>
					</p>

					<h3><label for="webpninja_quality"><?php esc_html_e( 'Quality', 'webp-ninja-image-compressor' ); ?></label></h3>
					<p><?php esc_html_e( 'Higher values preserve more detail; lower values produce smaller files. 80–85 is a great balance for most sites.', 'webp-ninja-image-compressor' ); ?></p>
					<div class="webpninja-slider-row">
						<input type="range" id="webpninja_quality" name="webpninja_quality" min="1" max="100" value="<?php echo esc_attr( $quality ); ?>">
						<span class="webpninja-quality-val" id="webpninja_quality_val"><?php echo esc_html( $quality ); ?></span>
					</div>

					<p>
						<label>
							<input type="checkbox" name="webpninja_png_lossy" value="1" <?php checked( $png_lossy ); ?>>
							<?php esc_html_e( 'Smart PNG compression (reduce colors, like TinyPNG) — much smaller PNGs, visually near-identical', 'webp-ninja-image-compressor' ); ?>
						</label>
					</p>
				</div>

				<div class="webpninja-card">
					<h2><?php esc_html_e( 'Public counter (optional)', 'webp-ninja-image-compressor' ); ?></h2>
					<p>
						<label>
							<input type="checkbox" name="<?php echo esc_attr( WebPNinja_Stats::OPTION ); ?>" value="1" <?php checked( WebPNinja_Stats::enabled() ); ?>>
							<?php esc_html_e( 'Add my compressed images to the live counter on webpninja.com', 'webp-ninja-image-compressor' ); ?>
						</label>
					</p>
					<p class="description">
						<?php
						printf(
							/* translators: 1: API host name, 2: link to the privacy policy */
							esc_html__( 'Off by default. When on, the plugin sends only a number — how many images were compressed — to %1$s once an hour. No images, file names, URLs or personal data are ever sent. %2$s', 'webp-ninja-image-compressor' ),
							'<code>api.webpninja.com</code>',
							'<a href="https://webpninja.com/privacy" target="_blank" rel="noopener">' . esc_html__( 'Privacy policy', 'webp-ninja-image-compressor' ) . '</a>'
						);
						?>
					</p>
				</div>

				<?php submit_button( __( 'Save Settings', 'webp-ninja-image-compressor' ) ); ?>
			</form>

			<div class="webpninja-card">
				<h2><?php esc_html_e( 'Server check', 'webp-ninja-image-compressor' ); ?></h2>
				<table class="widefat striped webpninja-check">
					<tbody>
						<tr>
							<td><?php esc_html_e( 'Image engine', 'webp-ninja-image-compressor' ); ?></td>
							<td>
								<?php if ( 'imagick' === $engine ) : ?>
									<span class="webpninja-good">✓ Imagick</span>
								<?php elseif ( 'gd' === $engine ) : ?>
									<span class="webpninja-good">✓ GD</span>
									<span class="webpninja-muted"><?php esc_html_e( '(Imagick gives slightly better results and keeps color profiles)', 'webp-ninja-image-compressor' ); ?></span>
								<?php else : ?>
									<span class="webpninja-bad"><?php esc_html_e( '✗ Neither Imagick nor GD is installed — ask your host to enable one.', 'webp-ninja-image-compressor' ); ?></span>
								<?php endif; ?>
							</td>
						</tr>
						<?php foreach ( [ 'webp' => 'WebP', 'avif' => 'AVIF' ] as $key => $name ) : ?>
							<tr>
								<?php /* translators: %s: image format name */ ?>
								<td><?php echo esc_html( sprintf( __( '%s output', 'webp-ninja-image-compressor' ), $name ) ); ?></td>
								<td>
									<?php if ( $supported[ $key ] ) : ?>
										<span class="webpninja-good">✓</span>
									<?php else : ?>
										<span class="webpninja-bad">✗</span>
										<span class="webpninja-muted">
											<?php
											echo 'avif' === $key && version_compare( get_bloginfo( 'version' ), '6.5', '<' )
												? esc_html__( 'needs WordPress 6.5+', 'webp-ninja-image-compressor' )
												: esc_html__( 'your server’s image library can’t encode it — ask your host to update Imagick/GD', 'webp-ninja-image-compressor' );
											?>
										</span>
									<?php endif; ?>
								</td>
							</tr>
						<?php endforeach; ?>
						<tr>
							<td><?php esc_html_e( 'PHP memory limit', 'webp-ninja-image-compressor' ); ?></td>
							<td><?php echo esc_html( ini_get( 'memory_limit' ) ); ?></td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="webpninja-footer">
				<?php
				printf(
					/* translators: %s: link to webpninja.com */
					esc_html__( 'Need AVIF, exact file sizes (e.g. under 50 KB) or batch conversion? Try %s — free and browser-based.', 'webp-ninja-image-compressor' ),
					'<a href="https://webpninja.com/tools" target="_blank" rel="noopener">webpninja.com</a>'
				);
				?>
			</div>
		</div>
		<?php
	}
}
