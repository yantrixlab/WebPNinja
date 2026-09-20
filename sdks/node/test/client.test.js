import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { WebPNinja } from '../src/client.js';
import {
  ValidationError,
  AuthenticationError,
  PayloadTooLargeError,
  RateLimitError,
} from '../src/errors.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch({ status, body, isBinary = false }) {
  globalThis.fetch = async (url, init) => {
    mockFetch.lastCall = { url, init };
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      arrayBuffer: async () => (isBinary ? body : new TextEncoder().encode('').buffer),
    };
  };
}

test('constructor throws without an API key', () => {
  const originalEnv = process.env.WEBPNINJA_API_KEY;
  delete process.env.WEBPNINJA_API_KEY;
  assert.throws(() => new WebPNinja());
  if (originalEnv) process.env.WEBPNINJA_API_KEY = originalEnv;
});

test('compress sends the Bearer token and multipart fields', async () => {
  const fakeBytes = new TextEncoder().encode('fake-webp-bytes').buffer;
  globalThis.fetch = async (url, init) => {
    mockFetch.lastCall = { url, init };
    return { ok: true, status: 200, arrayBuffer: async () => fakeBytes };
  };

  const client = new WebPNinja('webpninja_live_test');
  const result = await client.compress(new Uint8Array([1, 2, 3]), { format: 'webp', quality: 75 });

  assert.equal(mockFetch.lastCall.url, 'https://api.webpninja.com/api/v1/compress');
  assert.equal(mockFetch.lastCall.init.headers.Authorization, 'Bearer webpninja_live_test');
  assert.ok(Buffer.isBuffer(result));
});

test('compress throws ValidationError when format is missing', async () => {
  const client = new WebPNinja('webpninja_live_test');
  await assert.rejects(() => client.compress(new Uint8Array([1]), {}), ValidationError);
});

test('compress maps 401 to AuthenticationError', async () => {
  mockFetch({ status: 401, body: { error: 'Invalid or revoked API key' } });
  const client = new WebPNinja('webpninja_live_bad');
  await assert.rejects(
    () => client.compress(new Uint8Array([1]), { format: 'webp' }),
    AuthenticationError,
  );
});

test('compress maps 413 to PayloadTooLargeError with plan fields', async () => {
  mockFetch({
    status: 413,
    body: { error: "File exceeds your plan's upload limit", maxUploadMb: 15, fileSizeMb: 20 },
  });
  const client = new WebPNinja('webpninja_live_test');
  await assert.rejects(
    () => client.compress(new Uint8Array([1]), { format: 'webp' }),
    (err) => {
      assert.ok(err instanceof PayloadTooLargeError);
      assert.equal(err.maxUploadMb, 15);
      assert.equal(err.fileSizeMb, 20);
      return true;
    },
  );
});

test('compress maps 429 to RateLimitError with quota fields', async () => {
  mockFetch({ status: 429, body: { error: 'Daily quota exceeded', quota: 15, used: 15 } });
  const client = new WebPNinja('webpninja_live_test');
  await assert.rejects(
    () => client.compress(new Uint8Array([1]), { format: 'webp' }),
    (err) => {
      assert.ok(err instanceof RateLimitError);
      assert.equal(err.quota, 15);
      assert.equal(err.used, 15);
      return true;
    },
  );
});
