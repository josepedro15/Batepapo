-- RLS Policies for Kanban Board and CRM features

-- 1. CONTACTS
-- Allow members of an organization to view/edit contacts
CREATE POLICY "Enable access for organization members" ON "public"."contacts"
AS PERMISSIVE FOR ALL
TO public
USING (
  (organization_id IN ( 
    SELECT organization_members.organization_id 
    FROM organization_members 
    WHERE (organization_members.user_id = auth.uid())
  ))
)
WITH CHECK (
  (organization_id IN ( 
    SELECT organization_members.organization_id 
    FROM organization_members 
    WHERE (organization_members.user_id = auth.uid())
  ))
);

-- 2. PIPELINES
CREATE POLICY "Enable access for organization members" ON "public"."pipelines"
AS PERMISSIVE FOR ALL
TO public
USING (
  (organization_id IN ( 
    SELECT organization_members.organization_id 
    FROM organization_members 
    WHERE (organization_members.user_id = auth.uid())
  ))
)
WITH CHECK (
  (organization_id IN ( 
    SELECT organization_members.organization_id 
    FROM organization_members 
    WHERE (organization_members.user_id = auth.uid())
  ))
);

-- 3. STAGES
-- Stages link to pipelines, so we check if the user has access to the pipeline's organization
-- OR we can just check via the join if we want to be strict, but stages (in the schema I saw) didn't have organization_id directly?
-- Let's re-verify schema.
-- Schema says: stages table has pipeline_id. pipelines table has organization_id.
-- So we need a join or a subquery.

-- Re-reading schema context from previous turn:
-- create table public.stages ( ... pipeline_id ... );
-- create table public.pipelines ( ... organization_id ... );

CREATE POLICY "Enable access for organization members" ON "public"."stages"
AS PERMISSIVE FOR ALL
TO public
USING (
  (pipeline_id IN ( 
    SELECT pipelines.id 
    FROM pipelines 
    WHERE (pipelines.organization_id IN (
        SELECT organization_members.organization_id 
        FROM organization_members 
        WHERE (organization_members.user_id = auth.uid())
    ))
  ))
)
WITH CHECK (
  (pipeline_id IN ( 
    SELECT pipelines.id 
    FROM pipelines 
    WHERE (pipelines.organization_id IN (
        SELECT organization_members.organization_id 
        FROM organization_members 
        WHERE (organization_members.user_id = auth.uid())
    ))
  ))
);

-- 4. DEALS
-- Deals have organization_id directly in the schema I saw?
-- Schema: create table public.deals ( ... organization_id ... );
-- So we can use the simpler check.

CREATE POLICY "Enable access for organization members" ON "public"."deals"
AS PERMISSIVE FOR ALL
TO public
USING (
  (organization_id IN ( 
    SELECT organization_members.organization_id 
    FROM organization_members 
    WHERE (organization_members.user_id = auth.uid())
  ))
)
WITH CHECK (
  (organization_id IN ( 
    SELECT organization_members.organization_id 
    FROM organization_members 
    WHERE (organization_members.user_id = auth.uid())
  ))
);

-- 5. ORGANIZATION MEMBERS
-- Users should be able to see members of their own organizations (to know who they are working with)
-- Already has "Read own orgs" policy on organizations, but we need one for members table too?
-- Schema comments said: alter table public.organization_members enable row level security;
-- But didn't show specific policies for it.
-- Let's add one to be safe/complete.

CREATE POLICY "View members of own organizations" ON "public"."organization_members"
AS PERMISSIVE FOR SELECT
TO public
USING (
  (organization_id IN ( 
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE (om.user_id = auth.uid())
  ))
);

-- Also allow users to see "items where user_id is themselves" (essential for the subqueries to work recursively sometimes)
CREATE POLICY "View own membership" ON "public"."organization_members"
AS PERMISSIVE FOR SELECT
TO public
USING (
  (user_id = auth.uid())
);
