import crypto from 'node:crypto';

const PREFIX = 'webpninja_live_';
const ENC_ALGO = 'aes-256-gcm';

/** Generates a new raw API key. Only ever returned to the caller once. */
export function generateApiKey() {
  const raw = PREFIX + crypto.randomBytes(24).toString('hex');
  return { raw, prefix: raw.slice(0, PREFIX.length + 8) };
}

export function hashApiKey(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Derives a 32-byte AES key from API_KEY_ENCRYPTION_SECRET (any length) so the
// env var doesn't need to be an exact byte count.
function getEncryptionKey() {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error('API_KEY_ENCRYPTION_SECRET is not configured');
  return crypto.createHash('sha256').update(secret).digest();
}

/** Encrypts a raw API key for storage, so it can be decrypted and shown again later. */
export function encryptApiKey(raw) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/** Reverses encryptApiKey. Throws if the ciphertext was tampered with or the secret is wrong. */
export function decryptApiKey(encrypted) {
  const buf = Buffer.from(encrypted, 'base64');
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ENC_ALGO, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
