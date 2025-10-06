-- =====================================================
-- PRODUCTION RESET SCRIPT - CLEAR ALL USER DATA
-- =====================================================
-- This script will completely clear all user data from the database
-- Use with EXTREME CAUTION - this is irreversible
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-26
-- =====================================================

-- Step 1: Disable RLS temporarily for cleanup (if needed)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE packages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE package_shipments DISABLE ROW LEVEL SECURITY;

-- Step 2: Clear all related data in correct order (respecting foreign key constraints)
BEGIN;

-- Clear package-shipment relationships first
DELETE FROM package_shipments;
COMMENT ON TABLE package_shipments IS 'Cleared all package-shipment relationships for production reset';

-- Clear notifications (references users)
DELETE FROM notifications;
COMMENT ON TABLE notifications IS 'Cleared all notifications for production reset';

-- Clear user preferences (references users)
DELETE FROM user_preferences;
COMMENT ON TABLE user_preferences IS 'Cleared all user preferences for production reset';

-- Clear packages (references users)
DELETE FROM packages;
COMMENT ON TABLE packages IS 'Cleared all packages for production reset';

-- Clear shipments (references users)
DELETE FROM shipments;
COMMENT ON TABLE shipments IS 'Cleared all shipments for production reset';

-- Clear addresses (references users)
DELETE FROM addresses;
COMMENT ON TABLE addresses IS 'Cleared all addresses for production reset';

-- Clear users table last (parent table)
DELETE FROM users;
COMMENT ON TABLE users IS 'Cleared all users for production reset';

-- Step 3: Reset sequences and auto-increment values
-- Reset suite number sequence (if using sequences)
-- This ensures new users start from VC-001 again
-- Note: If using custom function for suite numbers, this may not be needed

-- Step 4: Verify all tables are empty
DO $$
DECLARE
    user_count INTEGER;
    address_count INTEGER;
    package_count INTEGER;
    shipment_count INTEGER;
    notification_count INTEGER;
    preference_count INTEGER;
    relationship_count INTEGER;
BEGIN
    -- Count records in all tables
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO address_count FROM addresses;
    SELECT COUNT(*) INTO package_count FROM packages;
    SELECT COUNT(*) INTO shipment_count FROM shipments;
    SELECT COUNT(*) INTO notification_count FROM notifications;
    SELECT COUNT(*) INTO preference_count FROM user_preferences;
    SELECT COUNT(*) INTO relationship_count FROM package_shipments;
    
    -- Log the results
    RAISE NOTICE 'DATABASE CLEANUP VERIFICATION:';
    RAISE NOTICE 'Users: % records remaining', user_count;
    RAISE NOTICE 'Addresses: % records remaining', address_count;
    RAISE NOTICE 'Packages: % records remaining', package_count;
    RAISE NOTICE 'Shipments: % records remaining', shipment_count;
    RAISE NOTICE 'Notifications: % records remaining', notification_count;
    RAISE NOTICE 'User Preferences: % records remaining', preference_count;
    RAISE NOTICE 'Package Shipments: % records remaining', relationship_count;
    
    -- Verify complete cleanup
    IF user_count = 0 AND address_count = 0 AND package_count = 0 AND 
       shipment_count = 0 AND notification_count = 0 AND preference_count = 0 AND
       relationship_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All user data has been completely cleared from database';
    ELSE
        RAISE EXCEPTION 'ERROR: Some data still remains in database. Manual cleanup required.';
    END IF;
END $$;

-- Step 5: Re-enable RLS if it was disabled
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE package_shipments ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Step 6: Log completion
SELECT 
    'DATABASE_RESET_COMPLETE' as status,
    NOW() as completed_at,
    'All user data cleared for production deployment' as message;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This script only clears the database tables
-- 2. You still need to clear Supabase Auth users separately
-- 3. You may need to clear the avatars storage bucket
-- 4. Consider backing up data before running this script
-- 5. Test this script in development environment first
-- =====================================================
