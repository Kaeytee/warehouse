-- Fix Missing Database Columns and RLS Policy Issues
-- Adds missing columns and fixes infinite recursion in RLS policies
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Add missing us_shipping_address_id column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS us_shipping_address_id INTEGER;

-- Add missing read_status column to notifications table (if it exists)
DO $$
BEGIN
    -- Check if notifications table exists first
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Add read_status column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_status') THEN
            ALTER TABLE public.notifications ADD COLUMN read_status BOOLEAN DEFAULT false;
        END IF;
    END IF;
END $$;

-- Fix infinite recursion in users RLS policy by dropping and recreating
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create simple, non-recursive RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS for profile creation
CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create your profile directly (bypass any trigger issues)
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
) VALUES (
    '5309050f-b6b1-424a-9633-397478ff9ed2',
    'austinbediako4@gmail.com',
    'Austin',
    'Bediako',
    '+233534544454',
    'S001',
    'client',
    'active',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone_number = EXCLUDED.phone_number,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- Verify the profile was created
SELECT 
    'Profile Created Successfully' as status,
    id,
    email,
    first_name,
    last_name,
    phone_number,
    suite_number,
    role,
    status
FROM public.users 
WHERE id = '5309050f-b6b1-424a-9633-397478ff9ed2';
