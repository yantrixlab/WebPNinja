-- Starting plan lineup. Re-run safely; edit the VALUES below to retune
-- pricing/quotas later. Fill in razorpay_plan_id after creating the matching
-- Plan in the Razorpay Dashboard (Subscriptions > Plans).

INSERT INTO plans (id, name, price_inr, monthly_quota, razorpay_plan_id, rate_limit_per_min) VALUES
  ('free',    'Free',    0,    500,    NULL, 30),
  ('starter', 'Starter', 499,  10000,  'plan_TbbtV49QBqXgAm', 60),
  ('pro',     'Pro',     1999, 100000, 'plan_TbbwF6Qk8Ca5XZ', 120)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr = EXCLUDED.price_inr,
  monthly_quota = EXCLUDED.monthly_quota,
  razorpay_plan_id = EXCLUDED.razorpay_plan_id,
  rate_limit_per_min = EXCLUDED.rate_limit_per_min;
