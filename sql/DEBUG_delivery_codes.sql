-- ============================================================================
-- DELIVERY CODE SYSTEM DEBUGGING SCRIPT
-- Run these queries in Supabase SQL Editor to diagnose issues
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK IF TRIGGER EXISTS
-- ============================================================================
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_delivery_codes';

-- Expected: 1 row showing trigger on 'shipments' table
-- If empty: Trigger not installed - run 62_delivery_auth_code_system.sql

-- ============================================================================
-- STEP 2: CHECK IF FUNCTIONS EXIST
-- ============================================================================
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN (
    'generate_delivery_codes_on_arrival',
    'verify_delivery_code',
    'get_customer_delivery_codes',
    'generate_auth_code'
)
ORDER BY proname;

-- Expected: 4 rows
-- If less than 4: Functions missing - run 62_delivery_auth_code_system.sql

-- ============================================================================
-- STEP 3: CHECK PACKAGES WITHOUT CODES
-- ============================================================================
SELECT 
    p.id,
    p.package_id,
    p.tracking_number,
    p.status,
    p.delivery_auth_code,
    p.auth_code_generated_at,
    p.linked_to_shipment_id,
    s.tracking_number as shipment_tracking,
    s.status as shipment_status,
    u.suite_number,
    u.first_name || ' ' || u.last_name as customer_name
FROM packages p
LEFT JOIN shipments s ON p.linked_to_shipment_id = s.id
LEFT JOIN users u ON p.user_id = u.id
WHERE p.status = 'arrived'
ORDER BY p.created_at DESC
LIMIT 20;

-- Look for:
-- - delivery_auth_code: Should be 6 digits, if NULL = no code generated
-- - status: Should be 'arrived'
-- - shipment_status: Parent shipment should also be 'arrived'

-- ============================================================================
-- STEP 4: CHECK SPECIFIC PACKAGES FROM SCREENSHOT
-- ============================================================================
SELECT 
    p.package_id,
    p.status,
    p.delivery_auth_code,
    p.auth_code_generated_at,
    s.tracking_number as shipment_tracking,
    s.status as shipment_status
FROM packages p
LEFT JOIN shipments s ON p.linked_to_shipment_id = s.id
WHERE p.package_id IN ('PKG251007PDWXLW', 'PKG251007QRGLUQ');

-- These are the packages visible in your screenshot with "NO CODE"

-- ============================================================================
-- STEP 5: CHECK SHIPMENT STATUS
-- ============================================================================
SELECT 
    id,
    tracking_number,
    status,
    total_packages,
    created_at,
    updated_at
FROM shipments
WHERE status IN ('arrived', 'in_transit')
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 6: CHECK IF TRIGGER IS ENABLED
-- ============================================================================
SELECT 
    tgname as trigger_name,
    tgenabled as is_enabled,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'trigger_generate_delivery_codes';

-- tgenabled should be 'O' (enabled)

-- ============================================================================
-- STEP 7: MANUAL CODE GENERATION (IF TRIGGER MISSING)
-- ============================================================================
-- If trigger doesn't exist, run this to manually generate codes for arrived packages

DO $$
DECLARE
    package_rec RECORD;
    auth_code TEXT;
    codes_generated INTEGER := 0;
BEGIN
    -- Get all arrived packages without codes
    FOR package_rec IN
        SELECT 
            p.id,
            p.package_id,
            p.user_id,
            u.first_name,
            u.last_name,
            u.suite_number
        FROM packages p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'arrived'
        AND p.delivery_auth_code IS NULL
    LOOP
        -- Generate unique 6-digit code
        auth_code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
        
        -- Update package
        UPDATE packages
        SET 
            delivery_auth_code = auth_code,
            auth_code_generated_at = NOW(),
            updated_at = NOW()
        WHERE id = package_rec.id;
        
        codes_generated := codes_generated + 1;
        
        RAISE NOTICE 'Generated code % for package % (Customer: % %, Suite: %)',
            auth_code,
            package_rec.package_id,
            package_rec.first_name,
            package_rec.last_name,
            package_rec.suite_number;
    END LOOP;
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'MANUAL CODE GENERATION COMPLETE';
    RAISE NOTICE 'Total codes generated: %', codes_generated;
    RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- STEP 8: VERIFY CODES WERE GENERATED
