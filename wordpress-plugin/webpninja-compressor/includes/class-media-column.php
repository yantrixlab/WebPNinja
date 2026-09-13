<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WebPNinja_Media_Column {

	public function __construct() {
		add_filter( 'manage_media_columns', [ $this, 'add_column' ] );
		add_action( 'manage_media_custom_column', [ $this, 'render_column' ], 10, 2 );
	}

	public function add_column( $columns ) {
		$columns['webpninja_savings'] = __( 'Savings', 'webpninja' );
		return $columns;
	}

	public function render_column( $column_name, $attachment_id ) {
		if ( $column_name !== 'webpninja_savings' ) {
			return;
		}

		$bytes_saved = (int) get_post_meta( $attachment_id, '_webpninja_bytes_saved', true );

		if ( $bytes_saved <= 0 ) {
			echo '<span style="color:#999;">—</span>';
			return;
		}

		$original_size = filesize( get_attached_file( $attachment_id ) );
		if ( ! $original_size ) {
			echo esc_html( $this->format_bytes( $bytes_saved ) . ' saved' );
			return;
		}

		$original_total = $original_size + $bytes_saved;
		$percent        = $original_total > 0 ? round( ( $bytes_saved / $original_total ) * 100 ) : 0;

		printf(
			'<span style="color:#2ecc71;font-weight:600;">-%d%%</span><br><small style="color:#888;">%s saved</small>',
			esc_html( $percent ),
			esc_html( $this->format_bytes( $bytes_saved ) )
		);
	}

	private function format_bytes( $bytes ) {
		if ( $bytes >= 1048576 ) {
			return round( $bytes / 1048576, 1 ) . ' MB';
		}
		if ( $bytes >= 1024 ) {
			return round( $bytes / 1024, 1 ) . ' KB';
		}
		return $bytes . ' B';
	}
}
