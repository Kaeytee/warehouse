-- Remaining Functions Security Fix - Set Search Path
-- Fixes remaining function search_path mutable security warnings
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Function for warehouse staff to intake packages
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
    
    -- Send WhatsApp notification (if enabled and number exists)
    IF user_whatsapp IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_preferences 
        WHERE user_id = target_user_id 
        AND whatsapp_notifications = true
    ) THEN
        PERFORM send_whatsapp_notification(
            user_whatsapp,
            'Package Received',
            'Dear ' || user_first_name || ' ' || user_last_name || ', your package ' || new_package_id_text || ' has been received at our warehouse and is ready for processing. You can track your package using ID: ' || new_package_id_text
        );
    END IF;
    
    -- Send SMS notification (if enabled and number exists)
    IF user_phone IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_preferences 
        WHERE user_id = target_user_id 
        AND sms_notifications = true
    ) THEN
        PERFORM send_sms_notification(
            user_phone,
            'Dear ' || user_first_name || ' ' || user_last_name || ', your package ' || new_package_id_text || ' has been received at our warehouse. Track at: vanguardcargo.com'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'package_uuid', new_package_uuid,
        'package_id', new_package_id_text,
        'tracking_number', new_tracking_number,
        'user_id', target_user_id,
        'message', 'Package intake completed successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update package status
CREATE OR REPLACE FUNCTION update_package_status(
    p_package_id UUID,
    p_new_status TEXT,
    p_admin_user_id UUID
)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
    package_owner_id UUID;
    package_tracking_number TEXT;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_user_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to update package status'
        );
    END IF;
    
    -- Get package info
    SELECT user_id, tracking_number 
    INTO package_owner_id, package_tracking_number
    FROM public.packages 
    WHERE id = p_package_id;
    
    IF package_owner_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Package not found'
        );
    END IF;
    
    -- Update package status
    UPDATE public.packages 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_package_id;
    
    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        package_owner_id,
        'Package Status Update',
        'Your package status has been updated to: ' || p_new_status,
        'package_update'
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Package status updated successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create shipment from multiple packages
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
SET search_path = ''
AS $$
DECLARE
    new_tracking_number TEXT;
    new_shipment_id UUID;
    package_id UUID;
    user_ids UUID[];
