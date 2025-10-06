-- Secure User Registration Fix - RPC Function Approach
-- This creates a secure function that bypasses RLS for user registration
-- Based on existing architecture in sql directory
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-30

-- ============================================
-- 1. CREATE SECURE USER PROFILE CREATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_user_profile_secure(
    user_id UUID,
    email TEXT,
    first_name TEXT DEFAULT 'User',
    last_name TEXT DEFAULT 'Name',
    phone_number TEXT DEFAULT NULL,
    street_address TEXT DEFAULT NULL,
    city TEXT DEFAULT NULL,
    country TEXT DEFAULT NULL,
    postal_code TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_suite_number TEXT;
    created_user RECORD;
BEGIN
    -- Security check: ensure the calling user matches the user_id
    IF auth.uid() != user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Cannot create profile for different user'
        );
    END IF;
    
    -- Check if user profile already exists
    IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User profile already exists'
        );
    END IF;
    
    -- Generate unique suite number using existing function
    new_suite_number := generate_suite_number();
    
    -- Insert user profile (SECURITY DEFINER bypasses RLS)
    INSERT INTO users (
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
        user_id,
        email,
        first_name,
        last_name,
        phone_number,
        street_address,
        city,
        country,
        postal_code,
        new_suite_number,
        'client',
        'active',
        false,
        NOW(),
        NOW()
    ) RETURNING * INTO created_user;
    
    -- Create default user preferences using existing table structure
    INSERT INTO user_preferences (
        user_id,
        language,
        units,
        auto_refresh,
        email_notifications,
        sms_notifications,
        whatsapp_notifications,
        push_notifications,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'en',
        'metric',
        true,
        true,
        true,
        true,
        true,
        NOW(),
        NOW()
    );
    
    -- Return success response with user data
    RETURN json_build_object(
        'success', true,
        'message', 'User profile created successfully',
        'user', json_build_object(
            'id', created_user.id,
            'email', created_user.email,
            'first_name', created_user.first_name,
            'last_name', created_user.last_name,
            'suite_number', created_user.suite_number,
            'role', created_user.role,
            'status', created_user.status,
            'phone_number', created_user.phone_number,
            'street_address', created_user.street_address,
            'city', created_user.city,
            'country', created_user.country,
            'postal_code', created_user.postal_code,
            'created_at', created_user.created_at
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to create user profile'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. GRANT EXECUTE PERMISSIONS
-- ============================================
-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION create_user_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================
-- 3. ADD MISSING RLS POLICY FOR USER_PREFERENCES INSERT
-- ============================================
-- This was missing from the original RLS policies
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. VERIFY FUNCTION CREATION
-- ============================================
SELECT 
    'FUNCTION_CREATED' as status,
    'create_user_profile_secure function is ready' as message,
    'Call via supabase.rpc("create_user_profile_secure", {...})' as usage;

-- ============================================
-- 5. TEST FUNCTION AVAILABILITY
-- ============================================
SELECT 
    routine_name as function_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_profile_secure';
