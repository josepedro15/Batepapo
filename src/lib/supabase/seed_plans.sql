-- =============================================
-- SEED DEFAULT PLANS (Starter & Pro)
-- Executar este script para corrigir "Price ID not found"
-- =============================================

-- 1. Inserir Produtos (se não existirem)
INSERT INTO products (id, name, active, description)
VALUES 
    ('prod_starter', 'Starter', true, 'Plano ideal para pequenas equipes'),
    ('prod_pro', 'Pro', true, 'Para equipes em crescimento')
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir Preços (se não existirem)
INSERT INTO prices (id, product_id, active, currency, unit_amount, type, interval)
VALUES 
    ('price_starter_monthly', 'prod_starter', true, 'brl', 9700, 'recurring', 'month'),
    ('price_pro_monthly', 'prod_pro', true, 'brl', 19700, 'recurring', 'month')
ON CONFLICT (id) DO NOTHING;

-- 3. Definir Limites do Plano (Plan Limits)
INSERT INTO plan_limits (price_id, max_users, max_contacts, max_pipelines, features)
VALUES 
    ('price_starter_monthly', 3, 1000, 2, '["3 atendentes", "1.000 contatos", "2 pipelines", "Chat WhatsApp"]'::jsonb),
    ('price_pro_monthly', 10, 10000, 5, '["10 atendentes", "10.000 contatos", "5 pipelines", "Campanhas WhatsApp", "Analytics avançado"]'::jsonb)
ON CONFLICT (price_id) DO UPDATE 
SET max_users = EXCLUDED.max_users,
    max_contacts = EXCLUDED.max_contacts,
    features = EXCLUDED.features;

-- 4. Verificação Final (Deve retornar 2 linhas)
SELECT * FROM prices WHERE id IN ('price_starter_monthly', 'price_pro_monthly');
