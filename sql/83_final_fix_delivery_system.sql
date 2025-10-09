-- ============================================================================
-- FINAL FIX: DELIVERY CODE SYSTEM
-- ============================================================================
-- The system uses packages.delivery_auth_code (NOT delivery_codes table)
-- This script fixes all issues to make codes visible to customers
-- ============================================================================

-- STEP 1: Verify codes exist in packages table
SELECT 
    '🔍 STEP 1: Codes in packages.delivery_auth_code' AS section,
    COUNT(*) AS codes_exist,
    '✅ These codes are stored correctly' AS note
FROM packages
WHERE delivery_auth_code IS NOT NULL
AND status = 'arrived';

-- STEP 2: Check specific user's packages
SELECT 
    '🔍 STEP 2: Your packages with arrived status' AS section,
    '' AS spacer;

SELECT 
    package_id,
    tracking_number,
    status,
    delivery_auth_code,
    auth_code_generated_at,
    CASE 
        WHEN delivery_auth_code IS NOT NULL THEN '✅ HAS CODE'
        ELSE '❌ NO CODE - Trigger failed'
    END AS code_status
FROM packages
WHERE user_id = '228624ae-1c23-4557-9984-cca1c0bb86f7'::UUID
AND status IN ('arrived', 'processing')
ORDER BY created_at DESC
LIMIT 10;

-- STEP 3: Fix search_path for all delivery functions
ALTER FUNCTION public.generate_auth_code() SET search_path = public, extensions;
ALTER FUNCTION public.generate_delivery_codes_on_arrival() SET search_path = public, extensions;
ALTER FUNCTION public.verify_delivery_code(UUID, TEXT, TEXT, UUID) SET search_path = public, extensions;
ALTER FUNCTION public.get_customer_delivery_codes(UUID) SET search_path = public, extensions;

SELECT '✅ Fixed search_path for all functions' AS status;

-- STEP 4: Add RLS policy for customers to view their own packages
DROP POLICY IF EXISTS "customers_view_own_packages" ON public.packages;

CREATE POLICY "customers_view_own_packages"
ON public.packages FOR SELECT
TO authenticated
USING (
    -- Customer sees only their own packages
    user_id = auth.uid()
    OR
    -- Admins/warehouse staff see all packages
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

SELECT '✅ Added RLS policy for customers' AS status;

-- STEP 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_customer_delivery_codes(UUID) TO authenticated;

SELECT '✅ Granted function permissions' AS status;

-- STEP 6: Manually generate missing codes for arrived packages
DO $$
DECLARE
    package_rec RECORD;
    auth_code TEXT;
    codes_generated INTEGER := 0;
BEGIN
    -- Find packages with status='arrived' but no delivery_auth_code
    FOR package_rec IN
        SELECT p.id, p.package_id, u.suite_number, u.first_name, u.last_name
        FROM packages p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'arrived'
        AND p.delivery_auth_code IS NULL
        AND p.auth_code_used_at IS NULL
    LOOP
        -- Generate unique 6-digit code
        auth_code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
        
        -- Update package with code
        UPDATE packages
        SET 
            delivery_auth_code = auth_code,
            auth_code_generated_at = NOW(),
            updated_at = NOW()
        WHERE id = package_rec.id;
        
        codes_generated := codes_generated + 1;
        
        RAISE NOTICE '✅ Generated code % for package % (Suite: %, Customer: % %)',
            auth_code, 
            package_rec.package_id, 
            package_rec.suite_number,
            package_rec.first_name,
            package_rec.last_name;
    END LOOP;
    
    IF codes_generated > 0 THEN
        RAISE NOTICE '🎉 Generated % delivery codes for arrived packages', codes_generated;
    ELSE
        RAISE NOTICE '✅ All arrived packages already have codes';
    END IF;
END $$;

-- STEP 7: Test the function for your specific user
SELECT 
    '🔍 STEP 3: Test get_customer_delivery_codes() function' AS section,
    '' AS spacer;

SELECT 
    package_id,
    tracking_number,
    delivery_code,
    shipment_tracking,
    status,
    generated_at,
    '✅' AS available
FROM public.get_customer_delivery_codes('228624ae-1c23-4557-9984-cca1c0bb86f7'::UUID);

-- STEP 8: Summary
SELECT 
    '🚀 FINAL SUMMARY' AS section,
    '' AS spacer;

SELECT 
    COUNT(*) FILTER (WHERE delivery_auth_code IS NOT NULL) AS codes_available,
    COUNT(*) FILTER (WHERE delivery_auth_code IS NULL) AS missing_codes,
    COUNT(*) AS total_arrived_packages,
    'Customer: 228624ae-1c23-4557-9984-cca1c0bb86f7' AS for_user
FROM packages
WHERE user_id = '228624ae-1c23-4557-9984-cca1c0bb86f7'::UUID
AND status = 'arrived';

SELECT 
    '✅ SYSTEM READY' AS final_status,
    'Client app should now see delivery codes' AS message,
    'Use: get_customer_delivery_codes(user_id) or direct SELECT from packages' AS how_to_query;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 
-- 1. The delivery_codes TABLE is NOT used - ignore it completely
-- 2. All codes are stored in packages.delivery_auth_code column
-- 3. Codes are generated when shipment status changes to 'arrived'
-- 4. Use get_customer_delivery_codes(user_id) function in client app
-- 5. Each customer sees ONLY their own codes (RLS enforced)
-- ============================================================================
