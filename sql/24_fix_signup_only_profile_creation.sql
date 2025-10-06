-- Fix Profile Creation - Only on Signup, Not Login
-- Creates profiles automatically during signup but prevents recursion on login
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. DROP EXISTING PROBLEMATIC FUNCTION AND TRIGGER
-- ============================================
DO $$
BEGIN
    -- Drop existing trigger if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        DROP TRIGGER on_auth_user_created ON auth.users;
        RAISE NOTICE 'Dropped existing trigger: on_auth_user_created';
    END IF;
END $$;

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- 2. CREATE IMPROVED HANDLE_NEW_USER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_suite_number TEXT;
    profile_exists BOOLEAN := FALSE;
BEGIN
    -- Only proceed if this is a new user creation (not an update)
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Check if profile already exists (prevent duplicate creation)
    SELECT EXISTS(
        SELECT 1 FROM public.users WHERE id = NEW.id
    ) INTO profile_exists;
    
    -- If profile already exists, don't create another one
    IF profile_exists THEN
        RAISE LOG 'Profile already exists for user %, skipping creation', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Generate unique suite number
    BEGIN
        new_suite_number := generate_suite_number();
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error generating suite number: %', SQLERRM;
            RETURN NEW;
    END;
    
    -- Create user profile with proper error handling
    BEGIN
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
        );
        
        RAISE LOG 'Successfully created profile for user % with suite %', NEW.email, new_suite_number;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- If profile already exists due to race condition, that's fine
            RAISE LOG 'Profile creation skipped for % - already exists', NEW.email;
        WHEN OTHERS THEN
            -- Log error but don't fail the auth process
            RAISE LOG 'Error creating profile for %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- ============================================
-- 3. CREATE TRIGGER ONLY FOR NEW USER SIGNUPS
-- ============================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. FIX RLS POLICIES TO PREVENT RECURSION AND 403 ERRORS
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
-- 5. VERIFY SETUP
-- ============================================
SELECT 
    'TRIGGER_STATUS' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 
    'POLICY_STATUS' as check_type,
    policyname as policy_name,
    cmd as command_type
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
