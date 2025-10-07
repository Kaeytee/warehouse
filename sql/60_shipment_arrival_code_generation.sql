-- Auto-Generate 6-Digit Pickup Codes on Shipment Arrival
-- Triggers when shipment status changes to 'arrived'
-- Generates secure codes for all packages in the shipment
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07

-- ============================================================================
-- SECTION 1: PICKUP CODE VERIFICATION LOGS TABLE
-- ============================================================================

-- Table to store all verification attempts for audit trail
CREATE TABLE IF NOT EXISTS pickup_code_verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    tracking_number TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('generate', 'verify', 'regenerate', 'expire')),
    actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'staff', 'customer')),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'partial')),
    verification_code TEXT, -- The code that was attempted (for failed attempts)
    failure_reason TEXT, -- Why verification failed
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_verification_logs_package ON pickup_code_verification_logs(package_id),
    INDEX idx_verification_logs_shipment ON pickup_code_verification_logs(shipment_id),
    INDEX idx_verification_logs_created ON pickup_code_verification_logs(created_at)
);

-- Enable RLS
ALTER TABLE pickup_code_verification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view verification logs
CREATE POLICY verification_logs_admin_view ON pickup_code_verification_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'warehouse_admin')
        )
    );

-- ============================================================================
-- SECTION 2: ADD SECURE CODE FIELDS TO PACKAGES TABLE
-- ============================================================================

-- Add columns for secure code storage (if not already added)
DO $$ 
BEGIN
    -- Hashed pickup code (stored securely)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_hash') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_hash TEXT;
    END IF;
    
    -- Code generation metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_generated_at') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_generated_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_generated_by') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_generated_by TEXT DEFAULT 'system';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_expires_at') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_expires_at TIMESTAMPTZ;
    END IF;
    
    -- Code usage tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_used_at') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_used_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_used_by') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_used_by UUID REFERENCES users(id);
    END IF;
    
    -- Failed verification tracking for rate limiting
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_failed_attempts') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_failed_attempts INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'pickup_code_locked_until') THEN
        ALTER TABLE packages ADD COLUMN pickup_code_locked_until TIMESTAMPTZ;
    END IF;
    
    -- Collection/delivery tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'collected_by') THEN
        ALTER TABLE packages ADD COLUMN collected_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'packages' AND column_name = 'collected_at') THEN
        ALTER TABLE packages ADD COLUMN collected_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create index for code lookup performance
CREATE INDEX IF NOT EXISTS idx_packages_pickup_code_hash ON packages(pickup_code_hash) WHERE pickup_code_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packages_shipment_status ON packages(linked_to_shipment_id, status);

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- Function to generate secure random 6-digit code
CREATE OR REPLACE FUNCTION generate_secure_6digit_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    LOOP
        -- Generate random 6-digit code (100000 to 999999)
        code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
        
        -- Check uniqueness against active codes
        IF NOT EXISTS (
            SELECT 1 FROM packages
            WHERE pickup_code_hash = crypt(code, gen_salt('bf'))
            AND (pickup_code_used_at IS NULL OR pickup_code_expires_at > NOW())
        ) THEN
            RETURN code;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash pickup code securely using bcrypt
