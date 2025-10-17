-- ============================================================================
-- FIX ESTIMATED DELIVERY FOR ALL SHIPMENTS
-- ============================================================================
-- Sets estimated_delivery to 3 days from created_at for all shipments
-- where estimated_delivery is NULL
-- 
-- This ensures all waybills display a proper delivery estimate
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-17
-- ============================================================================

-- ============================================================================
-- STEP 1: Update existing shipments with NULL estimated_delivery
-- ============================================================================

-- Update all shipments that have NULL estimated_delivery
-- Set it to 3 days from their created_at date
UPDATE shipments
SET 
    estimated_delivery = (created_at + INTERVAL '3 days')::DATE,
    updated_at = NOW()
WHERE estimated_delivery IS NULL;

-- Log the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Get count of shipments that were updated
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Updated % shipment(s) with estimated_delivery = created_at + 3 days', updated_count;
END $$;

-- ============================================================================
-- STEP 2: Create trigger to auto-set estimated_delivery on new shipments
-- ============================================================================

-- Function to automatically set estimated_delivery when creating shipment
CREATE OR REPLACE FUNCTION set_estimated_delivery()
RETURNS TRIGGER AS $$
BEGIN
    -- If estimated_delivery is not provided, calculate it as 3 days from creation
    IF NEW.estimated_delivery IS NULL THEN
        NEW.estimated_delivery := (NEW.created_at + INTERVAL '3 days')::DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_set_estimated_delivery ON shipments;

-- Create trigger on shipments table
CREATE TRIGGER trigger_set_estimated_delivery
    BEFORE INSERT ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION set_estimated_delivery();

-- ============================================================================
-- STEP 3: Verification
-- ============================================================================

-- Check that all shipments now have estimated_delivery
SELECT 
    COUNT(*) FILTER (WHERE estimated_delivery IS NULL) as null_count,
    COUNT(*) FILTER (WHERE estimated_delivery IS NOT NULL) as has_delivery_count,
    COUNT(*) as total_shipments
FROM shipments;

-- Show sample of updated shipments
SELECT 
    tracking_number,
    created_at,
    estimated_delivery,
    (estimated_delivery - created_at::DATE) as days_difference
FROM shipments
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- VERIFICATION OUTPUT
-- ============================================================================

SELECT '✅ All shipments now have estimated_delivery set to 3 days from creation' AS status;
SELECT 'New shipments will automatically get estimated_delivery via trigger' AS message;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Changes made:
-- 1. Updated all existing shipments with NULL estimated_delivery
-- 2. Created trigger to auto-set estimated_delivery on INSERT
-- 3. Estimated delivery is always 3 days from created_at
-- 
-- This ensures:
-- - Waybills always show proper delivery estimate (no more "N/A")
-- - Consistent delivery timeframe across all shipments
-- - Automatic calculation for all future shipments
-- 
-- ============================================================================
