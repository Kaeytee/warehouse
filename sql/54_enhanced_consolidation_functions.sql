-- Enhanced Consolidation Functions with Shipment Linking
-- Improves shipment creation with package linking and metric aggregation
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07

-- ============================================================================
-- SECTION 1: ENHANCED SHIPMENT CREATION WITH FULL TRACEABILITY
-- ============================================================================

-- Enhanced function to create shipment with complete package linking
CREATE OR REPLACE FUNCTION create_shipment_from_packages_enhanced(
    p_package_ids UUID[],
    p_warehouse_staff_id UUID,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_delivery_address TEXT,
    p_delivery_city TEXT,
    p_delivery_country TEXT,
    p_service_type TEXT DEFAULT 'standard'
)
RETURNS JSON AS $$
DECLARE
    new_tracking_number TEXT;
    new_shipment_id UUID;
    package_id UUID;
    package_user_id UUID;
    package_suite_number TEXT;
    affected_users UUID[];
    suite_numbers TEXT[] := ARRAY[]::TEXT[];
    total_weight_calc DECIMAL := 0;
    total_value_calc DECIMAL := 0;
    package_count INTEGER := 0;
    package_rec RECORD;
BEGIN
    -- Verify warehouse staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_warehouse_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions for shipment creation'
        );
    END IF;
    
    -- Validate that packages exist and are in correct status
    IF EXISTS (
        SELECT 1 FROM packages 
        WHERE id = ANY(p_package_ids) 
        AND status NOT IN ('received', 'processing')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Some packages are not ready for shipment (must be received or processing)'
        );
    END IF;
    
    -- Check if any packages are already linked to a shipment
    IF EXISTS (
        SELECT 1 FROM packages 
        WHERE id = ANY(p_package_ids) 
        AND linked_to_shipment_id IS NOT NULL
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Some packages are already linked to another shipment'
        );
    END IF;
    
    -- Generate tracking number for shipment
    new_tracking_number := generate_tracking_number();
    
    -- Get the first user for shipment record
    SELECT user_id INTO package_user_id
    FROM packages 
    WHERE id = p_package_ids[1];
    
    -- Calculate aggregated metrics and collect suite numbers
    FOR package_rec IN 
        SELECT 
            p.id,
            p.user_id,
            p.weight,
            p.declared_value,
            u.suite_number
        FROM packages p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ANY(p_package_ids)
    LOOP
        -- Aggregate totals
        total_weight_calc := total_weight_calc + COALESCE(package_rec.weight, 0);
        total_value_calc := total_value_calc + COALESCE(package_rec.declared_value, 0);
        package_count := package_count + 1;
        
        -- Collect unique suite numbers
        IF NOT (package_rec.suite_number = ANY(suite_numbers)) THEN
            suite_numbers := array_append(suite_numbers, package_rec.suite_number);
        END IF;
        
        -- Collect affected users
        affected_users := array_append(affected_users, package_rec.user_id);
    END LOOP;
    
    -- Create shipment with aggregated data
    INSERT INTO shipments (
        tracking_number,
        user_id,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_city,
        delivery_country,
        service_type,
        status,
        total_weight,
        total_value,
        total_packages,
        combined_suite_numbers
    ) VALUES (
        new_tracking_number,
        package_user_id,
        p_recipient_name,
        p_recipient_phone,
        p_delivery_address,
        p_delivery_city,
        p_delivery_country,
        p_service_type,
        'processing',
        total_weight_calc,
        total_value_calc,
        package_count,
        suite_numbers
    ) RETURNING id INTO new_shipment_id;
    
    -- Link packages to shipment and update their status
    FOREACH package_id IN ARRAY p_package_ids
    LOOP
        -- Insert package-shipment relationship
        INSERT INTO package_shipments (package_id, shipment_id)
        VALUES (package_id, new_shipment_id);
        
        -- Update package with shipment link and status
        UPDATE packages 
        SET 
            status = 'shipped',
            linked_to_shipment_id = new_shipment_id,
            updated_at = NOW()
        WHERE id = package_id;
    END LOOP;
    
    -- Send notifications to all affected users
    PERFORM notify_users_shipment_created(affected_users, new_tracking_number);
    
    -- Return comprehensive result
    RETURN json_build_object(
        'success', true,
        'shipment_id', new_shipment_id,
        'tracking_number', new_tracking_number,
        'packages_count', package_count,
        'total_weight', total_weight_calc,
        'total_value', total_value_calc,
        'suite_numbers', suite_numbers,
        'message', 'Consolidated shipment created successfully with ' || package_count || ' packages'
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
-- SECTION 2: GET CONSOLIDATED SHIPMENT DETAILS
-- ============================================================================

-- Function to get full consolidated shipment details
CREATE OR REPLACE FUNCTION get_consolidated_shipment_details(
    p_shipment_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    shipment_record RECORD;
    packages_data JSONB;
    has_permission BOOLEAN;
BEGIN
    -- Check permissions (admin or shipment owner)
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND (
            role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin')
            OR id = (SELECT user_id FROM shipments WHERE id = p_shipment_id)
        )
    ) INTO has_permission;
    
    IF NOT has_permission THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get shipment details
    SELECT 
        s.*,
        u.first_name || ' ' || u.last_name AS customer_name,
        u.email AS customer_email,
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
    
    -- Get all linked packages
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'package_id', p.package_id,
            'tracking_number', p.tracking_number,
            'description', p.description,
            'weight', p.weight,
            'declared_value', p.declared_value,
            'status', p.status,
            'store_name', p.store_name,
            'vendor_name', p.vendor_name,
            'barcode_data', p.barcode_data,
            'qr_code_data', p.qr_code_data,
            'auth_code', p.delivery_auth_code,
            'linked_at', ps.created_at
        ) ORDER BY ps.created_at
    )
    INTO packages_data
    FROM packages p
    JOIN package_shipments ps ON p.id = ps.package_id
    WHERE ps.shipment_id = p_shipment_id;
    
    -- Return comprehensive shipment data
    RETURN json_build_object(
        'success', true,
        'shipment', jsonb_build_object(
            'shipment_id', shipment_record.id,
            'tracking_number', shipment_record.tracking_number,
            'status', shipment_record.status,
            'service_type', shipment_record.service_type,
            'total_weight', shipment_record.total_weight,
            'total_value', shipment_record.total_value,
            'total_packages', COALESCE(jsonb_array_length(packages_data), 0),
            'shipping_cost', shipment_record.shipping_cost,
            'combined_suite_numbers', shipment_record.combined_suite_numbers,
            'customer_name', shipment_record.customer_name,
            'customer_email', shipment_record.customer_email,
            'suite_number', shipment_record.suite_number,
            'recipient_name', shipment_record.recipient_name,
            'recipient_phone', shipment_record.recipient_phone,
            'delivery_address', shipment_record.delivery_address,
            'delivery_city', shipment_record.delivery_city,
            'delivery_country', shipment_record.delivery_country,
            'estimated_delivery', shipment_record.estimated_delivery,
            'created_at', shipment_record.created_at,
            'updated_at', shipment_record.updated_at,
            'barcode_data', shipment_record.barcode_data,
            'qr_code_data', shipment_record.qr_code_data,
            'waybill_generated', shipment_record.waybill_generated_at IS NOT NULL,
            'sender_details', jsonb_build_object(
                'name', 'Vanguard Cargo LLC',
                'address', '4700 Eisenhower Avenue ALX-E2',
                'city', 'Alexandria',
                'state', 'VA',
                'zip', '22304',
                'country', 'USA',
                'email', 'info@vanguardcargo.co',
                'phone', '0303982320 | +233 544197819'
            )
        ),
        'packages', COALESCE(packages_data, '[]'::jsonb)
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
-- SECTION 3: GET PACKAGES BY SHIPMENT
-- ============================================================================

-- Function to get all packages linked to a shipment
CREATE OR REPLACE FUNCTION get_packages_by_shipment(
    p_shipment_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    packages_data JSONB;
    has_permission BOOLEAN;
BEGIN
    -- Check permissions
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND (
            role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin')
            OR id = (SELECT user_id FROM shipments WHERE id = p_shipment_id)
        )
    ) INTO has_permission;
    
    IF NOT has_permission THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get packages with full details
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'package_id', p.package_id,
            'tracking_number', p.tracking_number,
            'description', p.description,
            'weight', p.weight,
            'declared_value', p.declared_value,
            'status', p.status,
            'store_name', p.store_name,
            'vendor_name', p.vendor_name,
            'notes', p.notes,
            'intake_date', p.intake_date,
            'created_at', p.created_at,
            'barcode_data', p.barcode_data,
            'qr_code_data', p.qr_code_data,
            'auth_code', p.delivery_auth_code,
            'linked_to_shipment_id', p.linked_to_shipment_id,
            'user_suite', u.suite_number,
            'user_name', u.first_name || ' ' || u.last_name
        ) ORDER BY p.created_at
    )
    INTO packages_data
    FROM packages p
    JOIN users u ON p.user_id = u.id
    JOIN package_shipments ps ON p.id = ps.package_id
    WHERE ps.shipment_id = p_shipment_id;
    
    RETURN json_build_object(
        'success', true,
        'packages', COALESCE(packages_data, '[]'::jsonb)
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
-- SECTION 4: UNLINK PACKAGE FROM SHIPMENT
-- ============================================================================

-- Function to remove package from consolidated shipment
CREATE OR REPLACE FUNCTION unlink_package_from_shipment(
    p_package_id UUID,
    p_staff_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    shipment_id_var UUID;
    package_record RECORD;
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
    
    -- Get package details
    SELECT * INTO package_record
    FROM packages
    WHERE id = p_package_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Package not found'
        );
    END IF;
    
    IF package_record.linked_to_shipment_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Package is not linked to any shipment'
        );
    END IF;
    
    shipment_id_var := package_record.linked_to_shipment_id;
    
    -- Remove package-shipment relationship
    DELETE FROM package_shipments
    WHERE package_id = p_package_id
    AND shipment_id = shipment_id_var;
    
    -- Update package to remove shipment link
    UPDATE packages
    SET 
        linked_to_shipment_id = NULL,
        status = 'received',
        updated_at = NOW()
    WHERE id = p_package_id;
    
    -- Update shipment totals
    UPDATE shipments
    SET 
        total_packages = total_packages - 1,
        updated_at = NOW()
    WHERE id = shipment_id_var;
    
    -- Log the unlinking action
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        package_record.user_id,
        'Package Removed from Shipment',
        'Package ' || package_record.package_id || ' has been removed from shipment. Reason: ' || COALESCE(p_reason, 'Staff action'),
        'package_update'
    );
    
    RETURN json_build_object(
        'success', true,
        'package_id', package_record.package_id,
        'previous_shipment_id', shipment_id_var,
        'message', 'Package successfully unlinked from shipment'
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
-- MIGRATION COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 54_enhanced_consolidation_functions.sql completed successfully';
    RAISE NOTICE 'Added enhanced consolidation with package linking and traceability';
    RAISE NOTICE 'Implemented aggregated metrics and suite number tracking';
END $$;
