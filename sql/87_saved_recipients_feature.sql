-- ============================================================================
-- SAVED RECIPIENTS FEATURE
-- ============================================================================
-- Allows users to save and reuse recipient details when creating shipments
-- Independent feature that works alongside existing shipment creation
--
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-17
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Saved Recipients Table
-- ============================================================================

-- Table to store saved recipient details for quick selection
-- Each user can save multiple recipients with nicknames for easy identification
CREATE TABLE IF NOT EXISTS saved_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL, -- Friendly name for the recipient (e.g., "Mom's House", "Office Address")
    recipient_name TEXT NOT NULL, -- Full name of recipient
    recipient_phone TEXT, -- Phone number with international format
    delivery_address TEXT NOT NULL, -- Street address
    delivery_city TEXT NOT NULL, -- City name
    delivery_country TEXT NOT NULL, -- Country name
    service_type TEXT DEFAULT 'standard' CHECK (service_type IN ('standard', 'express', 'overnight')), -- Preferred service type
    is_default BOOLEAN DEFAULT FALSE, -- Mark if this is the user's default recipient
    usage_count INTEGER DEFAULT 0, -- Track how many times this recipient has been used
    last_used_at TIMESTAMP WITH TIME ZONE, -- Last time this recipient was used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can't have duplicate nicknames
    UNIQUE(user_id, nickname)
);

-- Comment on table
COMMENT ON TABLE saved_recipients IS 'Stores saved recipient details for quick selection during shipment creation';

-- Comments on columns for documentation
COMMENT ON COLUMN saved_recipients.nickname IS 'User-friendly identifier for the recipient (e.g., "Mom", "Office", "John NYC")';
COMMENT ON COLUMN saved_recipients.usage_count IS 'Tracks usage for sorting by most frequently used';
COMMENT ON COLUMN saved_recipients.is_default IS 'Only one recipient per user can be marked as default';

-- ============================================================================
-- STEP 2: Create Indexes for Performance
-- ============================================================================

-- Index for fast user-specific queries
CREATE INDEX IF NOT EXISTS idx_saved_recipients_user_id ON saved_recipients(user_id);

-- Index for finding default recipients quickly
CREATE INDEX IF NOT EXISTS idx_saved_recipients_default ON saved_recipients(user_id, is_default) WHERE is_default = TRUE;

-- Index for sorting by most recently used
CREATE INDEX IF NOT EXISTS idx_saved_recipients_last_used ON saved_recipients(user_id, last_used_at DESC);

-- Index for sorting by most frequently used
CREATE INDEX IF NOT EXISTS idx_saved_recipients_usage_count ON saved_recipients(user_id, usage_count DESC);

SELECT '✅ Saved Recipients table and indexes created' AS status;

-- ============================================================================
-- STEP 3: Create Function to Get User's Saved Recipients
-- ============================================================================

