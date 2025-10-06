-- Fix Existing User Names from Auth Metadata
-- Updates users who have incorrect default names with actual registration data
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Drop and recreate the handle_new_user function with correct defaults
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_suite_number TEXT;
BEGIN
    -- Generate suite number for new user
    new_suite_number := generate_suite_number();
    
    -- Insert user profile with suite number using empty strings as defaults
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
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', public.users.first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', public.users.last_name),
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users who have default 'User' and 'Name' values
-- Pull actual names from auth.users metadata
UPDATE public.users 
SET 
    first_name = COALESCE(
        (SELECT raw_user_meta_data->>'first_name' 
         FROM auth.users 
         WHERE auth.users.id = public.users.id), 
        first_name
    ),
    last_name = COALESCE(
        (SELECT raw_user_meta_data->>'last_name' 
         FROM auth.users 
         WHERE auth.users.id = public.users.id), 
        last_name
    ),
    phone_number = COALESCE(
        (SELECT raw_user_meta_data->>'phone' 
         FROM auth.users 
         WHERE auth.users.id = public.users.id), 
        phone_number
    ),
    updated_at = NOW()
WHERE 
    -- Update users with default or empty names
    (first_name IN ('User', '') OR first_name IS NULL)
    OR (last_name IN ('Name', '') OR last_name IS NULL)
    OR phone_number IS NULL;

-- Log the update results
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % user profiles with correct names from metadata', updated_count;
END $$;
