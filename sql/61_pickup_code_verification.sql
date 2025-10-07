-- Pickup Code Verification Endpoint
-- Secure verification with rate limiting and audit logging
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07

-- ============================================================================
-- SECTION 1: VERIFICATION ENDPOINT WITH SECURITY
-- ============================================================================

-- Main verification function with rate limiting and security
CREATE OR REPLACE FUNCTION verify_pickup_code(
    p_package_id UUID,
    p_suite_number TEXT,
    p_pickup_code TEXT,
    p_staff_id UUID,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    package_record RECORD;
    verification_success BOOLEAN := false;
    failure_reason TEXT;
    new_status TEXT := 'delivered';
BEGIN
    -- Step 1: Verify staff permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_staff_id 
        AND role IN ('warehouse_admin', 'admin', 'super_admin')
    ) THEN
        -- Log failed attempt
        INSERT INTO pickup_code_verification_logs (
            package_id, action_type, actor_type, actor_id,
            outcome, failure_reason, ip_address
        ) VALUES (
            p_package_id, 'verify', 'staff', p_staff_id,
            'failure', 'Insufficient permissions', p_ip_address
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', 'Insufficient permissions to verify pickup codes'
        );
    END IF;
    
    -- Step 2: Get package details with user info
    SELECT 
        p.*,
        u.suite_number as customer_suite,
        u.first_name || ' ' || u.last_name as customer_name,
        s.tracking_number as shipment_tracking
    INTO package_record
    FROM packages p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN shipments s ON p.linked_to_shipment_id = s.id
    WHERE p.id = p_package_id;
    
    IF NOT FOUND THEN
        failure_reason := 'Package not found';
        
        INSERT INTO pickup_code_verification_logs (
            package_id, action_type, actor_type, actor_id,
            outcome, failure_reason, verification_code, ip_address
        ) VALUES (
            p_package_id, 'verify', 'staff', p_staff_id,
            'failure', failure_reason, p_pickup_code, p_ip_address
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', failure_reason
        );
    END IF;
    
    -- Step 3: Check if package is rate-limited due to failed attempts
    IF package_record.pickup_code_locked_until IS NOT NULL 
       AND package_record.pickup_code_locked_until > NOW() THEN
        failure_reason := format('Too many failed attempts. Locked until %s', 
                                 package_record.pickup_code_locked_until);
        
        INSERT INTO pickup_code_verification_logs (
            package_id, shipment_id, tracking_number,
            action_type, actor_type, actor_id,
            outcome, failure_reason, verification_code, ip_address
        ) VALUES (
            p_package_id, package_record.linked_to_shipment_id, package_record.tracking_number,
            'verify', 'staff', p_staff_id,
            'failure', failure_reason, p_pickup_code, p_ip_address
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', failure_reason,
            'locked_until', package_record.pickup_code_locked_until
        );
    END IF;
    
    -- Step 4: Verify suite number matches
    IF UPPER(TRIM(package_record.customer_suite)) != UPPER(TRIM(p_suite_number)) THEN
        failure_reason := 'Suite number does not match package owner';
        
        -- Increment failed attempts
        UPDATE packages
        SET 
            pickup_code_failed_attempts = COALESCE(pickup_code_failed_attempts, 0) + 1,
            pickup_code_locked_until = CASE 
                WHEN COALESCE(pickup_code_failed_attempts, 0) + 1 >= 5 
                THEN NOW() + INTERVAL '30 minutes'
                ELSE NULL
            END,
            updated_at = NOW()
        WHERE id = p_package_id;
        
        INSERT INTO pickup_code_verification_logs (
            package_id, shipment_id, tracking_number,
            action_type, actor_type, actor_id,
            outcome, failure_reason, verification_code, ip_address,
            metadata
        ) VALUES (
            p_package_id, package_record.linked_to_shipment_id, package_record.tracking_number,
            'verify', 'staff', p_staff_id,
            'failure', failure_reason, p_pickup_code, p_ip_address,
            jsonb_build_object(
                'provided_suite', p_suite_number,
                'expected_suite', package_record.customer_suite,
                'failed_attempts', COALESCE(package_record.pickup_code_failed_attempts, 0) + 1
            )
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', failure_reason
        );
    END IF;
    
    -- Step 5: Check if code exists
    IF package_record.pickup_code_hash IS NULL THEN
        failure_reason := 'No pickup code has been generated for this package';
        
        INSERT INTO pickup_code_verification_logs (
            package_id, shipment_id, tracking_number,
            action_type, actor_type, actor_id,
            outcome, failure_reason, ip_address
        ) VALUES (
            p_package_id, package_record.linked_to_shipment_id, package_record.tracking_number,
            'verify', 'staff', p_staff_id,
            'failure', failure_reason, p_ip_address
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', failure_reason
        );
    END IF;
    
    -- Step 6: Check if code has expired
    IF package_record.pickup_code_expires_at IS NOT NULL 
       AND package_record.pickup_code_expires_at < NOW() THEN
        failure_reason := 'Pickup code has expired';
        
        INSERT INTO pickup_code_verification_logs (
            package_id, shipment_id, tracking_number,
            action_type, actor_type, actor_id,
            outcome, failure_reason, verification_code, ip_address,
            metadata
        ) VALUES (
            p_package_id, package_record.linked_to_shipment_id, package_record.tracking_number,
            'verify', 'staff', p_staff_id,
            'failure', failure_reason, p_pickup_code, p_ip_address,
            jsonb_build_object(
                'expired_at', package_record.pickup_code_expires_at
            )
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', failure_reason,
            'expired_at', package_record.pickup_code_expires_at
        );
    END IF;
    
    -- Step 7: Check if code has already been used
    IF package_record.pickup_code_used_at IS NOT NULL THEN
        failure_reason := format('Code already used on %s', package_record.pickup_code_used_at);
        
        INSERT INTO pickup_code_verification_logs (
            package_id, shipment_id, tracking_number,
            action_type, actor_type, actor_id,
            outcome, failure_reason, verification_code, ip_address,
            metadata
        ) VALUES (
            p_package_id, package_record.linked_to_shipment_id, package_record.tracking_number,
            'verify', 'staff', p_staff_id,
            'failure', failure_reason, p_pickup_code, p_ip_address,
            jsonb_build_object(
                'used_at', package_record.pickup_code_used_at,
                'used_by', package_record.pickup_code_used_by
            )
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', failure_reason,
            'used_at', package_record.pickup_code_used_at
        );
    END IF;
    
    -- Step 8: Verify the code matches (bcrypt comparison)
    IF NOT verify_pickup_code_hash(TRIM(p_pickup_code), package_record.pickup_code_hash) THEN
        failure_reason := 'Invalid pickup code';
        
        -- Increment failed attempts
        UPDATE packages
        SET 
            pickup_code_failed_attempts = COALESCE(pickup_code_failed_attempts, 0) + 1,
            pickup_code_locked_until = CASE 
                WHEN COALESCE(pickup_code_failed_attempts, 0) + 1 >= 5 
                THEN NOW() + INTERVAL '30 minutes'
                ELSE NULL
            END,
            updated_at = NOW()
        WHERE id = p_package_id;
        
        INSERT INTO pickup_code_verification_logs (
            package_id, shipment_id, tracking_number,
            action_type, actor_type, actor_id,
            outcome, failure_reason, verification_code, ip_address,
            metadata
        ) VALUES (
            p_package_id, package_record.linked_to_shipment_id, package_record.tracking_number,
            'verify', 'staff', p_staff_id,
            'failure', failure_reason, p_pickup_code, p_ip_address,
            jsonb_build_object(
                'failed_attempts', COALESCE(package_record.pickup_code_failed_attempts, 0) + 1,
                'will_lock', COALESCE(package_record.pickup_code_failed_attempts, 0) + 1 >= 5
            )
        );
        
        RETURN json_build_object(
            'success', false,
            'verified', false,
            'message', failure_reason,
            'failed_attempts', COALESCE(package_record.pickup_code_failed_attempts, 0) + 1,
            'max_attempts', 5
        );
    END IF;
    
    -- Step 9: VERIFICATION SUCCESSFUL - Update package status
    UPDATE packages
    SET
        status = new_status,
        pickup_code_used_at = NOW(),
        pickup_code_used_by = p_staff_id,
        collected_by = p_staff_id,
        collected_at = NOW(),
        pickup_code_failed_attempts = 0,
        pickup_code_locked_until = NULL,
        updated_at = NOW()
    WHERE id = p_package_id;
    
    -- Step 10: Log successful verification
    INSERT INTO pickup_code_verification_logs (
        package_id, shipment_id, tracking_number,
        action_type, actor_type, actor_id,
        outcome, ip_address,
        metadata
    ) VALUES (
        p_package_id, package_record.linked_to_shipment_id, package_record.tracking_number,
        'verify', 'staff', p_staff_id,
        'success', p_ip_address,
        jsonb_build_object(
            'customer_name', package_record.customer_name,
            'suite_number', package_record.customer_suite,
            'new_status', new_status
        )
    );
    
    -- Step 11: Return success response
    RETURN json_build_object(
        'success', true,
        'verified', true,
        'package_id', package_record.package_id,
        'tracking_number', package_record.tracking_number,
        'customer_name', package_record.customer_name,
        'suite_number', package_record.customer_suite,
        'old_status', package_record.status,
        'new_status', new_status,
        'collected_at', NOW(),
        'message', 'Package successfully verified and marked as delivered'
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Log exception
    INSERT INTO pickup_code_verification_logs (
        package_id, action_type, actor_type, actor_id,
        outcome, failure_reason, ip_address
    ) VALUES (
        p_package_id, 'verify', 'staff', p_staff_id,
        'failure', SQLERRM, p_ip_address
    );
    
    RETURN json_build_object(
        'success', false,
        'verified', false,
        'message', 'Verification failed due to system error',
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 2: ADMIN FUNCTIONS
-- ============================================================================

-- Function to regenerate pickup code for a package (admin only)
CREATE OR REPLACE FUNCTION regenerate_pickup_code(
    p_package_id UUID,
    p_admin_id UUID,
    p_code_expiry_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    package_record RECORD;
    new_code TEXT;
    hashed_code TEXT;
    expiry_date TIMESTAMPTZ;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND role IN ('admin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Get package info
    SELECT * INTO package_record
    FROM packages
    WHERE id = p_package_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Package not found'
        );
    END IF;
    
    -- Generate new code
    new_code := generate_secure_6digit_code();
    hashed_code := hash_pickup_code(new_code);
    expiry_date := NOW() + (p_code_expiry_days || ' days')::INTERVAL;
    
    -- Update package
    UPDATE packages
    SET
        pickup_code_hash = hashed_code,
        pickup_code_generated_at = NOW(),
        pickup_code_generated_by = 'admin_regeneration',
        pickup_code_expires_at = expiry_date,
        pickup_code_failed_attempts = 0,
        pickup_code_locked_until = NULL,
        pickup_code_used_at = NULL,
        pickup_code_used_by = NULL,
        updated_at = NOW()
    WHERE id = p_package_id;
    
    -- Log regeneration
    INSERT INTO pickup_code_verification_logs (
        package_id, tracking_number,
        action_type, actor_type, actor_id,
        outcome,
        metadata
    ) VALUES (
        p_package_id, package_record.tracking_number,
        'regenerate', 'staff', p_admin_id,
        'success',
        jsonb_build_object(
            'reason', 'admin_request',
            'expires_at', expiry_date
        )
    );
    
    -- Return new code (plaintext for notification)
    RETURN json_build_object(
        'success', true,
        'package_id', package_record.package_id,
        'tracking_number', package_record.tracking_number,
        'new_code', new_code,
        'expires_at', expiry_date,
        'message', 'Pickup code regenerated successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get verification logs for a package
CREATE OR REPLACE FUNCTION get_package_verification_logs(
    p_package_id UUID,
    p_requester_id UUID
)
RETURNS JSON AS $$
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_requester_id 
        AND role IN ('warehouse_admin', 'admin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;
    
    -- Return logs
    RETURN json_build_object(
        'success', true,
        'logs', (
            SELECT json_agg(
                json_build_object(
                    'action_type', action_type,
                    'actor_type', actor_type,
                    'outcome', outcome,
                    'failure_reason', failure_reason,
                    'created_at', created_at,
                    'metadata', metadata
                ) ORDER BY created_at DESC
            )
            FROM pickup_code_verification_logs
            WHERE package_id = p_package_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Pickup code verification system installed successfully';
    RAISE NOTICE '   - Function created: verify_pickup_code()';
    RAISE NOTICE '   - Function created: regenerate_pickup_code()';
    RAISE NOTICE '   - Function created: get_package_verification_logs()';
    RAISE NOTICE '   - Security: Bcrypt verification with rate limiting';
    RAISE NOTICE '   - Rate limit: 5 attempts, 30 minute lockout';
END $$;
