package com.webpninja.sdk;

public class AuthenticationError extends WebPNinjaError {
    public AuthenticationError(String message) {
        super(message, 401);
    }
}
