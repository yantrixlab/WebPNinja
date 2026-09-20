package com.webpninja.sdk;

public class ValidationError extends WebPNinjaError {
    public ValidationError(String message) {
        super(message, 400);
    }
}
