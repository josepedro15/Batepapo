-- =============================================
-- SUBSCRIPTION SYSTEM SCHEMA
-- CRM WhatsApp Pro - Stripe Integration
-- =============================================
-- Run this migration in Supabase SQL Editor

-- 1. PRODUCTS (synced from Stripe)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, -- Stripe product_id (prod_xxx)
  active BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRICES (synced from Stripe)
CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY, -- Stripe price_id (price_xxx)
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'brl',
  unit_amount INTEGER NOT NULL, -- Amount in centavos
  type TEXT DEFAULT 'recurring' CHECK (type IN ('one_time', 'recurring')),
  interval TEXT CHECK (interval IN ('day', 'week', 'month', 'year')),
  interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER DEFAULT 7,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS (link user to Stripe customer)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription_id (sub_xxx)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  price_id TEXT REFERENCES prices(id),
  status TEXT CHECK (status IN (
    'trialing', 'active', 'canceled', 
    'past_due', 'unpaid', 'incomplete', 'incomplete_expired'
  )) NOT NULL,
  quantity INTEGER DEFAULT 1,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PLAN LIMITS (defines limits per price)
CREATE TABLE IF NOT EXISTS plan_limits (
  price_id TEXT PRIMARY KEY REFERENCES prices(id) ON DELETE CASCADE,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_contacts INTEGER NOT NULL DEFAULT 100,
  max_pipelines INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Products and Prices: Public read (for pricing page)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active prices" ON prices
  FOR SELECT USING (active = true);

-- Customers: Only own record
CREATE POLICY "Users can view own customer record" ON customers
  FOR SELECT USING (auth.uid() = id);

-- Subscriptions: Only own subscription
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Plan limits: Public read
CREATE POLICY "Anyone can view plan limits" ON plan_limits
  FOR SELECT USING (true);

-- =============================================
-- HELPER FUNCTION: Get current subscription
-- =============================================
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id TEXT,
  status TEXT,
  price_id TEXT,
  plan_name TEXT,
  current_period_end TIMESTAMPTZ,
  max_users INTEGER,
  max_contacts INTEGER,
  max_pipelines INTEGER,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.status,
    s.price_id,
    pr.name,
    s.current_period_end,
    pl.max_users,
    pl.max_contacts,
    pl.max_pipelines,
    pl.features
  FROM subscriptions s
  JOIN prices p ON s.price_id = p.id
  JOIN products pr ON p.product_id = pr.id
  LEFT JOIN plan_limits pl ON s.price_id = pl.price_id
  WHERE s.user_id = p_user_id
    AND s.status IN ('trialing', 'active')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
