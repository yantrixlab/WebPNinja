# WebP Ninja SDKs

Official client libraries for the [WebP Ninja Developer API](https://webpninja.com/docs).

See [SPEC.md](SPEC.md) for the interface every language implements.

| Language | Status | Package |
|---|---|---|
| Python | **Published** | [`webpninja`](https://pypi.org/project/webpninja/) |
| Node.js | Built, tests passing — pending first publish | [`@webpninja/sdk`](node/) |
| Java / Android | Built, tests passing — pending Maven Central namespace verification + first publish | [`com.webpninja:webpninja-sdk`](java/) |
| Ruby | Not started | `webpninja` (RubyGems) |
| PHP | Not started | `webpninja/webpninja` (Packagist) |
| .NET | Not started | `WebPNinja` (NuGet) |

Each SDK is released independently via its own GitHub Actions workflow
(`.github/workflows/publish-<language>.yml`), triggered by pushing a tag like `node-v1.0.0`.
