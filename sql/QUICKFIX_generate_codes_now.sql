-- ============================================================================
-- QUICK FIX: Generate Delivery Codes for Existing Arrived Packages
-- Run this NOW in Supabase SQL Editor to immediately generate codes
-- ============================================================================

DO $$
DECLARE
    package_rec RECORD;
    auth_code TEXT;
    codes_generated INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GENERATING DELIVERY CODES...';
    RAISE NOTICE '========================================';
    
    -- Get all arrived packages without codes
    FOR package_rec IN
        SELECT 
            p.id,
            p.package_id,
            p.tracking_number,
            p.user_id,
            p.status,
            u.first_name,
            u.last_name,
            u.suite_number
        FROM packages p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'arrived'
        AND (p.delivery_auth_code IS NULL OR p.delivery_auth_code = '')
        ORDER BY p.created_at DESC
    LOOP
        -- Generate unique 6-digit code for this package
        auth_code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
        
        -- Update package with code
        UPDATE packages
        SET 
            delivery_auth_code = auth_code,
            auth_code_generated_at = NOW(),
            updated_at = NOW()
        WHERE id = package_rec.id;
        
        codes_generated := codes_generated + 1;
        
        -- Log each code generation
        RAISE NOTICE '[%] Package: % | Code: % | Customer: % % (Suite: %)',
            codes_generated,
            package_rec.package_id,
            auth_code,
            package_rec.first_name,
            package_rec.last_name,
            package_rec.suite_number;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUCCESS!';
    RAISE NOTICE 'Generated % delivery codes', codes_generated;
    RAISE NOTICE '========================================';
    
    -- Show summary
    IF codes_generated = 0 THEN
        RAISE NOTICE 'ℹ️ No packages needed codes (all already have codes or none are arrived)';
    ELSE
        RAISE NOTICE 'Next step: Refresh the Delivery page in your browser';
    END IF;
END $$;

-- Verify codes were generated
SELECT 
    p.package_id,
    p.tracking_number,
    p.delivery_auth_code as code,
    p.auth_code_generated_at,
    u.suite_number,
    u.first_name || ' ' || u.last_name as customer
FROM packages p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'arrived'
AND p.delivery_auth_code IS NOT NULL
ORDER BY p.auth_code_generated_at DESC;
