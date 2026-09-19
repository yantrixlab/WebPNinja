-- WebP Ninja API schema. Run once against the Postgres database.
-- Safe to re-run: every statement is idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY,
  total_images BIGINT NOT NULL DEFAULT 0
);
INSERT INTO stats (id, total_images) VALUES (1, 4049) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  monthly_quota INTEGER NOT NULL, -- -1 means unlimited. Despite the column
                                  -- name, this is "quota per quota_period" —
                                  -- kept as-is rather than renamed to limit
                                  -- the blast radius of an already-live column.
  razorpay_plan_id TEXT,
  rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
  max_upload_mb INTEGER NOT NULL DEFAULT 10,
  quota_period TEXT NOT NULL DEFAULT 'month' -- 'day' or 'month'; which usage_monthly.period granularity this plan's quota resets on
);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_upload_mb INTEGER NOT NULL DEFAULT 10;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS quota_period TEXT NOT NULL DEFAULT 'month';

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_subscription_per_user
  ON subscriptions(user_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  encrypted_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS encrypted_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS one_active_key_per_user
  ON api_keys(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys(key_hash);

-- Despite the name, `period` isn't always a month: it's "YYYY-MM" for
-- month-cadence plans and "YYYY-MM-DD" for day-cadence plans (see
-- plans.quota_period) — the string just needs to change when the quota
-- should reset, and requireApiKey.js picks the right format per plan.
CREATE TABLE IF NOT EXISTS usage_monthly (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period)
);
