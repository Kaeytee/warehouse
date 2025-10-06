-- Fix handle_new_user Function to Prevent Conflicts
-- Removes automatic profile creation that causes issues
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. CHECK IF TRIGGER EXISTS AND DROP IT
-- ============================================
DO $$
BEGIN
    -- Drop the trigger if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
    ) THEN
        DROP TRIGGER on_auth_user_created ON auth.users;
        RAISE NOTICE 'Dropped trigger: on_auth_user_created';
    END IF;
END $$;

-- ============================================
-- 2. DROP THE PROBLEMATIC FUNCTION
-- ============================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- 3. CREATE A SAFER VERSION (OPTIONAL - FOR MANUAL USE ONLY)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_user_profile_manual(
    p_user_id UUID,
    p_email TEXT,
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_suite_number TEXT;
    existing_user_count INTEGER;
BEGIN
    -- Check if profile already exists
    SELECT COUNT(*) INTO existing_user_count
    FROM public.users 
    WHERE id = p_user_id;
    
    IF existing_user_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Profile already exists for this user'
        );
    END IF;
    
    -- Generate unique suite number
    new_suite_number := generate_suite_number();
    
    -- Create user profile manually
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        suite_number,
        role,
        status,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_first_name,
        p_last_name,
        new_suite_number,
        'client',
        'active',
        true,
        NOW(),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'user_id', p_user_id,
        'suite_number', new_suite_number,
        'message', 'Profile created successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ============================================
-- 4. VERIFY CURRENT USER PROFILE STATUS
-- ============================================
SELECT 
    'CURRENT_STATUS' as check_type,
    au.id as auth_user_id,
    au.email as auth_email,
    u.id as profile_user_id,
    u.email as profile_email,
    u.first_name,
    u.last_name,
    u.suite_number,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING_PROFILE'
        ELSE 'PROFILE_EXISTS'
    END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email IN ('austinbediako4@gmail.com', 'austinbediako5@gmail.com')
ORDER BY au.created_at DESC;

-- ============================================
-- 5. SHOW REMAINING FUNCTIONS
-- ============================================
SELECT 
    'REMAINING_FUNCTIONS' as check_type,
    routine_name as function_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;
