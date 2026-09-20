import { errorFromResponse, WebPNinjaError, ValidationError } from './errors.js';

const DEFAULT_BASE_URL = 'https://api.webpninja.com';

export class WebPNinja {
  constructor(apiKey = process.env.WEBPNINJA_API_KEY, { baseUrl = DEFAULT_BASE_URL } = {}) {
    if (!apiKey) {
      throw new WebPNinjaError('Missing API key: pass one to new WebPNinja(apiKey) or set WEBPNINJA_API_KEY');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async compress(input, { format, quality = 80, filename = 'image' } = {}) {
    if (!format) {
      throw new ValidationError('format is required');
    }

    const { bytes, name } = await resolveInput(input, filename);

    const form = new FormData();
    form.append('file', new Blob([bytes]), name);
    form.append('format', format);
    form.append('quality', String(quality));

    const res = await fetch(`${this.baseUrl}/api/v1/compress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch {
        // response wasn't JSON; fall back to a generic message
      }
      throw errorFromResponse(res.status, body);
    }

    return Buffer.from(await res.arrayBuffer());
  }

  async compressToFile(input, outputPath, options) {
    const { writeFile } = await import('node:fs/promises');
    const result = await this.compress(input, options);
    await writeFile(outputPath, result);
    return result;
  }
}

async function resolveInput(input, defaultFilename) {
  if (typeof input === 'string') {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    return { bytes: await readFile(input), name: path.basename(input) };
  }
  if (input instanceof Uint8Array) {
    return { bytes: input, name: defaultFilename };
  }
  throw new TypeError('input must be a file path (string) or bytes (Uint8Array/Buffer)');
}
