# webpninja

Official Python client for the [WebP Ninja](https://webpninja.com) Developer API — server-side
image compression for WebP, JPEG, PNG, and AVIF.

## Install

```bash
pip install webpninja
```

Requires Python 3.8 or later.

## Usage

```python
from webpninja import WebPNinja

client = WebPNinja("webpninja_live_your_key")
# or: client = WebPNinja()  # reads WEBPNINJA_API_KEY from the environment

client.compress_to_file("photo.png", "photo.webp", format="webp", quality=75)
```

Or get the compressed bytes directly:

```python
data = client.compress("photo.png", format="webp", quality=75)
```

`input` can be a file path or raw bytes.

## Error handling

```python
from webpninja import WebPNinja, RateLimitError, AuthenticationError

try:
    client.compress("photo.png", format="webp")
except RateLimitError as err:
    print(f"Quota: {err.used}/{err.quota}")
except AuthenticationError:
    print("Check your API key.")
```

All errors extend `WebPNinjaError` and carry `.status` (the HTTP status code) and `.message`.
See [webpninja.com/docs](https://webpninja.com/docs) for the full error reference.

## License

MIT
