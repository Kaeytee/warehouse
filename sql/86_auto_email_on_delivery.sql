-- ============================================================================
-- AUTOMATIC EMAIL NOTIFICATION ON PACKAGE DELIVERY
-- ============================================================================
-- Triggers Supabase Edge Function to send email when package status changes
-- to 'delivered' - completely automated, no frontend involvement
--
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-09
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable HTTP Extension (Required for calling Edge Functions)
-- ============================================================================

-- Enable pg_net extension for making HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT '✅ pg_net extension enabled' AS status;

-- ============================================================================
-- STEP 2: Create Function to Call Edge Function
-- ============================================================================

-- Function to call the send-notification-email Edge Function
-- This is invoked by the trigger when package status changes
CREATE OR REPLACE FUNCTION trigger_delivery_email()
RETURNS TRIGGER AS $$
DECLARE
    user_data RECORD;
    edge_function_url TEXT;
    supabase_anon_key TEXT;
    request_id BIGINT;
    status_icon TEXT;
    status_title TEXT;
    status_message TEXT;
BEGIN
    -- Only proceed if status actually changed
    IF NEW.status != OLD.status THEN
        
        -- Fetch user details for email
        SELECT 
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            u.suite_number
        INTO user_data
        FROM users u
        WHERE u.id = NEW.user_id;
        
        -- Check if user exists and has email
        IF user_data.email IS NULL THEN
            RAISE NOTICE 'No email found for user %, skipping email notification', NEW.user_id;
            RETURN NEW;
        END IF;
        
        -- Set status-specific icon, title, and message
        CASE NEW.status
            WHEN 'received' THEN
                status_icon := '📦';
                status_title := 'Package Received';
                status_message := 'Your package ' || NEW.package_id || ' has been received at our warehouse and is being processed.';
            WHEN 'processing' THEN
                status_icon := '⚙️';
                status_title := 'Package Processing';
                status_message := 'Your package ' || NEW.package_id || ' is currently being processed and prepared for shipment.';
            WHEN 'arrived' THEN
                status_icon := '✅';
                status_title := 'Package Arrived';
                status_message := 'Great news! Your package ' || NEW.package_id || ' has arrived at the warehouse and is ready for pickup. Check your delivery code in the app.';
            WHEN 'delivered' THEN
                status_icon := '🎉';
                status_title := 'Package Delivered';
                status_message := 'Your package ' || NEW.package_id || ' has been successfully delivered! Thank you for choosing VanguardCargo.';
            WHEN 'shipped' THEN
                status_icon := '🚚';
                status_title := 'Package Shipped';
                status_message := 'Your package ' || NEW.package_id || ' has been shipped and is on its way.';
            WHEN 'in_transit' THEN
                status_icon := '🛫';
                status_title := 'Package In Transit';
                status_message := 'Your package ' || NEW.package_id || ' is currently in transit to the destination warehouse.';
            ELSE
                status_icon := '📦';
                status_title := 'Package Status Update';
                status_message := 'Your package ' || NEW.package_id || ' status has been updated to: ' || NEW.status;
        END CASE;
        
        -- ====================================================================
        -- IMPORTANT: Set your Supabase project URL and anon key here
        -- ====================================================================
        -- Get from: Supabase Dashboard > Settings > API
        -- Replace 'YOUR_PROJECT_REF' with your actual project reference
        -- Replace 'YOUR_ANON_KEY' with your actual anonymous key
        -- ====================================================================
        
        edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email';
        supabase_anon_key := 'YOUR_ANON_KEY';
        
        -- ====================================================================
        -- Call Edge Function via HTTP POST (matches your Edge Function format)
        -- ====================================================================
        SELECT net.http_post(
            url := edge_function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || supabase_anon_key
            ),
            body := jsonb_build_object(
                'to', user_data.email,
                'userName', user_data.first_name || ' ' || user_data.last_name,
                'notificationTitle', status_title,
                'notificationMessage', status_message,
                'notificationIcon', status_icon,
                'notificationType', 'package_update',
                'trackingNumber', NEW.tracking_number,
                'packageId', NEW.package_id,
                'suiteNumber', user_data.suite_number,
                'status', NEW.status,
                'logToDatabase', false
            )
        ) INTO request_id;
        
        RAISE NOTICE '✅ Email notification queued for user % (Package: %), Request ID: %', 
            user_data.email, 
            NEW.package_id,
            request_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the package update
        RAISE WARNING '❌ Failed to trigger email notification: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Set Function Search Path
