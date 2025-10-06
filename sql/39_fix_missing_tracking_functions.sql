-- Fix Missing Tracking Functions
-- Ensures generate_tracking_number() and generate_package_id() functions exist
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Function to generate unique tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT
SET search_path = ''
AS $$
DECLARE
    new_tracking_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate tracking number in format VC240001, VC240002, etc.
        new_tracking_number := 'VC' || TO_CHAR(NOW(), 'YY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this tracking number already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.packages WHERE tracking_number = new_tracking_number
            UNION
            SELECT 1 FROM public.shipments WHERE tracking_number = new_tracking_number
        ) THEN
            RETURN new_tracking_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique tracking number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique package ID
CREATE OR REPLACE FUNCTION generate_package_id()
RETURNS TEXT
SET search_path = ''
AS $$
DECLARE
    new_package_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate package ID in format PKG240001, PKG240002, etc.
        new_package_id := 'PKG' || TO_CHAR(NOW(), 'YY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this package ID already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.packages WHERE package_id = new_package_id
        ) THEN
            RETURN new_package_id;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique package ID';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_tracking_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_package_id() TO authenticated;

-- Verify functions exist
DO $$
BEGIN
    -- Test generate_tracking_number function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_tracking_number') THEN
        RAISE NOTICE 'SUCCESS: generate_tracking_number() function created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: generate_tracking_number() function not found';
    END IF;
    
    -- Test generate_package_id function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_package_id') THEN
        RAISE NOTICE 'SUCCESS: generate_package_id() function created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: generate_package_id() function not found';
    END IF;
END $$;