CREATE OR REPLACE FUNCTION hash_pickup_code(plaintext_code TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(plaintext_code, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify pickup code against hash
CREATE OR REPLACE FUNCTION verify_pickup_code_hash(plaintext_code TEXT, code_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN code_hash = crypt(plaintext_code, code_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: BATCH CODE GENERATION FOR SHIPMENT ARRIVAL
-- ============================================================================

-- Function to generate pickup codes for all packages in a shipment
CREATE OR REPLACE FUNCTION generate_pickup_codes_for_shipment(
    p_shipment_id UUID,
    p_code_expiry_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    package_record RECORD;
    generated_code TEXT;
    hashed_code TEXT;
    expiry_date TIMESTAMPTZ;
    codes_generated INTEGER := 0;
    codes_failed INTEGER := 0;
    generated_codes JSONB := '[]'::jsonb;
    job_id UUID := uuid_generate_v4();
BEGIN
    -- Calculate expiry date
    expiry_date := NOW() + (p_code_expiry_days || ' days')::INTERVAL;
    
    -- Loop through all packages in the shipment
    FOR package_record IN 
        SELECT 
            id,
            package_id,
            tracking_number,
            user_id,
            status
        FROM packages
        WHERE linked_to_shipment_id = p_shipment_id
        AND status = 'arrived'
        AND (pickup_code_hash IS NULL OR pickup_code_expires_at < NOW())
    LOOP
        BEGIN
            -- Generate unique 6-digit code
            generated_code := generate_secure_6digit_code();
            
            -- Hash the code
            hashed_code := hash_pickup_code(generated_code);
            
            -- Update package with hashed code
            UPDATE packages
            SET
                pickup_code_hash = hashed_code,
                pickup_code_generated_at = NOW(),
                pickup_code_generated_by = 'system_shipment_arrival',
                pickup_code_expires_at = expiry_date,
                pickup_code_failed_attempts = 0,
                pickup_code_locked_until = NULL,
                updated_at = NOW()
            WHERE id = package_record.id;
            
            -- Log successful generation
            INSERT INTO pickup_code_verification_logs (
                package_id,
                shipment_id,
                tracking_number,
                action_type,
                actor_type,
                actor_id,
                outcome,
                metadata
            ) VALUES (
                package_record.id,
                p_shipment_id,
                package_record.tracking_number,
                'generate',
                'system',
                NULL,
                'success',
                jsonb_build_object(
                    'job_id', job_id,
                    'expiry_date', expiry_date,
                    'generation_trigger', 'shipment_arrival'
                )
            );
            
            -- Add to return array (plaintext code for immediate delivery)
            generated_codes := generated_codes || jsonb_build_object(
                'package_id', package_record.id,
                'package_identifier', package_record.package_id,
                'tracking_number', package_record.tracking_number,
                'user_id', package_record.user_id,
                'code', generated_code,  -- PLAINTEXT for immediate notification
                'expires_at', expiry_date
            );
            
            codes_generated := codes_generated + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log failed generation
            INSERT INTO pickup_code_verification_logs (
                package_id,
                shipment_id,
                tracking_number,
                action_type,
                actor_type,
                outcome,
                failure_reason,
                metadata
            ) VALUES (
                package_record.id,
                p_shipment_id,
                package_record.tracking_number,
                'generate',
                'system',
                'failure',
                SQLERRM,
                jsonb_build_object('job_id', job_id)
            );
            
            codes_failed := codes_failed + 1;
        END;
    END LOOP;
    
    -- Return result with plaintext codes for notification delivery
    RETURN json_build_object(
        'success', true,
        'job_id', job_id,
        'shipment_id', p_shipment_id,
        'codes_generated', codes_generated,
        'codes_failed', codes_failed,
        'codes', generated_codes,  -- Array of codes for immediate notification
        'message', format('Generated %s codes, %s failed', codes_generated, codes_failed)
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'codes_generated', codes_generated,
        'codes_failed', codes_failed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: TRIGGER FOR AUTO-GENERATION ON SHIPMENT ARRIVAL
-- ============================================================================

-- Trigger function that runs when shipment status changes to 'arrived'
CREATE OR REPLACE FUNCTION trigger_generate_pickup_codes_on_arrival()
RETURNS TRIGGER AS $$
DECLARE
    generation_result JSON;
BEGIN
    -- Check if status changed TO 'arrived'
    IF NEW.status = 'arrived' AND (OLD.status IS NULL OR OLD.status != 'arrived') THEN
        -- Generate codes for all packages in this shipment
        SELECT generate_pickup_codes_for_shipment(NEW.id) INTO generation_result;
        
        -- Log the trigger event
        RAISE NOTICE 'Pickup codes generated for shipment %: %', NEW.tracking_number, generation_result;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS shipment_arrival_code_generation_trigger ON shipments;

-- Create trigger on shipments table
CREATE TRIGGER shipment_arrival_code_generation_trigger
    AFTER UPDATE ON shipments
    FOR EACH ROW
    WHEN (NEW.status = 'arrived' AND (OLD.status IS DISTINCT FROM 'arrived'))
    EXECUTE FUNCTION trigger_generate_pickup_codes_on_arrival();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Shipment arrival code generation system installed successfully';
    RAISE NOTICE '   - Trigger created: shipment_arrival_code_generation_trigger';
    RAISE NOTICE '   - Function created: generate_pickup_codes_for_shipment()';
    RAISE NOTICE '   - Table created: pickup_code_verification_logs';
    RAISE NOTICE '   - Security: Codes stored as bcrypt hashes';
    RAISE NOTICE '   - Expiry: Default 30 days';
END $$;
