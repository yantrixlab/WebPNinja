# WebP Ninja SDKs

Official client libraries for the [WebP Ninja Developer API](https://webpninja.com/docs).

See [SPEC.md](SPEC.md) for the interface every language implements.

| Language | Status | Package |
|---|---|---|
| Node.js | Built, tests passing — pending first publish | [`@webpninja/sdk`](node/) |
| Python | Built, tests passing — pending first publish | [`webpninja`](python/) |
| Ruby | Not started | `webpninja` (RubyGems) |
| PHP | Not started | `webpninja/webpninja` (Packagist) |
| Java | Not started | `com.webpninja:webpninja-sdk` (Maven Central) |
| .NET | Not started | `WebPNinja` (NuGet) |

Each SDK is released independently via its own GitHub Actions workflow
(`.github/workflows/publish-<language>.yml`), triggered by pushing a tag like `node-v1.0.0`.