-- ============================================================================

ALTER FUNCTION public.trigger_delivery_email() SET search_path = public, extensions;

-- ============================================================================
-- STEP 4: Create Trigger on Packages Table
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_send_delivery_email ON packages;

-- Create trigger that fires AFTER package status update (ANY status change)
CREATE TRIGGER trigger_send_delivery_email
    AFTER UPDATE OF status ON packages
    FOR EACH ROW
    WHEN (NEW.status != OLD.status)
    EXECUTE FUNCTION trigger_delivery_email();

SELECT '✅ Trigger created: trigger_send_delivery_email (fires on ANY status change)' AS status;

-- ============================================================================
-- STEP 5: Create Additional Trigger for Shipment Status Changes (OPTIONAL)
-- ============================================================================

-- Function to send email when shipment status changes (arrived, in_transit, etc.)
CREATE OR REPLACE FUNCTION trigger_shipment_status_email()
RETURNS TRIGGER AS $$
DECLARE
    package_rec RECORD;
    user_data RECORD;
    edge_function_url TEXT;
    supabase_anon_key TEXT;
    request_id BIGINT;
    status_icon TEXT;
    status_title TEXT;
    status_message TEXT;
BEGIN
    -- Only proceed if status actually changed
    IF NEW.status != OLD.status THEN
        
        -- Set status-specific icon, title, and message
        CASE NEW.status
            WHEN 'pending' THEN
                status_icon := '📝';
                status_title := 'Shipment Pending';
                status_message := 'Your shipment ' || NEW.tracking_number || ' has been created and is pending processing.';
            WHEN 'processing' THEN
                status_icon := '⚙️';
                status_title := 'Shipment Processing';
                status_message := 'Your shipment ' || NEW.tracking_number || ' is now being processed at our facility.';
            WHEN 'shipped' THEN
                status_icon := '📦';
                status_title := 'Shipment Dispatched';
                status_message := 'Your shipment ' || NEW.tracking_number || ' has been dispatched and is on its way!';
            WHEN 'in_transit' THEN
                status_icon := '🚚';
                status_title := 'Shipment In Transit';
                status_message := 'Your shipment ' || NEW.tracking_number || ' is currently in transit to the destination.';
            WHEN 'arrived' THEN
                status_icon := '✅';
                status_title := 'Shipment Arrived';
                status_message := 'Great news! Your shipment ' || NEW.tracking_number || ' has arrived at the warehouse. Check your delivery codes in the app!';
            ELSE
                status_icon := '📋';
                status_title := 'Shipment Status Update';
                status_message := 'Your shipment ' || NEW.tracking_number || ' status has been updated to: ' || NEW.status;
        END CASE;
        
        -- Get all unique users who have packages in this shipment
        FOR user_data IN
            SELECT DISTINCT
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.suite_number
            FROM packages p
            JOIN users u ON p.user_id = u.id
            WHERE p.linked_to_shipment_id = NEW.id
            AND u.email IS NOT NULL
        LOOP
            -- Set Edge Function URL and key
            edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email';
            supabase_anon_key := 'YOUR_ANON_KEY';
            
            -- Call Edge Function for each user (matches your Edge Function format)
            SELECT net.http_post(
                url := edge_function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || supabase_anon_key
                ),
                body := jsonb_build_object(
                    'to', user_data.email,
                    'userName', user_data.first_name || ' ' || user_data.last_name,
                    'notificationTitle', status_title,
                    'notificationMessage', status_message,
                    'notificationIcon', status_icon,
                    'notificationType', 'shipment_update',
                    'trackingNumber', NEW.tracking_number,
                    'suiteNumber', user_data.suite_number,
                    'status', NEW.status,
                    'logToDatabase', false
                )
            ) INTO request_id;
            
            RAISE NOTICE '✅ Shipment status email queued for user % (Shipment: %)', 
                user_data.email, 
                NEW.tracking_number;
        END LOOP;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Failed to trigger shipment email notification: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.trigger_shipment_status_email() SET search_path = public, extensions;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_send_shipment_status_email ON shipments;

