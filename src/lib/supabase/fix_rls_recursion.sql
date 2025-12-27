-- FIX RLS RECURSION ISSUES

-- drop policies first to ensure clean slate (optional, but good practice if names conflict)
DROP POLICY IF EXISTS "Enable access for organization members" ON "public"."contacts";
DROP POLICY IF EXISTS "Enable access for organization members" ON "public"."pipelines";
DROP POLICY IF EXISTS "Enable access for organization members" ON "public"."stages";
DROP POLICY IF EXISTS "Enable access for organization members" ON "public"."deals";
DROP POLICY IF EXISTS "View members of own organizations" ON "public"."organization_members";
DROP POLICY IF EXISTS "View own membership" ON "public"."organization_members";

-- 1. Helper Function (SECURITY DEFINER)
-- This function runs with the privileges of the creator (usually postgres/superuser)
-- allowing it to bypass RLS on organization_members to get the data efficiently.
CREATE OR REPLACE FUNCTION public.get_auth_user_org_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid();
END;
$$;

-- 2. Policies using the helper function

-- CONTACTS
CREATE POLICY "Enable access for organization members" ON "public"."contacts"
AS PERMISSIVE FOR ALL
TO public
USING (
  organization_id IN (SELECT get_auth_user_org_ids())
)
WITH CHECK (
  organization_id IN (SELECT get_auth_user_org_ids())
);

-- PIPELINES
CREATE POLICY "Enable access for organization members" ON "public"."pipelines"
AS PERMISSIVE FOR ALL
TO public
USING (
  organization_id IN (SELECT get_auth_user_org_ids())
)
WITH CHECK (
  organization_id IN (SELECT get_auth_user_org_ids())
);

-- DEALS
CREATE POLICY "Enable access for organization members" ON "public"."deals"
AS PERMISSIVE FOR ALL
TO public
USING (
  organization_id IN (SELECT get_auth_user_org_ids())
)
WITH CHECK (
  organization_id IN (SELECT get_auth_user_org_ids())
);

-- STAGES
-- Stages don't have organization_id, they have pipeline_id.
-- So we check if the pipeline_id belongs to a pipeline in one of our orgs.
CREATE POLICY "Enable access for organization members" ON "public"."stages"
AS PERMISSIVE FOR ALL
TO public
USING (
  pipeline_id IN (
    SELECT id FROM pipelines WHERE organization_id IN (SELECT get_auth_user_org_ids())
  )
)
WITH CHECK (
  pipeline_id IN (
    SELECT id FROM pipelines WHERE organization_id IN (SELECT get_auth_user_org_ids())
  )
);

-- ORGANIZATION MEMBERS
-- View members of my organizations
CREATE POLICY "View members of own organizations" ON "public"."organization_members"
AS PERMISSIVE FOR SELECT
TO public
USING (
  organization_id IN (SELECT get_auth_user_org_ids())
);
