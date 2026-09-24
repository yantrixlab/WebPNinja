<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Everything the user sees in the Media Library: the status column (list
 * view), the status row in the attachment details modal (grid view), the
 * per-image "Compress now" button and the "Compress" bulk action.
 */
class WebPNinja_Media_Column {

	/** @var WebPNinja_Compressor */
	private $compressor;

	public function __construct( WebPNinja_Compressor $compressor ) {
		$this->compressor = $compressor;

		add_filter( 'manage_media_columns', [ $this, 'add_column' ] );
		add_action( 'manage_media_custom_column', [ $this, 'render_column' ], 10, 2 );
		add_filter( 'attachment_fields_to_edit', [ $this, 'add_modal_field' ], 10, 2 );

		add_filter( 'bulk_actions-upload', [ $this, 'add_bulk_action' ] );
		add_filter( 'handle_bulk_actions-upload', [ $this, 'handle_bulk_action' ], 10, 3 );
		add_action( 'admin_notices', [ $this, 'bulk_notice' ] );

		add_action( 'wp_ajax_webpninja_compress', [ $this, 'ajax_compress' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
	}

	public function enqueue_assets( $hook ) {
		if ( ! in_array( $hook, [ 'upload.php', 'post.php', 'post-new.php', 'settings_page_webpninja' ], true ) ) {
			return;
		}
		wp_enqueue_style( 'webpninja-admin', WEBPNINJA_URL . 'assets/admin.css', [], WEBPNINJA_VERSION );
		wp_enqueue_script( 'webpninja-admin', WEBPNINJA_URL . 'assets/admin.js', [], WEBPNINJA_VERSION, true );
		wp_localize_script( 'webpninja-admin', 'webpninjaAdmin', [
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'webpninja' ),
			'i18n'    => [
				'compressing' => __( 'Compressing…', 'webpninja' ),
				'failed'      => __( 'Compression failed', 'webpninja' ),
				'done'        => __( 'All images are compressed.', 'webpninja' ),
				'remaining'   => __( 'remaining', 'webpninja' ),
			],
		] );
	}

	/* ─────────── Status markup ─────────── */

	/** Status HTML for one attachment, shared by the column, the modal and AJAX. */
	public static function status_html( $attachment_id ) {
		$mime = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime, WebPNinja_Compressor::MIMES, true ) ) {
			return '<span class="webpninja-muted">—</span>';
		}

		$result = WebPNinja_Compressor::get_result( $attachment_id );

		if ( ! $result ) {
			return sprintf(
				'<span class="webpninja-muted">%s</span><br><button type="button" class="button button-small webpninja-compress" data-id="%d">%s</button>',
				esc_html__( 'Not compressed', 'webpninja' ),
				(int) $attachment_id,
				esc_html__( 'Compress now', 'webpninja' )
			);
		}

		if ( 'done' !== $result['status'] ) {
			return sprintf(
				'<span class="webpninja-muted" title="%s">%s</span>',
				esc_attr( $result['message'] ?? '' ),
				'skipped' === $result['status'] ? esc_html__( 'Skipped', 'webpninja' ) : esc_html__( 'Failed', 'webpninja' )
			) . ( ! empty( $result['message'] ) ? '<br><small class="webpninja-muted">' . esc_html( $result['message'] ) . '</small>' : '' );
		}

		if ( isset( $result['saved'] ) ) {
			// Recorded by 1.0.x — only the saved byte count is known.
			return sprintf( '<strong class="webpninja-good">%s</strong>', esc_html( sprintf( __( '%s saved', 'webpninja' ), size_format( $result['saved'], 1 ) ) ) );
		}

		$saved = max( 0, $result['before'] - $result['after'] );
		if ( $saved <= 0 ) {
			return '<span class="webpninja-muted">' . esc_html__( 'Already optimized', 'webpninja' ) . '</span>';
		}

