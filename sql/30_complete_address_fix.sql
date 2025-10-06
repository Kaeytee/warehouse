-- Complete Address Fields Fix - Run All Fixes Together
-- Combines RLS policies, address columns, and data verification
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. ADD ADDRESS COLUMNS IF MISSING
-- ============================================
DO $$
BEGIN
    -- Add street_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'street_address' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN street_address TEXT;
        RAISE NOTICE 'Added street_address column to users table';
    END IF;

    -- Add city column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'city' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to users table';
    END IF;

    -- Add country column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'country' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN country TEXT;
        RAISE NOTICE 'Added country column to users table';
    END IF;

    -- Add postal_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'postal_code' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN postal_code TEXT;
        RAISE NOTICE 'Added postal_code column to users table';
    END IF;
END $$;

-- ============================================
-- 2. FIX RLS POLICIES
-- ============================================
-- Temporarily disable RLS to fix policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies completely
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.users';
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Create simple, working policies for authenticated users
CREATE POLICY "authenticated_select_own" ON public.users
    FOR SELECT 
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "authenticated_insert_own" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "authenticated_update_own" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow service_role full access (for backend operations)
CREATE POLICY "service_role_full_access" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow anon users to INSERT (for signup trigger)
CREATE POLICY "anon_insert_signup" ON public.users
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. UPDATE EXISTING USERS WITH EMPTY ADDRESS DATA
-- ============================================
UPDATE public.users 
SET 
    street_address = COALESCE(street_address, ''),
    city = COALESCE(city, ''),
    country = COALESCE(country, ''),
    postal_code = COALESCE(postal_code, '')
WHERE 
    street_address IS NULL 
    OR city IS NULL 
    OR country IS NULL 
    OR postal_code IS NULL;

-- ============================================
-- 4. VERIFY CURRENT USER DATA
-- ============================================
SELECT 
    'CURRENT_USER_DATA' as status,
    id,
    email,
    first_name,
    last_name,
    phone_number,
    street_address,
    city,
    country,
    postal_code,
    suite_number
FROM public.users 
WHERE id = '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f';

-- ============================================
-- 5. VERIFY COLUMNS AND POLICIES
-- ============================================
SELECT 
    'COLUMNS_VERIFIED' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('phone_number', 'street_address', 'city', 'country', 'postal_code')
ORDER BY column_name;

SELECT 
    'POLICIES_VERIFIED' as status,
    policyname as policy_name,
    cmd as command_type
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
