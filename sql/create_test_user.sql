-- Create test warehouse user
-- Run this in your Supabase SQL Editor

-- First, create the auth user (this creates the user in auth.users)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'austinbediako4@gmail.com',
    crypt('your_password_here', gen_salt('bf')), -- Replace 'your_password_here' with actual password
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Then create the user profile with warehouse role
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    suite_number,
    status,
    email_verified,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'austinbediako4@gmail.com'),
    'austinbediako4@gmail.com',
    'Austin',
    'Bediako',
    'warehouse_admin', -- or 'admin' for full admin access
    'VC-001',
    'active',
    true,
    NOW(),
    NOW()
);