		$pct  = $result['before'] > 0 ? (int) floor( $saved / $result['before'] * 100 ) : 0;
		$from = '';
		if ( ! empty( $result['from'] ) ) {
			$labels = [ 'image/jpeg' => 'JPEG', 'image/png' => 'PNG', 'image/webp' => 'WebP', 'image/avif' => 'AVIF' ];
			/* translators: 1: original format, 2: new format, e.g. "PNG → WebP" */
			$from = '<br><small class="webpninja-muted">' . esc_html( sprintf( __( 'Converted %1$s → %2$s', 'webpninja' ), $labels[ $result['from'] ] ?? '', $labels[ $mime ] ?? '' ) ) . '</small>';
		}
		return $from ? sprintf(
			'<strong class="webpninja-good">−%d%%</strong> <small class="webpninja-muted">%s → %s · %s</small>',
			$pct,
			esc_html( size_format( $result['before'], 1 ) ),
			esc_html( size_format( $result['after'], 1 ) ),
			/* translators: %d: number of files (original + thumbnails) */
			esc_html( sprintf( _n( '%d file', '%d files', $result['files'], 'webpninja' ), $result['files'] ) )
		) . $from : sprintf(
			'<strong class="webpninja-good">−%d%%</strong> <small class="webpninja-muted">%s → %s · %s</small>',
			$pct,
			esc_html( size_format( $result['before'], 1 ) ),
			esc_html( size_format( $result['after'], 1 ) ),
			/* translators: %d: number of files (original + thumbnails) */
			esc_html( sprintf( _n( '%d file', '%d files', $result['files'], 'webpninja' ), $result['files'] ) )
		);
	}

	/* ─────────── List view column ─────────── */

	public function add_column( $columns ) {
		$columns['webpninja_savings'] = __( 'WebP Ninja', 'webpninja' );
		return $columns;
	}

	public function render_column( $column_name, $attachment_id ) {
		if ( 'webpninja_savings' !== $column_name ) {
			return;
		}
		echo '<div class="webpninja-status" data-id="' . (int) $attachment_id . '">' . wp_kses_post( self::status_html( $attachment_id ) ) . '</div>';
	}

	/* ─────────── Grid view: attachment details modal ─────────── */

	public function add_modal_field( $fields, $post ) {
		if ( ! in_array( $post->post_mime_type, WebPNinja_Compressor::MIMES, true ) ) {
			return $fields;
		}
		$fields['webpninja'] = [
			'label' => __( 'WebP Ninja', 'webpninja' ),
			'input' => 'html',
			'html'  => '<div class="webpninja-status" data-id="' . (int) $post->ID . '">' . wp_kses_post( self::status_html( $post->ID ) ) . '</div>',
		];
		return $fields;
	}

	/* ─────────── AJAX: compress one image ─────────── */

	public function ajax_compress() {
		check_ajax_referer( 'webpninja', 'nonce' );
		$id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
		if ( ! $id || ! current_user_can( 'edit_post', $id ) ) {
			wp_send_json_error( [ 'message' => __( 'You are not allowed to edit this image.', 'webpninja' ) ], 403 );
		}
		$this->compressor->compress_existing( $id );
		wp_send_json_success( [ 'html' => self::status_html( $id ) ] );
	}

	/* ─────────── Bulk action (list view) ─────────── */

	public function add_bulk_action( $actions ) {
		$actions['webpninja_compress'] = __( 'Compress with WebP Ninja', 'webpninja' );
		return $actions;
	}

	public function handle_bulk_action( $redirect, $action, $ids ) {
		if ( 'webpninja_compress' !== $action ) {
			return $redirect;
		}
		$count = 0;
		foreach ( $ids as $id ) {
			if ( current_user_can( 'edit_post', $id ) && in_array( get_post_mime_type( $id ), WebPNinja_Compressor::MIMES, true ) ) {
				if ( function_exists( 'set_time_limit' ) ) {
					@set_time_limit( 60 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- may be disabled on the host.
				}
				$this->compressor->compress_existing( $id );
				++$count;
			}
		}
		return add_query_arg( 'webpninja_compressed', $count, $redirect );
	}

	public function bulk_notice() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only count set by our own redirect.
		if ( empty( $_GET['webpninja_compressed'] ) ) {
			return;
		}
		$count = absint( $_GET['webpninja_compressed'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		printf(
			'<div class="notice notice-success is-dismissible"><p>%s</p></div>',
			/* translators: %d: number of images */
			esc_html( sprintf( _n( 'WebP Ninja compressed %d image.', 'WebP Ninja compressed %d images.', $count, 'webpninja' ), $count ) )
		);
	}
}
