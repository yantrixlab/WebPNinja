package com.webpninja.sdk;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Base error for all WebP Ninja API failures. */
public class WebPNinjaError extends RuntimeException {
    private final int status;

    public WebPNinjaError(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }

    static WebPNinjaError fromResponse(int status, String body) {
        String message = extractString(body, "error");
        if (message == null) {
            message = "Request failed with status " + status;
        }

        switch (status) {
            case 400:
                return new ValidationError(message);
            case 401:
                return new AuthenticationError(message);
            case 413:
                return new PayloadTooLargeError(message, extractInt(body, "maxUploadMb"), extractInt(body, "fileSizeMb"));
            case 422:
                return new CompressionError(message);
            case 429:
                return new RateLimitError(message, extractInt(body, "quota"), extractInt(body, "used"));
            default:
                return new WebPNinjaError(message, status);
        }
    }

    // A tiny hand-rolled extractor for the API's known flat JSON error shape, rather than
    // pulling in a JSON library — org.json:json conflicts with the org.json classes Android
    // already bundles at runtime ("duplicate class" build errors), which is exactly the class
    // of dependency headache this SDK is meant to avoid for Android consumers.
    private static String extractString(String json, String key) {
        if (json == null) return null;
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(json);
        return m.find() ? m.group(1).replace("\\\"", "\"").replace("\\\\", "\\") : null;
    }

    private static Integer extractInt(String json, String key) {
        if (json == null) return null;
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*(-?\\d+)").matcher(json);
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }
}