-- ============================================================================
SELECT 
    COUNT(*) as total_arrived_packages,
    COUNT(delivery_auth_code) as packages_with_codes,
    COUNT(*) - COUNT(delivery_auth_code) as packages_without_codes
FROM packages
WHERE status = 'arrived';

-- Expected: packages_without_codes should be 0

-- ============================================================================
-- STEP 9: LIST ALL PACKAGES WITH CODES
-- ============================================================================
SELECT 
    p.package_id,
    p.tracking_number,
    p.delivery_auth_code,
    p.auth_code_generated_at,
    u.suite_number,
    u.first_name || ' ' || u.last_name as customer_name
FROM packages p
JOIN users u ON p.user_id = u.SELECT 
    tgname as trigger_name,
    tgenabled as is_enabled,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'trigger_generate_delivery_codes';
WHERE p.status = 'arrived'
AND p.delivery_auth_code IS NOT NULL
ORDER BY p.auth_code_generated_at DESC;

-- This should show all packages with codes

-- ============================================================================
-- STEP 10: TEST TRIGGER MANUALLY
-- ============================================================================
-- Pick a shipment and change status to test trigger

-- First, check current status
SELECT id, tracking_number, status FROM shipments LIMIT 1;

-- Then toggle status to trigger the function
-- Replace <shipment_id> with actual ID from above query
-- UPDATE shipments SET status = 'in_transit' WHERE id = '<shipment_id>';
-- UPDATE shipments SET status = 'arrived' WHERE id = '<shipment_id>';

-- Then check if codes were generated
-- SELECT package_id, delivery_auth_code FROM packages WHERE linked_to_shipment_id = '<shipment_id>';

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================
SELECT 
    'Trigger Installed' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_generate_delivery_codes')
        THEN '✅ YES'
        ELSE '❌ NO - Run 62_delivery_auth_code_system.sql'
    END as status
UNION ALL
SELECT 
    'Functions Installed',
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('generate_delivery_codes_on_arrival', 'verify_delivery_code', 'get_customer_delivery_codes', 'generate_auth_code')) = 4
        THEN '✅ YES'
        ELSE '❌ NO - Run 62_delivery_auth_code_system.sql'
    END
UNION ALL
SELECT 
    'Arrived Packages',
    CASE 
        WHEN (SELECT COUNT(*) FROM packages WHERE status = 'arrived') > 0
        THEN '✅ ' || (SELECT COUNT(*)::TEXT FROM packages WHERE status = 'arrived') || ' packages'
        ELSE '❌ No packages with arrived status'
    END
UNION ALL
SELECT 
    'Packages with Codes',
    CASE 
        WHEN (SELECT COUNT(*) FROM packages WHERE status = 'arrived' AND delivery_auth_code IS NOT NULL) > 0
        THEN '✅ ' || (SELECT COUNT(*)::TEXT FROM packages WHERE status = 'arrived' AND delivery_auth_code IS NOT NULL) || ' packages have codes'
        ELSE '❌ No codes generated - Run STEP 7 above'
    END;

-- ============================================================================
-- NEXT STEPS BASED ON RESULTS
-- ============================================================================
/*
IF TRIGGER NOT INSTALLED:
1. Run: /sql/62_delivery_auth_code_system.sql in Supabase SQL Editor
2. Verify: Re-run STEP 1 above

IF TRIGGER INSTALLED BUT NO CODES:
1. Run: STEP 7 (Manual Code Generation) above
2. OR: Toggle a shipment status to trigger code generation

IF CODES EXIST BUT DELIVERY PAGE SHOWS NOTHING:
1. Check browser console for errors
2. Verify RLS policies allow reading delivery_auth_code
3. Check user authentication

IF STILL NOT WORKING:
1. Share output of STEP 3, STEP 5, and Diagnostic Summary
2. Check browser console logs
*/
