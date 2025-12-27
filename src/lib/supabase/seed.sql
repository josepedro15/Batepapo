-- SEED DATA for Testing
-- Run this AFTER creating an organization via the UI

-- NOTE: Replace 'YOUR_ORG_ID' and 'YOUR_USER_ID' with actual IDs from your Supabase tables
-- You can get these by running:
-- SELECT id FROM organizations LIMIT 1;
-- SELECT id FROM profiles LIMIT 1;

-- For demonstration, we'll use variables (you need to replace these)
DO $$
DECLARE
    v_org_id uuid;
    v_user_id uuid;
    v_pipeline_id uuid;
    v_stage_new_id uuid;
    v_stage_qualified_id uuid;
    v_contact1_id uuid;
    v_contact2_id uuid;
    v_contact3_id uuid;
BEGIN
    -- Get the first organization and user (CHANGE THIS if you have multiple)
    SELECT id INTO v_org_id FROM organizations ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO v_user_id FROM profiles ORDER BY created_at DESC LIMIT 1;

    -- Insert sample contacts
    INSERT INTO contacts (organization_id, name, phone, email, tags, status, owner_id)
    VALUES 
        (v_org_id, 'João Silva', '5511987654321', 'joao@example.com', ARRAY['lead', 'whatsapp'], 'open', v_user_id),
        (v_org_id, 'Maria Santos', '5511976543210', 'maria@example.com', ARRAY['cliente'], 'open', NULL),
        (v_org_id, 'Pedro Costa', '5511965432109', NULL, ARRAY['lead'], 'open', NULL),
        (v_org_id, 'Ana Paula', '5511954321098', 'ana@example.com', ARRAY['vip'], 'open', v_user_id),
        (v_org_id, 'Carlos Rocha', '5511943210987', 'carlos@example.com', ARRAY['lead'], 'closed', NULL)
    RETURNING id INTO v_contact1_id;

    -- Get IDs for messages
    SELECT id INTO v_contact2_id FROM contacts WHERE name = 'Maria Santos' AND organization_id = v_org_id;
    SELECT id INTO v_contact3_id FROM contacts WHERE name = 'Pedro Costa' AND organization_id = v_org_id;

    -- Insert sample messages
    INSERT INTO messages (organization_id, contact_id, sender_type, sender_id, body, status, created_at)
    VALUES
        (v_org_id, v_contact1_id, 'contact', NULL, 'Olá, gostaria de saber mais sobre os produtos!', 'delivered', NOW() - INTERVAL '2 hours'),
        (v_org_id, v_contact1_id, 'user', v_user_id, 'Oi João! Claro, temos várias opções. Qual o seu interesse?', 'sent', NOW() - INTERVAL '1 hour 50 minutes'),
        (v_org_id, v_contact1_id, 'contact', NULL, 'Estou procurando um CRM para minha empresa.', 'delivered', NOW() - INTERVAL '1 hour 45 minutes'),
        (v_org_id, v_contact2_id, 'contact', NULL, 'Boa tarde! Vocês têm atendimento aos sábados?', 'delivered', NOW() - INTERVAL '30 minutes'),
        (v_org_id, v_contact3_id, 'contact', NULL, 'Quanto custa o plano básico?', 'delivered', NOW() - INTERVAL '15 minutes');

    -- Get pipeline (should exist from kanban actions, but let's ensure)
    SELECT id INTO v_pipeline_id FROM pipelines WHERE organization_id = v_org_id LIMIT 1;
    
    IF v_pipeline_id IS NULL THEN
        INSERT INTO pipelines (organization_id, name) VALUES (v_org_id, 'Vendas Padrão') RETURNING id INTO v_pipeline_id;
        
        -- Create stages if they don't exist
        INSERT INTO stages (pipeline_id, name, position, color) VALUES
            (v_pipeline_id, 'Novo Lead', 0, 'bg-blue-500'),
            (v_pipeline_id, 'Qualificado', 1, 'bg-yellow-500'),
            (v_pipeline_id, 'Proposta', 2, 'bg-purple-500'),
            (v_pipeline_id, 'Fechado', 3, 'bg-green-500');
    END IF;

    -- Get stage IDs
    SELECT id INTO v_stage_new_id FROM stages WHERE pipeline_id = v_pipeline_id AND name = 'Novo Lead';
    SELECT id INTO v_stage_qualified_id FROM stages WHERE pipeline_id = v_pipeline_id AND name = 'Qualificado';

    -- Insert sample deals
    INSERT INTO deals (organization_id, pipeline_id, stage_id, contact_id, title, value, position)
    VALUES
        (v_org_id, v_pipeline_id, v_stage_new_id, v_contact1_id, 'Venda CRM - João Silva', 5000.00, 0),
        (v_org_id, v_pipeline_id, v_stage_new_id, v_contact2_id, 'Consultoria - Maria Santos', 2500.00, 1),
        (v_org_id, v_pipeline_id, v_stage_qualified_id, (SELECT id FROM contacts WHERE name = 'Ana Paula' AND organization_id = v_org_id), 'Upgrade Plano - Ana Paula', 8000.00, 0);

    RAISE NOTICE 'Seed data inserted successfully!';
END $$;
