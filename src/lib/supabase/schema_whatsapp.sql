-- =============================================
-- WHATSAPP INSTANCES SCHEMA
-- CRM WhatsApp Pro - UAZAPI Integration
-- =============================================
-- Run this migration in Supabase SQL Editor

-- WhatsApp instances per organization
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  instance_name TEXT NOT NULL,            -- Name in UAZAPI (e.g., "org_abc123")
  instance_token TEXT NOT NULL,           -- Token returned by UAZAPI
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected')),
  phone_number TEXT,                      -- Connected phone number
  webhook_configured BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_org ON whatsapp_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_token ON whatsapp_instances(instance_token);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Org members can view their instance
CREATE POLICY "Org members can view instance" ON whatsapp_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = whatsapp_instances.organization_id
      AND user_id = auth.uid()
    )
  );

-- Only owners/managers can manage instance
CREATE POLICY "Owners/managers can manage instance" ON whatsapp_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = whatsapp_instances.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- =============================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_whatsapp_instance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_whatsapp_instances_updated_at ON whatsapp_instances;
CREATE TRIGGER trigger_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_instance_updated_at();
