import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { createSubscription, verifyWebhookSignature } from '../lib/razorpay.js';

export const billingRouter = Router();

billingRouter.post('/api/billing/checkout', requireAuth, async (req, res) => {
  const { planId } = req.body ?? {};

  try {
    const { rows: planRows } = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
    const plan = planRows[0];
    if (!plan || !plan.razorpay_plan_id) {
      return res.status(400).json({ error: 'Unknown or non-purchasable plan' });
    }

    const subscription = await createSubscription(plan.razorpay_plan_id, {
      notes: { userId: req.userId, planId },
    });

    await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, razorpay_subscription_id)
       VALUES ($1, $2, 'pending', $3)`,
      [req.userId, planId, subscription.id]
    );

    res.json({ subscriptionId: subscription.id, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('[billing/checkout]', err.message);
    res.status(500).json({ error: 'Internal error creating subscription' });
  }
});

/**
 * Registered directly on the Express app in index.js with express.raw(),
 * BEFORE the global express.json() middleware — signature verification
 * needs the exact raw request bytes, which json() would otherwise consume.
 */
export async function billingWebhookHandler(req, res) {
  const signature = req.headers['x-razorpay-signature'];

  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = JSON.parse(req.body.toString('utf8'));

  try {
    if (event.event === 'subscription.charged') {
      const razorpaySubscriptionId = event.payload.subscription.entity.id;
      const periodEnd = event.payload.subscription.entity.current_end;

      const { rows } = await pool.query(
        'SELECT user_id, plan_id FROM subscriptions WHERE razorpay_subscription_id = $1',
        [razorpaySubscriptionId]
      );
      const target = rows[0];
      if (target) {
        await pool.query(
          `UPDATE subscriptions SET status = 'cancelled', updated_at = now()
           WHERE user_id = $1 AND status = 'active' AND razorpay_subscription_id IS DISTINCT FROM $2`,
          [target.user_id, razorpaySubscriptionId]
        );
        await pool.query(
          `UPDATE subscriptions
           SET status = 'active', current_period_end = to_timestamp($2), updated_at = now()
           WHERE razorpay_subscription_id = $1`,
          [razorpaySubscriptionId, periodEnd]
        );
      }
    } else if (event.event === 'subscription.cancelled') {
      const razorpaySubscriptionId = event.payload.subscription.entity.id;
      const { rows } = await pool.query(
        `UPDATE subscriptions SET status = 'cancelled', updated_at = now()
         WHERE razorpay_subscription_id = $1
         RETURNING user_id`,
        [razorpaySubscriptionId]
      );
      const userId = rows[0]?.user_id;
      if (userId) {
        // Fall back to the Free plan so API access continues at the free quota.
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan_id, status)
           SELECT $1, 'free', 'active'
           WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = $1 AND status = 'active')`,
          [userId]
        );
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[billing/webhook]', err.message);
    res.status(500).json({ error: 'Internal error processing webhook' });
  }
}
