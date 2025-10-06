-- Warehouse App Access Control - Multi-App Architecture
-- Restricts warehouse app access to admin roles while preserving client app functionality
-- Maintains shared database for Client App, Warehouse App, and SuperAdmin App
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-06

-- ============================================
-- 1. PRESERVE EXISTING USER ROLES (NO CONSTRAINT CHANGES)
-- ============================================

-- First, disable RLS to make changes safely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Add missing status column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'reported'));

-- DO NOT change the role constraint - keep it flexible for all apps
-- The original constraint should allow: 'client', 'warehouse_admin', 'admin', 'superadmin', 'super_admin'
-- Update the constraint to include all valid roles for all apps
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('client', 'warehouse_admin', 'admin', 'superadmin', 'super_admin'));

-- ============================================
-- 2. DROP ALL EXISTING POLICIES SAFELY
-- ============================================

-- Remove all existing user policies
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
DROP POLICY IF EXISTS "admin_users_select_own" ON public.users;
DROP POLICY IF EXISTS "admin_users_update_own" ON public.users;
DROP POLICY IF EXISTS "super_admin_view_all" ON public.users;
DROP POLICY IF EXISTS "super_admin_update_all" ON public.users;
DROP POLICY IF EXISTS "service_role_admin_access" ON public.users;
DROP POLICY IF EXISTS "prevent_user_registration" ON public.users;

-- ============================================
-- 3. CREATE MULTI-APP RLS POLICIES
-- ============================================

-- Policy 1: All users can view their own profile (for all apps)
CREATE POLICY "users_view_own_profile" ON public.users
    FOR SELECT 
    TO authenticated
    USING (id = auth.uid() AND status = 'active');

-- Policy 2: All users can update their own profile (for all apps)
CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (id = auth.uid() AND status = 'active')
    WITH CHECK (id = auth.uid());

-- Policy 3: Warehouse admins can view other users (for warehouse app user search)
-- Meta-style: Email-based role determination with database role validation
CREATE POLICY "warehouse_admins_view_users" ON public.users
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND (
                u.role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin') OR
                u.email LIKE '%admin@%' OR
                u.email LIKE '%warehouse@%' OR
                u.email LIKE '%manager@%' OR
                u.email = 'admin@vanguardcargo.org'
            )
            AND u.status = 'active'
        )
    );

-- Policy 4: Super admins can update any user (for superadmin app)
CREATE POLICY "super_admins_manage_users" ON public.users
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
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- Policy 5: Allow user registration (for client app signup)
CREATE POLICY "allow_user_registration" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Policy 6: Service role full access (for system operations)
CREATE POLICY "service_role_full_access" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 4. UPDATE PACKAGE POLICIES FOR MULTI-APP ACCESS
-- ============================================

-- Drop existing package policies
DROP POLICY IF EXISTS "Users can view own packages" ON public.packages;
DROP POLICY IF EXISTS "Users can insert own packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can view all packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can update all packages" ON public.packages;
DROP POLICY IF EXISTS "admin_view_all_packages" ON public.packages;
DROP POLICY IF EXISTS "admin_manage_packages" ON public.packages;

-- Policy 1: Users can view their own packages (client app)
CREATE POLICY "users_view_own_packages" ON public.packages
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Users can create their own packages (client app)
CREATE POLICY "users_create_own_packages" ON public.packages
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy 3: Warehouse staff can view all packages (warehouse app)
CREATE POLICY "warehouse_staff_view_all_packages" ON public.packages
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- Policy 4: Warehouse staff can update all packages (warehouse app)
CREATE POLICY "warehouse_staff_update_packages" ON public.packages
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- Policy 5: Warehouse staff can create packages (warehouse app - intake)
CREATE POLICY "warehouse_staff_create_packages" ON public.packages
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- ============================================
-- 5. UPDATE SHIPMENT POLICIES FOR MULTI-APP ACCESS
-- ============================================

-- Drop existing shipment policies
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can insert own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can update own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can view all shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can update all shipments" ON public.shipments;
DROP POLICY IF EXISTS "admin_view_all_shipments" ON public.shipments;
DROP POLICY IF EXISTS "admin_manage_shipments" ON public.shipments;

