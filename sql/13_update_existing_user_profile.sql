-- Update Existing User Profile with Proper Names
-- Fixes users who already registered with 'User Name' defaults
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- First, let's check if there are users with default 'User' and 'Name' values
-- and update them with their actual metadata if available

-- Update users who have 'User' as first_name but have proper metadata
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
    updated_at = NOW()
WHERE 
    (first_name = 'User' OR first_name = '' OR first_name IS NULL)
    OR (last_name = 'Name' OR last_name = '' OR last_name IS NULL);

-- Also ensure phone_number is properly mapped from metadata
UPDATE public.users 
SET 
    phone_number = COALESCE(
        (SELECT raw_user_meta_data->>'phone' 
         FROM auth.users 
         WHERE auth.users.id = public.users.id), 
        phone_number
    ),
    updated_at = NOW()
WHERE 
    phone_number IS NULL 
    AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = public.users.id 
        AND raw_user_meta_data->>'phone' IS NOT NULL
    );
