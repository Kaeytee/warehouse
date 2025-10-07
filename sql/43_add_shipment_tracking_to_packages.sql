-- Add shipment tracking number to packages table
-- This allows packages to be linked to shipments via tracking number
-- Enables simplified tracking where users can track by either package or shipment number
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-03

-- ============================================
-- 1. ADD SHIPMENT_TRACKING_NUMBER COLUMN
-- ============================================

-- Add the new column to packages table
ALTER TABLE packages 
ADD COLUMN shipment_tracking_number TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_packages_shipment_tracking 
ON packages(shipment_tracking_number);

-- ============================================
-- 2. UPDATE CREATE_SHIPMENT_FROM_PACKAGES FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION create_shipment_from_packages(
    p_package_ids UUID[],
    p_warehouse_staff_id UUID,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_delivery_address TEXT,
    p_delivery_city TEXT,
    p_delivery_country TEXT,
    p_service_type TEXT DEFAULT 'standard'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tracking_number TEXT;
    new_shipment_id UUID;
    package_id UUID;
    package_user_id UUID;
    total_weight DECIMAL := 0;
    total_value DECIMAL := 0;
    estimated_days INTEGER;
    calculated_delivery_date TIMESTAMP;
BEGIN
    -- Verify warehouse staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_warehouse_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions for shipment creation'
        );
    END IF;
    
    -- Verify all packages exist and are in processing status
    IF NOT EXISTS (
        SELECT 1 FROM packages 
        WHERE id = ANY(p_package_ids) 
        AND status = 'processing'
        HAVING COUNT(*) = array_length(p_package_ids, 1)
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'One or more packages not found or not in processing status'
        );
    END IF;
    
    -- Calculate total weight and value
    SELECT COALESCE(SUM(weight), 0), COALESCE(SUM(declared_value), 0)
    INTO total_weight, total_value
    FROM packages 
    WHERE id = ANY(p_package_ids);
    
    -- Get the first package's user for shipment record
    SELECT user_id INTO package_user_id
    FROM packages 
    WHERE id = p_package_ids[1];
    
    -- Generate tracking number for the shipment
    new_tracking_number := generate_tracking_number();
    
    -- Calculate estimated delivery based on service type
    -- Standard: 5-7 days, Express: 3-5 days, Overnight: 1-2 days
    CASE p_service_type
        WHEN 'express' THEN
            estimated_days := 4;  -- Middle of 3-5 days
        WHEN 'overnight' THEN
            estimated_days := 2;  -- Middle of 1-2 days
        ELSE  -- standard
            estimated_days := 6;  -- Middle of 5-7 days
    END CASE;
    
    calculated_delivery_date := NOW() + (estimated_days || ' days')::INTERVAL;
    
    -- Insert new shipment
    INSERT INTO shipments (
        user_id,
        tracking_number,
        status,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_city,
        delivery_country,
        total_weight,
        total_value,
        service_type,
        estimated_delivery
    ) VALUES (
        package_user_id,
        new_tracking_number,
        'pending',
        p_recipient_name,
        p_recipient_phone,
        p_delivery_address,
        p_delivery_city,
        p_delivery_country,
        total_weight,
        total_value,
        p_service_type,
        calculated_delivery_date
    ) RETURNING id INTO new_shipment_id;
    
    -- Update packages with shipment tracking number and status
    UPDATE packages 
    SET 
        status = 'shipped', 
        shipment_tracking_number = new_tracking_number,
        updated_at = NOW()
    WHERE id = ANY(p_package_ids);
    
    -- Link packages to shipment (maintain junction table for queries)
    INSERT INTO package_shipments (package_id, shipment_id)
    SELECT unnest(p_package_ids), new_shipment_id;
    
    -- Create notification for user
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        package_user_id,
        'Shipment Created',
        'Your packages have been shipped with tracking number: ' || new_tracking_number,
        'shipment_update'
    );
    
    RETURN json_build_object(
        'success', true,
        'tracking_number', new_tracking_number,
        'shipment_id', new_shipment_id,
        'packages_count', array_length(p_package_ids, 1),
        'total_weight', total_weight,
        'total_value', total_value
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- ============================================
-- 3. CREATE PUBLIC TRACKING FUNCTION
-- ============================================

-- Function for public tracking page (no authentication required)
CREATE OR REPLACE FUNCTION public_track_shipment(p_tracking_number TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    shipment_data JSON;
    packages_data JSON;
BEGIN
    -- Get shipment information
    SELECT json_build_object(
        'tracking_number', s.tracking_number,
        'status', s.status,
        'recipient_name', s.recipient_name,
        'delivery_city', s.delivery_city,
        'delivery_country', s.delivery_country,
        'service_type', s.service_type,
        'total_weight', s.total_weight,
        'created_at', s.created_at,
        'updated_at', s.updated_at
    ) INTO shipment_data
    FROM shipments s
    WHERE s.tracking_number = p_tracking_number;
    
    -- If no shipment found, return error
    IF shipment_data IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tracking number not found'
        );
    END IF;
    
    -- Get packages in this shipment
    SELECT json_agg(
        json_build_object(
            'package_id', p.package_id,
            'description', p.description,
            'weight', p.weight,
            'store_name', p.store_name,
            'vendor_name', p.vendor_name,
            'status', p.status
        )
    ) INTO packages_data
    FROM packages p
    WHERE p.shipment_tracking_number = p_tracking_number;
    
    RETURN json_build_object(
        'success', true,
        'shipment', shipment_data,
        'packages', COALESCE(packages_data, '[]'::json)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_shipment_from_packages(UUID[], UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public_track_shipment(TEXT) TO anon, authenticated;

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Check if column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'packages' 
AND column_name = 'shipment_tracking_number';

-- Check if index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'packages' 
AND indexname = 'idx_packages_shipment_tracking';

-- Sample query to see packages with shipment tracking
-- SELECT package_id, tracking_number, shipment_tracking_number, status 
-- FROM packages 
-- WHERE shipment_tracking_number IS NOT NULL;
