-- Verify Profile Creation and Check Data
-- Confirms the profile was created and shows current state
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Check if your profile was actually created
SELECT 
    'Profile Status' as check_type,
    id,
    email,
    first_name,
    last_name,
    phone_number,
    suite_number,
    role,
    status,
    email_verified,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'austinbediako4@gmail.com';

-- Check what the frontend getUserProfile query would return
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone_number,
    role,
    status,
    suite_number,
    us_shipping_address_id,
    street_address,
    city,
    country,
    postal_code,
    avatar_url
FROM public.users
WHERE id = '5309050f-b6b1-424a-9633-397478ff9ed2';

-- Force update the profile to ensure it's there
UPDATE public.users 
SET 
    first_name = 'Austin',
    last_name = 'Bediako',
    phone_number = '+233534544454',
    updated_at = NOW()
WHERE id = '5309050f-b6b1-424a-9633-397478ff9ed2';

-- Verify the update worked
SELECT 
    'After Update' as status,
    id,
    email,
    first_name,
    last_name,
    phone_number,
    suite_number,
    updated_at
FROM public.users 
WHERE id = '5309050f-b6b1-424a-9633-397478ff9ed2';
