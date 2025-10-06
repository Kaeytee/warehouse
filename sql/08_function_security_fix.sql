-- Function Security Fix - Set Search Path
-- Fixes function search_path mutable security warnings
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Fix search_path for all functions by recreating them with SET search_path = ''

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
        -- Generate tracking number in format VC240001, VC240002, etc.
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
        -- Generate package ID in format PKG240001, PKG240002, etc.
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

-- Function to generate unique suite number
CREATE OR REPLACE FUNCTION generate_suite_number()
RETURNS TEXT
SET search_path = ''
AS $$
DECLARE
    new_suite_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate suite number in format S001, S002, etc.
        new_suite_number := 'S' || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this suite number already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.users WHERE suite_number = new_suite_number
        ) THEN
            RETURN new_suite_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RAISE EXCEPTION 'Unable to generate unique suite number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
DECLARE
    new_suite_number TEXT;
BEGIN
    -- Generate suite number for new user
    new_suite_number := generate_suite_number();
    
    -- Insert user profile with suite number
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        suite_number,
        role,
        status,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
        new_suite_number,
        'client',
        'active',
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone_number TEXT DEFAULT NULL
)
RETURNS JSON
SET search_path = ''
AS $$
BEGIN
    -- Update user profile
    UPDATE public.users 
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        phone_number = p_phone_number,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Profile updated successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
    p_user_id UUID,
    p_email_notifications BOOLEAN DEFAULT NULL,
    p_sms_notifications BOOLEAN DEFAULT NULL,
    p_whatsapp_notifications BOOLEAN DEFAULT NULL
)
RETURNS JSON
SET search_path = ''
AS $$
BEGIN
    -- Upsert user preferences
    INSERT INTO public.user_preferences (
        user_id,
        email_notifications,
        sms_notifications,
        whatsapp_notifications,
        updated_at
    ) VALUES (
        p_user_id,
        COALESCE(p_email_notifications, true),
        COALESCE(p_sms_notifications, true),
        COALESCE(p_whatsapp_notifications, true),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        email_notifications = COALESCE(p_email_notifications, user_preferences.email_notifications),
        sms_notifications = COALESCE(p_sms_notifications, user_preferences.sms_notifications),
        whatsapp_notifications = COALESCE(p_whatsapp_notifications, user_preferences.whatsapp_notifications),
        updated_at = NOW();
    
    RETURN json_build_object(
        'success', true,
        'message', 'Preferences updated successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple WhatsApp notification function
CREATE OR REPLACE FUNCTION send_whatsapp_notification(
    phone_number TEXT,
    title TEXT,
    message TEXT
)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
    -- Placeholder for WhatsApp integration
    -- This will be implemented with Supabase Edge Functions or external service
    RAISE NOTICE 'WhatsApp to %: % - %', phone_number, title, message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple SMS notification function
CREATE OR REPLACE FUNCTION send_sms_notification(
    phone_number TEXT,
    message TEXT
)
RETURNS VOID
SET search_path = ''
AS $$
BEGIN
    -- Placeholder for SMS integration
    -- This will be implemented with Supabase Edge Functions or external service
    RAISE NOTICE 'SMS to %: %', phone_number, message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
