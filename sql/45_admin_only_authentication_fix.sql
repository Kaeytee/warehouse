-- Admin-Only Authentication Fix
-- Restricts database access to only admin roles (super_admin, admin, warehouse_admin)
-- Fixes the authentication bypass issue by updating schema and RLS policies
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-06

-- ============================================
-- 1. UPDATE USER TABLE ROLE CONSTRAINTS
-- ============================================

-- First, disable RLS to make schema changes
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Update the role constraint to only allow admin roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'super_admin', 'warehouse_admin'));

-- Update any existing 'client' users to be rejected (they shouldn't exist in admin system)
-- This will help identify any non-admin users that somehow got created
UPDATE public.users 
SET status = 'suspended', 
    updated_at = NOW()
WHERE role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin');

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================

-- Remove all existing user policies that might allow non-admin access
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Warehouse staff can search users for package intake" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_select_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_insert_own" ON public.users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.users;
DROP POLICY IF EXISTS "anon_insert_signup" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "service_role_all" ON public.users;

-- ============================================
-- 3. CREATE ADMIN-ONLY RLS POLICIES
-- ============================================

-- Policy 1: Only allow admin users to select their own profile
CREATE POLICY "admin_users_select_own" ON public.users
    FOR SELECT 
    TO authenticated
    USING (
        id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
        AND status = 'active'
    );

-- Policy 2: Only allow admin users to update their own profile
CREATE POLICY "admin_users_update_own" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (
        id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
        AND status = 'active'
    )
    WITH CHECK (
        id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    );

-- Policy 3: Super admins can view all admin users
CREATE POLICY "super_admin_view_all" ON public.users
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- Policy 4: Super admins can update all admin users
CREATE POLICY "super_admin_update_all" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'superadmin')
            AND status = 'active'
        )
    )
    WITH CHECK (
        role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    );

-- Policy 5: Service role full access (for system functions)
CREATE POLICY "service_role_admin_access" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin'));

-- Policy 6: Prevent any INSERT from non-service roles (no self-registration)
-- Only service role can create admin users
CREATE POLICY "prevent_user_registration" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (false);

-- ============================================
-- 4. UPDATE PACKAGE AND SHIPMENT POLICIES
-- ============================================

-- Drop existing package policies
DROP POLICY IF EXISTS "Users can view own packages" ON public.packages;
DROP POLICY IF EXISTS "Users can insert own packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can view all packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can update all packages" ON public.packages;

-- Create admin-only package policies
CREATE POLICY "admin_view_all_packages" ON public.packages
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
            AND status = 'active'
        )
    );

CREATE POLICY "admin_manage_packages" ON public.packages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
            AND status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- Drop existing shipment policies
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can insert own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can update own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can view all shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can update all shipments" ON public.shipments;

-- Create admin-only shipment policies
CREATE POLICY "admin_view_all_shipments" ON public.shipments
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
            AND status = 'active'
        )
    );

CREATE POLICY "admin_manage_shipments" ON public.shipments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
            AND status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- ============================================
-- 5. UPDATE AUTH FUNCTIONS TO PREVENT NON-ADMIN REGISTRATION
-- ============================================

-- Replace the handle_new_user function to only allow admin users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_suite_number TEXT;
    user_role TEXT;
BEGIN
    -- Check if this user should be created as an admin
    -- Only create profiles for users that have been pre-approved as admins
    -- This prevents random user registration
    
    -- Extract role from metadata (must be set by admin during user creation)
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    
    -- Only allow admin roles to be created
    IF user_role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') THEN
        -- Log the attempt but don't create profile
        RAISE LOG 'Blocked non-admin user registration attempt: % with role: %', NEW.email, user_role;
        RETURN NEW;
    END IF;
    
    -- Generate unique suite number for admin users
    new_suite_number := generate_suite_number();
    
    -- Insert admin user record
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        phone_number,
        street_address,
        city,
        country,
        postal_code,
        suite_number,
        role,
        status,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL),
        COALESCE(NEW.raw_user_meta_data->>'street_address', NULL),
        COALESCE(NEW.raw_user_meta_data->>'city', NULL),
        COALESCE(NEW.raw_user_meta_data->>'country', NULL),
        COALESCE(NEW.raw_user_meta_data->>'postal_code', NULL),
        new_suite_number,
        user_role,
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = NEW.email,
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', users.first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', users.last_name),
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NOW();
    
    -- Create user preferences for admin users only
    INSERT INTO public.user_preferences (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user for admin: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- ============================================
-- 6. RE-ENABLE RLS WITH ADMIN-ONLY POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE ADMIN USER VERIFICATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION verify_admin_access()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    can_access BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        (u.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') AND u.status = 'active') as can_access
    FROM public.users u
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_admin_access() TO authenticated;

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Show current user policies
SELECT 
    'POLICY_VERIFICATION' as check_type,
    policyname as policy_name,
    roles,
    cmd as command_type,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- Show any existing non-admin users (should be suspended)
SELECT 
    'NON_ADMIN_USERS' as check_type,
    id,
    email,
    role,
    status,
    'SHOULD_BE_SUSPENDED' as action_needed
FROM public.users 
WHERE role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
OR status != 'active';

-- Show constraint verification
SELECT 
    'CONSTRAINT_VERIFICATION' as check_type,
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname LIKE '%role%';
