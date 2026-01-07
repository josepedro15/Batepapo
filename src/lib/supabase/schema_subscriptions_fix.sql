-- =============================================
-- SUBSCRIPTION SYSTEM SCHEMA (SAFE FIX)
-- Use este script para corrigir o erro de "policy already exists"
-- =============================================

-- 1. DROP POLICIES ANTIGAS (Limpeza para evitar conflitos)
-- Isso garante que não dê erro se elas já existirem
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Anyone can view active prices" ON prices;
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Anyone can view plan limits" ON plan_limits;

-- 2. CRIAR TABELAS (Se não existirem)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  active BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'brl',
  unit_amount INTEGER NOT NULL,
  type TEXT DEFAULT 'recurring',
  interval TEXT,
  interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER DEFAULT 7,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  price_id TEXT REFERENCES prices(id),
  status TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS plan_limits (
  price_id TEXT PRIMARY KEY REFERENCES prices(id) ON DELETE CASCADE,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_contacts INTEGER NOT NULL DEFAULT 100,
  max_pipelines INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- 4. RECRIAR POLICIES
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view active prices" ON prices FOR SELECT USING (active = true);
CREATE POLICY "Users can view own customer record" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view plan limits" ON plan_limits FOR SELECT USING (true);
