-- =============================================================================
-- VANGUARDCARGO WAREHOUSE - COMPLETE ENHANCEMENT DEPLOYMENT SCRIPT
-- =============================================================================
--
-- This master script deploys all warehouse enhancements in the correct order:
-- 1. Database schema changes (tables, columns, indexes)
-- 2. Core utility functions
-- 3. Waybill and document generation functions
-- 4. Receipt generation functions  
-- 5. Package verification and authentication functions
-- 6. Enhanced consolidation functions
--
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07
--
-- INSTRUCTIONS:
-- 1. Connect to your Supabase database
-- 2. Run this script as the postgres user
-- 3. Verify all migrations complete successfully
-- 4. Test functionality with provided examples
--
-- =============================================================================

-- Log deployment start
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Starting VanguardCargo Warehouse Enhancement Deployment';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- MIGRATION 1: Database Schema Enhancements
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '--- MIGRATION 1: Database Schema Enhancements ---';
    RAISE NOTICE 'Adding barcode, QR code, authentication, and receipt tracking fields';
END $$;

\i sql/51_add_waybill_barcode_auth_fields.sql

-- =============================================================================
-- MIGRATION 2: Core Barcode and Waybill Functions
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '--- MIGRATION 2: Core Barcode and Waybill Functions ---';
    RAISE NOTICE 'Creating waybill generation and code storage functions';
END $$;

\i sql/52_waybill_barcode_receipt_functions.sql

-- =============================================================================
-- MIGRATION 3: Receipt and Verification Functions
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '--- MIGRATION 3: Receipt and Verification Functions ---';
    RAISE NOTICE 'Adding receipt generation and 6-digit verification system';
END $$;

\i sql/53_receipt_verification_functions.sql

-- =============================================================================
-- MIGRATION 4: Enhanced Consolidation Functions
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '--- MIGRATION 4: Enhanced Consolidation Functions ---';
    RAISE NOTICE 'Implementing advanced shipment consolidation with full traceability';
END $$;

\i sql/54_enhanced_consolidation_functions.sql

-- =============================================================================
-- DEPLOYMENT VERIFICATION
-- =============================================================================

DO $$
DECLARE
    packages_cols_count INTEGER;
    shipments_cols_count INTEGER;
    receipts_exists BOOLEAN;
    verification_log_exists BOOLEAN;
    functions_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'DEPLOYMENT VERIFICATION';
    RAISE NOTICE '=============================================================================';
    
    -- Check packages table enhancements
    SELECT COUNT(*) INTO packages_cols_count
    FROM information_schema.columns
    WHERE table_name = 'packages'
    AND column_name IN ('barcode_data', 'qr_code_data', 'linked_to_shipment_id', 'delivery_auth_code');
    
    RAISE NOTICE 'Packages table new columns: % of 4 expected', packages_cols_count;
    
    -- Check shipments table enhancements
    SELECT COUNT(*) INTO shipments_cols_count
    FROM information_schema.columns
    WHERE table_name = 'shipments'
    AND column_name IN ('barcode_data', 'qr_code_data', 'waybill_data', 'total_packages');
    
    RAISE NOTICE 'Shipments table new columns: % of 4 expected', shipments_cols_count;
    
    -- Check new tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'receipts'
    ) INTO receipts_exists;
    
    RAISE NOTICE 'Receipts table exists: %', receipts_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'package_verification_log'
    ) INTO verification_log_exists;
    
    RAISE NOTICE 'Package verification log table exists: %', verification_log_exists;
    
    -- Check functions
    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'generate_waybill',
        'generate_package_intake_receipt',
        'generate_shipment_receipt',
        'verify_package_delivery',
        'create_shipment_from_packages_enhanced',
        'store_package_codes',
        'store_shipment_codes',
        'generate_auth_code',
        'generate_receipt_number'
    );
    
    RAISE NOTICE 'New functions created: % of 9 expected', functions_count;
    
    -- Final verification
    IF packages_cols_count = 4 AND shipments_cols_count >= 4 AND 
       receipts_exists AND verification_log_exists AND functions_count = 9 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ DEPLOYMENT SUCCESSFUL!';
        RAISE NOTICE 'All migrations completed successfully';
    ELSE
        RAISE WARNING '';
        RAISE WARNING '⚠️  DEPLOYMENT INCOMPLETE!';
        RAISE WARNING 'Some migrations may have failed. Please check logs above.';
    END IF;
END $$;

-- =============================================================================
-- DEPLOYMENT SUMMARY
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'DEPLOYMENT SUMMARY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✨ NEW FEATURES DEPLOYED:';
    RAISE NOTICE '';
    RAISE NOTICE '1. 📋 Digital Waybill Generation';
    RAISE NOTICE '   - Comprehensive shipment documents with all details';
    RAISE NOTICE '   - Automatic generation with barcode/QR integration';
    RAISE NOTICE '';
    RAISE NOTICE '2. 📊 Barcode & QR Code System';
    RAISE NOTICE '   - Automatic code generation for packages and shipments';
    RAISE NOTICE '   - Database storage for barcodes and QR codes';
    RAISE NOTICE '   - Public tracking endpoint integration';
    RAISE NOTICE '';
    RAISE NOTICE '3. 🧾 Receipt Generation';
    RAISE NOTICE '   - Package intake receipts';
    RAISE NOTICE '   - Shipment creation receipts';
    RAISE NOTICE '   - Professional formatting with branding';
    RAISE NOTICE '';
    RAISE NOTICE '4. 📦 Enhanced Consolidation';
    RAISE NOTICE '   - Package-to-shipment linking (linked_to_shipment_id)';
    RAISE NOTICE '   - Aggregated metrics (weight, value, count)';
    RAISE NOTICE '   - Suite number tracking for all packages';
    RAISE NOTICE '';
    RAISE NOTICE '5. 🔐 6-Digit Authentication System';
    RAISE NOTICE '   - Secure random code generation at intake';
    RAISE NOTICE '   - Encrypted storage in database';
    RAISE NOTICE '   - Required for delivery confirmation';
    RAISE NOTICE '';
    RAISE NOTICE '6. ✅ Package Verification';
    RAISE NOTICE '   - Complete verification workflow';
    RAISE NOTICE '   - Comprehensive audit logging';
    RAISE NOTICE '   - Multi-factor validation (code + suite number)';
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '1. Install NPM dependencies:';
    RAISE NOTICE '   npm install qrcode @types/qrcode @types/jsbarcode';
    RAISE NOTICE '';
    RAISE NOTICE '2. Review implementation guide:';
    RAISE NOTICE '   IMPLEMENTATION_GUIDE.md';
    RAISE NOTICE '';
    RAISE NOTICE '3. Test features using provided examples';
    RAISE NOTICE '';
    RAISE NOTICE '4. Deploy frontend components to production';
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Deployment completed at: %', NOW();
    RAISE NOTICE '=============================================================================';
END $$;
