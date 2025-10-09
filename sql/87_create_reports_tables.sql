-- ============================================================================
-- VanguardCargo Warehouse - Reports System Tables
-- ============================================================================
-- Description: Creates tables required for the Reports page functionality
-- Tables: status_history, package_documents
-- Version: 1.0.0
-- Author: Senior Software Engineer
-- ============================================================================

-- ============================================================================
-- DROP EXISTING TABLES (Clean Install)
-- ============================================================================
DROP TABLE IF EXISTS public.status_history CASCADE;
DROP TABLE IF EXISTS public.package_documents CASCADE;

-- ============================================================================
-- TABLE: status_history
-- Purpose: Audit trail for all status changes in the system
-- ============================================================================
CREATE TABLE public.status_history (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign Keys
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('package', 'shipment', 'user')),
    
    -- Status Information
    previous_status TEXT,
    new_status TEXT NOT NULL,
    
    -- Change Metadata
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    performed_by TEXT,
    performed_by_type TEXT DEFAULT 'user' CHECK (performed_by_type IN ('user', 'system', 'api')),
    
    -- Additional Context
    reason TEXT,
    source TEXT DEFAULT 'web_app' CHECK (source IN ('web_app', 'mobile_app', 'api', 'system')),
    location JSONB,
    metadata JSONB,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- TABLE: package_documents
