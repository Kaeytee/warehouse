-- Fix Infinite Recursion in RLS Policies
-- Completely removes and recreates RLS policies to eliminate recursion
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Disable RLS temporarily to fix the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

-- Create your profile first WITHOUT RLS enabled
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

-- Create simple, non-recursive RLS policies
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT 
    USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT 
    WITH CHECK (id = auth.uid());

-- Allow service role full access (for triggers and functions)
CREATE POLICY "service_role_all" ON public.users
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Fix notifications table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Add read_status column if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_status') THEN
            ALTER TABLE public.notifications ADD COLUMN read_status BOOLEAN DEFAULT false;
            -- Update existing records
            UPDATE public.notifications SET read_status = false WHERE read_status IS NULL;
        END IF;
    END IF;
END $$;

-- Verify profile creation
SELECT 
    'Profile Fixed' as status,
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
WHERE id = '5309050f-b6b1-424a-9633-397478ff9ed2';
