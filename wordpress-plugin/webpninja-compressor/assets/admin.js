/* global webpninjaAdmin */
( function () {
	'use strict';

	var cfg = window.webpninjaAdmin;
	if ( ! cfg ) {
		return;
	}

	function post( action, data ) {
		var body = new URLSearchParams( Object.assign( { action: action, nonce: cfg.nonce }, data || {} ) );
		return fetch( cfg.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body } )
			.then( function ( r ) { return r.json(); } )
			.then( function ( json ) {
				if ( ! json || ! json.success ) {
					throw new Error( ( json && json.data && json.data.message ) || cfg.i18n.failed );
				}
				return json.data;
			} );
	}

	/* Quality slider readout (settings page). */
	var slider = document.getElementById( 'webpninja_quality' );
	var readout = document.getElementById( 'webpninja_quality_val' );
	if ( slider && readout ) {
		slider.addEventListener( 'input', function () {
			readout.textContent = slider.value;
		} );
	}

	/* "Compress now" — list view column and the attachment details modal.
	   Delegated, because the modal re-renders its fields on every open. */
	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest && e.target.closest( '.webpninja-compress' );
		if ( ! btn ) {
			return;
		}
		e.preventDefault();
		var box = btn.closest( '.webpninja-status' );
		btn.disabled = true;
		btn.textContent = cfg.i18n.compressing;
		post( 'webpninja_compress', { id: btn.getAttribute( 'data-id' ) } )
			.then( function ( data ) {
				if ( box ) {
					box.innerHTML = data.html;
				}
			} )
			.catch( function ( err ) {
				btn.disabled = false;
				btn.textContent = err.message;
			} );
	} );

	/* "Compress existing images" (settings page): one image per request, so
	   no single request can hit the host's PHP time limit. */
	var start = document.getElementById( 'webpninja-bulk-start' );
	if ( start ) {
		var total = parseInt( start.getAttribute( 'data-total' ), 10 ) || 0;
		var wrap = document.querySelector( '.webpninja-progress' );
		var bar = document.querySelector( '.webpninja-progress-bar' );
		var log = document.querySelector( '.webpninja-bulk-log' );
		var savedTotal = 0;

		var step = function () {
			post( 'webpninja_bulk_next' )
				.then( function ( data ) {
					savedTotal += data.saved || 0;
					var done = total - data.remaining;
					bar.style.width = ( total ? Math.min( 100, ( done / total ) * 100 ) : 100 ) + '%';
					if ( data.remaining > 0 ) {
						log.textContent = done + ' / ' + total + ' — ' + data.remaining + ' ' + cfg.i18n.remaining + ' · ' + ( savedTotal / 1048576 ).toFixed( 1 ) + ' MB saved';
						step();
					} else {
						log.textContent = cfg.i18n.done + ' ' + ( savedTotal / 1048576 ).toFixed( 1 ) + ' MB saved.';
					}
				} )
				.catch( function ( err ) {
					log.textContent = err.message;
					start.disabled = false;
				} );
		};

		start.addEventListener( 'click', function () {
			start.disabled = true;
			wrap.hidden = false;
			step();
		} );
	}
}() );