BEGIN
    -- Verify warehouse staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_warehouse_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to create shipment'
        );
    END IF;
    
    -- Generate tracking number
    new_tracking_number := generate_tracking_number();
    
    -- Create shipment
    INSERT INTO public.shipments (
        tracking_number,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_city,
        delivery_country,
        service_type,
        status,
        created_by,
        created_at
    ) VALUES (
        new_tracking_number,
        p_recipient_name,
        p_recipient_phone,
        p_delivery_address,
        p_delivery_city,
        p_delivery_country,
        p_service_type,
        'processing',
        p_warehouse_staff_id,
        NOW()
    ) RETURNING id INTO new_shipment_id;
    
    -- Link packages to shipment and collect user IDs
    FOREACH package_id IN ARRAY p_package_ids
    LOOP
        -- Update package status and link to shipment
        UPDATE public.packages 
        SET 
            status = 'grouped',
            updated_at = NOW()
        WHERE id = package_id;
        
        -- Create package-shipment relationship
        INSERT INTO public.package_shipments (package_id, shipment_id)
        VALUES (package_id, new_shipment_id);
        
        -- Collect user ID for notifications
        SELECT array_append(user_ids, user_id) INTO user_ids
        FROM public.packages 
        WHERE id = package_id;
    END LOOP;
    
    -- Notify users about shipment creation
    PERFORM notify_users_shipment_created(user_ids, new_tracking_number);
    
    RETURN json_build_object(
        'success', true,
        'shipment_id', new_shipment_id,
        'tracking_number', new_tracking_number,
        'message', 'Shipment created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update shipment status
CREATE OR REPLACE FUNCTION update_shipment_status(
    p_shipment_id UUID,
    p_new_status TEXT,
    p_warehouse_staff_id UUID
)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
    shipment_tracking_number TEXT;
    user_ids UUID[];
BEGIN
    -- Verify warehouse staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_warehouse_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to update shipment status'
        );
    END IF;
    
    -- Get shipment tracking number
    SELECT tracking_number INTO shipment_tracking_number
    FROM public.shipments 
    WHERE id = p_shipment_id;
    
    IF shipment_tracking_number IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Shipment not found'
        );
    END IF;
    
    -- Update shipment status
    UPDATE public.shipments 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_shipment_id;
    
    -- Update all packages in this shipment
    UPDATE public.packages 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id IN (
        SELECT package_id 
        FROM public.package_shipments 
        WHERE shipment_id = p_shipment_id
    );
    
    -- Collect user IDs for notifications
    SELECT array_agg(DISTINCT p.user_id) INTO user_ids
    FROM public.packages p
    JOIN public.package_shipments ps ON p.id = ps.package_id
    WHERE ps.shipment_id = p_shipment_id;
    
    -- Notify users about status update
    PERFORM notify_users_shipment_status_update(user_ids, shipment_tracking_number, p_new_status);
    
    RETURN json_build_object(
        'success', true,
        'message', 'Shipment status updated successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to notify users about shipment creation
CREATE OR REPLACE FUNCTION notify_users_shipment_created(
    user_ids UUID[],
    tracking_number TEXT
)
RETURNS VOID
SET search_path = ''
AS $$
DECLARE
    user_id UUID;
    user_whatsapp TEXT;
    user_phone TEXT;
BEGIN
    FOREACH user_id IN ARRAY user_ids
    LOOP
        -- Get user contact info
        SELECT whatsapp_number, phone_number 
        INTO user_whatsapp, user_phone
        FROM public.users 
        WHERE id = user_id;
        
        -- Create in-app notification
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type
        ) VALUES (
            user_id,
            'Shipment Created',
            'Your packages have been grouped into shipment ' || tracking_number || ' and are ready for dispatch.',
            'shipment_update'
        );
        
        -- Send WhatsApp notification
        IF user_whatsapp IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_preferences 
            WHERE user_id = notify_users_shipment_created.user_id 
            AND whatsapp_notifications = true
        ) THEN
            PERFORM send_whatsapp_notification(
                user_whatsapp,
                'Shipment Created',
                'Dear ' || (SELECT first_name || ' ' || last_name FROM public.users WHERE id = user_id) || ', your packages have been grouped into shipment ' || tracking_number || ' and are ready for dispatch.'
            );
        END IF;
        
        -- Send SMS notification
        IF user_phone IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_preferences 
            WHERE user_id = notify_users_shipment_created.user_id 
            AND sms_notifications = true
        ) THEN
            PERFORM send_sms_notification(
                user_phone,
                'Dear ' || (SELECT first_name || ' ' || last_name FROM public.users WHERE id = user_id) || ', your packages have been grouped into shipment ' || tracking_number || ' and are ready for dispatch. Track at: vanguardcargo.com'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to notify users about shipment status updates
CREATE OR REPLACE FUNCTION notify_users_shipment_status_update(
    user_ids UUID[],
    tracking_number TEXT,
    new_status TEXT
)
RETURNS VOID
SET search_path = ''
AS $$
DECLARE
    user_id UUID;
    user_whatsapp TEXT;
    user_phone TEXT;
BEGIN
    FOREACH user_id IN ARRAY user_ids
    LOOP
        -- Get user contact info
        SELECT whatsapp_number, phone_number 
        INTO user_whatsapp, user_phone
        FROM public.users 
        WHERE id = user_id;
        
        -- Create in-app notification
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type
        ) VALUES (
            user_id,
            'Package Status Update',
            'Your package is now ' || new_status || '. Shipment: ' || tracking_number,
            'package_update'
        );
        
        -- Send WhatsApp notification
        IF user_whatsapp IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_preferences 
            WHERE user_id = notify_users_shipment_status_update.user_id 
            AND whatsapp_notifications = true
        ) THEN
            PERFORM send_whatsapp_notification(
                user_whatsapp,
                'Package Status Update',
                'Dear ' || (SELECT first_name || ' ' || last_name FROM public.users WHERE id = user_id) || ', your package is now ' || new_status || '. Shipment: ' || tracking_number
            );
        END IF;
        
        -- Send SMS notification
        IF user_phone IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_preferences 
            WHERE user_id = notify_users_shipment_status_update.user_id 
            AND sms_notifications = true
        ) THEN
            PERFORM send_sms_notification(
                user_phone,
                'Dear ' || (SELECT first_name || ' ' || last_name FROM public.users WHERE id = user_id) || ', your package is now ' || new_status || '. Shipment: ' || tracking_number || '. Track at: vanguardcargo.com'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Legacy function to create shipment
CREATE OR REPLACE FUNCTION create_shipment(
    p_user_id UUID,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_delivery_address TEXT,
    p_delivery_city TEXT,
    p_delivery_country TEXT,
    p_service_type TEXT DEFAULT 'standard'
)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
    new_tracking_number TEXT;
    new_shipment_id UUID;
BEGIN
    -- Generate tracking number
    new_tracking_number := generate_tracking_number();
    
    -- Create shipment
    INSERT INTO public.shipments (
        tracking_number,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_city,
        delivery_country,
        service_type,
        status,
        created_by,
        created_at
    ) VALUES (
        new_tracking_number,
        p_recipient_name,
        p_recipient_phone,
        p_delivery_address,
        p_delivery_city,
        p_delivery_country,
        p_service_type,
        'processing',
        p_user_id,
        NOW()
    ) RETURNING id INTO new_shipment_id;
    
    RETURN json_build_object(
        'success', true,
        'shipment_id', new_shipment_id,
        'tracking_number', new_tracking_number,
        'message', 'Shipment created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS JSON
SET search_path = ''
AS $$
BEGIN
    -- Update notification as read
    UPDATE public.notifications 
    SET 
        read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id 
    AND user_id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Notification marked as read'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to create new user
CREATE OR REPLACE FUNCTION admin_create_user(
    p_admin_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role TEXT,
    p_phone_number TEXT DEFAULT NULL,
    p_whatsapp_number TEXT DEFAULT NULL
)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
    new_user_id UUID;
    new_suite_number TEXT;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id 
        AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to create user'
        );
    END IF;
    
    -- Generate new user ID and suite number
    new_user_id := gen_random_uuid();
    new_suite_number := generate_suite_number();
    
    -- Create user
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        role,
        suite_number,
        phone_number,
        whatsapp_number,
        status,
        created_by,
        created_at
    ) VALUES (
        new_user_id,
        p_email,
        p_first_name,
        p_last_name,
        p_role,
        new_suite_number,
        p_phone_number,
        p_whatsapp_number,
        'active',
        p_admin_id,
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'suite_number', new_suite_number,
        'message', 'User created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to report user
CREATE OR REPLACE FUNCTION admin_report_user(
    p_admin_id UUID,
    p_user_id UUID,
    p_report_reason TEXT
)
RETURNS JSON
SET search_path = ''
AS $$
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id 
        AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to report user'
        );
    END IF;
    
    -- Update user status to reported
    UPDATE public.users 
    SET 
        status = 'reported',
        reported_by = p_admin_id,
        report_reason = p_report_reason,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User reported successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to revoke user access
CREATE OR REPLACE FUNCTION admin_revoke_user(
    p_admin_id UUID,
    p_user_id UUID
)
RETURNS JSON
SET search_path = ''
AS $$
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id 
        AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to revoke user access'
        );
    END IF;
    
    -- Update user status to suspended
    UPDATE public.users 
    SET 
        status = 'suspended',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User access revoked successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
