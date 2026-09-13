import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const meRouter = Router();

function currentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

meRouter.get('/api/me', requireAuth, async (req, res) => {
  try {
    const { rows: userRows } = await pool.query(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { rows: subRows } = await pool.query(
      `SELECT s.status, s.current_period_end, p.id AS plan_id, p.name AS plan_name,
              p.monthly_quota, p.price_inr
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active'`,
      [req.userId]
    );
    const subscription = subRows[0] ?? null;

    const { rows: usageRows } = await pool.query(
      'SELECT count FROM usage_monthly WHERE user_id = $1 AND period = $2',
      [req.userId, currentPeriod()]
    );
    const usedThisPeriod = usageRows[0]?.count ?? 0;

    const { rows: keyRows } = await pool.query(
      'SELECT key_prefix, created_at, last_used_at FROM api_keys WHERE user_id = $1 AND revoked_at IS NULL',
      [req.userId]
    );

    res.json({
      user,
      plan: subscription,
      usage: { period: currentPeriod(), used: usedThisPeriod, quota: subscription?.monthly_quota ?? 0 },
      apiKey: keyRows[0] ?? null,
    });
  } catch (err) {
    console.error('[me]', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});
