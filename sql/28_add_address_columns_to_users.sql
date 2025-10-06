-- Add Address Columns to Users Table
-- Ensures address fields exist for loading signup data
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. ADD ADDRESS COLUMNS IF THEY DON'T EXIST
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
-- 2. UPDATE EXISTING USERS WITH DEFAULT ADDRESS DATA
-- ============================================
-- Set default values for existing users who don't have address data
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
-- 3. VERIFY COLUMNS EXIST
-- ============================================
SELECT 
    'COLUMN_CHECK' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('street_address', 'city', 'country', 'postal_code', 'phone_number')
ORDER BY column_name;
