import Razorpay from 'razorpay';
import crypto from 'node:crypto';

// Constructed lazily (not at module load) so the rest of the API still boots
// and serves requests before RAZORPAY_KEY_ID/SECRET are configured.
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

/** Creates a Razorpay subscription for the given plan. Returns the subscription object. */
export async function createSubscription(razorpayPlanId, { totalCount = 120, notes = {} } = {}) {
  return getRazorpay().subscriptions.create({
    plan_id: razorpayPlanId,
    customer_notify: 1,
    total_count: totalCount, // ~10 years of monthly cycles; Razorpay requires a bound
    notes,
  });
}

/** Verifies an X-Razorpay-Signature header against the raw request body. */
export function verifyWebhookSignature(rawBody, signature) {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
