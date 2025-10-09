-- ============================================================================
-- FIX CRYPTO EXTENSION ISSUE
-- ============================================================================
-- The gen_random_bytes() function requires pgcrypto extension
-- This script ensures the extension is enabled and search_path includes it
-- ============================================================================

-- STEP 1: Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- STEP 2: Update search_path for functions to include extensions schema
ALTER FUNCTION public.warehouse_package_intake(
    TEXT, TEXT, UUID, DECIMAL, DECIMAL, TEXT, TEXT, TEXT
) SET search_path = public, extensions;

ALTER FUNCTION public.warehouse_package_intake_enhanced(
    TEXT, TEXT, UUID, DECIMAL, DECIMAL, TEXT, TEXT, TEXT
) SET search_path = public, extensions;

ALTER FUNCTION public.generate_tracking_number() SET search_path = public, extensions;
ALTER FUNCTION public.generate_package_id() SET search_path = public, extensions;

-- Also fix generate_auth_code if it exists (this likely uses gen_random_bytes)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_auth_code') THEN
        ALTER FUNCTION public.generate_auth_code() SET search_path = public, extensions;
    END IF;
END $$;

-- Fix generate_secure_6digit_code if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_secure_6digit_code') THEN
        ALTER FUNCTION public.generate_secure_6digit_code() SET search_path = public, extensions;
    END IF;
END $$;

-- STEP 3: Verify pgcrypto is installed
SELECT 
    extname AS extension_name,
    extversion AS version,
    '✅ Installed' AS status
FROM pg_extension
WHERE extname = 'pgcrypto';

-- STEP 4: Verify functions have correct search_path
SELECT 
    p.proname AS function_name,
    CASE 
        WHEN proconfig IS NOT NULL THEN 
            (SELECT string_agg(config, ', ') 
             FROM unnest(proconfig) AS config 
             WHERE config LIKE 'search_path%')
        ELSE 'NOT SET'
    END AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('warehouse_package_intake', 'generate_auth_code', 'generate_tracking_number')
ORDER BY p.proname;

SELECT '✅ pgcrypto extension enabled!' AS status;
SELECT '✅ Functions updated with correct search_path!' AS message;
SELECT '🚀 Package intake should work now!' AS final_message;
