-- ============================================================================
-- CLEAR ALL SHIPMENT AND RECIPIENT DATA
-- ============================================================================
-- Removes all shipment data, packages, and saved recipients
-- KEEPS: Users, authentication, roles, and permissions
-- 
-- ⚠️  WARNING: THIS WILL DELETE ALL SHIPMENT DATA - CANNOT BE UNDONE!
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-17
-- ============================================================================

-- ============================================================================
-- BACKUP REMINDER
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: About to delete all shipment and package data!';
    RAISE NOTICE '⚠️  Make sure you have a backup if needed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Data that will be DELETED:';
    RAISE NOTICE '  - All shipments';
    RAISE NOTICE '  - All packages';
    RAISE NOTICE '  - All saved recipients';
    RAISE NOTICE '  - All receipts and waybills';
    RAISE NOTICE '  - All notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'Data that will be KEPT:';
    RAISE NOTICE '  - Users and authentication';
    RAISE NOTICE '  - Roles and permissions';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CLEAR ALL DATA IN ONE TRANSACTION
-- ============================================================================

DO $$
BEGIN
    -- Step 1: Delete verification and audit logs
    DELETE FROM package_verification_log;
    RAISE NOTICE '✅ Cleared package_verification_log';

    -- Delete pickup code verification logs (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickup_code_verification_logs') THEN
        DELETE FROM pickup_code_verification_logs;
        RAISE NOTICE '✅ Cleared pickup_code_verification_logs';
    END IF;

    -- Step 2: Delete receipts and documents
    DELETE FROM receipts;
    RAISE NOTICE '✅ Cleared receipts';

    -- Delete waybills (if exists as separate table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waybills') THEN
        DELETE FROM waybills;
        RAISE NOTICE '✅ Cleared waybills';
    END IF;

    -- Step 3: Delete saved recipients
    DELETE FROM saved_recipients;
    RAISE NOTICE '✅ Cleared saved_recipients';

    -- Step 4: Delete shipment-related data (in correct order)
    DELETE FROM package_shipments;
    RAISE NOTICE '✅ Cleared package_shipments';

    DELETE FROM packages;
    RAISE NOTICE '✅ Cleared packages';

    DELETE FROM shipments;
    RAISE NOTICE '✅ Cleared shipments';

    -- Step 5: Delete notifications
    DELETE FROM notifications;
    RAISE NOTICE '✅ Cleared notifications';
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ All shipment data has been deleted successfully!';
END $$;

-- ============================================================================
-- STEP 6: Reset sequences (optional - for clean IDs)
-- ============================================================================

-- This ensures new shipments start with clean tracking numbers
-- No sequence reset needed as we use generated tracking numbers

-- ============================================================================
-- VERIFICATION: Show what's left
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    shipment_count INTEGER;
    package_count INTEGER;
    recipient_count INTEGER;
BEGIN
    -- Count remaining data
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO shipment_count FROM shipments;
    SELECT COUNT(*) INTO package_count FROM packages;
    SELECT COUNT(*) INTO recipient_count FROM saved_recipients;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CLEANUP COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Current Database State:';
    RAISE NOTICE '  👥 Users: % (KEPT)', user_count;
    RAISE NOTICE '  📦 Packages: % (should be 0)', package_count;
    RAISE NOTICE '  🚚 Shipments: % (should be 0)', shipment_count;
    RAISE NOTICE '  📝 Saved Recipients: % (should be 0)', recipient_count;
    RAISE NOTICE '';
    
    IF shipment_count = 0 AND package_count = 0 AND recipient_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All shipment data cleared!';
        RAISE NOTICE '✅ Authentication data preserved!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Some data may still remain';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'You can now start fresh with shipment creation!';
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
