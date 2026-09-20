# WebP Ninja SDKs

Official client libraries for the [WebP Ninja Developer API](https://webpninja.com/docs).

See [SPEC.md](SPEC.md) for the interface every language implements.

| Language | Status | Package |
|---|---|---|
| Python | **Published** | [`webpninja`](https://pypi.org/project/webpninja/) |
| Java / Android | **Published** | [`com.webpninja:webpninja-sdk`](https://repo1.maven.org/maven2/com/webpninja/webpninja-sdk/1.0.0/) |
| Node.js | Built, tests passing — pending first publish | [`@webpninja/sdk`](node/) |
| Ruby | Not started | `webpninja` (RubyGems) |
| PHP | Not started | `webpninja/webpninja` (Packagist) |
| .NET | Not started | `WebPNinja` (NuGet) |

Each SDK is released independently via its own GitHub Actions workflow
(`.github/workflows/publish-<language>.yml`), triggered by pushing a tag like `node-v1.0.0`.
