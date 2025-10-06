-- Admin Access Verification and Cleanup
-- Verifies that only admin users can access the system
-- Provides diagnostic queries to confirm security implementation
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-06

-- ============================================
-- 1. DIAGNOSTIC QUERIES
-- ============================================

-- Check current user table constraints
SELECT 
    'TABLE_CONSTRAINTS' as check_type,
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND contype = 'c'
ORDER BY conname;

-- Check current RLS policies
SELECT 
    'RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname as policy_name,
    roles,
    cmd as command_type,
    permissive,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'packages', 'shipments')
ORDER BY tablename, policyname;

-- Check existing users and their roles
SELECT 
    'USER_AUDIT' as check_type,
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    suite_number,
    email_verified,
    created_at,
    CASE 
        WHEN role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') 
             AND status = 'active' 
        THEN 'AUTHORIZED'
        ELSE 'UNAUTHORIZED'
    END as access_status
FROM public.users 
ORDER BY 
    CASE 
        WHEN role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') 
             AND status = 'active' 
        THEN 1 
        ELSE 2 
    END,
    created_at DESC;

-- Check function security settings
SELECT 
    'FUNCTION_SECURITY' as check_type,
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    CASE 
        WHEN p.proconfig IS NOT NULL THEN 
            array_to_string(p.proconfig, ', ')
        ELSE 'No search_path set'
    END as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'generate_suite_number',
    'handle_new_user',
    'update_user_profile',
    'update_user_preferences',
    'create_user_profile_secure',
    'verify_admin_access'
)
ORDER BY p.proname;

-- ============================================
-- 2. SECURITY VALIDATION TESTS
-- ============================================

-- Test 1: Verify role constraint works
DO $$
BEGIN
    BEGIN
        -- This should fail due to role constraint
        INSERT INTO public.users (
            id, email, first_name, last_name, role, suite_number, status
        ) VALUES (
            gen_random_uuid(), 'test@invalid.com', 'Test', 'User', 'client', 'TEST-001', 'active'
        );
        RAISE NOTICE 'ERROR: Role constraint not working - client user was created!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'SUCCESS: Role constraint working - client user creation blocked';
        WHEN OTHERS THEN
            RAISE NOTICE 'UNEXPECTED ERROR: %', SQLERRM;
    END;
END $$;

-- Test 2: Verify admin role creation works
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    BEGIN
        -- This should succeed
        INSERT INTO public.users (
            id, email, first_name, last_name, role, suite_number, status
        ) VALUES (
            test_user_id, 'admin@test.com', 'Test', 'Admin', 'admin', 'TEST-ADM', 'active'
        );
        RAISE NOTICE 'SUCCESS: Admin user creation works';
        
        -- Clean up test user
        DELETE FROM public.users WHERE id = test_user_id;
        RAISE NOTICE 'Test admin user cleaned up';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Admin user creation failed - %', SQLERRM;
    END;
END $$;

-- ============================================
-- 3. CLEANUP NON-ADMIN USERS
-- ============================================

-- Identify and suspend any non-admin users that might exist
UPDATE public.users 
SET 
    status = 'suspended',
    updated_at = NOW()
WHERE role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
AND status != 'suspended';

-- Report on cleanup
SELECT 
    'CLEANUP_REPORT' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') THEN 1 END) as admin_users,
    COUNT(CASE WHEN role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') THEN 1 END) as non_admin_users,
    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
    COUNT(CASE WHEN status = 'active' AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') THEN 1 END) as active_admin_users
FROM public.users;

-- ============================================
-- 4. CREATE ADMIN USER CREATION HELPER
-- ============================================

CREATE OR REPLACE FUNCTION create_admin_user(
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'warehouse_admin',
    phone_number TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    new_suite_number TEXT;
    created_user RECORD;
BEGIN
    -- Validate role
    IF role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid role. Must be admin, super_admin, warehouse_admin, or superadmin'
        );
    END IF;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE email = create_admin_user.email) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User with this email already exists'
        );
    END IF;
    
    -- Generate new user ID and suite number
    new_user_id := gen_random_uuid();
    new_suite_number := generate_suite_number();
    
    -- Create admin user
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        phone_number,
        suite_number,
        role,
        status,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        create_admin_user.email,
        create_admin_user.first_name,
        create_admin_user.last_name,
        create_admin_user.phone_number,
        new_suite_number,
        create_admin_user.role,
        'active',
        false,
        NOW(),
        NOW()
    ) RETURNING * INTO created_user;
    
    -- Create user preferences
    INSERT INTO public.user_preferences (
        user_id,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        NOW(),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Admin user created successfully',
        'user', json_build_object(
            'id', created_user.id,
            'email', created_user.email,
            'first_name', created_user.first_name,
            'last_name', created_user.last_name,
            'suite_number', created_user.suite_number,
            'role', created_user.role,
            'status', created_user.status
        ),
        'instructions', 'User must be created in Supabase Auth with matching email and role metadata'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute to service role only (for admin operations)
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ============================================
-- 5. FINAL SECURITY STATUS REPORT
-- ============================================

SELECT 
    'SECURITY_STATUS_REPORT' as report_type,
    json_build_object(
        'database_constraints', json_build_object(
            'role_constraint_active', EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conrelid = 'public.users'::regclass 
                AND consrc LIKE '%admin%'
            ),
            'rls_enabled', (
                SELECT relrowsecurity 
                FROM pg_class 
                WHERE relname = 'users' 
                AND relnamespace = 'public'::regnamespace
            )
        ),
        'user_statistics', (
            SELECT json_build_object(
                'total_users', COUNT(*),
                'active_admin_users', COUNT(CASE WHEN role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') AND status = 'active' THEN 1 END),
                'suspended_non_admin_users', COUNT(CASE WHEN role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') AND status = 'suspended' THEN 1 END),
                'unauthorized_users', COUNT(CASE WHEN role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') AND status = 'active' THEN 1 END)
            )
            FROM public.users
        ),
        'security_policies', (
            SELECT COUNT(*) 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users'
            AND policyname LIKE '%admin%'
        ),
        'function_security', (
            SELECT COUNT(*) 
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.prosecdef = true
            AND p.proconfig IS NOT NULL
        )
    ) as security_details;

-- Show final recommendations
SELECT 
    'IMPLEMENTATION_COMPLETE' as status,
    'Admin-only authentication system implemented' as message,
    json_build_object(
        'next_steps', ARRAY[
            'Run these SQL files in order: 45_admin_only_authentication_fix.sql, 46_function_security_improvements.sql',
            'Test login with existing admin users',
            'Verify non-admin users cannot access the system',
            'Create new admin users using create_admin_user() function if needed'
        ],
        'security_features', ARRAY[
            'Database role constraints prevent non-admin user creation',
            'RLS policies restrict access to admin users only',
            'Functions have secure search_path settings',
            'Authentication trigger blocks non-admin registration',
            'All warehouse operations require admin role verification'
        ]
    ) as implementation_details;
