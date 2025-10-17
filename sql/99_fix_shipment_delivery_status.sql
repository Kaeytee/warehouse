-- ============================================================================
-- FIX SHIPMENT DELIVERY STATUS UPDATE
-- ============================================================================
-- When a package is delivered, automatically update the parent shipment status
-- to 'delivered' if all packages in the shipment have been delivered
-- 
-- BUG FIX: Previously, only package status was updated to 'delivered', but the
-- parent shipment remained in 'arrived' status, causing confusion in Shipment History
-- 
-- @author Senior Software Engineer
-- @version 1.0.1
-- @date 2025-10-17
-- ============================================================================

-- ============================================================================
-- DROP AND RECREATE verify_delivery_code WITH SHIPMENT STATUS UPDATE
-- ============================================================================
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
    v_shipment_id UUID;
    v_total_packages INTEGER;
    v_delivered_packages INTEGER;
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
        p.linked_to_shipment_id,
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
        
        -- ====================================================================
        -- NEW FIX: Update shipment status if all packages are delivered
        -- ====================================================================
        v_shipment_id := package_rec.linked_to_shipment_id;
        
        IF v_shipment_id IS NOT NULL THEN
            -- Count total packages in the shipment
            SELECT COUNT(*) INTO v_total_packages
            FROM packages
            WHERE linked_to_shipment_id = v_shipment_id;
            
            -- Count delivered packages in the shipment (including the one just delivered)
            SELECT COUNT(*) INTO v_delivered_packages
            FROM packages
            WHERE linked_to_shipment_id = v_shipment_id
            AND status = 'delivered';
            
            -- If all packages are delivered, update shipment status
            IF v_delivered_packages = v_total_packages THEN
                UPDATE shipments
                SET 
                    status = 'delivered',
                    updated_at = NOW()
                WHERE id = v_shipment_id;
                
                RAISE NOTICE 'SHIPMENT AUTO-UPDATED: Shipment % marked as delivered (%/%)', 
                    v_shipment_id, v_delivered_packages, v_total_packages;
            ELSE
                RAISE NOTICE 'SHIPMENT PARTIAL: %/% packages delivered in shipment %',
                    v_delivered_packages, v_total_packages, v_shipment_id;
            END IF;
        END IF;
        
        -- Create success message
        result_message := 'Package ' || package_rec.package_id || ' successfully delivered to ' || 
                         package_rec.first_name || ' ' || package_rec.last_name;
        
        -- ====================================================================
        -- Create in-app notification for customer
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
-- VERIFICATION & STATUS
-- ============================================================================
SELECT '✅ verify_delivery_code() function updated with shipment status fix' AS status;
SELECT 'When all packages in a shipment are delivered, shipment status will automatically update to delivered' AS message;

-- ============================================================================
-- OPTIONAL: FIX EXISTING DATA
-- ============================================================================
-- If you have shipments that are stuck in "arrived" status but all packages 
-- are delivered, run this query to fix them:

DO $$
DECLARE
    shipment_rec RECORD;
    fixed_count INTEGER := 0;
BEGIN
    -- Find shipments where all packages are delivered but shipment status is not
    FOR shipment_rec IN
        SELECT 
            s.id,
            s.tracking_number,
            s.status,
            COUNT(*) as total_packages,
            COUNT(*) FILTER (WHERE p.status = 'delivered') as delivered_packages
        FROM shipments s
        JOIN packages p ON p.linked_to_shipment_id = s.id
        WHERE s.status != 'delivered'
        GROUP BY s.id, s.tracking_number, s.status
        HAVING COUNT(*) = COUNT(*) FILTER (WHERE p.status = 'delivered')
    LOOP
        -- Update shipment to delivered
        UPDATE shipments
        SET 
            status = 'delivered',
            updated_at = NOW()
        WHERE id = shipment_rec.id;
        
        fixed_count := fixed_count + 1;
        
        RAISE NOTICE 'FIXED: Shipment % (%) - %/% packages delivered',
            shipment_rec.tracking_number,
            shipment_rec.id,
            shipment_rec.delivered_packages,
            shipment_rec.total_packages;
    END LOOP;
    
    IF fixed_count > 0 THEN
        RAISE NOTICE '✅ Fixed % shipment(s) with inconsistent status', fixed_count;
    ELSE
        RAISE NOTICE '✅ No shipments need fixing - all statuses are consistent';
    END IF;
END $$;

-- ============================================================================
-- CHANGELOG
-- ============================================================================
-- v1.0.1 (2025-10-17)
-- - Added automatic shipment status update when all packages are delivered
-- - Added package counting logic to determine when shipment is fully delivered
-- - Added data migration to fix existing inconsistent shipment statuses
-- - Maintains backward compatibility with existing delivery verification flow
-- ============================================================================
