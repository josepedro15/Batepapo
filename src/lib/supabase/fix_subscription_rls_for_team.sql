-- =============================================
-- FIX: Backfill organization_id in existing subscriptions
-- =============================================
-- This script updates existing subscriptions that have NULL organization_id
-- by linking them to the organization of the subscription owner

UPDATE subscriptions
SET organization_id = (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = subscriptions.user_id
    LIMIT 1
)
WHERE organization_id IS NULL;

-- Verify the update
SELECT 
    s.id as subscription_id,
    s.user_id,
    s.organization_id,
    s.status,
    o.name as organization_name
FROM subscriptions s
LEFT JOIN organizations o ON s.organization_id = o.id
WHERE s.status IN ('active', 'trialing');
