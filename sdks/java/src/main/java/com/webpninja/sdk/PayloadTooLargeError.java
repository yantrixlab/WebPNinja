package com.webpninja.sdk;

public class PayloadTooLargeError extends WebPNinjaError {
    private final Integer maxUploadMb;
    private final Integer fileSizeMb;

    public PayloadTooLargeError(String message, Integer maxUploadMb, Integer fileSizeMb) {
        super(message, 413);
        this.maxUploadMb = maxUploadMb;
        this.fileSizeMb = fileSizeMb;
    }

    public Integer getMaxUploadMb() {
        return maxUploadMb;
    }

    public Integer getFileSizeMb() {
        return fileSizeMb;
    }
}
