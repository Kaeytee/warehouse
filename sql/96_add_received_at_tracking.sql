-- =====================================================
-- SQL Migration: Add Received At Timestamp Tracking
-- =====================================================
-- Purpose: Add received_at timestamp to track when packages
--          are marked as 'received' status for accurate daily metrics
-- Date: 2025-10-09
-- Author: Senior Software Engineer
-- =====================================================

-- Step 1: Add received_at column to packages table
-- This column tracks the exact timestamp when a package status changes to 'received'
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying by received_at date
CREATE INDEX IF NOT EXISTS idx_packages_received_at 
ON packages(received_at) 
WHERE received_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN packages.received_at IS 'Timestamp when package status was changed to received';

-- Step 2: Backfill existing received packages with created_at as fallback
-- This ensures historical data has some received_at value
UPDATE packages
SET received_at = created_at
WHERE status = 'received' 
AND received_at IS NULL;

-- Step 3: Create trigger function to automatically set received_at
-- This function sets received_at whenever status changes to 'received'
CREATE OR REPLACE FUNCTION set_received_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to 'received' and received_at is not set
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    NEW.received_at = NOW();
  END IF;
  
  -- If status is being changed away from 'received', clear received_at
  IF OLD.status = 'received' AND NEW.status != 'received' THEN
    NEW.received_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger on packages table
DROP TRIGGER IF EXISTS trigger_set_received_at ON packages;
CREATE TRIGGER trigger_set_received_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION set_received_at_timestamp();

-- Step 5: Also handle INSERT case (when package is created with status='received')
CREATE OR REPLACE FUNCTION set_received_at_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If package is being created with status='received', set received_at
  IF NEW.status = 'received' AND NEW.received_at IS NULL THEN
    NEW.received_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_received_at_insert ON packages;
CREATE TRIGGER trigger_set_received_at_insert
  BEFORE INSERT ON packages
  FOR EACH ROW
  EXECUTE FUNCTION set_received_at_on_insert();

-- Step 6: Create helper function to get today's received packages count
CREATE OR REPLACE FUNCTION get_todays_received_packages_count()
RETURNS INTEGER AS $$
DECLARE
  package_count INTEGER;
BEGIN
  -- Get count of packages marked as received today
  SELECT COUNT(*)
  INTO package_count
  FROM packages
  WHERE status = 'received'
  AND received_at >= CURRENT_DATE
  AND received_at < CURRENT_DATE + INTERVAL '1 day';
  
  RETURN COALESCE(package_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_todays_received_packages_count() IS 'Returns count of packages marked as received today';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'packages' 
AND column_name = 'received_at';

-- Verify triggers were created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_set_received_at', 'trigger_set_received_at_insert');

-- Verify index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'packages'
AND indexname = 'idx_packages_received_at';

-- Show sample of packages with received_at
SELECT package_id, status, received_at, created_at
FROM packages
WHERE status = 'received'
ORDER BY received_at DESC
LIMIT 10;

-- Test the helper function
SELECT get_todays_received_packages_count() AS todays_received_count;

-- =====================================================
-- Usage Notes
-- =====================================================
-- 1. The received_at timestamp is automatically set when status changes to 'received'
-- 2. If status changes away from 'received', received_at is cleared
-- 3. For dashboard metrics, query: WHERE status = 'received' AND received_at >= CURRENT_DATE
-- 4. Historical data was backfilled with created_at as a fallback
-- 5. Use get_todays_received_packages_count() function for quick counts
-- =====================================================
