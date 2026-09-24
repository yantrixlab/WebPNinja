import { pool } from '../db.js';

export const PRICING_URL = process.env.PRICING_URL ?? 'https://webpninja.com/pricing';

/**
 * The cheapest purchasable plan above the caller's current one that actually
 * solves their problem — e.g. a 17.8 MB file on Free needs a plan allowing at
 * least 18 MB, not just "the next tier up". Returns null when no plan fits
 * (or the plans table can't be read), so callers fall back to a plain error.
 *
 * @param {string} currentPlanId
 * @param {{ minUploadMb?: number, moreThanQuota?: number }} need
 *   minUploadMb: the upload size the plan must allow;
 *   moreThanQuota: the current quota, which the plan must beat (-1 = unlimited)
 */
export async function suggestUpgrade(currentPlanId, { minUploadMb = 0, moreThanQuota = null } = {}) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, price_inr, max_upload_mb, monthly_quota
       FROM plans
       WHERE razorpay_plan_id IS NOT NULL
         AND price_inr > (SELECT price_inr FROM plans WHERE id = $1)
       ORDER BY price_inr ASC`,
      [currentPlanId]
    );
    const plan = rows.find((p) =>
      p.max_upload_mb >= minUploadMb &&
      (moreThanQuota === null || p.monthly_quota === -1 || p.monthly_quota > moreThanQuota)
    );
    if (!plan) return null;
    return {
      plan: plan.id,
      name: plan.name,
      priceInr: plan.price_inr,
      maxUploadMb: plan.max_upload_mb,
      unlimitedCompressions: plan.monthly_quota === -1,
      url: PRICING_URL,
    };
  } catch (err) {
    console.warn('[suggestUpgrade]', err.message);
    return null;
  }
}
