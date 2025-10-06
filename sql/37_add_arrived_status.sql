-- Add 'arrived' Status to Package and Shipment Tables
-- This script adds the 'arrived' status for when goods arrive in Ghana
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-01

-- ============================================
-- 1. UPDATE PACKAGES TABLE STATUS CONSTRAINT
-- ============================================

-- Drop the existing CHECK constraint for packages status
ALTER TABLE packages 
DROP CONSTRAINT IF EXISTS packages_status_check;

-- Add the new CHECK constraint with 'arrived' status
ALTER TABLE packages 
ADD CONSTRAINT packages_status_check 
CHECK (status IN (
    'pending',         -- Awaiting arrival at US warehouse
    'received',        -- Arrived at US warehouse
    'processing',      -- Being processed at US warehouse
    'shipped',         -- Shipped from US to Ghana
    'arrived',         -- Arrived in Ghana (NEW STATUS)
    'delivered'        -- Delivered to customer in Ghana
));

-- ============================================
-- 2. UPDATE SHIPMENTS TABLE STATUS CONSTRAINT
-- ============================================

-- Drop the existing CHECK constraint for shipments status
ALTER TABLE shipments 
DROP CONSTRAINT IF EXISTS shipments_status_check;

-- Add the new CHECK constraint with 'arrived' status
ALTER TABLE shipments 
ADD CONSTRAINT shipments_status_check 
CHECK (status IN (
    'pending',         -- Being prepared for shipment
    'processing',      -- In processing at warehouse
    'shipped',         -- Shipped from US warehouse
    'in_transit',      -- In transit to Ghana
    'arrived',         -- Arrived in Ghana (NEW STATUS)
    'delivered'        -- Delivered to customer
));

-- ============================================
-- 3. UPDATE EXISTING DATA (IF NEEDED)
-- ============================================

-- Optional: Update any existing 'delivered' records that should be 'arrived'
-- Uncomment and modify as needed based on your business logic

/*
-- Example: Update shipments that are marked as delivered but should be arrived
UPDATE shipments 
SET status = 'arrived', 
    updated_at = NOW()
WHERE status = 'delivered' 
  AND estimated_delivery > CURRENT_DATE;

-- Example: Update packages that are marked as delivered but should be arrived  
UPDATE packages 
SET status = 'arrived',
    updated_at = NOW()
WHERE status = 'delivered'
  AND created_at > '2025-01-01'; -- Adjust date as needed
*/

-- ============================================
-- 4. VERIFY THE CHANGES
-- ============================================

-- Check packages table constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'packages_status_check';

-- Check shipments table constraint  
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'shipments_status_check';

-- Test inserting a record with 'arrived' status (should succeed)
-- Uncomment to test:
/*
INSERT INTO packages (
    id, package_id, tracking_number, user_id, status, description
) VALUES (
    gen_random_uuid(),
    'TEST-ARRIVED-001',
    'TRK-TEST-001', 
    (SELECT id FROM users LIMIT 1),
    'arrived',
    'Test package with arrived status'
);

-- Clean up test record
DELETE FROM packages WHERE package_id = 'TEST-ARRIVED-001';
*/

-- ============================================
-- 5. DOCUMENTATION
-- ============================================

-- Updated Package Status Flow:
-- pending → received → processing → shipped → arrived → delivered

-- Updated Shipment Status Flow:  
-- pending → processing → shipped → in_transit → arrived → delivered

-- The 'arrived' status represents:
-- - For Packages: Package has arrived in Ghana and is available for pickup/delivery
-- - For Shipments: Shipment has arrived in Ghana and is being processed for final delivery
