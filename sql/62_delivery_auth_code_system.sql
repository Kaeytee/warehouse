-- Complete Delivery Authentication Code System
-- Auto-generates unique 6-digit codes per customer when shipment arrives
-- Enables secure delivery verification in Delivery page
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07

-- ============================================================================
-- SECTION 1: AUTO-GENERATE DELIVERY CODES ON SHIPMENT ARRIVAL
-- ============================================================================

-- Function to generate delivery auth codes for all packages when shipment arrives
-- Each package gets its own unique 6-digit code
CREATE OR REPLACE FUNCTION generate_delivery_codes_on_arrival()
RETURNS TRIGGER AS $$
DECLARE
    package_rec RECORD;
    auth_code TEXT;
    packages_updated INTEGER := 0;
BEGIN
    -- Only trigger when status changes to 'arrived'
    IF NEW.status = 'arrived' AND (OLD.status IS NULL OR OLD.status != 'arrived') THEN
        
        -- Get all packages in this shipment
        FOR package_rec IN
            SELECT 
                p.id,
                p.user_id,
                p.package_id,
                u.first_name,
                u.last_name,
                u.email,
                u.suite_number
            FROM packages p
            JOIN users u ON p.user_id = u.id
            WHERE p.linked_to_shipment_id = NEW.id
            AND p.status != 'delivered'
        LOOP
            -- Generate unique 6-digit code for THIS PACKAGE
            auth_code := generate_auth_code();
            
            -- Update package with its unique auth code and status
            UPDATE packages
            SET 
                delivery_auth_code = auth_code,
                auth_code_generated_at = NOW(),
                status = 'arrived',
                updated_at = NOW()
            WHERE id = package_rec.id;
            
            packages_updated := packages_updated + 1;
            
            -- Log the code generation
            RAISE NOTICE 'Generated UNIQUE auth code for Package % (User: % %, Suite: %): Code=%',
                package_rec.package_id,
                package_rec.first_name,
                package_rec.last_name,
                package_rec.suite_number,
                auth_code;
        END LOOP;
        
        RAISE NOTICE 'Generated % unique delivery codes for shipment %',
            packages_updated,
            NEW.tracking_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 2: CREATE TRIGGER ON SHIPMENTS TABLE
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_generate_delivery_codes ON shipments;

-- Create trigger that fires when shipment status changes
CREATE TRIGGER trigger_generate_delivery_codes
    AFTER UPDATE OF status ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION generate_delivery_codes_on_arrival();

-- ============================================================================
-- SECTION 3: DELIVERY VERIFICATION FUNCTION
-- ============================================================================

-- Function to verify delivery auth code and mark package as delivered
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
    -- Get package details with user info
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
    
    -- Get staff details
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
    
    -- Validate suite number
    IF package_rec.suite_number != UPPER(TRIM(p_suite_number)) THEN
        verification_success := false;
        failure_reason := 'Suite number mismatch';
    END IF;
    
    -- Validate auth code
    IF package_rec.delivery_auth_code IS NULL THEN
        verification_success := false;
        failure_reason := 'No delivery code generated for this package';
    ELSIF package_rec.delivery_auth_code != TRIM(p_auth_code) THEN
        verification_success := false;
        failure_reason := 'Invalid delivery code';
    END IF;
    
    -- Check if code already used
    IF package_rec.auth_code_used_at IS NOT NULL THEN
        verification_success := false;
        failure_reason := 'Delivery code already used - package already delivered';
    END IF;
    
    -- Check if package is in correct status
    IF package_rec.status != 'arrived' THEN
        verification_success := false;
        failure_reason := 'Package not in arrived status (current: ' || package_rec.status || ')';
    END IF;
    
    -- Log verification attempt in package_verification_log
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
    
    -- If verification successful, mark package as delivered
    IF verification_success THEN
        UPDATE packages
        SET 
            status = 'delivered',
            auth_code_used_at = NOW(),
            auth_code_used_by = p_staff_id,
            updated_at = NOW()
        WHERE id = p_package_id;
        
        result_message := 'Package ' || package_rec.package_id || ' successfully delivered to ' || 
                         package_rec.first_name || ' ' || package_rec.last_name;
        
        RAISE NOTICE 'DELIVERY SUCCESS: % (Staff: % %)',
            result_message,
            staff_rec.first_name,
            staff_rec.last_name;
        
        RETURN jsonb_build_object(
            'verified', true,
            'message', result_message,
            'package_id', package_rec.package_id,
            'tracking_number', package_rec.tracking_number,
            'customer_name', package_rec.first_name || ' ' || package_rec.last_name,
            'delivered_at', NOW()
        );
    ELSE
        RAISE NOTICE 'DELIVERY FAILED: Package % - Reason: %',
            package_rec.package_id,
            failure_reason;
        
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
-- SECTION 4: HELPER FUNCTION - GET CUSTOMER DELIVERY CODES
-- ============================================================================

-- Function to retrieve delivery codes for a customer (for client app display)
-- Each package has its own unique 6-digit code
CREATE OR REPLACE FUNCTION get_customer_delivery_codes(p_user_id UUID)
RETURNS TABLE (
    package_id TEXT,
    tracking_number TEXT,
    delivery_code TEXT,
    shipment_tracking TEXT,
    status TEXT,
    generated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.package_id,
        p.tracking_number,
        p.delivery_auth_code,
        s.tracking_number AS shipment_tracking,
        p.status,
        p.auth_code_generated_at,
        NULL::TIMESTAMP WITH TIME ZONE AS expires_at,  -- Codes don't expire in this system
        p.description
    FROM packages p
    LEFT JOIN shipments s ON p.linked_to_shipment_id = s.id
    WHERE p.user_id = p_user_id
    AND p.status = 'arrived'
    AND p.delivery_auth_code IS NOT NULL
    AND p.auth_code_used_at IS NULL
    ORDER BY p.auth_code_generated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION verify_delivery_code(UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_delivery_codes(UUID) TO authenticated;

-- ============================================================================
-- SECTION 6: VERIFICATION AND TESTING
-- ============================================================================

-- Verify all components are in place
DO $$
DECLARE
    trigger_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Check trigger exists
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_name = 'trigger_generate_delivery_codes'
    AND event_object_table = 'shipments';
    
    -- Check functions exist
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN (
        'generate_delivery_codes_on_arrival',
        'verify_delivery_code',
        'get_customer_delivery_codes',
        'generate_auth_code'
    );
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'DELIVERY AUTH CODE SYSTEM DEPLOYED';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Trigger installed: % (expected 1)', trigger_count;
    RAISE NOTICE 'Functions installed: % (expected 4)', function_count;
    RAISE NOTICE '';
    RAISE NOTICE 'WORKFLOW:';
    RAISE NOTICE '1. Shipment marked as "arrived" → Auto-generates unique 6-digit codes per user';
    RAISE NOTICE '2. Customer sees code in their app via get_customer_delivery_codes()';
    RAISE NOTICE '3. Staff verifies code in Delivery page via verify_delivery_code()';
    RAISE NOTICE '4. Package marked as delivered only after successful verification';
    RAISE NOTICE '====================================';
END $$;

