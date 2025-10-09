-- ============================================================================
-- ADD NOTIFICATION WHEN PACKAGE IS DELIVERED
-- ============================================================================
-- Enhances verify_delivery_code() function to send notification to customer
-- when their package is successfully delivered via code verification
-- 
-- @author Senior Software Engineer  
-- @version 1.0.0
-- @date 2025-10-08
-- ============================================================================

-- Drop and recreate the function with notification support
CREATE OR REPLACE FUNCTION verify_delivery_code(
    p_package_id UUID,
    p_suite_number TEXT,
    p_auth_code TEXT,
    p_staff_id UUID
)
RETURNS JSONB AS $$
DECLARE
    package_rec RECORD;
    staff_rec RECORD;
    verification_success BOOLEAN := true;
    failure_reason TEXT := NULL;
    result_message TEXT;
BEGIN
    -- ========================================================================
    -- STEP 1: Fetch package and user details
    -- ========================================================================
    SELECT 
        p.id,
        p.package_id,
        p.tracking_number,
        p.status,
        p.delivery_auth_code,
        p.auth_code_generated_at,
        p.auth_code_used_at,
        p.user_id,
        u.suite_number,
        u.first_name,
        u.last_name,
        u.email
    INTO package_rec
    FROM packages p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = p_package_id;
    
    -- Check if package exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'verified', false,
            'message', 'Package not found',
            'package_id', p_package_id
        );
    END IF;
    
    -- ========================================================================
    -- STEP 2: Fetch staff details for verification logging
    -- ========================================================================
    SELECT id, role, first_name, last_name
    INTO staff_rec
    FROM users
    WHERE id = p_staff_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'verified', false,
            'message', 'Staff user not found'
        );
    END IF;
    
    -- ========================================================================
    -- STEP 3: Validate suite number
    -- ========================================================================
    IF package_rec.suite_number != UPPER(TRIM(p_suite_number)) THEN
        verification_success := false;
        failure_reason := 'Suite number mismatch';
    END IF;
    
    -- ========================================================================
    -- STEP 4: Validate delivery auth code
    -- ========================================================================
    IF package_rec.delivery_auth_code IS NULL THEN
        verification_success := false;
        failure_reason := 'No delivery code generated for this package';
    ELSIF package_rec.delivery_auth_code != TRIM(p_auth_code) THEN
        verification_success := false;
        failure_reason := 'Invalid delivery code';
    END IF;
    
    -- ========================================================================
    -- STEP 5: Check if code was already used
    -- ========================================================================
    IF package_rec.auth_code_used_at IS NOT NULL THEN
        verification_success := false;
        failure_reason := 'Delivery code already used - package already delivered';
    END IF;
    
    -- ========================================================================
    -- STEP 6: Verify package status is 'arrived'
    -- ========================================================================
    IF package_rec.status != 'arrived' THEN
        verification_success := false;
        failure_reason := 'Package not in arrived status (current: ' || package_rec.status || ')';
    END IF;
    
    -- ========================================================================
    -- STEP 7: Log verification attempt (success or failure)
    -- ========================================================================
    INSERT INTO package_verification_log (
        package_id,
        suite_number,
        auth_code_entered,
        verification_success,
        failure_reason,
        verified_by,
        verified_by_role
    ) VALUES (
        p_package_id,
        p_suite_number,
        p_auth_code,
        verification_success,
        failure_reason,
        p_staff_id,
        staff_rec.role
    );
    
    -- ========================================================================
    -- STEP 8: Process successful delivery
    -- ========================================================================
    IF verification_success THEN
        -- Update package status to delivered
        UPDATE packages
        SET 
            status = 'delivered',
            auth_code_used_at = NOW(),
            auth_code_used_by = p_staff_id,
            updated_at = NOW()
        WHERE id = p_package_id;
        
        -- Create success message
        result_message := 'Package ' || package_rec.package_id || ' successfully delivered to ' || 
                         package_rec.first_name || ' ' || package_rec.last_name;
        
        -- ====================================================================
        -- NEW: Create in-app notification for customer
        -- ====================================================================
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            action_url,
            created_at
        ) VALUES (
            package_rec.user_id,
            '📦 Package Delivered',
            'Your package ' || package_rec.package_id || ' has been successfully delivered! Thank you for choosing VanguardCargo.',
            'package_update',
            '/packages/' || package_rec.tracking_number,
            NOW()
        );
        
        -- Log successful delivery
        RAISE NOTICE 'DELIVERY SUCCESS: % (Staff: % %)',
            result_message,
            staff_rec.first_name,
            staff_rec.last_name;
        
        RAISE NOTICE 'NOTIFICATION SENT: Customer % % notified of delivery',
            package_rec.first_name,
            package_rec.last_name;
        
        -- Return success response
        RETURN jsonb_build_object(
            'verified', true,
            'message', result_message,
            'package_id', package_rec.package_id,
            'tracking_number', package_rec.tracking_number,
            'customer_name', package_rec.first_name || ' ' || package_rec.last_name,
            'delivered_at', NOW()
        );
    ELSE
        -- ====================================================================
        -- STEP 9: Handle failed verification
        -- ====================================================================
        RAISE NOTICE 'DELIVERY FAILED: Package % - Reason: %',
            package_rec.package_id,
            failure_reason;
        
        -- Return failure response
        RETURN jsonb_build_object(
            'verified', false,
            'message', failure_reason,
            'package_id', package_rec.package_id,
            'attempts_logged', true
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SET SEARCH PATH FOR FUNCTION
-- ============================================================================
ALTER FUNCTION public.verify_delivery_code(UUID, TEXT, TEXT, UUID) 
SET search_path = public, extensions;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION verify_delivery_code(UUID, TEXT, TEXT, UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT '✅ verify_delivery_code() function updated with notification support' AS status;
SELECT 'Customers will now receive in-app notification when package is delivered' AS message;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
-- 
-- When a package is successfully delivered via code verification:
-- 1. Package status updated to 'delivered' ✅
-- 2. Auth code marked as used ✅
-- 3. Verification logged for audit ✅
-- 4. Customer receives in-app notification ✅ NEW!
-- 
-- Notification details:
-- - Type: 'package_update'
-- - Title: '📦 Package Delivered'
-- - Message: Includes package ID
-- - Action URL: Links to package tracking page
-- - Timestamp: Delivery completion time
-- 
-- ============================================================================
