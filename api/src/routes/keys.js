import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { generateApiKey, hashApiKey, encryptApiKey, decryptApiKey } from '../lib/apiKeys.js';

export const keysRouter = Router();

// Generates a new key, revoking any existing one first (one active key per user).
// The raw key is returned in this response, and also stored encrypted (not
// plaintext) so it can be decrypted and shown again later via /api/keys/reveal.
keysRouter.post('/api/keys/generate', requireAuth, async (req, res) => {
  try {
    const { raw, prefix } = generateApiKey();
    const keyHash = hashApiKey(raw);
    // Was called before the try/catch — if API_KEY_ENCRYPTION_SECRET is
    // missing or misconfigured, encryptApiKey() throws synchronously, and an
    // uncaught throw in an async Express handler never reaches the client at
    // all (the request just hangs until it times out) rather than failing
    // cleanly with a 500.
    const encryptedKey = encryptApiKey(raw);

    await pool.query('UPDATE api_keys SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [
      req.userId,
    ]);
    await pool.query(
      'INSERT INTO api_keys (user_id, key_hash, key_prefix, encrypted_key) VALUES ($1, $2, $3, $4)',
      [req.userId, keyHash, prefix, encryptedKey]
    );
    res.json({ apiKey: raw, prefix });
  } catch (err) {
    console.error('[keys/generate]', err.message);
    res.status(500).json({ error: 'Internal error generating key' });
  }
});

// Decrypts and returns the current active key's full value, for the dashboard's
// show/hide toggle. Keys generated before encrypted_key existed have none stored
// (older keys were only ever hashed) — those return 404 and must be regenerated.
keysRouter.get('/api/keys/reveal', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT encrypted_key FROM api_keys WHERE user_id = $1 AND revoked_at IS NULL',
      [req.userId]
    );
    const encryptedKey = rows[0]?.encrypted_key;
    if (!encryptedKey) {
      return res.status(404).json({ error: 'This key was created before full-key reveal was supported. Regenerate to get a revealable key.' });
    }
    try {
      res.json({ apiKey: decryptApiKey(encryptedKey) });
    } catch (decryptErr) {
      // Decryption fails (auth tag mismatch) if API_KEY_ENCRYPTION_SECRET has
      // changed since this key was generated — e.g. rotated, or a redeploy
      // reset/regenerated the env var. There's no way to recover the
      // plaintext without the original secret, so from the user's side this
      // needs the exact same fix as a key that predates encrypted storage:
      // regenerate it. Logging the real cause server-side since the
      // user-facing message can't say "your server's encryption secret
      // changed" without it looking like our bug, not an infra one.
      console.error('[keys/reveal] decrypt failed — API_KEY_ENCRYPTION_SECRET likely changed since this key was generated:', decryptErr.message);
      return res.status(404).json({ error: 'This key can no longer be revealed. Regenerate to get a revealable key.' });
    }
  } catch (err) {
    console.error('[keys/reveal]', err.message);
    res.status(500).json({ error: 'Internal error revealing key' });
  }
});

keysRouter.delete('/api/keys', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE api_keys SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[keys/delete]', err.message);
    res.status(500).json({ error: 'Internal error revoking key' });
  }
});
