-- =============================================
-- SEED DATA FOR SUBSCRIPTION PLANS
-- Run AFTER schema_subscriptions.sql
-- =============================================

-- Insert Products (these should match your Stripe products)
INSERT INTO products (id, active, name, description, metadata) VALUES
('prod_starter', true, 'Starter', 'Plano inicial para pequenas equipes', '{"tier": "starter"}'),
('prod_pro', true, 'Pro', 'Plano profissional com recursos avançados', '{"tier": "pro"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Insert Prices (replace with actual Stripe price IDs after creating in Stripe)
INSERT INTO prices (id, product_id, active, currency, unit_amount, interval, trial_period_days, metadata) VALUES
('price_starter_monthly', 'prod_starter', true, 'brl', 9700, 'month', 7, '{"display": "R$ 97/mês"}'),
('price_pro_monthly', 'prod_pro', true, 'brl', 19700, 'month', 7, '{"display": "R$ 197/mês"}')
ON CONFLICT (id) DO UPDATE SET
  unit_amount = EXCLUDED.unit_amount,
  trial_period_days = EXCLUDED.trial_period_days;

-- Insert Plan Limits
INSERT INTO plan_limits (price_id, max_users, max_contacts, max_pipelines, features) VALUES
('price_starter_monthly', 3, 1000, 2, '{"api": true, "tags": true, "notes": true, "campaigns": false, "analytics": false, "webhooks": false}'),
('price_pro_monthly', 10, 10000, 5, '{"api": true, "tags": true, "notes": true, "campaigns": true, "analytics": true, "webhooks": true}')
ON CONFLICT (price_id) DO UPDATE SET
  max_users = EXCLUDED.max_users,
  max_contacts = EXCLUDED.max_contacts,
  max_pipelines = EXCLUDED.max_pipelines,
  features = EXCLUDED.features;
