-- RLS Security Fix for Missing Tables
-- Enables Row Level Security on package_shipments table
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Enable RLS on package_shipments table
ALTER TABLE package_shipments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for package_shipments table
-- Users can only see their own package shipments
CREATE POLICY "Users can view their own package shipments"
ON package_shipments FOR SELECT
USING (
    package_id IN (
        SELECT id FROM packages WHERE user_id = auth.uid()
    )
);

-- Admins and warehouse staff can view all package shipments
CREATE POLICY "Admins can view all package shipments"
ON package_shipments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'warehouse_admin')
    )
);

-- Only warehouse staff can insert package shipments
CREATE POLICY "Warehouse staff can create package shipments"
ON package_shipments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    )
);

-- Only warehouse staff can update package shipments
CREATE POLICY "Warehouse staff can update package shipments"
ON package_shipments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('warehouse_admin', 'admin', 'superadmin')
    )
);

-- Only admins can delete package shipments
CREATE POLICY "Admins can delete package shipments"
ON package_shipments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
    )
);
