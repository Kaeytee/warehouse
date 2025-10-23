-- Update Saved Recipient RPC Function
-- Allows users to update their saved recipients

CREATE OR REPLACE FUNCTION update_saved_recipient(
  p_recipient_id UUID,
  p_user_id UUID,
  p_nickname TEXT DEFAULT NULL,
  p_recipient_name TEXT DEFAULT NULL,
  p_recipient_phone TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_delivery_city TEXT DEFAULT NULL,
  p_delivery_country TEXT DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_existing_record RECORD;
BEGIN
  -- Check if recipient exists and belongs to the user
  SELECT * INTO v_existing_record
  FROM saved_recipients
  WHERE id = p_recipient_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Recipient not found or unauthorized'
    );
  END IF;

  -- If setting as default, unset all other defaults for this user
  IF p_is_default = true THEN
    UPDATE saved_recipients
    SET is_default = false
    WHERE user_id = p_user_id AND id != p_recipient_id;
  END IF;

  -- Update the recipient
  UPDATE saved_recipients
  SET
    nickname = COALESCE(p_nickname, nickname),
    recipient_name = COALESCE(p_recipient_name, recipient_name),
    recipient_phone = COALESCE(p_recipient_phone, recipient_phone),
    delivery_address = COALESCE(p_delivery_address, delivery_address),
    delivery_city = COALESCE(p_delivery_city, delivery_city),
    delivery_country = COALESCE(p_delivery_country, delivery_country),
    service_type = COALESCE(p_service_type, service_type),
    is_default = COALESCE(p_is_default, is_default),
    updated_at = NOW()
  WHERE id = p_recipient_id AND user_id = p_user_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Recipient updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_saved_recipient TO authenticated;

COMMENT ON FUNCTION update_saved_recipient IS 'Updates an existing saved recipient. Only the owner can update their recipients.';
