# @webpninja/sdk

Official Node.js client for the [WebP Ninja](https://webpninja.com) Developer API — server-side
image compression for WebP, JPEG, PNG, and AVIF.

## Install

```bash
npm install @webpninja/sdk
```

Requires Node.js 18 or later.

## Usage

```js
import { WebPNinja } from '@webpninja/sdk';

const client = new WebPNinja('webpninja_live_your_key');
// or: const client = new WebPNinja(); // reads WEBPNINJA_API_KEY from the environment

await client.compressToFile('photo.png', 'photo.webp', {
  format: 'webp',
  quality: 75,
});
```

Or get the compressed bytes directly:

```js
const bytes = await client.compress('photo.png', { format: 'webp', quality: 75 });
```

`input` can be a file path or raw bytes (`Uint8Array`/`Buffer`).

## Error handling

```js
import { WebPNinja, RateLimitError, AuthenticationError } from '@webpninja/sdk';

try {
  await client.compress('photo.png', { format: 'webp' });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Quota: ${err.used}/${err.quota}`);
  } else if (err instanceof AuthenticationError) {
    console.log('Check your API key.');
  }
}
```

All errors extend `WebPNinjaError` and carry `.status` (the HTTP status code) and `.message`.
See [webpninja.com/docs](https://webpninja.com/docs) for the full error reference.

## License

MIT
