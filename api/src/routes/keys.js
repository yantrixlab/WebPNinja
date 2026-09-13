import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { generateApiKey, hashApiKey } from '../lib/apiKeys.js';

export const keysRouter = Router();

// Generates a new key, revoking any existing one first (one active key per user).
// The raw key is returned in this response only — it is never stored or shown again.
keysRouter.post('/api/keys/generate', requireAuth, async (req, res) => {
  const { raw, prefix } = generateApiKey();
  const keyHash = hashApiKey(raw);

  try {
    await pool.query('UPDATE api_keys SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [
      req.userId,
    ]);
    await pool.query('INSERT INTO api_keys (user_id, key_hash, key_prefix) VALUES ($1, $2, $3)', [
      req.userId,
      keyHash,
      prefix,
    ]);
    res.json({ apiKey: raw, prefix });
  } catch (err) {
    console.error('[keys/generate]', err.message);
    res.status(500).json({ error: 'Internal error generating key' });
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
