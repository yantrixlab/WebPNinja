package com.webpninja.sdk;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Official Java/Android client for the WebP Ninja Developer API.
 *
 * <p>Works identically on the JVM and on Android — it's a plain JAR with no Android-specific
 * APIs (no {@code java.nio.file}, no {@code java.net.http}), so it's consumable from a Gradle
 * {@code implementation} dependency the same way as any Maven dependency.
 */
public class WebPNinja {
    private static final String DEFAULT_BASE_URL = "https://api.webpninja.com";
    private static final MediaType OCTET_STREAM = MediaType.parse("application/octet-stream");

    private final String apiKey;
    private final String baseUrl;
    private final OkHttpClient httpClient;

    /** Reads the API key from the {@code WEBPNINJA_API_KEY} environment variable. */
    public WebPNinja() {
        this(System.getenv("WEBPNINJA_API_KEY"), DEFAULT_BASE_URL);
    }

    public WebPNinja(String apiKey) {
        this(apiKey, DEFAULT_BASE_URL);
    }

    public WebPNinja(String apiKey, String baseUrl) {
        if (apiKey == null || apiKey.isEmpty()) {
            throw new IllegalArgumentException(
                "Missing API key: pass one to new WebPNinja(apiKey) or use new WebPNinja() to read WEBPNINJA_API_KEY");
        }
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build();
    }

    public byte[] compress(File input, String format) throws IOException {
        return compress(input, format, 80);
    }

    public byte[] compress(File input, String format, int quality) throws IOException {
        return compress(readAllBytes(input), input.getName(), format, quality);
    }

    public byte[] compress(byte[] input, String filename, String format) throws IOException {
        return compress(input, filename, format, 80);
    }

    public byte[] compress(byte[] input, String filename, String format, int quality) throws IOException {
        RequestBody fileBody = RequestBody.create(input, OCTET_STREAM);

        RequestBody body = new MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", filename, fileBody)
            .addFormDataPart("format", format)
            .addFormDataPart("quality", String.valueOf(quality))
            .build();

        Request request = new Request.Builder()
            .url(baseUrl + "/api/v1/compress")
            .header("Authorization", "Bearer " + apiKey)
            .post(body)
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            ResponseBody responseBody = response.body();
            if (!response.isSuccessful()) {
                String errorBody = responseBody != null ? responseBody.string() : null;
                throw WebPNinjaError.fromResponse(response.code(), errorBody);
            }
            return responseBody != null ? responseBody.bytes() : new byte[0];
        }
    }

    public void compressToFile(File input, File output, String format) throws IOException {
        compressToFile(input, output, format, 80);
    }

    public void compressToFile(File input, File output, String format, int quality) throws IOException {
        writeAllBytes(output, compress(input, format, quality));
    }

    private static byte[] readAllBytes(File file) throws IOException {
        try (FileInputStream in = new FileInputStream(file);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            return out.toByteArray();
        }
    }

    private static void writeAllBytes(File file, byte[] data) throws IOException {
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(data);
        }
    }
}
