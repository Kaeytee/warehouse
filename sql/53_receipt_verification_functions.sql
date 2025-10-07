-- Receipt Generation and Package Verification Functions
-- Handles receipt creation for intake/shipment and 6-digit code verification
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07

-- ============================================================================
-- SECTION 1: RECEIPT GENERATION FUNCTIONS
-- ============================================================================

-- Function to generate package intake receipt
CREATE OR REPLACE FUNCTION generate_package_intake_receipt(
    p_package_id UUID,
    p_staff_id UUID
)
RETURNS JSON AS $$
DECLARE
    package_record RECORD;
    receipt_number TEXT;
    receipt_id UUID;
    receipt_json JSONB;
BEGIN
    -- Verify staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions for receipt generation'
        );
    END IF;
    
    -- Get package details with user information
    SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.email,
        u.suite_number,
        u.phone_number
    INTO package_record
    FROM packages p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = p_package_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Package not found'
        );
    END IF;
    
    -- Generate receipt number
    receipt_number := generate_receipt_number();
    
    -- Build receipt data JSON
    receipt_json := jsonb_build_object(
        'receipt_type', 'package_intake',
        'receipt_number', receipt_number,
        'package_details', jsonb_build_object(
            'package_id', package_record.package_id,
            'tracking_number', package_record.tracking_number,
            'description', package_record.description,
            'weight', package_record.weight,
            'declared_value', package_record.declared_value,
            'store_name', package_record.store_name,
            'vendor_name', package_record.vendor_name
        ),
        'customer_details', jsonb_build_object(
            'name', package_record.first_name || ' ' || package_record.last_name,
            'email', package_record.email,
            'suite_number', package_record.suite_number,
            'phone', package_record.phone_number
        ),
        'warehouse_details', jsonb_build_object(
            'name', 'VanguardCargo Warehouse',
            'contact', 'info@vanguardcargo.co'
        ),
        'timestamps', jsonb_build_object(
            'intake_date', package_record.intake_date,
            'generated_at', NOW()
        ),
        'barcode_data', package_record.barcode_data,
        'auth_code', package_record.delivery_auth_code
    );
    
    -- Insert receipt record
    INSERT INTO receipts (
        receipt_number,
        receipt_type,
        package_id,
        user_id,
        suite_number,
        receipt_data,
        barcode_data,
        generated_by
    ) VALUES (
        receipt_number,
        'package_intake',
        p_package_id,
        package_record.user_id,
        package_record.suite_number,
        receipt_json,
        package_record.barcode_data,
        p_staff_id
    ) RETURNING id INTO receipt_id;
    
    -- Return success with receipt data
    RETURN json_build_object(
        'success', true,
        'receipt_id', receipt_id,
        'receipt_number', receipt_number,
        'receipt_data', receipt_json,
        'message', 'Package intake receipt generated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate shipment creation receipt
CREATE OR REPLACE FUNCTION generate_shipment_receipt(
    p_shipment_id UUID,
    p_staff_id UUID
)
RETURNS JSON AS $$
DECLARE
    shipment_record RECORD;
    packages_count INTEGER;
    total_weight DECIMAL;
    total_value DECIMAL;
    receipt_number TEXT;
    receipt_id UUID;
    receipt_json JSONB;
BEGIN
    -- Verify staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions for receipt generation'
        );
    END IF;
    
    -- Get shipment details with user info (needed for receipt table fields)
    -- Note: We get user info for receipts table but won't use it in receipt display
    SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        u.suite_number
    INTO shipment_record
    FROM shipments s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = p_shipment_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Shipment not found'
        );
    END IF;
    
    -- Get package aggregates
    SELECT 
        COUNT(*),
        COALESCE(SUM(p.weight), 0),
        COALESCE(SUM(p.declared_value), 0)
    INTO packages_count, total_weight, total_value
    FROM packages p
    JOIN package_shipments ps ON p.id = ps.package_id
    WHERE ps.shipment_id = p_shipment_id;
    
    -- Generate receipt number
    receipt_number := generate_receipt_number();
    
    -- Build receipt data JSON (no customer_details since shipment may have multiple customers)
    receipt_json := jsonb_build_object(
        'receipt_type', 'shipment_created',
        'receipt_number', receipt_number,
        'shipment_details', jsonb_build_object(
            'tracking_number', shipment_record.tracking_number,
            'status', shipment_record.status,
            'service_type', shipment_record.service_type,
            'packages_count', packages_count,
            'total_weight', total_weight,
            'shipping_cost', shipment_record.shipping_cost
        ),
        'sender_details', jsonb_build_object(
            'name', 'Vanguard Cargo LLC',
            'address', '4700 Eisenhower Avenue ALX-E2',
            'city', 'Alexandria',
            'state', 'VA',
            'zip', '22304',
            'country', 'USA',
            'email', 'info@vanguardcargo.co',
            'phone', '0303982320 | +233 544197819'
        ),
        'delivery_details', jsonb_build_object(
            'recipient_name', shipment_record.recipient_name,
            'recipient_phone', shipment_record.recipient_phone,
            'address', shipment_record.delivery_address,
            'city', shipment_record.delivery_city,
            'country', shipment_record.delivery_country
        ),
        'warehouse_details', jsonb_build_object(
            'name', 'VanguardCargo Warehouse',
            'contact', 'info@vanguardcargo.co'
        ),
        'timestamps', jsonb_build_object(
            'created_at', shipment_record.created_at,
            'estimated_delivery', shipment_record.estimated_delivery,
            'generated_at', NOW()
        ),
        'barcode_data', shipment_record.barcode_data
    );
    
    -- Insert receipt record
    INSERT INTO receipts (
        receipt_number,
        receipt_type,
        shipment_id,
        user_id,
        suite_number,
        receipt_data,
        barcode_data,
        generated_by
    ) VALUES (
        receipt_number,
        'shipment_created',
        p_shipment_id,
        shipment_record.user_id,
        shipment_record.suite_number,
        receipt_json,
        shipment_record.barcode_data,
        p_staff_id
    ) RETURNING id INTO receipt_id;
    
    -- Return success with receipt data
    RETURN json_build_object(
        'success', true,
        'receipt_id', receipt_id,
        'receipt_number', receipt_number,
        'receipt_data', receipt_json,
        'message', 'Shipment receipt generated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 2: PACKAGE VERIFICATION FUNCTIONS
-- ============================================================================

-- Function to verify package delivery with 6-digit code
CREATE OR REPLACE FUNCTION verify_package_delivery(
    p_package_id UUID,
    p_suite_number TEXT,
    p_auth_code TEXT,
    p_staff_id UUID
)
RETURNS JSON AS $$
DECLARE
    package_record RECORD;
    staff_record RECORD;
    verification_success BOOLEAN;
    failure_reason TEXT;
BEGIN
    -- Verify staff permissions
    SELECT role INTO staff_record
    FROM users 
    WHERE id = p_staff_id 
    AND role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin');
    
    IF NOT FOUND THEN
        -- Log failed attempt
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
            false,
            'Insufficient permissions',
            p_staff_id,
            'unknown'
        );
        
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions for package verification'
        );
    END IF;
    
    -- Get package details with user suite number
    SELECT 
        p.*,
        u.suite_number AS correct_suite_number,
        u.first_name,
        u.last_name
    INTO package_record
    FROM packages p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = p_package_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Package not found'
        );
    END IF;
    
    -- Initialize verification result
    verification_success := true;
    failure_reason := NULL;
    
    -- Validate suite number
    IF package_record.correct_suite_number != p_suite_number THEN
        verification_success := false;
        failure_reason := 'Suite number mismatch';
    END IF;
    
    -- Validate auth code
    IF package_record.delivery_auth_code IS NULL THEN
        verification_success := false;
        failure_reason := 'No authentication code set for this package';
    ELSIF package_record.delivery_auth_code != p_auth_code THEN
        verification_success := false;
        failure_reason := 'Invalid authentication code';
    END IF;
    
    -- Check if code already used
    IF package_record.auth_code_used_at IS NOT NULL THEN
        verification_success := false;
        failure_reason := 'Authentication code already used';
    END IF;
    
    -- Check if package is in correct status for delivery
    IF package_record.status != 'arrived' THEN
        verification_success := false;
        failure_reason := 'Package not in arrived status';
    END IF;
    
    -- Log verification attempt
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
        staff_record.role
    );
    
    -- If verification successful, update package status
    IF verification_success THEN
        UPDATE packages
        SET 
            status = 'delivered',
            auth_code_used_at = NOW(),
            auth_code_used_by = p_staff_id,
            updated_at = NOW()
        WHERE id = p_package_id;
        
        -- Create notification for customer
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type
        ) VALUES (
            package_record.user_id,
            'Package Delivered',
            'Your package ' || package_record.package_id || ' has been successfully delivered and verified.',
            'package_update'
        );
        
        RETURN json_build_object(
            'success', true,
            'verified', true,
            'package_id', package_record.package_id,
            'tracking_number', package_record.tracking_number,
            'customer_name', package_record.first_name || ' ' || package_record.last_name,
            'message', 'Package verified and marked as delivered successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'reason', failure_reason,
            'message', 'Package verification failed: ' || failure_reason
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get verification logs for a package
CREATE OR REPLACE FUNCTION get_package_verification_logs(
    p_package_id UUID,
    p_staff_id UUID
)
RETURNS JSON AS $$
DECLARE
    logs_data JSONB;
BEGIN
    -- Verify staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get verification logs
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', pvl.id,
            'verified_at', pvl.verified_at,
            'suite_number', pvl.suite_number,
            'verification_success', pvl.verification_success,
            'failure_reason', pvl.failure_reason,
            'verified_by', u.first_name || ' ' || u.last_name,
            'verified_by_role', pvl.verified_by_role
        ) ORDER BY pvl.verified_at DESC
    )
    INTO logs_data
    FROM package_verification_log pvl
    LEFT JOIN users u ON pvl.verified_by = u.id
    WHERE pvl.package_id = p_package_id;
    
    RETURN json_build_object(
        'success', true,
        'logs', COALESCE(logs_data, '[]'::jsonb)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 3: ENHANCED PACKAGE INTAKE WITH AUTH CODE
-- ============================================================================

-- Enhanced warehouse package intake with automatic auth code generation
CREATE OR REPLACE FUNCTION warehouse_package_intake_enhanced(
    p_user_suite_number TEXT,
    p_description TEXT,
    p_warehouse_staff_id UUID,
    p_weight DECIMAL DEFAULT NULL,
    p_declared_value DECIMAL DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL,
    p_vendor_name TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    package_uuid UUID;
    auth_code TEXT;
BEGIN
    -- Call original intake function
    result := warehouse_package_intake(
        p_user_suite_number,
        p_description,
        p_warehouse_staff_id,
        p_weight,
        p_declared_value,
        p_store_name,
        p_vendor_name,
        p_notes
    );
    
    -- Check if intake was successful
    IF (result->>'success')::BOOLEAN = true THEN
        package_uuid := (result->>'package_uuid')::UUID;
        
        -- Generate and store auth code
        auth_code := generate_auth_code();
        
        UPDATE packages
        SET 
            delivery_auth_code = auth_code,
            auth_code_generated_at = NOW()
        WHERE id = package_uuid;
        
        -- Add auth code to result
        result := jsonb_set(
            result::JSONB,
            '{auth_code}',
            to_jsonb(auth_code)
        )::JSON;
    END IF;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 53_receipt_verification_functions.sql completed successfully';
    RAISE NOTICE 'Added receipt generation and package verification functions';
    RAISE NOTICE 'Enhanced package intake with automatic 6-digit auth code generation';
END $$;