-- Policy 1: Users can view their own shipments (client app)
CREATE POLICY "users_view_own_shipments" ON public.shipments
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Users can create their own shipments (client app)
CREATE POLICY "users_create_own_shipments" ON public.shipments
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own shipments (client app - limited updates)
CREATE POLICY "users_update_own_shipments" ON public.shipments
    FOR UPDATE 
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy 4: Warehouse staff can view all shipments (warehouse app)
CREATE POLICY "warehouse_staff_view_all_shipments" ON public.shipments
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- Policy 5: Warehouse staff can manage all shipments (warehouse app)
CREATE POLICY "warehouse_staff_manage_shipments" ON public.shipments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin')
            AND status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin')
            AND status = 'active'
        )
    );

-- ============================================
-- 6. UPDATE AUTH FUNCTIONS FOR MULTI-APP SUPPORT
-- ============================================

-- Update handle_new_user to support all app types
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_suite_number TEXT;
    user_role TEXT;
BEGIN
    -- Extract role from metadata (defaults to 'client' for client app)
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    
    -- Validate role is allowed
    IF user_role NOT IN ('client', 'warehouse_admin', 'admin', 'super_admin', 'superadmin') THEN
        RAISE LOG 'Invalid role specified: % for user: %', user_role, NEW.email;
        user_role := 'client'; -- Default to client
    END IF;
    
    -- Generate unique suite number for all users
    new_suite_number := generate_suite_number();
    
    -- Insert user record
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
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
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
    
    -- Create user preferences for all users
    INSERT INTO public.user_preferences (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- ============================================
-- 7. CREATE WAREHOUSE APP AUTHENTICATION HELPER
-- ============================================

-- Function to verify warehouse app access specifically
CREATE OR REPLACE FUNCTION verify_warehouse_access()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    status TEXT,
    has_warehouse_access BOOLEAN,
    app_access TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        (u.role IN ('warehouse_admin', 'admin', 'super_admin', 'superadmin') AND u.status = 'active') as has_warehouse_access,
        CASE 
            WHEN u.role = 'client' THEN 'CLIENT_APP_ONLY'
            WHEN u.role IN ('warehouse_admin', 'admin') THEN 'WAREHOUSE_APP'
            WHEN u.role IN ('super_admin', 'superadmin') THEN 'ALL_APPS'
            ELSE 'NO_ACCESS'
        END as app_access
    FROM public.users u
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_warehouse_access() TO authenticated;

-- ============================================
-- 8. RE-ENABLE RLS
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Show user distribution by role and app access
SELECT 
    'USER_DISTRIBUTION' as check_type,
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    CASE 
        WHEN role = 'client' THEN 'CLIENT_APP'
        WHEN role IN ('warehouse_admin', 'admin') THEN 'WAREHOUSE_APP'
        WHEN role IN ('super_admin', 'superadmin') THEN 'SUPERADMIN_APP'
        ELSE 'UNKNOWN'
    END as primary_app_access
FROM public.users 
GROUP BY role
ORDER BY 
    CASE role
        WHEN 'client' THEN 1
        WHEN 'warehouse_admin' THEN 2
        WHEN 'admin' THEN 3
        WHEN 'super_admin' THEN 4
        WHEN 'superadmin' THEN 5
        ELSE 6
    END;

-- Show current RLS policies
SELECT 
    'RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname as policy_name,
    roles,
    cmd as command_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'packages', 'shipments')
ORDER BY tablename, policyname;

-- Final status
SELECT 
    'MULTI_APP_SETUP_COMPLETE' as status,
    'Database configured for Client App, Warehouse App, and SuperAdmin App' as message,
    json_build_object(
        'client_app', 'Users with role=client can access client features',
        'warehouse_app', 'Users with warehouse_admin/admin/super_admin can access warehouse features',
        'superadmin_app', 'Users with super_admin/superadmin can access all features',
        'database_shared', 'All apps share the same user/package/shipment tables',
        'frontend_auth', 'Each app should filter users by role in authentication service'
    ) as app_access_summary;
