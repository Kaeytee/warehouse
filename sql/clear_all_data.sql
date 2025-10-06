-- COMPREHENSIVE DATA CLEANUP SCRIPT
-- This script clears all data from tables while preserving schema, functions, triggers, and policies
-- WARNING: This will delete ALL user data - use with caution!

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Clear all data from public schema tables in dependency order
-- Start with tables that have no dependencies, then work up the chain

-- 1. Clear junction/relationship tables first
TRUNCATE TABLE package_shipments CASCADE;

-- 2. Clear dependent tables
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE user_preferences CASCADE;
TRUNCATE TABLE addresses CASCADE;

-- 3. Clear main entity tables
TRUNCATE TABLE shipments CASCADE;
TRUNCATE TABLE packages CASCADE;

-- 4. Clear users table (this will cascade to any remaining dependent data)
TRUNCATE TABLE users CASCADE;

-- 5. Clear auth.users table (Supabase Auth users)
-- Note: This requires superuser privileges or service role
DELETE FROM auth.users;

-- 6. Clear storage objects (avatars)
-- Note: This requires storage admin privileges
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- 7. Reset any sequences to start from 1
-- (Add any sequences you have defined)
-- Example: ALTER SEQUENCE your_sequence_name RESTART WITH 1;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify cleanup
SELECT 
    'CLEANUP VERIFICATION' as status,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM packages) as packages_count,
    (SELECT COUNT(*) FROM shipments) as shipments_count,
    (SELECT COUNT(*) FROM notifications) as notifications_count,
    (SELECT COUNT(*) FROM user_preferences) as preferences_count,
    (SELECT COUNT(*) FROM addresses) as addresses_count,
    (SELECT COUNT(*) FROM package_shipments) as package_shipments_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'avatars') as avatar_files_count;

-- Display cleanup summary
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users) = 0 
         AND (SELECT COUNT(*) FROM auth.users) = 0 
         AND (SELECT COUNT(*) FROM packages) = 0 
        THEN 'SUCCESS: All data cleared'
        ELSE 'WARNING: Some data may remain'
    END as cleanup_status;

-- Show preserved schema elements
SELECT 
    'PRESERVED ELEMENTS' as category,
    'Tables, Functions, Triggers, Policies, and RLS remain intact' as details;

-- Instructions:
-- 1. Run this script in Supabase SQL Editor with service role privileges
-- 2. Confirm all counts are 0 in the verification section
-- 3. Test user registration to ensure triggers still work
-- 4. Re-populate with fresh test data if needed
