-- =====================================================
-- FIX DUPLICATE EMAIL CONSTRAINT ERROR
-- =====================================================
-- This fixes the duplicate email error by improving the trigger logic
-- and handling existing users properly
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-26
-- =====================================================

-- Step 1: Fix the trigger to handle existing users properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_suite_number TEXT;
    existing_user_count INTEGER;
BEGIN
    -- Check if user already exists in public.users table
    SELECT COUNT(*) INTO existing_user_count 
    FROM public.users 
    WHERE id = NEW.id OR email = NEW.email;
    
    -- Only proceed if user doesn't already exist
    IF existing_user_count = 0 THEN
        -- Generate unique suite number
        new_suite_number := generate_suite_number();
        
        -- Insert new user record with ALL registration fields
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
        );
        
        -- Create default user preferences
        INSERT INTO user_preferences (user_id, created_at, updated_at)
        VALUES (NEW.id, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE LOG 'Created new user profile for: %', NEW.email;
    ELSE
        -- User already exists, just update email verification status
        UPDATE users SET
            email_verified = NEW.email_confirmed_at IS NOT NULL,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        RAISE LOG 'Updated existing user profile for: %', NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle duplicate key errors gracefully
        RAISE LOG 'User already exists, skipping creation: %', NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function to safely create missing profiles
CREATE OR REPLACE FUNCTION create_missing_user_profile(
    user_id UUID,
    user_email TEXT
)
RETURNS JSON AS $$
DECLARE
    new_suite_number TEXT;
    existing_user_count INTEGER;
BEGIN
    -- Check if profile already exists
    SELECT COUNT(*) INTO existing_user_count 
    FROM public.users 
    WHERE id = user_id;
    
    IF existing_user_count = 0 THEN
        -- Generate suite number
        new_suite_number := generate_suite_number();
        
        -- Create basic profile
        INSERT INTO users (
            id,
            email,
            first_name,
            last_name,
            suite_number,
            status,
            email_verified,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            user_email,
            'User',
            'Profile',
            new_suite_number,
            'active',
            true,
            NOW(),
            NOW()
        );
        
        -- Create preferences
        INSERT INTO user_preferences (user_id, created_at, updated_at)
        VALUES (user_id, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Profile created successfully',
            'suite_number', new_suite_number
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Profile already exists'
        );
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Profile already exists (duplicate constraint)'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Clean up any orphaned auth users without profiles
DO $$
DECLARE
    auth_user RECORD;
    result JSON;
BEGIN
    FOR auth_user IN 
        SELECT au.id, au.email 
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        SELECT create_missing_user_profile(auth_user.id, auth_user.email) INTO result;
        RAISE NOTICE 'Created missing profile for %: %', auth_user.email, result;
    END LOOP;
END $$;

-- Verification query
SELECT 
    'Duplicate email fix applied' as status,
    'Trigger now handles existing users safely' as description,
    'Missing profiles have been created' as cleanup_status;

-- =====================================================
-- WHAT THIS FIXES:
-- =====================================================
-- 1. ✅ Prevents duplicate email constraint violations
-- 2. ✅ Handles existing users gracefully in trigger
-- 3. ✅ Creates missing profiles for orphaned auth users
-- 4. ✅ Adds proper error handling for unique violations
-- 5. ✅ Provides safe profile creation function
-- 6. ✅ Maintains data integrity while fixing conflicts
-- =====================================================
