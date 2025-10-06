-- Final Function Security Fix - Last 2 Functions
-- Fixes the remaining search_path warnings for update_user_profile and update_user_preferences
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Function to update user profile (fixed search_path)
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

-- Function to update user preferences (fixed search_path)
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
