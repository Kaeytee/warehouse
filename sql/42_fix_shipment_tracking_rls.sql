-- Fix RLS policy for shipment tracking
-- Allow users to view shipments that contain their packages
-- This enables tracking functionality where users can track shipments by tracking number
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-03

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own shipments" ON shipments;

-- Create new policy that allows users to view:
-- 1. Shipments they created (user_id = auth.uid())
-- 2. Shipments that contain their packages (via junction table)
CREATE POLICY "Users can view accessible shipments" ON shipments
    FOR SELECT USING (
        -- User owns the shipment
        auth.uid() = user_id
        OR
        -- User has packages in the shipment
        EXISTS (
            SELECT 1 FROM package_shipments ps
            JOIN packages p ON ps.package_id = p.id
            WHERE ps.shipment_id = shipments.id
            AND p.user_id = auth.uid()
        )
    );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'shipments' 
AND policyname = 'Users can view accessible shipments';

-- Test query to verify access (replace with actual user ID and tracking number)
-- SELECT id, tracking_number, status FROM shipments 
-- WHERE tracking_number = 'YOUR_TRACKING_NUMBER_HERE';
