-- Fix and maintain total_packages count in shipments table
-- Updates existing shipments and creates triggers for automatic maintenance
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07

-- ============================================================================
-- SECTION 1: UPDATE EXISTING SHIPMENTS
-- ============================================================================

-- Update all existing shipments with correct package count
UPDATE shipments s
SET total_packages = (
    SELECT COUNT(*)
    FROM package_shipments ps
    WHERE ps.shipment_id = s.id
)
WHERE total_packages = 0 OR total_packages IS NULL;

-- ============================================================================
-- SECTION 2: CREATE TRIGGER FUNCTION FOR AUTOMATIC MAINTENANCE
-- ============================================================================

-- Function to update shipment total_packages when packages are added/removed
CREATE OR REPLACE FUNCTION update_shipment_total_packages()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the shipment's total_packages count
    IF TG_OP = 'INSERT' THEN
        -- Package added to shipment
        UPDATE shipments
        SET 
            total_packages = (
                SELECT COUNT(*)
                FROM package_shipments
                WHERE shipment_id = NEW.shipment_id
            ),
            updated_at = NOW()
        WHERE id = NEW.shipment_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Package removed from shipment
        UPDATE shipments
        SET 
            total_packages = (
                SELECT COUNT(*)
                FROM package_shipments
                WHERE shipment_id = OLD.shipment_id
            ),
            updated_at = NOW()
        WHERE id = OLD.shipment_id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Package moved between shipments
        IF NEW.shipment_id != OLD.shipment_id THEN
            -- Update old shipment
            UPDATE shipments
            SET 
                total_packages = (
                    SELECT COUNT(*)
                    FROM package_shipments
                    WHERE shipment_id = OLD.shipment_id
                ),
                updated_at = NOW()
            WHERE id = OLD.shipment_id;
            
            -- Update new shipment
            UPDATE shipments
            SET 
                total_packages = (
                    SELECT COUNT(*)
                    FROM package_shipments
                    WHERE shipment_id = NEW.shipment_id
                ),
                updated_at = NOW()
            WHERE id = NEW.shipment_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 3: CREATE TRIGGER
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_shipment_total_packages ON package_shipments;

-- Create trigger on package_shipments table
CREATE TRIGGER trigger_update_shipment_total_packages
    AFTER INSERT OR UPDATE OR DELETE ON package_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_shipment_total_packages();

-- ============================================================================
-- SECTION 4: VERIFICATION
-- ============================================================================

-- Verify the fix worked
DO $$
DECLARE
    shipments_fixed INTEGER;
    shipments_with_packages INTEGER;
BEGIN
    -- Count shipments that were fixed
    SELECT COUNT(*) INTO shipments_fixed
    FROM shipments
    WHERE total_packages > 0;
    
    -- Count shipments with actual packages
    SELECT COUNT(DISTINCT shipment_id) INTO shipments_with_packages
    FROM package_shipments;
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'TOTAL_PACKAGES FIX COMPLETED';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Shipments with packages: %', shipments_fixed;
    RAISE NOTICE 'Actual shipments with packages: %', shipments_with_packages;
    RAISE NOTICE 'Trigger installed: trigger_update_shipment_total_packages';
    RAISE NOTICE '====================================';
END $$;

