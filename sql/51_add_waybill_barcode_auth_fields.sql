-- Database Schema Enhancement for Waybill, Barcode, QR, and Authentication Features
-- Adds fields for barcode/QR storage, 6-digit authentication codes, and shipment linking
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07

-- ============================================================================
-- SECTION 1: PACKAGES TABLE ENHANCEMENTS
-- ============================================================================

-- Add barcode and QR code fields to packages table
-- These will store the data URL or encoded string for each package's identification
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS barcode_data TEXT,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS linked_to_shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_auth_code TEXT,
ADD COLUMN IF NOT EXISTS auth_code_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auth_code_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auth_code_used_by UUID REFERENCES users(id);

-- Add comment documentation for new fields
COMMENT ON COLUMN packages.barcode_data IS 'Base64 encoded barcode image or barcode string for package identification';
COMMENT ON COLUMN packages.qr_code_data IS 'QR code data or URL linking to public tracking page';
COMMENT ON COLUMN packages.linked_to_shipment_id IS 'Foreign key linking package to its consolidated shipment for traceability';
COMMENT ON COLUMN packages.delivery_auth_code IS 'Encrypted 6-digit code required for delivery confirmation';
COMMENT ON COLUMN packages.auth_code_generated_at IS 'Timestamp when the authentication code was generated';
COMMENT ON COLUMN packages.auth_code_used_at IS 'Timestamp when the code was successfully used for delivery';
COMMENT ON COLUMN packages.auth_code_used_by IS 'Staff member who verified and used the authentication code';

-- ============================================================================
-- SECTION 2: SHIPMENTS TABLE ENHANCEMENTS
-- ============================================================================

-- Add barcode, QR code, and waybill fields to shipments table
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS barcode_data TEXT,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS waybill_data JSONB,
ADD COLUMN IF NOT EXISTS waybill_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_packages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS combined_suite_numbers TEXT[];

-- Add comment documentation for shipment fields
COMMENT ON COLUMN shipments.barcode_data IS 'Base64 encoded barcode image for shipment tracking';
COMMENT ON COLUMN shipments.qr_code_data IS 'QR code data linking to shipment tracking page';
COMMENT ON COLUMN shipments.waybill_data IS 'Complete waybill data in JSON format including all shipment details';
COMMENT ON COLUMN shipments.waybill_generated_at IS 'Timestamp when waybill was generated';
COMMENT ON COLUMN shipments.total_packages IS 'Total number of packages in consolidated shipment';
COMMENT ON COLUMN shipments.combined_suite_numbers IS 'Array of suite numbers for all packages in shipment';

-- ============================================================================
-- SECTION 3: RECEIPTS TABLE CREATION
-- ============================================================================

-- Create receipts table for package intake and shipment receipts
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    receipt_type TEXT NOT NULL CHECK (receipt_type IN ('package_intake', 'shipment_created', 'delivery_confirmation')),
    
    -- Reference fields (one will be populated based on type)
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    -- Customer and warehouse information
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suite_number TEXT NOT NULL,
    warehouse_name TEXT DEFAULT 'VanguardCargo Warehouse',
    
    -- Receipt content
    receipt_data JSONB NOT NULL,
    barcode_data TEXT,
    
    -- Metadata
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    printed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment documentation for receipts table
COMMENT ON TABLE receipts IS 'Stores all receipt data for package intake, shipments, and deliveries';
COMMENT ON COLUMN receipts.receipt_number IS 'Unique receipt number in format RCP-YYYYMMDD-XXXX';
COMMENT ON COLUMN receipts.receipt_type IS 'Type of receipt: package_intake, shipment_created, or delivery_confirmation';
COMMENT ON COLUMN receipts.receipt_data IS 'Complete receipt data in JSON format for printing and auditing';

-- ============================================================================
-- SECTION 4: PACKAGE VERIFICATION LOG TABLE
-- ============================================================================

-- Create verification attempts log table for security and auditing
CREATE TABLE IF NOT EXISTS package_verification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    suite_number TEXT NOT NULL,
    auth_code_entered TEXT NOT NULL,
    
    -- Verification result
    verification_success BOOLEAN NOT NULL,
    failure_reason TEXT,
    
    -- Staff information
    verified_by UUID NOT NULL REFERENCES users(id),
    verified_by_role TEXT NOT NULL,
    
    -- Timestamps and metadata
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment documentation for verification log
COMMENT ON TABLE package_verification_log IS 'Comprehensive audit log of all package verification attempts for security';
COMMENT ON COLUMN package_verification_log.verification_success IS 'Whether the verification attempt was successful';
COMMENT ON COLUMN package_verification_log.failure_reason IS 'Reason for verification failure (wrong code, expired, etc.)';

-- ============================================================================
-- SECTION 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for improved query performance on new fields
CREATE INDEX IF NOT EXISTS idx_packages_linked_shipment ON packages(linked_to_shipment_id);
CREATE INDEX IF NOT EXISTS idx_packages_auth_code ON packages(delivery_auth_code) WHERE delivery_auth_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_package_id ON receipts(package_id);
CREATE INDEX IF NOT EXISTS idx_receipts_shipment_id ON receipts(shipment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_verification_log_package_id ON package_verification_log(package_id);
CREATE INDEX IF NOT EXISTS idx_verification_log_verified_by ON package_verification_log(verified_by);
CREATE INDEX IF NOT EXISTS idx_verification_log_verified_at ON package_verification_log(verified_at);

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_verification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin users can view all receipts
CREATE POLICY receipts_admin_select ON receipts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'superadmin', 'warehouse_admin', 'super_admin')
        )
    );

-- RLS Policy: Admin users can insert receipts
CREATE POLICY receipts_admin_insert ON receipts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'superadmin', 'warehouse_admin', 'super_admin')
        )
    );

-- RLS Policy: Users can view their own receipts
CREATE POLICY receipts_user_select ON receipts
    FOR SELECT
    USING (user_id = auth.uid());

-- RLS Policy: Admin users can view verification logs
CREATE POLICY verification_log_admin_select ON package_verification_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'superadmin', 'warehouse_admin', 'super_admin')
        )
    );

-- RLS Policy: Admin users can insert verification logs
CREATE POLICY verification_log_admin_insert ON package_verification_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'superadmin', 'warehouse_admin', 'super_admin')
        )
    );

-- ============================================================================
-- SECTION 7: TRIGGERS
-- ============================================================================

-- Create trigger for receipts updated_at timestamp
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receipts_updated_at_trigger
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_receipts_updated_at();

-- ============================================================================
-- MIGRATION COMPLETION LOG
-- ============================================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 51_add_waybill_barcode_auth_fields.sql completed successfully';
    RAISE NOTICE 'Added barcode, QR code, authentication, and receipt tracking fields';
    RAISE NOTICE 'Created receipts and package_verification_log tables';
    RAISE NOTICE 'Applied RLS policies and performance indexes';
END $$;
