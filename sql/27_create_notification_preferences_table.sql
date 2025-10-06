-- Create Notification Preferences Table
-- Fixes 404 error for notification_preferences endpoint
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. CREATE NOTIFICATION_PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Email notification preferences
    email_notifications BOOLEAN DEFAULT true,
    email_package_updates BOOLEAN DEFAULT true,
    email_shipment_updates BOOLEAN DEFAULT true,
    email_delivery_notifications BOOLEAN DEFAULT true,
    email_promotional BOOLEAN DEFAULT false,
    
    -- SMS notification preferences
    sms_notifications BOOLEAN DEFAULT true,
    sms_package_updates BOOLEAN DEFAULT true,
    sms_shipment_updates BOOLEAN DEFAULT true,
    sms_delivery_notifications BOOLEAN DEFAULT true,
    sms_promotional BOOLEAN DEFAULT false,
    
    -- WhatsApp notification preferences
    whatsapp_notifications BOOLEAN DEFAULT true,
    whatsapp_package_updates BOOLEAN DEFAULT true,
    whatsapp_shipment_updates BOOLEAN DEFAULT true,
    whatsapp_delivery_notifications BOOLEAN DEFAULT true,
    whatsapp_promotional BOOLEAN DEFAULT false,
    
    -- Push notification preferences
    push_notifications BOOLEAN DEFAULT true,
    push_package_updates BOOLEAN DEFAULT true,
    push_shipment_updates BOOLEAN DEFAULT true,
    push_delivery_notifications BOOLEAN DEFAULT true,
    push_promotional BOOLEAN DEFAULT false,
    
    -- General preferences
    notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')),
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone TEXT DEFAULT 'UTC',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_updated_at ON public.notification_preferences(updated_at);

-- ============================================
-- 3. CREATE UPDATE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notification preferences
CREATE POLICY "users_select_own_notification_preferences" ON public.notification_preferences
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Allow users to update their own notification preferences
CREATE POLICY "users_update_own_notification_preferences" ON public.notification_preferences
    FOR UPDATE 
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow users to insert their own notification preferences
CREATE POLICY "users_insert_own_notification_preferences" ON public.notification_preferences
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "service_role_notification_preferences" ON public.notification_preferences
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 5. CREATE DEFAULT PREFERENCES FOR EXISTING USERS
-- ============================================
INSERT INTO public.notification_preferences (
    user_id,
    email_notifications,
    sms_notifications,
    whatsapp_notifications,
    push_notifications,
    created_at,
    updated_at
)
SELECT 
    id as user_id,
    true as email_notifications,
    true as sms_notifications,
    true as whatsapp_notifications,
    true as push_notifications,
    NOW() as created_at,
    NOW() as updated_at
FROM public.users
WHERE id NOT IN (
    SELECT user_id FROM public.notification_preferences
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 6. CREATE FUNCTION TO AUTO-CREATE PREFERENCES FOR NEW USERS
-- ============================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create default notification preferences for new user
    INSERT INTO public.notification_preferences (
        user_id,
        email_notifications,
        sms_notifications,
        whatsapp_notifications,
        push_notifications,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        true,
        true,
        true,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE LOG 'Error creating notification preferences for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger to auto-create preferences for new users
CREATE TRIGGER trigger_create_default_notification_preferences
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- 7. VERIFY TABLE CREATION
-- ============================================
SELECT 
    'TABLE_CREATED' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 8. VERIFY RLS POLICIES
-- ============================================
SELECT 
    'RLS_POLICIES' as status,
    policyname as policy_name,
    cmd as command_type,
    roles
FROM pg_policies 
WHERE tablename = 'notification_preferences' 
AND schemaname = 'public'
ORDER BY policyname;
