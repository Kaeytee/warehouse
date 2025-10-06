-- Package and Shipment Management Functions
-- Warehouse intake, notifications, and admin management
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Function to generate unique tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
    new_tracking_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate tracking number in format VC240001, VC240002, etc.
        new_tracking_number := 'VC' || TO_CHAR(NOW(), 'YY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this tracking number already exists
        IF NOT EXISTS (
            SELECT 1 FROM packages WHERE tracking_number = new_tracking_number
            UNION
            SELECT 1 FROM shipments WHERE tracking_number = new_tracking_number
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
RETURNS TEXT AS $$
DECLARE
    new_package_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate package ID in format PKG240001, PKG240002, etc.
        new_package_id := 'PKG' || TO_CHAR(NOW(), 'YY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this package ID already exists
        IF NOT EXISTS (
            SELECT 1 FROM packages WHERE package_id = new_package_id
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

-- Function for warehouse staff to intake packages (scan/manual entry)
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
RETURNS JSON AS $$
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
        SELECT 1 FROM users 
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
    FROM users 
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
    INSERT INTO packages (
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
    INSERT INTO notifications (
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
        SELECT 1 FROM user_preferences 
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
        SELECT 1 FROM user_preferences 
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

-- Simple WhatsApp notification function (placeholder for Supabase integration)
CREATE OR REPLACE FUNCTION send_whatsapp_notification(
    phone_number TEXT,
    title TEXT,
    message TEXT
)
RETURNS VOID AS $$
BEGIN
    -- This will be implemented with Supabase Edge Functions
    -- For now, just log the notification
    RAISE LOG 'WhatsApp to %: % - %', phone_number, title, message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple SMS notification function (placeholder for Supabase integration)
CREATE OR REPLACE FUNCTION send_sms_notification(
    phone_number TEXT,
    message TEXT
)
RETURNS VOID AS $$
BEGIN
    -- This will be implemented with Supabase Edge Functions
    -- For now, just log the notification
    RAISE LOG 'SMS to %: %', phone_number, message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update package status (admin only)
CREATE OR REPLACE FUNCTION update_package_status(
    p_package_id UUID,
    p_new_status TEXT,
    p_admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    package_owner_id UUID;
    old_status TEXT;
    tracking_num TEXT;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_user_id 
        AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get package info
    SELECT user_id, status, tracking_number 
    INTO package_owner_id, old_status, tracking_num
    FROM packages 
    WHERE id = p_package_id;
    
    IF package_owner_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Package not found'
        );
    END IF;
    
    -- Update package status
    UPDATE packages 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_package_id;
    
    -- Create notification for user
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        package_owner_id,
        'Package Status Updated',
        'Your package ' || tracking_num || ' status has been updated to ' || p_new_status || '.',
        'package_update'
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Package status updated successfully',
        'old_status', old_status,
        'new_status', p_new_status
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
RETURNS JSON AS $$
DECLARE
    new_tracking_number TEXT;
    new_shipment_id UUID;
    package_id UUID;
    package_user_id UUID;
    affected_users UUID[];
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
    
    -- Verify all packages exist and are in 'received' or 'processing' status
    IF EXISTS (
        SELECT 1 FROM packages 
        WHERE id = ANY(p_package_ids) 
        AND status NOT IN ('received', 'processing')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Some packages are not ready for shipment'
        );
    END IF;
    
    -- Generate tracking number
    new_tracking_number := generate_tracking_number();
    
    -- Get the first user for shipment record (assuming same user for grouped packages)
    SELECT user_id INTO package_user_id
    FROM packages 
    WHERE id = p_package_ids[1];
    
    -- Create shipment
    INSERT INTO shipments (
        tracking_number,
        user_id,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_city,
        delivery_country,
        service_type,
        status
    ) VALUES (
        new_tracking_number,
        package_user_id,
        p_recipient_name,
        p_recipient_phone,
        p_delivery_address,
        p_delivery_city,
        p_delivery_country,
        p_service_type,
        'processing'
    ) RETURNING id INTO new_shipment_id;
    
    -- Link packages to shipment and update their status
    FOREACH package_id IN ARRAY p_package_ids
    LOOP
        -- Insert package-shipment relationship
        INSERT INTO package_shipments (package_id, shipment_id)
        VALUES (package_id, new_shipment_id);
        
        -- Update package status to 'shipped'
        UPDATE packages 
        SET status = 'shipped', updated_at = NOW()
        WHERE id = package_id;
        
        -- Collect affected users for notifications
        SELECT user_id INTO package_user_id FROM packages WHERE id = package_id;
        affected_users := array_append(affected_users, package_user_id);
    END LOOP;
    
    -- Send notifications to all affected users
    PERFORM notify_users_shipment_created(affected_users, new_tracking_number);
    
    RETURN json_build_object(
        'success', true,
        'shipment_id', new_shipment_id,
        'tracking_number', new_tracking_number,
        'packages_count', array_length(p_package_ids, 1),
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

-- Function to update shipment status and cascade to all packages
CREATE OR REPLACE FUNCTION update_shipment_status(
    p_shipment_id UUID,
    p_new_status TEXT,
    p_warehouse_staff_id UUID
)
RETURNS JSON AS $$
DECLARE
    old_status TEXT;
    shipment_tracking TEXT;
    affected_users UUID[];
    package_rec RECORD;
BEGIN
    -- Verify warehouse staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_warehouse_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get shipment info
    SELECT status, tracking_number 
    INTO old_status, shipment_tracking
    FROM shipments 
    WHERE id = p_shipment_id;
    
    IF old_status IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Shipment not found'
        );
    END IF;
    
    -- Update shipment status
    UPDATE shipments 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_shipment_id;
    
    -- Update all packages in this shipment
    FOR package_rec IN 
        SELECT p.id, p.user_id, p.package_id, p.tracking_number
        FROM packages p
        JOIN package_shipments ps ON p.id = ps.package_id
        WHERE ps.shipment_id = p_shipment_id
    LOOP
        -- Update package status to match shipment
        UPDATE packages 
        SET 
            status = p_new_status,
            updated_at = NOW()
        WHERE id = package_rec.id;
        
        -- Collect affected users
        affected_users := array_append(affected_users, package_rec.user_id);
        
        -- Create individual package notification with package ID
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type
        ) VALUES (
            package_rec.user_id,
            'Package Status Updated',
            'Your package ' || package_rec.package_id || ' is now ' || p_new_status || '. Shipment: ' || shipment_tracking,
            'package_update'
        );
    END LOOP;
    
    -- Send WhatsApp and SMS notifications to all affected users
    PERFORM notify_users_shipment_status_update(affected_users, shipment_tracking, p_new_status);
    
    RETURN json_build_object(
        'success', true,
        'shipment_tracking', shipment_tracking,
        'old_status', old_status,
        'new_status', p_new_status,
        'packages_updated', array_length(affected_users, 1),
        'message', 'Shipment and all packages updated successfully'
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
RETURNS VOID AS $$
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
        FROM users 
        WHERE id = user_id;
        
        -- Send WhatsApp notification
        IF user_whatsapp IS NOT NULL AND EXISTS (
            SELECT 1 FROM user_preferences 
            WHERE user_id = notify_users_shipment_created.user_id 
            AND whatsapp_notifications = true
        ) THEN
            PERFORM send_whatsapp_notification(
                user_whatsapp,
                'Shipment Created',
                'Dear ' || (SELECT first_name || ' ' || last_name FROM users WHERE id = user_id) || ', your packages have been grouped into shipment ' || tracking_number || ' and are ready for dispatch.'
            );
        END IF;
        
        -- Send SMS notification
        IF user_phone IS NOT NULL AND EXISTS (
            SELECT 1 FROM user_preferences 
            WHERE user_id = notify_users_shipment_created.user_id 
            AND sms_notifications = true
        ) THEN
            PERFORM send_sms_notification(
                user_phone,
                'Dear ' || (SELECT first_name || ' ' || last_name FROM users WHERE id = user_id) || ', your packages have been grouped into shipment ' || tracking_number || ' and are ready for dispatch. Track at: vanguardcargo.com'
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
RETURNS VOID AS $$
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
        FROM users 
        WHERE id = user_id;
        
        -- Send WhatsApp notification
        IF user_whatsapp IS NOT NULL AND EXISTS (
            SELECT 1 FROM user_preferences 
            WHERE user_id = notify_users_shipment_status_update.user_id 
            AND whatsapp_notifications = true
        ) THEN
            PERFORM send_whatsapp_notification(
                user_whatsapp,
                'Package Status Update',
                'Dear ' || (SELECT first_name || ' ' || last_name FROM users WHERE id = user_id) || ', your package is now ' || new_status || '. Shipment: ' || tracking_number
            );
        END IF;
        
        -- Send SMS notification
        IF user_phone IS NOT NULL AND EXISTS (
            SELECT 1 FROM user_preferences 
            WHERE user_id = notify_users_shipment_status_update.user_id 
            AND sms_notifications = true
        ) THEN
            PERFORM send_sms_notification(
                user_phone,
                'Dear ' || (SELECT first_name || ' ' || last_name FROM users WHERE id = user_id) || ', your package is now ' || new_status || '. Shipment: ' || tracking_number || '. Track at: vanguardcargo.com'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create shipment
-- Legacy function kept for compatibility
CREATE OR REPLACE FUNCTION create_shipment(
    p_user_id UUID,
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
BEGIN
    -- Generate tracking number
    new_tracking_number := generate_tracking_number();
    
    -- Insert new shipment
    INSERT INTO shipments (
        tracking_number,
        user_id,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_city,
        delivery_country,
        service_type,
        status
    ) VALUES (
        new_tracking_number,
        p_user_id,
        p_recipient_name,
        p_recipient_phone,
        p_delivery_address,
        p_delivery_city,
        p_delivery_country,
        p_service_type,
        'pending'
    ) RETURNING id INTO new_shipment_id;
    
    -- Create notification
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        p_user_id,
        'Shipment Created',
        'Your shipment ' || new_tracking_number || ' has been created successfully.',
        'shipment_update'
    );
    
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
RETURNS JSON AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true
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

-- Admin function to create new user (admin, warehouse_admin)
CREATE OR REPLACE FUNCTION admin_create_user(
    p_admin_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role TEXT,
    p_phone_number TEXT DEFAULT NULL,
    p_whatsapp_number TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    new_suite_number TEXT;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Generate new user ID and suite number
    new_user_id := gen_random_uuid();
    new_suite_number := generate_suite_number();
    
    -- Insert new user
    INSERT INTO users (
        id,
        email,
        first_name,
        last_name,
        role,
        suite_number,
        phone_number,
        whatsapp_number,
        created_by,
        email_verified
    ) VALUES (
        new_user_id,
        p_email,
        p_first_name,
        p_last_name,
        p_role,
        new_suite_number,
        p_phone_number,
        p_whatsapp_number,
        p_admin_id,
        false
    );
    
    -- Create default preferences
    INSERT INTO user_preferences (user_id)
    VALUES (new_user_id);
    
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
RETURNS JSON AS $$
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Update user status to reported
    UPDATE users 
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
RETURNS JSON AS $$
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Update user status to suspended
    UPDATE users 
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
