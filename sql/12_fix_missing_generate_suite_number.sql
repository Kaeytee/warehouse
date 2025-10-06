-- Fix Missing generate_suite_number Function
-- Ensures generate_suite_number exists for user registration trigger
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Create generate_suite_number function with proper security
CREATE OR REPLACE FUNCTION generate_suite_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_suite_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate suite number in format S001, S002, etc.
        new_suite_number := 'S' || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this suite number already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.users WHERE suite_number = new_suite_number
        ) THEN
            RETURN new_suite_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RAISE EXCEPTION 'Unable to generate unique suite number';
        END IF;
    END LOOP;
END;
$$;

-- Recreate handle_new_user function with proper security
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
    
    -- Insert user profile with suite number
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
