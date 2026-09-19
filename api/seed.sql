-- Starting plan lineup. Re-run safely; edit the VALUES below to retune
-- pricing/quotas later. Fill in razorpay_plan_id after creating the matching
-- Plan in the Razorpay Dashboard (Subscriptions > Plans).

-- Live-mode plan IDs (created in Razorpay's Live Mode dashboard).
-- monthly_quota = -1 means unlimited. max_upload_mb caps a single image's
-- size. quota_period is 'day' or 'month' — which cadence monthly_quota
-- resets on (see api/src/middleware/requireApiKey.js).
INSERT INTO plans (id, name, price_inr, monthly_quota, quota_period, razorpay_plan_id, rate_limit_per_min, max_upload_mb) VALUES
  ('free',    'Free',    0,   15, 'day',   NULL,                   15,  15),
  ('starter', 'Starter', 299, -1, 'month', 'plan_Tc4FCvgAGHRcMC', 60,  33),
  ('pro',     'Pro',     599, -1, 'month', 'plan_TcQyrXQjt5XTuc', 120, 200)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr = EXCLUDED.price_inr,
  monthly_quota = EXCLUDED.monthly_quota,
  quota_period = EXCLUDED.quota_period,
  razorpay_plan_id = EXCLUDED.razorpay_plan_id,
  rate_limit_per_min = EXCLUDED.rate_limit_per_min,
  max_upload_mb = EXCLUDED.max_upload_mb;
