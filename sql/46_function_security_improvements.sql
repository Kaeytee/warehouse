-- Function Security Improvements
-- Fixes search_path security warnings from SQL advisor
-- Adds proper search_path settings to all functions
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-06

-- ============================================
-- 1. FIX GENERATE_SUITE_NUMBER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION generate_suite_number()
RETURNS TEXT AS $$
DECLARE
    new_suite_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate suite number in format VC-001, VC-002, etc.
        new_suite_number := 'VC-' || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this suite number already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE suite_number = new_suite_number) THEN
            RETURN new_suite_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique suite number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- 2. FIX UPDATE_USER_PROFILE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_user_profile(
    user_id UUID,
    new_first_name TEXT DEFAULT NULL,
    new_last_name TEXT DEFAULT NULL,
    new_phone TEXT DEFAULT NULL,
    new_street_address TEXT DEFAULT NULL,
    new_city TEXT DEFAULT NULL,
    new_country TEXT DEFAULT NULL,
    new_postal_code TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Security check: only allow admin users to update profiles
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
        AND status = 'active'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;
    
    -- Update user profile
    UPDATE users 
    SET 
        first_name = COALESCE(new_first_name, first_name),
        last_name = COALESCE(new_last_name, last_name),
        phone_number = COALESCE(new_phone, phone_number),
        street_address = COALESCE(new_street_address, street_address),
        city = COALESCE(new_city, city),
        country = COALESCE(new_country, country),
        postal_code = COALESCE(new_postal_code, postal_code),
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'message', 'Profile updated successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- ============================================
-- 3. FIX UPDATE_USER_PREFERENCES FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_user_preferences(
    user_id UUID,
    new_language TEXT DEFAULT NULL,
    new_units TEXT DEFAULT NULL,
    new_auto_refresh BOOLEAN DEFAULT NULL,
    new_email_notifications BOOLEAN DEFAULT NULL,
    new_sms_notifications BOOLEAN DEFAULT NULL,
    new_whatsapp_notifications BOOLEAN DEFAULT NULL,
    new_push_notifications BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    -- Security check: only allow admin users to update preferences
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
        AND status = 'active'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;
    
    -- Update preferences
    UPDATE user_preferences 
    SET 
        language = COALESCE(new_language, language),
        units = COALESCE(new_units, units),
        auto_refresh = COALESCE(new_auto_refresh, auto_refresh),
        email_notifications = COALESCE(new_email_notifications, email_notifications),
        sms_notifications = COALESCE(new_sms_notifications, sms_notifications),
        whatsapp_notifications = COALESCE(new_whatsapp_notifications, whatsapp_notifications),
        push_notifications = COALESCE(new_push_notifications, push_notifications),
        updated_at = NOW()
    WHERE user_id = update_user_preferences.user_id;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'message', 'Preferences updated successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- ============================================
-- 4. FIX CREATE_USER_PROFILE_SECURE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile_secure(
    user_id UUID,
    email TEXT,
    first_name TEXT DEFAULT 'Admin',
    last_name TEXT DEFAULT 'User',
    phone_number TEXT DEFAULT NULL,
    street_address TEXT DEFAULT NULL,
    city TEXT DEFAULT NULL,
    country TEXT DEFAULT NULL,
    postal_code TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'warehouse_admin'
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
    
    -- Validate role is admin type
    IF user_role NOT IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid role: Only admin roles allowed'
        );
    END IF;
    
    -- Check if user profile already exists
    IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User profile already exists'
        );
    END IF;
    
    -- Generate unique suite number
    new_suite_number := generate_suite_number();
    
    -- Insert admin user profile
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
        user_role,
        'active',
        false,
        NOW(),
        NOW()
    ) RETURNING * INTO created_user;
    
    -- Create default user preferences
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
        'message', 'Admin user profile created successfully',
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
            'message', 'Failed to create admin user profile'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- ============================================
-- 5. FIX REMAINING FUNCTIONS WITH SEARCH_PATH
-- ============================================

-- Fix get_recent_timestamp function
CREATE OR REPLACE FUNCTION get_recent_timestamp()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix generate_paystack_reference function
CREATE OR REPLACE FUNCTION generate_paystack_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN 'VCG_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || FLOOR(RANDOM() * 1000)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- 6. GRANT PROPER PERMISSIONS
-- ============================================

-- Grant execute permissions to authenticated users for admin functions
GRANT EXECUTE ON FUNCTION generate_suite_number() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_preferences(UUID, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_access() TO authenticated;

-- Grant to service role for system operations
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- 7. VERIFICATION
-- ============================================

SELECT 
    'FUNCTION_SECURITY_CHECK' as check_type,
    routine_name as function_name,
    routine_type,
    security_type,
    CASE 
        WHEN prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_mode
FROM information_schema.routines r
LEFT JOIN pg_proc p ON p.proname = r.routine_name
WHERE r.routine_schema = 'public' 
AND r.routine_name IN (
    'generate_suite_number',
    'update_user_profile', 
    'update_user_preferences',
    'create_user_profile_secure',
    'verify_admin_access',
    'handle_new_user'
)
ORDER BY routine_name;
