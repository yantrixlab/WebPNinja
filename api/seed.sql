-- Starting plan lineup. Re-run safely; edit the VALUES below to retune
-- pricing/quotas later. Fill in razorpay_plan_id after creating the matching
-- Plan in the Razorpay Dashboard (Subscriptions > Plans).

-- Live-mode plan IDs (created in Razorpay's Live Mode dashboard).
INSERT INTO plans (id, name, price_inr, monthly_quota, razorpay_plan_id, rate_limit_per_min) VALUES
  ('free',    'Free',    0,   500,    NULL, 30),
  ('starter', 'Starter', 299, 10000,  'plan_Tc4FCvgAGHRcMC', 60),
  ('pro',     'Pro',     999, 100000, 'plan_Tc4G2ZhCM9yaD3', 120)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr = EXCLUDED.price_inr,
  monthly_quota = EXCLUDED.monthly_quota,
  razorpay_plan_id = EXCLUDED.razorpay_plan_id,
  rate_limit_per_min = EXCLUDED.rate_limit_per_min;
