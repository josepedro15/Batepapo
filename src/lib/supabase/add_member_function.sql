-- FUNCTION to add a team member by email
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator.
-- This allows it to look up users in the public.profiles table even if RLS normally blocks it for non-owners.

CREATE OR REPLACE FUNCTION public.add_team_member(email_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user_id uuid;
    v_requesting_user_id uuid;
    v_org_id uuid;
    v_role text;
BEGIN
    v_requesting_user_id := auth.uid();

    -- 1. Check if the requesting user is an Owner or Manager of an organization
    SELECT organization_id, role INTO v_org_id, v_role
    FROM organization_members
    WHERE user_id = v_requesting_user_id
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'You are not a member of any organization.';
    END IF;

    IF v_role NOT IN ('owner', 'manager') THEN
        RAISE EXCEPTION 'Only Owners and Managers can add members.';
    END IF;

    -- 2. Find the target user by email
    SELECT id INTO v_target_user_id
    FROM profiles
    WHERE email = email_input;

    IF v_target_user_id IS NULL THEN
        -- In a real production app, you might want to create an invite record here instead.
        -- For this specific request, we just error if the user doesn't exist.
        RAISE EXCEPTION 'User with this email not found. They must create an account first.';
    END IF;

    -- 3. Check if user is already in the organization
    IF EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = v_org_id AND user_id = v_target_user_id
    ) THEN
        RAISE EXCEPTION 'User is already a member of this organization.';
    END IF;

    -- 4. Add the member
    INSERT INTO organization_members (organization_id, user_id, role, joined_at)
    VALUES (v_org_id, v_target_user_id, 'attendant', NOW());

    RETURN json_build_object('success', true, 'message', 'Member added successfully');
END;
$$;
