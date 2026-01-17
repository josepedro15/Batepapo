-- =============================================
-- CONNECTED PHONE SCHEMA MIGRATION
-- Links contacts, messages, and deals to WhatsApp phone number
-- =============================================
-- Run this migration in Supabase SQL Editor

-- 1. Adicionar coluna connected_phone nas tabelas relacionadas
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS connected_phone TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS connected_phone TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS connected_phone TEXT;

-- 2. Migrar dados existentes (associar ao número atualmente conectado)
-- Isso associa todos os contatos existentes ao número WhatsApp conectado da organização
UPDATE contacts c SET connected_phone = (
    SELECT phone_number FROM whatsapp_instances wi 
    WHERE wi.organization_id = c.organization_id 
    AND wi.status = 'connected'
    LIMIT 1
) WHERE c.connected_phone IS NULL;

-- Propagar connected_phone para mensagens baseado no contato
UPDATE messages m SET connected_phone = (
    SELECT c.connected_phone FROM contacts c WHERE c.id = m.contact_id
) WHERE m.connected_phone IS NULL;

-- Propagar connected_phone para deals baseado no contato
UPDATE deals d SET connected_phone = (
    SELECT c.connected_phone FROM contacts c WHERE c.id = d.contact_id
) WHERE d.connected_phone IS NULL;

-- 3. Criar índices para performance nas queries de filtro
CREATE INDEX IF NOT EXISTS idx_contacts_connected_phone ON contacts(connected_phone);
CREATE INDEX IF NOT EXISTS idx_messages_connected_phone ON messages(connected_phone);
CREATE INDEX IF NOT EXISTS idx_deals_connected_phone ON deals(connected_phone);

-- 4. Índice composto para queries comuns (org + phone)
CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, connected_phone);
CREATE INDEX IF NOT EXISTS idx_deals_org_phone ON deals(organization_id, connected_phone);
