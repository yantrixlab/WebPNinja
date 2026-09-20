# WebP Ninja SDK Spec

Every official client library (Node.js, Python, Ruby, PHP, Java, .NET) implements this same
interface, adapted to each language's idioms. This file is the source of truth — an SDK is not
"done" until it matches this contract, and its tests assert against these exact error mappings.

## Wraps one endpoint

`POST https://api.webpninja.com/api/v1/compress` — see
[api/src/routes/compress.js](../api/src/routes/compress.js) for the live implementation.

SDKs do not wrap `/api/v1/compress/fallback` — that route is an unauthenticated, IP-rate-limited
fallback for the browser tool only, not part of the metered developer API.

## Construction

- Takes an API key as the first constructor argument.
- If omitted, falls back to reading it from the `WEBPNINJA_API_KEY` environment variable.
- Optional: a base URL override (for pointing tests/staging at something other than
  `https://api.webpninja.com`).
- No automatic retries. Errors are surfaced faithfully, not swallowed or retried silently.

## The one method: `compress`

Signature (adapted per language): `compress(input, { format, quality })`

- `input`: a file path, raw bytes/buffer, or stream/readable — whatever is most idiomatic for
  the language's file-handling conventions.
- `format`: one of `webp`, `jpeg`, `png`, `avif`.
- `quality`: integer 10–100, default 80.
- Returns: the compressed image as raw bytes (Buffer / bytes / byte[] / Stream, per language).
- Convenience: a `toFile(path)` (or equivalent) method/option to write the result directly to
  disk, since that's the most common calling pattern.

## Error hierarchy

Base error: `WebPNinjaError` (carries the raw HTTP status and the API's `error` message).

| Subclass | HTTP status | Extra fields | API condition |
|---|---|---|---|
| `ValidationError` | 400 | — | missing file, invalid `format`, invalid `quality` |
| `AuthenticationError` | 401 | — | missing, invalid, or revoked API key |
| `PayloadTooLargeError` | 413 | `maxUploadMb`, `fileSizeMb` (when plan-based) | file exceeds the global 200MB cap or the plan's upload limit |
| `CompressionError` | 422 | — | file couldn't be decoded/compressed |
| `RateLimitError` | 429 | `quota`, `used` (when present) | daily/monthly quota exceeded, or requests/min rate limit exceeded |

Every non-2xx response's JSON body is `{"error": "..."}` (sometimes with the extra fields above)
— parse that message into the exception rather than a generic HTTP error.

## Testing

No SDK test suite makes a real network call. Mock the HTTP layer (e.g. `nock`/`undici` mocks for
Node, `responses` for Python, `webmock` for Ruby, PHPUnit/Guzzle mocks for PHP, MockWebServer/
WireMock for Java, a mocked `HttpMessageHandler` for .NET) and assert both the outgoing request
shape (headers, multipart fields) and the error-mapping table above against fixture responses.

## Packages

| Registry | Name |
|---|---|
| npm | `@webpninja/sdk` |
| PyPI | `webpninja` |
| RubyGems | `webpninja` |
| Packagist | `webpninja/webpninja` |
| Maven | `com.webpninja:webpninja-sdk` |
| NuGet | `WebPNinja` |

All SDKs are MIT licensed.
