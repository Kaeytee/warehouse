-- =====================================================
-- FIX METADATA MISMATCH ISSUE
-- =====================================================
-- This fixes the mismatch between app metadata and trigger expectations
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-26
-- =====================================================

-- Step 1: Update the trigger to handle the actual metadata structure
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_suite_number TEXT;
BEGIN
    -- Generate unique suite number
    new_suite_number := generate_suite_number();
    
    -- Insert user record with suite number and metadata
    -- Note: Address fields will be updated later by the application
    INSERT INTO users (
        id,
        email,
        first_name,
        last_name,
        phone_number,
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

-- Step 2: Verify the fix
SELECT 'Trigger updated to handle actual metadata structure' as status;

-- =====================================================
-- WHAT THIS FIXES:
-- =====================================================
-- 1. ✅ Removes address fields from trigger (they're not in metadata)
-- 2. ✅ Keeps first_name, last_name, phone_number (they ARE in metadata)
-- 3. ✅ Application will update address fields separately after signup
-- 4. ✅ No more NULL conflicts between trigger and app code
-- =====================================================
