-- Execute este script PRIMEIRO para remover as políticas existentes
-- Depois execute o schema_campaigns_v2.sql

-- Drop policies de campaign_messages
DROP POLICY IF EXISTS "Read own campaign messages" ON campaign_messages;
DROP POLICY IF EXISTS "Insert own campaign messages" ON campaign_messages;
DROP POLICY IF EXISTS "Delete own campaign messages" ON campaign_messages;

-- Drop policies de campaign_recipients
DROP POLICY IF EXISTS "Read own campaign recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Insert own campaign recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Update own campaign recipients" ON campaign_recipients;

-- Drop policies de campaigns
DROP POLICY IF EXISTS "Insert own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Update own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Delete own campaigns" ON campaigns;

-- Pronto! Agora execute o schema_campaigns_v2.sql
