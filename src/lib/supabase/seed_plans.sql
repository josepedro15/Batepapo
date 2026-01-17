-- =============================================
-- SEED DEFAULT PLAN (Plano Único)
-- Executar este script para configurar o plano
-- =============================================

-- 1. Desativar planos antigos e duplicados (Soft Delete para evitar erro de FK)
UPDATE products SET active = false WHERE name = 'BatePapo Pro' AND id != 'prod_To0NHc2B5u5D2b';
UPDATE products SET active = false WHERE id IN ('prod_starter', 'prod_pro', 'prod_batepapo');
UPDATE prices SET active = false WHERE id IN ('price_starter_monthly', 'price_pro_monthly', 'price_batepapo_monthly');

-- 2. Inserir Produto único
INSERT INTO products (id, name, active, description)
VALUES 
    ('prod_To0NHc2B5u5D2b', 'BatePapo Pro', true, 'Plano completo com todos os recursos')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- 3. Inserir Preço (R$ 149,90/mês)
INSERT INTO prices (id, product_id, active, currency, unit_amount, type, interval)
VALUES 
    ('price_1SqOMzE3jySaqEXCqllhxGsz', 'prod_To0NHc2B5u5D2b', true, 'brl', 14990, 'recurring', 'month')
ON CONFLICT (id) DO UPDATE 
SET unit_amount = EXCLUDED.unit_amount,
    active = EXCLUDED.active;

-- 4. Definir Limites do Plano (usando limites Pro)
INSERT INTO plan_limits (price_id, max_users, max_contacts, max_pipelines, features)
VALUES 
    ('price_1SqOMzE3jySaqEXCqllhxGsz', 10, 10000, 5, '["10 atendentes", "10.000 contatos", "5 pipelines", "Chat WhatsApp", "Campanhas WhatsApp", "Analytics avançado"]'::jsonb)
ON CONFLICT (price_id) DO UPDATE 
SET max_users = EXCLUDED.max_users,
    max_contacts = EXCLUDED.max_contacts,
    max_pipelines = EXCLUDED.max_pipelines,
    features = EXCLUDED.features;

-- 5. Verificação Final (Deve retornar 1 linha)
SELECT p.name, pr.unit_amount/100 as price_reais, pl.max_users, pl.max_contacts, pl.features
FROM products p
JOIN prices pr ON pr.product_id = p.id
JOIN plan_limits pl ON pl.price_id = pr.id
WHERE p.id = 'prod_batepapo';
