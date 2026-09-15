import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { generateApiKey, hashApiKey, encryptApiKey, decryptApiKey } from '../lib/apiKeys.js';

export const keysRouter = Router();

// Generates a new key, revoking any existing one first (one active key per user).
// The raw key is returned in this response, and also stored encrypted (not
// plaintext) so it can be decrypted and shown again later via /api/keys/reveal.
keysRouter.post('/api/keys/generate', requireAuth, async (req, res) => {
  const { raw, prefix } = generateApiKey();
  const keyHash = hashApiKey(raw);
  const encryptedKey = encryptApiKey(raw);

  try {
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
    res.json({ apiKey: decryptApiKey(encryptedKey) });
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
