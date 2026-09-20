package com.webpninja.sdk;

public class RateLimitError extends WebPNinjaError {
    private final Integer quota;
    private final Integer used;

    public RateLimitError(String message, Integer quota, Integer used) {
        super(message, 429);
        this.quota = quota;
        this.used = used;
    }

    public Integer getQuota() {
        return quota;
    }

    public Integer getUsed() {
        return used;
    }
}