-- Function to retrieve all saved recipients for a user
-- Sorted by usage frequency and last used date
CREATE OR REPLACE FUNCTION get_saved_recipients(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    nickname TEXT,
    recipient_name TEXT,
    recipient_phone TEXT,
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_country TEXT,
    service_type TEXT,
    is_default BOOLEAN,
    usage_count INTEGER,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return all saved recipients for the user
    -- Ordered by: default first, then most frequently used, then most recently used
    RETURN QUERY
    SELECT 
        sr.id,
        sr.user_id,
        sr.nickname,
        sr.recipient_name,
        sr.recipient_phone,
        sr.delivery_address,
        sr.delivery_city,
        sr.delivery_country,
        sr.service_type,
        sr.is_default,
        sr.usage_count,
        sr.last_used_at,
        sr.created_at,
        sr.updated_at
    FROM saved_recipients sr
    WHERE sr.user_id = p_user_id
    ORDER BY 
        sr.is_default DESC NULLS LAST,
        sr.usage_count DESC NULLS LAST,
        sr.last_used_at DESC NULLS LAST,
        sr.created_at DESC;
END;
$$;

SELECT '✅ Function created: get_saved_recipients' AS status;

-- ============================================================================
-- STEP 4: Create Function to Save New Recipient
-- ============================================================================

-- Function to save a new recipient or update existing one
CREATE OR REPLACE FUNCTION save_recipient(
    p_user_id UUID,
    p_nickname TEXT,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_delivery_address TEXT,
    p_delivery_city TEXT,
    p_delivery_country TEXT,
    p_service_type TEXT DEFAULT 'standard',
    p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recipient_id UUID;
    v_result JSON;
BEGIN
    -- Validate user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'User not found'
        );
    END IF;
    
    -- Validate required fields
    IF p_nickname IS NULL OR TRIM(p_nickname) = '' THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Nickname is required'
        );
    END IF;
    
    IF p_recipient_name IS NULL OR TRIM(p_recipient_name) = '' THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Recipient name is required'
        );
    END IF;
    
    IF p_delivery_address IS NULL OR TRIM(p_delivery_address) = '' THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Delivery address is required'
        );
    END IF;
    
    -- If setting as default, unset all other defaults for this user
    IF p_is_default = TRUE THEN
        UPDATE saved_recipients
        SET is_default = FALSE,
            updated_at = NOW()
        WHERE user_id = p_user_id
          AND is_default = TRUE;
    END IF;
    
    -- Insert new recipient
    INSERT INTO saved_recipients (
        user_id,
        nickname,
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_city,
        delivery_country,
        service_type,
        is_default,
        usage_count,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        TRIM(p_nickname),
        TRIM(p_recipient_name),
        p_recipient_phone,
        TRIM(p_delivery_address),
        TRIM(p_delivery_city),
        TRIM(p_delivery_country),
        p_service_type,
        p_is_default,
        0,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_recipient_id;
    
    -- Return success with recipient ID
    RETURN json_build_object(
        'success', TRUE,
        'recipient_id', v_recipient_id,
        'message', 'Recipient saved successfully'
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'A recipient with this nickname already exists'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Failed to save recipient: ' || SQLERRM
        );
END;
$$;

SELECT '✅ Function created: save_recipient' AS status;

-- ============================================================================
-- STEP 5: Create Function to Update Saved Recipient
-- ============================================================================

-- Function to update an existing saved recipient
CREATE OR REPLACE FUNCTION update_saved_recipient(
    p_recipient_id UUID,
    p_user_id UUID,
    p_nickname TEXT,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_delivery_address TEXT,
    p_delivery_city TEXT,
    p_delivery_country TEXT,
    p_service_type TEXT DEFAULT 'standard',
    p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify recipient belongs to user
    IF NOT EXISTS (
        SELECT 1 FROM saved_recipients 
        WHERE id = p_recipient_id AND user_id = p_user_id
    ) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Recipient not found or access denied'
        );
    END IF;
    
    -- If setting as default, unset all other defaults for this user
    IF p_is_default = TRUE THEN
        UPDATE saved_recipients
        SET is_default = FALSE,
            updated_at = NOW()
        WHERE user_id = p_user_id
          AND id != p_recipient_id
          AND is_default = TRUE;
    END IF;
    
    -- Update the recipient
    UPDATE saved_recipients
    SET 
        nickname = TRIM(p_nickname),
        recipient_name = TRIM(p_recipient_name),
        recipient_phone = p_recipient_phone,
        delivery_address = TRIM(p_delivery_address),
        delivery_city = TRIM(p_delivery_city),
        delivery_country = TRIM(p_delivery_country),
        service_type = p_service_type,
        is_default = p_is_default,
        updated_at = NOW()
    WHERE id = p_recipient_id AND user_id = p_user_id;
    
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Recipient updated successfully'
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'A recipient with this nickname already exists'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Failed to update recipient: ' || SQLERRM
        );
END;
$$;

SELECT '✅ Function created: update_saved_recipient' AS status;

-- ============================================================================
-- STEP 6: Create Function to Delete Saved Recipient
-- ============================================================================

