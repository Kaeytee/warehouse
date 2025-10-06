-- =====================================================
-- STANDARDIZE SUITE NUMBERS TO VC-XXX FORMAT
-- =====================================================
-- Fix duplicate suite number generation systems
-- Standardize all users to VC-XXX format with sequential numbering
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-01-04
-- =====================================================

-- Step 1: Update any existing S-format suite numbers to VC-format
-- This will convert S001 -> VC-001, S002 -> VC-002, etc.
UPDATE users 
SET suite_number = 'VC-' || LPAD(SUBSTRING(suite_number FROM '[0-9]+')::TEXT, 3, '0'),
    updated_at = NOW()
WHERE suite_number ~ '^S[0-9]+$';

-- Step 2: Create/Replace the generate_suite_number function with VC-XXX format
CREATE OR REPLACE FUNCTION generate_suite_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_suite_number TEXT;
    counter INTEGER := 1;
    max_existing_number INTEGER := 0;
BEGIN
    -- Find the highest existing VC number to continue sequence
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(suite_number FROM 'VC-([0-9]+)') AS INTEGER)), 
        0
    ) INTO max_existing_number
    FROM public.users 
    WHERE suite_number ~ '^VC-[0-9]+$';
    
    -- Start counter from next available number
    counter := max_existing_number + 1;
    
    LOOP
        -- Generate suite number in format VC-001, VC-002, etc.
        new_suite_number := 'VC-' || LPAD(counter::TEXT, 3, '0');
        
        -- Double-check if this suite number already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.users WHERE suite_number = new_suite_number
        ) THEN
            RETURN new_suite_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique suite number - reached maximum limit';
        END IF;
    END LOOP;
END;
$$;

-- Step 3: Update handle_new_user function to use the standardized function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_suite_number TEXT;
BEGIN
    -- Generate unique VC-XXX suite number
    new_suite_number := generate_suite_number();
    
    -- Insert user profile with VC-format suite number
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
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        new_suite_number,
        'client',
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 4: Ensure trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_suite_number() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Step 6: Verification - Show current suite numbers after standardization
DO $$
BEGIN
    RAISE NOTICE '=== SUITE NUMBER STANDARDIZATION COMPLETE ===';
    RAISE NOTICE 'Current suite numbers in system:';
END $$;

-- Display current suite numbers for verification
SELECT 
    suite_number,
    first_name,
    last_name,
    email,
    role,
    created_at
FROM users 
ORDER BY 
    CASE 
        WHEN suite_number ~ '^VC-[0-9]+$' THEN 
            CAST(SUBSTRING(suite_number FROM 'VC-([0-9]+)') AS INTEGER)
        ELSE 9999 
    END,
    suite_number;

-- Step 7: Test the function to show next available number
SELECT 
    'Next available suite number: ' || generate_suite_number() as test_result;

-- =====================================================
-- SUMMARY OF CHANGES:
-- =====================================================
-- ✅ Converted any S-format numbers to VC-format
-- ✅ Updated generate_suite_number() to use VC-XXX format
-- ✅ Function now finds highest existing number and continues sequence
-- ✅ No more duplicate/conflicting suite number formats
-- ✅ All new users will get sequential VC-XXX numbers
-- ✅ Existing VC numbers are preserved and sequence continues from there
-- =====================================================
