-- Database Indexes for Performance Optimization
-- Run this migration in your Supabase SQL Editor
-- ================================================

-- ============================================
-- CONTACTS TABLE INDEXES
-- ============================================

-- Index for listing contacts by organization and status (most common query)
CREATE INDEX IF NOT EXISTS idx_contacts_org_status 
ON contacts(organization_id, status);

-- Index for finding contacts by owner (my chats)
CREATE INDEX IF NOT EXISTS idx_contacts_org_owner 
ON contacts(organization_id, owner_id);

-- Index for sorting contacts by update time
CREATE INDEX IF NOT EXISTS idx_contacts_org_updated 
ON contacts(organization_id, updated_at DESC NULLS LAST);

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================

-- Composite index for loading chat messages (heavily used)
CREATE INDEX IF NOT EXISTS idx_messages_contact_created 
ON messages(contact_id, created_at DESC);

-- Index for real-time filtering
CREATE INDEX IF NOT EXISTS idx_messages_org 
ON messages(organization_id);

-- ============================================
-- DEALS TABLE INDEXES
-- ============================================

-- Index for Kanban board loading (deals by stage)
CREATE INDEX IF NOT EXISTS idx_deals_stage_position 
ON deals(stage_id, position);

-- Index for pipeline filtering
CREATE INDEX IF NOT EXISTS idx_deals_pipeline 
ON deals(pipeline_id);

-- Index for finding deals by contact
CREATE INDEX IF NOT EXISTS idx_deals_contact 
ON deals(contact_id);

-- ============================================
-- STAGES TABLE INDEXES
-- ============================================

-- Index for loading stages in order
CREATE INDEX IF NOT EXISTS idx_stages_pipeline_position 
ON stages(pipeline_id, position);

-- ============================================
-- ORGANIZATION_MEMBERS TABLE INDEXES
-- ============================================

-- Index for RLS policy lookups (critical for performance)
CREATE INDEX IF NOT EXISTS idx_org_members_user 
ON organization_members(user_id);

-- Index for finding members by organization
CREATE INDEX IF NOT EXISTS idx_org_members_org 
ON organization_members(organization_id);

-- ============================================
-- PIPELINES TABLE INDEXES
-- ============================================

-- Index for finding pipelines by organization
CREATE INDEX IF NOT EXISTS idx_pipelines_org 
ON pipelines(organization_id);
