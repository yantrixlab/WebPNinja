package com.webpninja.sdk;

public class CompressionError extends WebPNinjaError {
    public CompressionError(String message) {
        super(message, 422);
    }
}
