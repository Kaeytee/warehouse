-- Add 'arrived' status to shipments table
-- This allows packages to be marked as arrived at destination before final delivery

-- Update the status constraint to include 'arrived'
ALTER TABLE shipments 
DROP CONSTRAINT IF EXISTS shipments_status_check;

ALTER TABLE shipments 
ADD CONSTRAINT shipments_status_check 
CHECK (status IN ('pending', 'processing', 'shipped', 'in_transit', 'arrived', 'delivered'));

-- Update any existing 'delivered' shipments that should be 'arrived' 
-- (Optional - you can run this if you want to convert some existing data)
-- UPDATE shipments SET status = 'arrived' WHERE status = 'delivered' AND created_at > NOW() - INTERVAL '7 days';

COMMENT ON COLUMN shipments.status IS 'Shipment status: pending -> processing -> shipped -> in_transit -> arrived -> delivered';
