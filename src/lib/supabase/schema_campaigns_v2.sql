-- Campanhas em Massa V2 - Integração UAZAPI
-- Execute este SQL no Supabase para expandir o schema de campanhas

-- 1. Expandir tabela campaigns existente
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS uazapi_folder_id text,
ADD COLUMN IF NOT EXISTS delay_min integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS delay_max integer DEFAULT 6,
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS sent_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Atualizar status default para 'draft'
-- Possíveis status: 'draft', 'scheduled', 'sending', 'paused', 'done', 'deleting'

-- 2. Nova tabela para mensagens da campanha (suporta múltiplos tipos)
CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    order_index integer NOT NULL DEFAULT 0,
    type text NOT NULL CHECK (type IN ('text', 'button', 'list', 'document', 'carousel')),
    content jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Tabela de destinatários da campanha
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
    phone text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Policy para campaign_messages
CREATE POLICY "Read own campaign messages" ON campaign_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM campaigns c 
        JOIN organization_members om ON om.organization_id = c.organization_id 
        WHERE c.id = campaign_messages.campaign_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Insert own campaign messages" ON campaign_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM campaigns c 
        JOIN organization_members om ON om.organization_id = c.organization_id 
        WHERE c.id = campaign_messages.campaign_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Delete own campaign messages" ON campaign_messages FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM campaigns c 
        JOIN organization_members om ON om.organization_id = c.organization_id 
        WHERE c.id = campaign_messages.campaign_id AND om.user_id = auth.uid()
    )
);

-- Policy para campaign_recipients
CREATE POLICY "Read own campaign recipients" ON campaign_recipients FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM campaigns c 
        JOIN organization_members om ON om.organization_id = c.organization_id 
        WHERE c.id = campaign_recipients.campaign_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Insert own campaign recipients" ON campaign_recipients FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM campaigns c 
        JOIN organization_members om ON om.organization_id = c.organization_id 
        WHERE c.id = campaign_recipients.campaign_id AND om.user_id = auth.uid()
    )
);

CREATE POLICY "Update own campaign recipients" ON campaign_recipients FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM campaigns c 
        JOIN organization_members om ON om.organization_id = c.organization_id 
        WHERE c.id = campaign_recipients.campaign_id AND om.user_id = auth.uid()
    )
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_uazapi_folder ON campaigns(uazapi_folder_id);

-- 6. Políticas adicionais para campaigns (insert, update, delete)
CREATE POLICY "Insert own campaigns" ON campaigns FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = campaigns.organization_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Update own campaigns" ON campaigns FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = campaigns.organization_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Delete own campaigns" ON campaigns FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = campaigns.organization_id AND user_id = auth.uid()
    )
);

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();
