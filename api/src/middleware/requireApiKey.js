import { pool } from '../db.js';
import { hashApiKey } from '../lib/apiKeys.js';
import { suggestUpgrade } from '../lib/upgrade.js';

// 'day' plans (currently just Free, to bound abuse on a $0 tier) reset every
// UTC day; everything else resets every UTC month. Same usage_monthly table
// either way — just a different period string granularity.
function currentPeriod(cadence) {
  const now = new Date();
  if (cadence === 'day') {
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** When the current quota period ends, as an ISO timestamp (UTC). */
function nextReset(daily) {
  const now = new Date();
  const next = daily
    ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    : Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return new Date(next).toISOString();
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
      `SELECT ak.id AS api_key_id, ak.user_id, p.id AS plan_id, p.name AS plan_name, p.monthly_quota, p.quota_period, p.rate_limit_per_min, p.max_upload_mb
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

    const isUnlimited = row.monthly_quota === -1;
    const period = currentPeriod(row.quota_period);
    const { rows: usageRows } = await pool.query(
      'SELECT count FROM usage_monthly WHERE user_id = $1 AND period = $2',
      [row.user_id, period]
    );
    const used = usageRows[0]?.count ?? 0;

    if (!isUnlimited && used >= row.monthly_quota) {
      const daily = row.quota_period === 'day';
      const resetsAt = nextReset(daily);
      const upgrade = await suggestUpgrade(row.plan_id, { moreThanQuota: row.monthly_quota });
      const when = daily ? 'today' : 'this month';
      const reset = daily ? 'at 00:00 UTC' : 'on the 1st of next month (UTC)';
      let error = `You've used all ${row.monthly_quota} compressions included in your ${row.plan_name} plan ${when}. Your quota resets ${reset}.`;
      if (upgrade) {
        const benefit = upgrade.unlimitedCompressions ? 'unlimited compressions' : 'a higher quota';
        error += ` To keep compressing now, upgrade to the ${upgrade.name} plan for ${benefit}: ${upgrade.url}`;
      }
      return res.status(429).json({
        error,
        quota: row.monthly_quota,
        used,
        resetsAt,
        ...(upgrade && { upgrade }),
      });
    }

    req.apiUserId = row.user_id;
    req.apiKeyId = row.api_key_id;
    req.plan = {
      id: row.plan_id,
      name: row.plan_name,
      monthlyQuota: row.monthly_quota,
      quotaPeriod: row.quota_period,
      rateLimitPerMin: row.rate_limit_per_min,
      maxUploadMb: row.max_upload_mb,
    };

    pool
      .query('UPDATE api_keys SET last_used_at = now() WHERE id = $1', [row.api_key_id])
      .catch((err) => console.warn('[requireApiKey] last_used_at update failed:', err.message));

    next();
  } catch (err) {
    console.error('[requireApiKey]', err.message);
    res.status(500).json({ error: 'Internal error validating API key' });
  }
}

export async function incrementUsage(userId, quotaPeriod) {
  const period = currentPeriod(quotaPeriod);
  await pool.query(
    `INSERT INTO usage_monthly (user_id, period, count) VALUES ($1, $2, 1)
     ON CONFLICT (user_id, period) DO UPDATE SET count = usage_monthly.count + 1`,
    [userId, period]
  );
}