-- Purpose: Track all generated documents for packages (receipts, waybills, labels)
-- ============================================================================
CREATE TABLE public.package_documents (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign Key
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    
    -- Document Information
    document_type TEXT NOT NULL CHECK (document_type IN ('receipt', 'waybill', 'label', 'barcode', 'qr_code')),
    document_url TEXT,
    document_data TEXT,
    
    -- Document Metadata
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT DEFAULT 'application/pdf',
    
    -- Generation Information
    generated_by TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Print Tracking
    print_count INTEGER DEFAULT 0,
    last_printed_at TIMESTAMP WITH TIME ZONE,
    last_printed_by TEXT,
    
    -- Additional Metadata
    metadata JSONB,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES for Performance Optimization
-- ============================================================================

-- Status History Indexes
CREATE INDEX idx_status_history_entity_id ON public.status_history(entity_id);
CREATE INDEX idx_status_history_entity_type ON public.status_history(entity_type);
CREATE INDEX idx_status_history_changed_at ON public.status_history(changed_at DESC);
CREATE INDEX idx_status_history_performed_by ON public.status_history(performed_by);
CREATE INDEX idx_status_history_new_status ON public.status_history(new_status);
CREATE INDEX idx_status_history_created_at ON public.status_history(created_at DESC);

-- Package Documents Indexes
CREATE INDEX idx_package_documents_package_id ON public.package_documents(package_id);
CREATE INDEX idx_package_documents_type ON public.package_documents(document_type);
CREATE INDEX idx_package_documents_created_at ON public.package_documents(created_at DESC);
CREATE INDEX idx_package_documents_generated_at ON public.package_documents(generated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: status_history
-- ============================================================================

-- Policy: Admin users can view all status history
CREATE POLICY "Admin users can view all status history"
ON public.status_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- Policy: Admin users can insert status history
CREATE POLICY "Admin users can insert status history"
ON public.status_history
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- Policy: System can insert status history (for automated processes)
CREATE POLICY "System can insert status history"
ON public.status_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: package_documents
-- ============================================================================

-- Policy: Admin users can view all package documents
CREATE POLICY "Admin users can view all package documents"
ON public.package_documents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- Policy: Admin users can insert package documents
CREATE POLICY "Admin users can insert package documents"
ON public.package_documents
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- Policy: Admin users can update package documents
CREATE POLICY "Admin users can update package documents"
ON public.package_documents
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- TRIGGERS: Automatic timestamp updates
-- ============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to status_history
CREATE TRIGGER update_status_history_updated_at
    BEFORE UPDATE ON public.status_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to package_documents
CREATE TRIGGER update_package_documents_updated_at
    BEFORE UPDATE ON public.package_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Log status change
CREATE OR REPLACE FUNCTION public.log_status_change(
    p_entity_id UUID,
    p_entity_type TEXT,
    p_previous_status TEXT,
    p_new_status TEXT,
    p_performed_by TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'web_app',
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO public.status_history (
        entity_id,
        entity_type,
        previous_status,
        new_status,
        performed_by,
        reason,
        source,
        metadata
    ) VALUES (
        p_entity_id,
        p_entity_type,
        p_previous_status,
        p_new_status,
        p_performed_by,
        p_reason,
        p_source,
        p_metadata
    )
    RETURNING id INTO v_history_id;
    
    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record document generation
CREATE OR REPLACE FUNCTION public.record_document_generation(
    p_package_id UUID,
    p_document_type TEXT,
    p_document_data TEXT DEFAULT NULL,
    p_generated_by TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_document_id UUID;
BEGIN
    INSERT INTO public.package_documents (
        package_id,
        document_type,
        document_data,
        generated_by,
        metadata
    ) VALUES (
        p_package_id,
        p_document_type,
        p_document_data,
        p_generated_by,
        p_metadata
    )
    RETURNING id INTO v_document_id;
    
    RETURN v_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update document print count
CREATE OR REPLACE FUNCTION public.record_document_print(
    p_document_id UUID,
    p_printed_by TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.package_documents
    SET 
        print_count = print_count + 1,
        last_printed_at = NOW(),
        last_printed_by = p_printed_by
    WHERE id = p_document_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.status_history TO authenticated;
GRANT SELECT ON public.package_documents TO authenticated;

-- Grant INSERT permission to authenticated users
GRANT INSERT ON public.status_history TO authenticated;
GRANT INSERT ON public.package_documents TO authenticated;

-- Grant UPDATE permission to authenticated users
GRANT UPDATE ON public.package_documents TO authenticated;

-- Grant EXECUTE on helper functions
GRANT EXECUTE ON FUNCTION public.log_status_change TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_document_generation TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_document_print TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample status history entries (optional)
-- Uncomment to populate with test data
/*
DO $$
DECLARE
    v_package_id UUID;
BEGIN
    -- Get a sample package ID
    SELECT id INTO v_package_id FROM public.packages LIMIT 1;
    
    IF v_package_id IS NOT NULL THEN
        -- Insert sample status changes
        PERFORM public.log_status_change(
            v_package_id,
            'package',
            'pending',
            'in_transit',
            'admin@vanguardcargo.co',
            'Package dispatched from warehouse',
            'web_app',
            '{"location": "Alexandria, VA"}'::JSONB
        );
        
        PERFORM public.log_status_change(
            v_package_id,
            'package',
            'in_transit',
            'delivered',
            'system',
            'Package delivered successfully',
            'system',
            '{"delivery_time": "2025-10-09T14:30:00Z"}'::JSONB
        );
    END IF;
END;
$$;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created successfully
SELECT 
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('status_history', 'package_documents')
ORDER BY tablename;

-- Verify indexes created
SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('status_history', 'package_documents')
ORDER BY tablename, indexname;

-- Verify RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('status_history', 'package_documents')
ORDER BY tablename, policyname;

-- ============================================================================
-- DEPLOYMENT NOTES
-- ============================================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all tables, indexes, and policies created successfully
-- 3. Test RLS policies with different user roles
-- 4. Monitor query performance with indexes
-- 5. Consider enabling real-time subscriptions if needed
-- ============================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Reports system tables created successfully!';
    RAISE NOTICE '✅ Tables: status_history, package_documents';
    RAISE NOTICE '✅ Indexes: Performance optimized';
    RAISE NOTICE '✅ RLS Policies: Security enabled';
    RAISE NOTICE '✅ Helper Functions: Ready to use';
    RAISE NOTICE '';
    RAISE NOTICE '📊 You can now use the Reports page!';
END;
$$;
