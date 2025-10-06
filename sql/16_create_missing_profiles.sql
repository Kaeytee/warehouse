-- Create Missing User Profiles from Auth Data
-- Manually creates profiles for users where the trigger failed
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- First, let's create your specific missing profile
INSERT INTO public.users (
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
) 
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'last_name',
    au.raw_user_meta_data->>'phone',
    generate_suite_number(),
    'client',
    'active',
    au.email_confirmed_at IS NOT NULL,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL  -- Only insert missing profiles
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone_number = EXCLUDED.phone_number,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- Create default user preferences for users who don't have them
INSERT INTO user_preferences (user_id, created_at, updated_at)
SELECT 
    pu.id,
    NOW(),
    NOW()
FROM public.users pu
LEFT JOIN user_preferences up ON pu.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify the fix worked - show updated user data
SELECT 
    'Fixed User Profile' as status,
    id,
    email,
    first_name,
    last_name,
    phone_number,
    suite_number,
    role,
    status,
    email_verified
FROM public.users 
WHERE email IN ('austinbediako4@gmail.com', 'austinbediako5@gmail.com')
ORDER BY created_at DESC;
