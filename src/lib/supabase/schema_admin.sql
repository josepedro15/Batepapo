-- =============================================
-- SUPER ADMIN SCHEMA
-- CRM WhatsApp Pro - Admin System
-- =============================================
-- Run this migration in Supabase SQL Editor

-- 1. Add super admin column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Set Jose Pedro as super admin
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'jopedromkt@gmail.com';

-- 3. Create index for fast super admin lookup
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin 
ON profiles(is_super_admin) WHERE is_super_admin = true;

-- 4. RLS Policy: Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles" ON profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
);

-- 5. RLS Policy: Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles" ON profiles
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
);

-- 6. RLS Policy: Super admins can read all subscriptions
CREATE POLICY "Super admins can read all subscriptions" ON subscriptions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
);

-- 7. RLS Policy: Super admins can update all subscriptions
CREATE POLICY "Super admins can update all subscriptions" ON subscriptions
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
);

-- 8. RLS Policy: Super admins can read all organizations
CREATE POLICY "Super admins can read all organizations" ON organizations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
);

-- 9. Helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_super_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
