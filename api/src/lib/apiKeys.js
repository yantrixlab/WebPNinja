import crypto from 'node:crypto';

const PREFIX = 'webpninja_live_';

/** Generates a new raw API key. Only ever returned to the caller once. */
export function generateApiKey() {
  const raw = PREFIX + crypto.randomBytes(24).toString('hex');
  return { raw, prefix: raw.slice(0, PREFIX.length + 8) };
}

export function hashApiKey(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
