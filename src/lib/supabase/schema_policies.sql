-- =============================================
-- RLS POLICIES FOR CHAT SYSTEM (FIXED)
-- =============================================

-- 1. CONTACTS
DROP POLICY IF EXISTS "Org members can view contacts" ON contacts;
CREATE POLICY "Org members can view contacts" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = contacts.organization_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can create contacts" ON contacts;
CREATE POLICY "Org members can create contacts" ON contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = contacts.organization_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can update contacts" ON contacts;
CREATE POLICY "Org members can update contacts" ON contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = contacts.organization_id
      AND user_id = auth.uid()
    )
  );

-- 2. MESSAGES
DROP POLICY IF EXISTS "Org members can view messages" ON messages;
CREATE POLICY "Org members can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = messages.organization_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can insert messages" ON messages;
CREATE POLICY "Org members can insert messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = messages.organization_id
      AND user_id = auth.uid()
    )
  );

-- 3. DEALS
DROP POLICY IF EXISTS "Org members can view deals" ON deals;
CREATE POLICY "Org members can view deals" ON deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = deals.organization_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can manage deals" ON deals;
CREATE POLICY "Org members can manage deals" ON deals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = deals.organization_id
      AND user_id = auth.uid()
    )
  );

-- 4. PIPELINES & STAGES
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view pipelines" ON pipelines;
CREATE POLICY "Org members can view pipelines" ON pipelines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = pipelines.organization_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can view stages" ON stages;
CREATE POLICY "Org members can view stages" ON stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pipelines
      WHERE pipelines.id = stages.pipeline_id
      AND EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = pipelines.organization_id
        AND user_id = auth.uid()
      )
    )
  );
