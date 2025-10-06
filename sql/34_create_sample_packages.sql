-- Create sample packages data for chart visualization
-- This will populate the packages table with realistic data for the dashboard chart
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- First, get a user ID to associate packages with (using the first available user)
DO $$
DECLARE
    sample_user_id UUID;
    package_counter INTEGER := 1;
    current_date_iter DATE;
    status_array TEXT[] := ARRAY['pending', 'received', 'processing', 'shipped', 'delivered'];
    random_status TEXT;
    random_weight DECIMAL;
    random_value DECIMAL;
BEGIN
    -- Get the first user ID from the users table
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- If no users exist, create a sample user first
    IF sample_user_id IS NULL THEN
        INSERT INTO users (
            id, email, first_name, last_name, role, suite_number, status, email_verified
        ) VALUES (
            gen_random_uuid(),
            'sample@vanguardcargo.com',
            'Sample',
            'User',
            'client',
            'VC-001',
            'active',
            true
        ) RETURNING id INTO sample_user_id;
    END IF;
    
    -- Create packages for the last 90 days with varying quantities
    FOR i IN 0..89 LOOP
        current_date_iter := CURRENT_DATE - INTERVAL '1 day' * i;
        
        -- Create 1-8 packages per day (more recent days have more packages)
        FOR j IN 1..(CASE WHEN i < 30 THEN 3 + (random() * 5)::INTEGER 
                           WHEN i < 60 THEN 2 + (random() * 3)::INTEGER 
                           ELSE 1 + (random() * 2)::INTEGER END) LOOP
            
            -- Select random status (more delivered for older packages)
            -- Array indices: 1=pending, 2=received, 3=processing, 4=shipped, 5=delivered
            IF i > 7 THEN
                -- For older packages: shipped or delivered (70% delivered, 30% shipped)
                IF random() < 0.7 THEN
                    random_status := 'delivered';
                ELSE
                    random_status := 'shipped';
                END IF;
            ELSIF i > 3 THEN
                -- For medium age packages: processing, shipped, or delivered
                CASE (random() * 3)::INTEGER
                    WHEN 0 THEN random_status := 'processing';
                    WHEN 1 THEN random_status := 'shipped';
                    ELSE random_status := 'delivered';
                END CASE;
            ELSE
                -- For recent packages: any status with realistic distribution
                CASE (random() * 10)::INTEGER
                    WHEN 0,1,2 THEN random_status := 'pending';
                    WHEN 3,4 THEN random_status := 'received';
                    WHEN 5,6 THEN random_status := 'processing';
                    WHEN 7,8 THEN random_status := 'shipped';
                    ELSE random_status := 'delivered';
                END CASE;
            END IF;
            
            -- Generate random weight and value
            random_weight := 0.5 + (random() * 10)::DECIMAL;
            random_value := 10 + (random() * 500)::DECIMAL;
            
            -- Insert package
            INSERT INTO packages (
                package_id,
                tracking_number,
                user_id,
                status,
                description,
                weight,
                declared_value,
                store_name,
                vendor_name,
                notes,
                created_at,
                updated_at
            ) VALUES (
                'PKG-' || LPAD(package_counter::TEXT, 6, '0'),
                'TRK-' || LPAD(package_counter::TEXT, 8, '0'),
                sample_user_id,
                random_status,
                'Sample package ' || package_counter,
                random_weight,
                random_value,
                CASE (random() * 5)::INTEGER
                    WHEN 0 THEN 'Amazon'
                    WHEN 1 THEN 'eBay'
                    WHEN 2 THEN 'Walmart'
                    WHEN 3 THEN 'Target'
                    ELSE 'Best Buy'
                END,
                'Sample Vendor',
                'Sample package for dashboard visualization',
                current_date_iter + INTERVAL '1 hour' * (random() * 23)::INTEGER,
                current_date_iter + INTERVAL '1 hour' * (random() * 23)::INTEGER
            );
            
            package_counter := package_counter + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % sample packages for chart visualization', package_counter - 1;
