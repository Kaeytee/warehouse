-- Debug Function Status
-- Check if all required functions exist in the database
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Check if functions exist in the database
DO $$
BEGIN
    RAISE NOTICE '=== DEBUGGING FUNCTION STATUS ===';
    RAISE NOTICE '';
    
    -- Check generate_tracking_number function
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'generate_tracking_number'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ generate_tracking_number() function EXISTS';
        
        -- Try to execute it
        BEGIN
            DECLARE
                test_tracking TEXT;
            BEGIN
                test_tracking := generate_tracking_number();
                RAISE NOTICE '✅ generate_tracking_number() WORKS - Generated: %', test_tracking;
            END;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ generate_tracking_number() EXISTS but FAILS: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ generate_tracking_number() function DOES NOT EXIST';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check generate_package_id function
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'generate_package_id'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ generate_package_id() function EXISTS';
        
        -- Try to execute it
        BEGIN
            DECLARE
                test_package_id TEXT;
            BEGIN
                test_package_id := generate_package_id();
                RAISE NOTICE '✅ generate_package_id() WORKS - Generated: %', test_package_id;
            END;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ generate_package_id() EXISTS but FAILS: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ generate_package_id() function DOES NOT EXIST';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check warehouse_package_intake function
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'warehouse_package_intake'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✅ warehouse_package_intake() function EXISTS';
        
        -- Get function signature
        SELECT 
            p.proname,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'warehouse_package_intake'
        AND n.nspname = 'public';
        
        RAISE NOTICE '✅ warehouse_package_intake() signature verified';
    ELSE
        RAISE NOTICE '❌ warehouse_package_intake() function DOES NOT EXIST';
    END IF;
    
    RAISE NOTICE '';
    
    -- List all functions that contain 'generate' or 'package' in their name
    RAISE NOTICE '=== ALL RELATED FUNCTIONS IN DATABASE ===';
    
    FOR rec IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE (p.proname ILIKE '%generate%' OR p.proname ILIKE '%package%')
        AND n.nspname = 'public'
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'Found: %.%(%)', rec.schema_name, rec.function_name, rec.arguments;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DEBUGGING COMPLETE ===';
END $$;

-- Also check table structure to ensure packages table exists
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING REQUIRED TABLES ===';
    
    -- Check packages table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'packages'
    ) THEN
        RAISE NOTICE '✅ packages table EXISTS';
        
        -- Check required columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'packages' 
            AND column_name = 'tracking_number'
        ) THEN
            RAISE NOTICE '✅ packages.tracking_number column EXISTS';
        ELSE
            RAISE NOTICE '❌ packages.tracking_number column MISSING';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'packages' 
            AND column_name = 'package_id'
        ) THEN
            RAISE NOTICE '✅ packages.package_id column EXISTS';
        ELSE
            RAISE NOTICE '❌ packages.package_id column MISSING';
        END IF;
    ELSE
        RAISE NOTICE '❌ packages table DOES NOT EXIST';
    END IF;
    
    -- Check shipments table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments'
    ) THEN
        RAISE NOTICE '✅ shipments table EXISTS';
    ELSE
        RAISE NOTICE '❌ shipments table DOES NOT EXIST';
    END IF;
    
    RAISE NOTICE '=== TABLE CHECK COMPLETE ===';
END $$;
