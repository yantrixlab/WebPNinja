import { pool } from '../db.js';
import { hashApiKey } from '../lib/apiKeys.js';

function currentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Verifies Authorization: Bearer <api_key>, loads the key owner's active
 * plan, and enforces the monthly quota. On success attaches req.apiUserId,
 * req.plan, and req.apiKeyId (usage is incremented by the route handler
 * after a successful compression, via incrementUsage below).
 */
export async function requireApiKey(req, res, next) {
  const header = req.headers.authorization ?? '';
  const rawKey = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!rawKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const keyHash = hashApiKey(rawKey);

  try {
    const { rows } = await pool.query(
      `SELECT ak.id AS api_key_id, ak.user_id, p.id AS plan_id, p.monthly_quota, p.rate_limit_per_min
       FROM api_keys ak
       JOIN subscriptions s ON s.user_id = ak.user_id AND s.status = 'active'
       JOIN plans p ON p.id = s.plan_id
       WHERE ak.key_hash = $1 AND ak.revoked_at IS NULL`,
      [keyHash]
    );

    const row = rows[0];
    if (!row) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    const period = currentPeriod();
    const { rows: usageRows } = await pool.query(
      'SELECT count FROM usage_monthly WHERE user_id = $1 AND period = $2',
      [row.user_id, period]
    );
    const used = usageRows[0]?.count ?? 0;

    if (used >= row.monthly_quota) {
      return res.status(429).json({ error: 'Monthly quota exceeded', quota: row.monthly_quota, used });
    }

    req.apiUserId = row.user_id;
    req.apiKeyId = row.api_key_id;
    req.plan = { id: row.plan_id, monthlyQuota: row.monthly_quota, rateLimitPerMin: row.rate_limit_per_min };

    pool
      .query('UPDATE api_keys SET last_used_at = now() WHERE id = $1', [row.api_key_id])
      .catch((err) => console.warn('[requireApiKey] last_used_at update failed:', err.message));

    next();
  } catch (err) {
    console.error('[requireApiKey]', err.message);
    res.status(500).json({ error: 'Internal error validating API key' });
  }
}

export async function incrementUsage(userId) {
  const period = currentPeriod();
  await pool.query(
    `INSERT INTO usage_monthly (user_id, period, count) VALUES ($1, $2, 1)
     ON CONFLICT (user_id, period) DO UPDATE SET count = usage_monthly.count + 1`,
    [userId, period]
  );
}
