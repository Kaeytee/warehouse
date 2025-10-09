-- ============================================================================
-- DEBUG DELIVERY CODE SYSTEM
-- ============================================================================
-- This script helps you understand why delivery codes aren't showing
-- ============================================================================

-- STEP 1: Check if trigger and functions exist
SELECT 
    '🔍 STEP 1: System Components' AS section,
    '' AS spacer;

SELECT 
    'Trigger' AS component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_delivery_codes')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run 62_delivery_auth_code_system.sql'
    END AS status;

SELECT 
    'Functions' AS component,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('generate_delivery_codes_on_arrival', 'get_customer_delivery_codes', 'generate_auth_code')) = 3
        THEN '✅ ALL 3 EXIST'
        ELSE '❌ SOME MISSING'
    END AS status;

-- STEP 2: Fix search_path for all delivery code functions
ALTER FUNCTION public.generate_auth_code() SET search_path = public, extensions;
ALTER FUNCTION public.generate_delivery_codes_on_arrival() SET search_path = public, extensions;
ALTER FUNCTION public.verify_delivery_code(UUID, TEXT, TEXT, UUID) SET search_path = public, extensions;
ALTER FUNCTION public.get_customer_delivery_codes(UUID) SET search_path = public, extensions;

SELECT '✅ Fixed search_path for delivery code functions' AS status;

-- STEP 3: Check shipments and their status
SELECT 
    '🔍 STEP 2: Shipments Status' AS section,
    '' AS spacer;

SELECT 
    s.tracking_number AS shipment,
    s.status AS current_status,
    s.created_at,
    COUNT(p.id) AS total_packages,
    COUNT(p.delivery_auth_code) AS packages_with_codes,
    CASE 
        WHEN s.status = 'arrived' THEN '✅ Should have codes'
        WHEN s.status = 'processing' THEN '⚠️ Not arrived yet - NO codes'
        WHEN s.status = 'in_transit' THEN '⚠️ Not arrived yet - NO codes'
        ELSE '❓ Unknown status'
    END AS explanation
FROM shipments s
LEFT JOIN packages p ON p.linked_to_shipment_id = s.id
GROUP BY s.id, s.tracking_number, s.status, s.created_at
ORDER BY s.created_at DESC
LIMIT 10;

-- STEP 4: Check packages without codes that should have them
SELECT 
    '🔍 STEP 3: Packages Status' AS section,
    '' AS spacer;

SELECT 
    p.package_id,
    p.tracking_number,
    p.status AS package_status,
    p.delivery_auth_code AS code,
    s.tracking_number AS shipment,
    s.status AS shipment_status,
    u.suite_number,
    u.first_name || ' ' || u.last_name AS customer,
    CASE 
        WHEN p.delivery_auth_code IS NOT NULL THEN '✅ HAS CODE'
        WHEN s.status = 'arrived' THEN '❌ SHOULD HAVE CODE BUT MISSING'
        ELSE '⚠️ Shipment not arrived yet'
    END AS code_status
FROM packages p
LEFT JOIN shipments s ON p.linked_to_shipment_id = s.id
LEFT JOIN users u ON p.user_id = u.id
WHERE p.status IN ('received', 'processing', 'arrived')
  AND p.linked_to_shipment_id IS NOT NULL
ORDER BY s.created_at DESC, p.created_at DESC
LIMIT 20;

-- STEP 5: Manual trigger test (if needed)
SELECT 
    '🔍 STEP 4: Fix Missing Codes' AS section,
    '' AS spacer;

-- If you have shipments with status='arrived' but packages have no codes,
-- this will generate them manually
DO $$
DECLARE
    shipment_rec RECORD;
    package_rec RECORD;
    auth_code TEXT;
    codes_generated INTEGER := 0;
BEGIN
    -- Find arrived shipments with packages missing codes
    FOR shipment_rec IN
        SELECT DISTINCT s.id, s.tracking_number
        FROM shipments s
        JOIN packages p ON p.linked_to_shipment_id = s.id
        WHERE s.status = 'arrived'
        AND p.delivery_auth_code IS NULL
        AND p.status != 'delivered'
    LOOP
        RAISE NOTICE '🔧 Fixing shipment: %', shipment_rec.tracking_number;
        
        -- Generate codes for all packages in this shipment
        FOR package_rec IN
            SELECT p.id, p.package_id, u.suite_number
            FROM packages p
            JOIN users u ON p.user_id = u.id
            WHERE p.linked_to_shipment_id = shipment_rec.id
            AND p.delivery_auth_code IS NULL
            AND p.status != 'delivered'
        LOOP
            -- Generate unique code
            auth_code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
            
            -- Update package
            UPDATE packages
            SET 
                delivery_auth_code = auth_code,
                auth_code_generated_at = NOW(),
                status = 'arrived',
                updated_at = NOW()
            WHERE id = package_rec.id;
            
            codes_generated := codes_generated + 1;
            RAISE NOTICE '  ✅ Generated code % for package % (Suite: %)', 
                auth_code, package_rec.package_id, package_rec.suite_number;
        END LOOP;
    END LOOP;
    
    IF codes_generated > 0 THEN
        RAISE NOTICE '✅ Generated % delivery codes', codes_generated;
    ELSE
        RAISE NOTICE 'ℹ️ No missing codes found - all good!';
    END IF;
END $$;

-- STEP 6: Final verification - show recent codes
SELECT 
    '🔍 STEP 5: Recent Delivery Codes' AS section,
    '' AS spacer;

SELECT 
    p.package_id,
    p.delivery_auth_code AS code,
    u.suite_number,
    u.first_name || ' ' || u.last_name AS customer,
    s.tracking_number AS shipment,
    p.auth_code_generated_at,
    '✅' AS status
FROM packages p
JOIN users u ON p.user_id = u.id
LEFT JOIN shipments s ON p.linked_to_shipment_id = s.id
WHERE p.delivery_auth_code IS NOT NULL
AND p.auth_code_used_at IS NULL
AND p.status = 'arrived'
ORDER BY p.auth_code_generated_at DESC
LIMIT 20;

SELECT '🚀 SUMMARY' AS section;
SELECT 
    COUNT(*) AS total_codes_available,
    'Delivery codes ready for pickup' AS description
FROM packages
WHERE delivery_auth_code IS NOT NULL
AND auth_code_used_at IS NULL
AND status = 'arrived';