-- Function to delete a saved recipient
CREATE OR REPLACE FUNCTION delete_saved_recipient(
    p_recipient_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete the recipient (only if it belongs to the user)
    DELETE FROM saved_recipients
    WHERE id = p_recipient_id AND user_id = p_user_id;
    
    -- Check if any row was deleted
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Recipient not found or access denied'
        );
    END IF;
    
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Recipient deleted successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Failed to delete recipient: ' || SQLERRM
        );
END;
$$;

SELECT '✅ Function created: delete_saved_recipient' AS status;

-- ============================================================================
-- STEP 7: Create Function to Mark Recipient as Used
-- ============================================================================

-- Function to increment usage count when a recipient is used
-- Called automatically when creating a shipment with a saved recipient
CREATE OR REPLACE FUNCTION mark_recipient_used(
    p_recipient_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update usage count and last used timestamp
    UPDATE saved_recipients
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = p_recipient_id AND user_id = p_user_id;
    
    -- Check if any row was updated
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Recipient not found or access denied'
        );
    END IF;
    
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Recipient usage tracked'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Failed to track recipient usage: ' || SQLERRM
        );
END;
$$;

SELECT '✅ Function created: mark_recipient_used' AS status;

-- ============================================================================
-- STEP 8: Create RLS Policies for Security
-- ============================================================================

-- Enable Row Level Security on saved_recipients table
ALTER TABLE saved_recipients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved recipients
CREATE POLICY saved_recipients_select_own
ON saved_recipients
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can insert their own saved recipients
CREATE POLICY saved_recipients_insert_own
ON saved_recipients
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own saved recipients
CREATE POLICY saved_recipients_update_own
ON saved_recipients
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own saved recipients
CREATE POLICY saved_recipients_delete_own
ON saved_recipients
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Warehouse staff can view all saved recipients (for support purposes)
CREATE POLICY saved_recipients_admin_view_all
ON saved_recipients
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'superadmin', 'warehouse_admin')
    )
);

SELECT '✅ RLS policies created for saved_recipients' AS status;

-- ============================================================================
-- STEP 9: Create Trigger for updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_saved_recipients_updated_at ON saved_recipients;

CREATE TRIGGER trigger_update_saved_recipients_updated_at
    BEFORE UPDATE ON saved_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_recipients_updated_at();

SELECT '✅ Trigger created: update_saved_recipients_updated_at' AS status;

-- ============================================================================
-- STEP 10: Verification
-- ============================================================================

SELECT '🔍 VERIFICATION' AS section;

-- Check if table exists
SELECT 
    'saved_recipients Table' AS component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_recipients')
        THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END AS status;

-- Check if functions exist
SELECT 
    routine_name AS function_name,
    '✅ EXISTS' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'get_saved_recipients',
      'save_recipient',
      'update_saved_recipient',
      'delete_saved_recipient',
      'mark_recipient_used'
  )
ORDER BY routine_name;

-- Check if RLS is enabled
SELECT 
    'Row Level Security' AS component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'saved_recipients' 
            AND rowsecurity = true
        )
        THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END AS status;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- 
-- 1. Save a new recipient:
-- SELECT save_recipient(
--     '<user_uuid>',
--     'Mom''s House',
--     'Jane Smith',
--     '+1234567890',
--     '123 Main Street',
--     'New York',
--     'United States',
--     'standard',
--     true
-- );
--
-- 2. Get all saved recipients for a user:
-- SELECT * FROM get_saved_recipients('<user_uuid>');
--
-- 3. Update a saved recipient:
-- SELECT update_saved_recipient(
--     '<recipient_uuid>',
--     '<user_uuid>',
--     'Mom',
--     'Jane Smith',
--     '+1234567890',
--     '456 Oak Avenue',
--     'Boston',
--     'United States',
--     'express',
--     false
-- );
--
-- 4. Delete a saved recipient:
-- SELECT delete_saved_recipient('<recipient_uuid>', '<user_uuid>');
--
-- 5. Track recipient usage:
-- SELECT mark_recipient_used('<recipient_uuid>', '<user_uuid>');
--
-- ============================================================================

SELECT '🚀 SAVED RECIPIENTS FEATURE READY' AS final_status;
SELECT 'Users can now save and reuse recipient details for faster shipment creation!' AS message;
