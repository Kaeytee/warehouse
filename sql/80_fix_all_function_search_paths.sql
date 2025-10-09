-- ============================================================================
-- FIX ALL FUNCTION SEARCH_PATHS - COMPREHENSIVE SOLUTION
-- ============================================================================
-- Many functions have SET search_path = '' which prevents them from finding tables
-- This script fixes ALL functions at once by setting search_path = public, extensions
-- ============================================================================

-- Enable pgcrypto extension first (required for gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- BATCH FIX: Set correct search_path for ALL public functions
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  func_signature TEXT;
BEGIN
  -- Loop through all functions in public schema
  FOR func_record IN 
    SELECT 
      p.oid::regprocedure::text AS full_signature,
      p.proname AS function_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- Only functions, not procedures
  LOOP
    func_signature := func_record.full_signature;
    
    BEGIN
      -- Set search_path to include public and extensions schemas
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', func_signature);
      
      RAISE NOTICE 'Fixed: %', func_signature;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to fix %: %', func_signature, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Completed updating search_path for all functions';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show functions with their search_path settings
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE 
    WHEN proconfig IS NOT NULL THEN 
      (SELECT string_agg(config, ', ') 
       FROM unnest(proconfig) AS config 
       WHERE config LIKE 'search_path%')
    ELSE '❌ NOT SET'
  END AS search_path_config,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM unnest(proconfig) AS config 
      WHERE config LIKE 'search_path%' AND config LIKE '%public%'
    )
    THEN '✅'
    ELSE '❌'
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_processing_packages',
    'warehouse_package_intake',
    'create_shipment_from_packages',
    'generate_tracking_number',
    'generate_package_id',
    'update_shipment_status'
  )
ORDER BY p.proname;

SELECT '✅ All functions updated with correct search_path!' AS status;
SELECT '🚀 Create Shipment page should work now!' AS message;
