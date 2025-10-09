-- =====================================================
-- SQL Fix: Case-Insensitive Suite Number Lookup
-- =====================================================
-- Purpose: Fix package intake function to use case-insensitive
--          suite number matching (ILIKE) to match frontend behavior
-- Date: 2025-10-09
-- Author: Senior Software Engineer
-- Issue: Frontend uses ILIKE but backend uses exact match (=)
-- =====================================================

-- First, ensure helper functions exist

-- Function to generate unique tracking number
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TEXT
SET search_path = 'public'
AS $$
DECLARE
    new_tracking_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate tracking number in format VC250001, VC250002, etc.
        new_tracking_number := 'VC' || TO_CHAR(NOW(), 'YY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this tracking number already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.packages WHERE tracking_number = new_tracking_number
            UNION
            SELECT 1 FROM public.shipments WHERE tracking_number = new_tracking_number
        ) THEN
            RETURN new_tracking_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique tracking number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique package ID
CREATE OR REPLACE FUNCTION public.generate_package_id()
RETURNS TEXT
SET search_path = 'public'
AS $$
DECLARE
    new_package_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate package ID in format PKG250001, PKG250002, etc.
        new_package_id := 'PKG' || TO_CHAR(NOW(), 'YY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this package ID already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.packages WHERE package_id = new_package_id
        ) THEN
            RETURN new_package_id;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique package ID';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now fix warehouse_package_intake function with case-insensitive suite number lookup
CREATE OR REPLACE FUNCTION public.warehouse_package_intake(
    p_user_suite_number TEXT,
    p_description TEXT,
    p_warehouse_staff_id UUID,
    p_weight DECIMAL DEFAULT NULL,
    p_declared_value DECIMAL DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL,
    p_vendor_name TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
SET search_path = 'public'
AS $$
DECLARE
    new_tracking_number TEXT;
    new_package_id_text TEXT;
    new_package_uuid UUID;
    target_user_id UUID;
    user_whatsapp TEXT;
    user_phone TEXT;
    user_first_name TEXT;
    user_last_name TEXT;
BEGIN
    -- Verify warehouse staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_warehouse_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions for package intake'
        );
    END IF;
    
    -- Find user by suite number (CASE-INSENSITIVE using ILIKE)
    -- This matches the frontend behavior for consistent user lookup
    SELECT id, whatsapp_number, phone_number, first_name, last_name 
    INTO target_user_id, user_whatsapp, user_phone, user_first_name, user_last_name
    FROM public.users 
    WHERE UPPER(suite_number) = UPPER(TRIM(p_user_suite_number))
    AND status = 'active'
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found with suite number: ' || p_user_suite_number
        );
    END IF;
    
    -- Generate tracking number and package ID
    new_tracking_number := public.generate_tracking_number();
    new_package_id_text := public.generate_package_id();
    
    -- Insert new package with received status and received_at timestamp
    INSERT INTO public.packages (
        package_id,
        tracking_number,
        user_id,
        description,
        status,
        weight,
        declared_value,
        store_name,
        vendor_name,
        notes,
        scanned_by,
        intake_date,
        received_at,  -- Set received_at for today's metrics
        created_at,
        updated_at
    )
    VALUES (
        new_package_id_text,
        new_tracking_number,
        target_user_id,
        p_description,
        'received',
        p_weight,
        p_declared_value,
        p_store_name,
        p_vendor_name,
        p_notes,
        p_warehouse_staff_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,  -- Set received_at to now for accurate daily metrics
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO new_package_uuid;

    -- Optional: Log the package intake activity (only if activity_log table exists)
    -- Wrapped in BEGIN...EXCEPTION block to prevent failure if table doesn't exist
    BEGIN
        INSERT INTO public.activity_log (
            user_id,
            action,
            entity_type,
            entity_id,
            details,
            ip_address,
            created_at
        )
        VALUES (
            p_warehouse_staff_id,
            'package_intake',
            'package',
            new_package_uuid,
            json_build_object(
                'package_id', new_package_id_text,
                'tracking_number', new_tracking_number,
                'user_suite', p_user_suite_number,
                'description', p_description
            ),
            '0.0.0.0',
            CURRENT_TIMESTAMP
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Silently ignore if activity_log table doesn't exist
            NULL;
    END;

    -- Return success with package details
    RETURN json_build_object(
        'success', true,
        'package_id', new_package_id_text,
        'tracking_number', new_tracking_number,
        'user_id', target_user_id,
        'status', 'received',
        'message', 'Package intake successful'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.warehouse_package_intake IS 
'Package intake function with case-insensitive suite number lookup and received_at tracking';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.warehouse_package_intake TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_tracking_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_package_id TO authenticated;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Test the function with a sample suite number
-- SELECT warehouse_package_intake(
--     'VC-087',  -- Case variations should all work: vc-087, Vc-087, VC-087
--     'Test Package',
--     'your-staff-uuid-here',
--     1.5,
--     100.00,
--     'Amazon',
--     'Test Vendor',
--     'Test notes'
-- );

-- Verify users table has the suite number
SELECT id, first_name, last_name, suite_number, status 
FROM users 
WHERE UPPER(suite_number) = UPPER('VC-087');

-- =====================================================
-- Key Changes Made
-- =====================================================
-- 1. Changed suite number lookup from exact match (=) to case-insensitive (UPPER() comparison)
-- 2. Added TRIM() to handle whitespace in suite numbers
-- 3. Added LIMIT 1 to ensure single user returned
-- 4. Added received_at timestamp to INSERT for accurate daily metrics
-- 5. Added 'super_admin' to role check for consistency
-- 6. Improved error handling and documentation
-- =====================================================
