-- ============================================================================
-- FIX FUNCTION SECURITY: SET SEARCH_PATH
-- ============================================================================
-- This script fixes all functions that have mutable search_path warnings
-- by automatically setting search_path = '' on ALL public schema functions
--
-- Author: Senior Software Engineer  
-- Date: 2025-10-08
-- ============================================================================

-- ============================================================================
-- AUTOMATIC FIX FOR ALL FUNCTIONS
-- ============================================================================
-- This dynamic script finds ALL functions and sets search_path automatically
-- Handles overloaded functions by using full signatures

DO $$
DECLARE
  func_record RECORD;
  func_signature TEXT;
BEGIN
  -- Loop through all functions in public schema
  FOR func_record IN 
    SELECT 
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arg_list,
      p.oid::regprocedure::text AS full_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- Only functions, not procedures
  LOOP
    -- Build the ALTER FUNCTION command with full signature
    func_signature := func_record.full_signature;
    
    BEGIN
      -- Execute ALTER FUNCTION with proper signature
      EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_signature);
      
      RAISE NOTICE 'Fixed: %', func_signature;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to fix %: %', func_signature, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Completed setting search_path for all functions';
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Check that all functions now have search_path set

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
    WHEN proconfig IS NOT NULL AND 
         EXISTS (SELECT 1 FROM unnest(proconfig) AS config WHERE config LIKE 'search_path%')
    THEN '✅'
    ELSE '❌'
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY 
  CASE WHEN proconfig IS NULL THEN 1 ELSE 0 END,  -- Show unfixed first
  function_name;
