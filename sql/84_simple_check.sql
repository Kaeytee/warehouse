-- ============================================================================
-- SIMPLE CHECK: Show me the delivery codes that exist
-- ============================================================================

-- Replace this UUID with your logged-in customer's UUID
SELECT 
    package_id AS "Package",
    delivery_auth_code AS "6-Digit Code",
    status AS "Status",
    '✅ READY FOR PICKUP' AS "Note"
FROM packages
WHERE user_id = '228624ae-1c23-4557-9984-cca1c0bb86f7'::UUID
AND status = 'arrived'
AND delivery_auth_code IS NOT NULL
ORDER BY auth_code_generated_at DESC;

-- If you see codes above, your DATABASE IS READY ✅
-- If client app shows 0 codes, the problem is CLIENT CODE, not database