-- Create trigger for shipment status changes
CREATE TRIGGER trigger_send_shipment_status_email
    AFTER UPDATE OF status ON shipments
    FOR EACH ROW
    WHEN (NEW.status != OLD.status)
    EXECUTE FUNCTION trigger_shipment_status_email();

SELECT '✅ Trigger created: trigger_send_shipment_status_email' AS status;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

SELECT 
    '🔍 VERIFICATION' AS section,
    '' AS spacer;

-- Check if pg_net extension is enabled
SELECT 
    'pg_net Extension' AS component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
        THEN '✅ ENABLED'
        ELSE '❌ NOT ENABLED'
    END AS status;

-- Check if triggers exist
SELECT 
    event_object_table AS table_name,
    trigger_name,
    '✅ ACTIVE' AS status
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_send_delivery_email', 'trigger_send_shipment_status_email')
ORDER BY event_object_table;

-- ============================================================================
-- IMPORTANT SETUP INSTRUCTIONS
-- ============================================================================
-- 
-- 🔧 BEFORE THIS WORKS, YOU MUST:
-- 
-- 1. Update the Edge Function URL in BOTH functions above:
--    Replace: 'YOUR_PROJECT_REF' with your actual Supabase project reference
--    Example: 'abcdefghijklmnop.supabase.co'
-- 
-- 2. Update the Supabase Anon Key in BOTH functions above:
--    Replace: 'YOUR_ANON_KEY' with your actual anonymous key
--    Get from: Supabase Dashboard > Settings > API > Project API keys > anon public
-- 
-- 3. Ensure your Edge Function 'send-notification-email' expects this payload:
--    {
--      "type": "package_delivered" | "shipment_status_update",
--      "userId": "uuid",
--      "userEmail": "email@example.com",
--      "userName": "First Last",
--      "packageId": "PKG...",  // For package delivery
--      "trackingNumber": "VC...",
--      "shipmentTracking": "VC...",  // For shipment updates
--      "status": "delivered",
--      "suiteNumber": "A123",
--      "deliveredAt": "timestamp",
--      "updatedAt": "timestamp",
--      "notificationData": {
--        "title": "Email Subject",
--        "message": "Email body",
--        "actionUrl": "/path/to/action"
--      }
--    }
-- 
-- 4. Test by updating a package status to 'delivered':
--    UPDATE packages SET status = 'delivered' WHERE id = '<package_uuid>';
-- 
-- 5. Check logs:
--    - PostgreSQL logs will show: "✅ Email notification queued..."
--    - Edge Function logs in Supabase Dashboard
-- 
-- ============================================================================
-- WORKFLOW
-- ============================================================================
-- 
-- AUTOMATIC EMAIL FLOW:
-- 
-- 1. Package status changes to 'delivered' in database
--    ↓
-- 2. Trigger fires: trigger_send_delivery_email
--    ↓
-- 3. Function: trigger_delivery_email()
--    ↓
-- 4. Fetches user email and package details
--    ↓
-- 5. Makes HTTP POST to Edge Function via pg_net
--    ↓
-- 6. Edge Function 'send-notification-email' receives request
--    ↓
-- 7. Edge Function sends email via Resend/SendGrid/etc.
--    ↓
-- 8. Customer receives email ✅
-- 
-- NO FRONTEND CODE NEEDED - FULLY AUTOMATED! 🚀
-- 
-- ============================================================================

SELECT '🚀 AUTOMATIC EMAIL SYSTEM READY' AS final_status;
SELECT 'Remember to update YOUR_PROJECT_REF and YOUR_ANON_KEY in the functions above!' AS important_note;
