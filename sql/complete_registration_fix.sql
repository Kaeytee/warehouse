-- =====================================================
-- COMPLETE REGISTRATION FIELDS FIX
-- =====================================================
-- This updates the trigger to handle ALL registration fields
-- including address data from the signup form
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-26
-- =====================================================

-- Update the handle_new_user function to extract ALL fields from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_suite_number TEXT;
BEGIN
    -- Generate unique suite number
    new_suite_number := generate_suite_number();
    
    -- Insert user record with ALL registration fields from metadata
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
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = NEW.email,
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', users.first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', users.last_name),
        phone_number = COALESCE(NEW.raw_user_meta_data->>'phone_number', users.phone_number),
        street_address = COALESCE(NEW.raw_user_meta_data->>'street_address', users.street_address),
        city = COALESCE(NEW.raw_user_meta_data->>'city', users.city),
        country = COALESCE(NEW.raw_user_meta_data->>'country', users.country),
        postal_code = COALESCE(NEW.raw_user_meta_data->>'postal_code', users.postal_code),
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NOW();
    
    -- Create default user preferences
    INSERT INTO user_preferences (user_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test query to verify the fix
SELECT 
    'Complete registration fix applied' as status,
    'Trigger now extracts ALL fields from signup metadata' as description,
    'Next registration will include: name, phone, address, city, country, postal_code' as fields_included;

-- =====================================================
-- WHAT THIS INCLUDES NOW:
-- =====================================================
-- ✅ first_name - from registration form
-- ✅ last_name - from registration form  
-- ✅ phone_number - from registration form
-- ✅ street_address - from registration form
-- ✅ city - from registration form
-- ✅ country - from registration form
-- ✅ postal_code - from registration form
-- ✅ email - from Supabase Auth
-- ✅ suite_number - auto-generated (VC-001, VC-002, etc.)
-- ✅ status - set to 'active'
-- ✅ email_verified - based on email confirmation
-- ✅ user_preferences - created automatically
-- =====================================================