END $$;

-- Create some sample shipments data as well
DO $$
DECLARE
    sample_user_id UUID;
    shipment_counter INTEGER := 1;
    current_date_iter DATE;
    status_array TEXT[] := ARRAY['pending', 'processing', 'shipped', 'in_transit', 'delivered'];
    service_array TEXT[] := ARRAY['standard', 'express', 'overnight'];
    random_status TEXT;
    random_service TEXT;
    random_weight DECIMAL;
    random_value DECIMAL;
    random_cost DECIMAL;
BEGIN
    -- Get the first user ID
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- Create shipments for the last 60 days
    FOR i IN 0..59 LOOP
        current_date_iter := CURRENT_DATE - INTERVAL '1 day' * i;
        
        -- Create 0-3 shipments per day
        FOR j IN 1..(random() * 3)::INTEGER LOOP
            
            -- Select random status (more delivered for older shipments)
            IF i > 14 THEN
                random_status := 'delivered';
            ELSIF i > 7 THEN
                -- For medium age shipments: shipped, in_transit, or delivered
                CASE (random() * 3)::INTEGER
                    WHEN 0 THEN random_status := 'shipped';
                    WHEN 1 THEN random_status := 'in_transit';
                    ELSE random_status := 'delivered';
                END CASE;
            ELSE
                -- For recent shipments: any status with realistic distribution
                CASE (random() * 5)::INTEGER
                    WHEN 0 THEN random_status := 'pending';
                    WHEN 1 THEN random_status := 'processing';
                    WHEN 2 THEN random_status := 'shipped';
                    WHEN 3 THEN random_status := 'in_transit';
                    ELSE random_status := 'delivered';
                END CASE;
            END IF;
            
            -- Select random service type
            CASE (random() * 3)::INTEGER
                WHEN 0 THEN random_service := 'standard';
                WHEN 1 THEN random_service := 'express';
                ELSE random_service := 'overnight';
            END CASE;
            random_weight := 1 + (random() * 20)::DECIMAL;
            random_value := 50 + (random() * 1000)::DECIMAL;
            random_cost := 15 + (random() * 100)::DECIMAL;
            
            -- Insert shipment
            INSERT INTO shipments (
                tracking_number,
                user_id,
                status,
                recipient_name,
                recipient_phone,
                delivery_address,
                delivery_city,
                delivery_country,
                total_weight,
                total_value,
                shipping_cost,
                service_type,
                estimated_delivery,
                created_at,
                updated_at
            ) VALUES (
                'SHP-' || LPAD(shipment_counter::TEXT, 8, '0'),
                sample_user_id,
                random_status,
                'Sample Recipient ' || shipment_counter,
                '+1-555-' || LPAD((random() * 9999)::INTEGER::TEXT, 4, '0'),
                (100 + (random() * 9900)::INTEGER) || ' Sample Street',
                CASE (random() * 4)::INTEGER
                    WHEN 0 THEN 'New York'
                    WHEN 1 THEN 'Los Angeles'
                    WHEN 2 THEN 'Chicago'
                    ELSE 'Houston'
                END,
                'USA',
                random_weight,
                random_value,
                random_cost,
                random_service,
                current_date_iter + INTERVAL '7 days',
                current_date_iter + INTERVAL '1 hour' * (random() * 23)::INTEGER,
                current_date_iter + INTERVAL '1 hour' * (random() * 23)::INTEGER
            );
            
            shipment_counter := shipment_counter + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created % sample shipments for dashboard visualization', shipment_counter - 1;
END $$;

-- Verify the data was created
SELECT 
    'Packages' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as earliest_date,
    MAX(created_at) as latest_date
FROM packages
UNION ALL
SELECT 
    'Shipments' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as earliest_date,
    MAX(created_at) as latest_date
FROM shipments;

-- Show package status distribution
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM packages 
GROUP BY status 
ORDER BY count DESC;
