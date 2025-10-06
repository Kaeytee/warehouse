-- Deploy Package Intake Functions
-- Ensures all required functions for package intake are deployed
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- First, create the helper functions that warehouse_package_intake depends on

-- Function to generate unique tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT
SET search_path = ''
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
CREATE OR REPLACE FUNCTION generate_package_id()
RETURNS TEXT
SET search_path = ''
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

-- Now create the main warehouse_package_intake function
CREATE OR REPLACE FUNCTION warehouse_package_intake(
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
SET search_path = ''
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
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions for package intake'
        );
    END IF;
    
    -- Find user by suite number
    SELECT id, whatsapp_number, phone_number, first_name, last_name 
    INTO target_user_id, user_whatsapp, user_phone, user_first_name, user_last_name
    FROM public.users 
    WHERE suite_number = p_user_suite_number 
    AND status = 'active';
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found with suite number: ' || p_user_suite_number
        );
    END IF;
    
    -- Generate tracking number and package ID
    new_tracking_number := generate_tracking_number();
    new_package_id_text := generate_package_id();
    
    -- Insert new package
    INSERT INTO public.packages (
        package_id,
        tracking_number,
        user_id,
        description,
        weight,
        declared_value,
        store_name,
        vendor_name,
        notes,
        status,
        scanned_by,
        intake_date
    ) VALUES (
        new_package_id_text,
        new_tracking_number,
        target_user_id,
        p_description,
        p_weight,
        p_declared_value,
        p_store_name,
        p_vendor_name,
        p_notes,
        'received',
        p_warehouse_staff_id,
        NOW()
    ) RETURNING id INTO new_package_uuid;
    
    -- Create in-app notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        target_user_id,
        'Package Received',
        'Your package ' || new_package_id_text || ' has been received at our warehouse and is ready for processing.',
        'package_update'
    );
    
    -- Return success response with package details
    RETURN json_build_object(
        'success', true,
        'package_id', new_package_id_text,
        'tracking_number', new_tracking_number,
        'user_id', target_user_id,
        'user_name', user_first_name || ' ' || user_last_name,
        'suite_number', p_user_suite_number,
        'description', p_description,
        'weight', p_weight,
        'store_name', p_store_name,
        'vendor_name', p_vendor_name,
        'notes', p_notes,
        'status', 'received',
        'intake_date', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_tracking_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_package_id() TO authenticated;
GRANT EXECUTE ON FUNCTION warehouse_package_intake(TEXT, TEXT, UUID, DECIMAL, DECIMAL, TEXT, TEXT, TEXT) TO authenticated;

-- Verify all functions exist and work
DO $$
DECLARE
    test_tracking_number TEXT;
    test_package_id TEXT;
BEGIN
    -- Test generate_tracking_number function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_tracking_number') THEN
        test_tracking_number := generate_tracking_number();
        RAISE NOTICE 'SUCCESS: generate_tracking_number() created and tested: %', test_tracking_number;
    ELSE
        RAISE EXCEPTION 'FAILED: generate_tracking_number() function not found';
    END IF;
    
    -- Test generate_package_id function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_package_id') THEN
        test_package_id := generate_package_id();
        RAISE NOTICE 'SUCCESS: generate_package_id() created and tested: %', test_package_id;
    ELSE
        RAISE EXCEPTION 'FAILED: generate_package_id() function not found';
    END IF;
    
    -- Test warehouse_package_intake function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'warehouse_package_intake') THEN
        RAISE NOTICE 'SUCCESS: warehouse_package_intake() function created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: warehouse_package_intake() function not found';
    END IF;
    
    RAISE NOTICE 'All package intake functions deployed successfully!';
END $$;
