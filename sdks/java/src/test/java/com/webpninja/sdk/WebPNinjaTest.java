package com.webpninja.sdk;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

public class WebPNinjaTest {
    private MockWebServer server;
    private WebPNinja client;

    @Before
    public void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        String baseUrl = server.url("/").toString().replaceAll("/$", "");
        client = new WebPNinja("webpninja_live_test", baseUrl);
    }

    @After
    public void tearDown() throws IOException {
        server.shutdown();
    }

    @Test
    public void compressSendsBearerTokenAndReturnsBytes() throws Exception {
        server.enqueue(new MockResponse().setResponseCode(200).setBody("fake-webp-bytes"));

        byte[] result = client.compress(new byte[]{1, 2, 3}, "photo.png", "webp", 75);

        RecordedRequest request = server.takeRequest();
        assertEquals("Bearer webpninja_live_test", request.getHeader("Authorization"));
        assertArrayEquals("fake-webp-bytes".getBytes(), result);
    }

    @Test
    public void compressMaps400ToValidationError() {
        server.enqueue(new MockResponse().setResponseCode(400)
            .setBody("{\"error\":\"format must be one of: webp, jpeg, png, avif\"}"));

        ValidationError error = assertThrows(ValidationError.class,
            () -> client.compress(new byte[]{1}, "photo.png", "bogus", 75));

        assertEquals("format must be one of: webp, jpeg, png, avif", error.getMessage());
    }

    @Test
    public void compressMaps401ToAuthenticationError() {
        server.enqueue(new MockResponse().setResponseCode(401)
            .setBody("{\"error\":\"Invalid or revoked API key\"}"));

        AuthenticationError error = assertThrows(AuthenticationError.class,
            () -> client.compress(new byte[]{1}, "photo.png", "webp", 75));

        assertEquals("Invalid or revoked API key", error.getMessage());
    }

    @Test
    public void compressMaps413WithPlanFields() {
        server.enqueue(new MockResponse().setResponseCode(413)
            .setBody("{\"error\":\"File exceeds your plan's upload limit\",\"maxUploadMb\":15,\"fileSizeMb\":20}"));

        PayloadTooLargeError error = assertThrows(PayloadTooLargeError.class,
            () -> client.compress(new byte[]{1}, "photo.png", "webp", 75));

        assertEquals(Integer.valueOf(15), error.getMaxUploadMb());
        assertEquals(Integer.valueOf(20), error.getFileSizeMb());
    }

    @Test
    public void compressMaps422ToCompressionError() {
        server.enqueue(new MockResponse().setResponseCode(422)
            .setBody("{\"error\":\"Could not compress the provided file\"}"));

        assertThrows(CompressionError.class,
            () -> client.compress(new byte[]{1}, "photo.png", "webp", 75));
    }

    @Test
    public void compressMaps429WithQuotaFields() {
        server.enqueue(new MockResponse().setResponseCode(429)
            .setBody("{\"error\":\"Daily quota exceeded\",\"quota\":15,\"used\":15}"));

        RateLimitError error = assertThrows(RateLimitError.class,
            () -> client.compress(new byte[]{1}, "photo.png", "webp", 75));

        assertEquals(Integer.valueOf(15), error.getQuota());
        assertEquals(Integer.valueOf(15), error.getUsed());
    }

    @Test
    public void constructorThrowsWithoutApiKey() {
        assertThrows(IllegalArgumentException.class, () -> new WebPNinja(""));
    }
}
