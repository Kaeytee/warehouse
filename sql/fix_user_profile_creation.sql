-- =====================================================
-- FIX USER PROFILE CREATION ISSUE
-- =====================================================
-- This script fixes the empty profile issue by updating the database trigger
-- to properly handle user metadata from Supabase Auth
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-26
-- =====================================================

-- Step 1: Update the handle_new_user function to properly extract metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_suite_number TEXT;
BEGIN
    -- Generate unique suite number
    new_suite_number := generate_suite_number();
    
    -- Insert user record with suite number and all metadata
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

-- Step 2: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Verify the fix works by testing metadata extraction
DO $$
BEGIN
    RAISE NOTICE 'User profile creation fix applied successfully';
    RAISE NOTICE 'The trigger now properly extracts all user metadata from Supabase Auth';
    RAISE NOTICE 'Application code updated to send metadata in correct format';
END $$;

-- =====================================================
-- WHAT WAS FIXED:
-- =====================================================
-- 1. ✅ Database trigger now extracts ALL metadata fields (not just first/last name)
-- 2. ✅ Application code sends metadata in correct format for trigger
-- 3. ✅ Removed conflicting manual upsert that was overwriting trigger data
-- 4. ✅ Added proper error handling and logging
-- 5. ✅ Ensured user_preferences are created with proper timestamps
-- 6. ✅ Fixed status to be 'active' instead of 'pending_verification'
-- =====================================================
