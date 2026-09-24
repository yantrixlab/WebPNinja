<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Opt-in only: adds this site's compression count to the public counter on
 * webpninja.com. Off by default — WordPress.org forbids contacting external
 * services without the site owner's consent, and the plugin otherwise makes
 * no external requests at all.
 *
 * What is sent: a single number (how many images were compressed since the
 * last report), batched once an hour. No images, file names, URLs, site
 * details or personal data.
 */
class WebPNinja_Stats {

	const OPTION   = 'webpninja_share_stats';
	const PENDING  = 'webpninja_stats_pending';
	const CRON     = 'webpninja_send_stats';
	const ENDPOINT = 'https://api.webpninja.com/api/stats/increment';

	/** The API rejects batches above this. */
	const MAX_BATCH = 1000;

	public function __construct() {
		add_action( 'webpninja_compressed', [ $this, 'record' ] );
		add_action( self::CRON, [ $this, 'send' ] );
		add_action( 'init', [ $this, 'sync_schedule' ] );
		// Turning sharing off must also drop anything not yet sent.
		add_action( 'update_option_' . self::OPTION, [ $this, 'on_toggle' ], 10, 2 );
	}

	public static function enabled() {
		return 1 === (int) get_option( self::OPTION, 0 );
	}

	/** Counts one compressed image, only while sharing is switched on. */
	public function record() {
		if ( self::enabled() ) {
			update_option( self::PENDING, (int) get_option( self::PENDING, 0 ) + 1, false );
		}
	}

	/** Keeps the hourly event scheduled exactly while sharing is on. */
	public function sync_schedule() {
		$scheduled = wp_next_scheduled( self::CRON );
		if ( self::enabled() && ! $scheduled ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', self::CRON );
		} elseif ( ! self::enabled() && $scheduled ) {
			wp_clear_scheduled_hook( self::CRON );
		}
	}

	public function on_toggle( $old_value, $new_value ) {
		if ( ! (int) $new_value ) {
			delete_option( self::PENDING );
			wp_clear_scheduled_hook( self::CRON );
		}
	}

	/** Sends the pending count in batches; whatever fails is retried next hour. */
	public function send() {
		if ( ! self::enabled() ) {
			return;
		}
		$pending = (int) get_option( self::PENDING, 0 );
		for ( $i = 0; $pending > 0 && $i < 5; $i++ ) {
			$count    = min( $pending, self::MAX_BATCH );
			$response = wp_remote_post(
				self::ENDPOINT,
				[
					'timeout' => 5,
					'headers' => [ 'Content-Type' => 'application/json' ],
					'body'    => wp_json_encode( [ 'count' => $count ] ),
				]
			);
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				break;
			}
			// Re-read rather than overwrite: images compressed while this
			// request was in flight were added to the option meanwhile.
			$pending = max( 0, (int) get_option( self::PENDING, 0 ) - $count );
			update_option( self::PENDING, $pending, false );
		}
	}
}
