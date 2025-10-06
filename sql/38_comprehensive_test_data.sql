-- Comprehensive Test Data Population Script
-- Creates 6 users with complete logistics workflow data
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-10-01

-- ============================================
-- 1. INSERT TEST USERS WITH COMPLETE PROFILES
-- ============================================

-- Insert 6 test users with different roles and complete information
INSERT INTO users (
    id, email, first_name, last_name, role, suite_number,
    phone_number, whatsapp_number, street_address, city, country, postal_code,
    status, email_verified, created_at, updated_at
) VALUES
-- Client Users (4)
('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John', 'Doe', 'client', 'VC-001',
 '+1234567890', '+1234567890', '123 Main St', 'New York', 'USA', '10001',
 'active', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),

('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane', 'Smith', 'client', 'VC-002', 
 '+1234567891', '+1234567891', '456 Oak Ave', 'Los Angeles', 'USA', '90210',
 'active', true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),

('33333333-3333-3333-3333-333333333333', 'mike.johnson@example.com', 'Mike', 'Johnson', 'client', 'VC-003',
 '+1234567892', '+1234567892', '789 Pine Rd', 'Chicago', 'USA', '60601',
 'active', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),

('44444444-4444-4444-4444-444444444444', 'sarah.wilson@example.com', 'Sarah', 'Wilson', 'client', 'VC-004',
 '+1234567893', '+1234567893', '321 Elm St', 'Houston', 'USA', '77001',
 'active', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),

-- Admin Users (2)
('55555555-5555-5555-5555-555555555555', 'admin@vanguardcargo.com', 'Admin', 'User', 'admin', 'VC-ADMIN',
 '+1234567894', '+1234567894', '4700 Eisenhower Ave', 'Alexandria', 'USA', '22304',
 'active', true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),

('66666666-6666-6666-6666-666666666666', 'warehouse@vanguardcargo.com', 'Warehouse', 'Manager', 'warehouse_admin', 'VC-WH001',
 '+1234567895', '+1234567895', '4700 Eisenhower Ave', 'Alexandria', 'USA', '22304',
 'active', true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days');

-- ============================================
-- 2. INSERT SHIPPING ADDRESSES
-- ============================================

INSERT INTO addresses (
    user_id, type, line1, line2, city, state_province, postal_code, country, is_default
) VALUES
-- John Doe addresses
('11111111-1111-1111-1111-111111111111', 'shipping', '123 Main St', 'Apt 4B', 'New York', 'NY', '10001', 'USA', true),
('11111111-1111-1111-1111-111111111111', 'billing', '123 Main St', 'Apt 4B', 'New York', 'NY', '10001', 'USA', false),

-- Jane Smith addresses  
('22222222-2222-2222-2222-222222222222', 'shipping', '456 Oak Ave', 'Suite 200', 'Los Angeles', 'CA', '90210', 'USA', true),

-- Mike Johnson addresses
('33333333-3333-3333-3333-333333333333', 'shipping', '789 Pine Rd', NULL, 'Chicago', 'IL', '60601', 'USA', true),

-- Sarah Wilson addresses
('44444444-4444-4444-4444-444444444444', 'shipping', '321 Elm St', 'Unit 5', 'Houston', 'TX', '77001', 'USA', true);

-- ============================================
-- 3. INSERT PACKAGES WITH VARIOUS STATUSES
-- ============================================

INSERT INTO packages (
    id, package_id, tracking_number, user_id, status, description, weight, declared_value,
    store_name, vendor_name, notes, scanned_by, intake_date, created_at, updated_at
) VALUES
-- John Doe packages (VC-001)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PKG25001', 'VC25001', '11111111-1111-1111-1111-111111111111', 'delivered', 'Nike Air Max Shoes', 2.5, 150.00,
 'Nike Store', 'Nike Inc', 'Size 10, White/Black', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '25 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '2 days'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PKG25002', 'VC25002', '11111111-1111-1111-1111-111111111111', 'arrived', 'Apple iPhone Case', 0.3, 45.00,
 'Apple Store', 'Apple Inc', 'iPhone 15 Pro Max case', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

-- Jane Smith packages (VC-002)
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'PKG25003', 'VC25003', '22222222-2222-2222-2222-222222222222', 'shipped', 'Zara Dress Collection', 1.8, 120.00,
 'Zara', 'Zara USA', '3 dresses, size M', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '8 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'PKG25004', 'VC25004', '22222222-2222-2222-2222-222222222222', 'processing', 'Amazon Electronics Bundle', 3.2, 280.00,
 'Amazon', 'Amazon.com', 'Headphones + Tablet stand', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),

-- Mike Johnson packages (VC-003)
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'PKG25005', 'VC25005', '33333333-3333-3333-3333-333333333333', 'received', 'Best Buy Gaming Setup', 15.5, 850.00,
 'Best Buy', 'Best Buy Co', 'Gaming keyboard + mouse + headset', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

-- Sarah Wilson packages (VC-004)
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'PKG25006', 'VC25006', '44444444-4444-4444-4444-444444444444', 'pending', 'H&M Fashion Items', 2.1, 95.00,
 'H&M', 'H&M USA', 'Tops and accessories', NULL, NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- ============================================
-- 4. INSERT SHIPMENTS
-- ============================================

INSERT INTO shipments (
    id, user_id, tracking_number, status, recipient_name, recipient_phone,
    delivery_address, delivery_city, delivery_country, total_weight, total_value,
    shipping_cost, service_type, estimated_delivery, created_at, updated_at
) VALUES
-- Shipment 1 - John's delivered packages
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'SH25001', 'delivered', 'John Doe', '+1234567890',
 '123 Main St, Apt 4B, New York, NY 10001', 'New York', 'USA', 2.5, 150.00,
 25.00, 'standard', NOW() - INTERVAL '3 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '2 days'),

-- Shipment 2 - John's arrived package
('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'SH25002', 'arrived', 'John Doe', '+1234567890',
 '123 Main St, Apt 4B, New York, NY 10001', 'New York', 'USA', 0.3, 45.00,
 15.00, 'express', NOW() + INTERVAL '2 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),

-- Shipment 3 - Jane's shipped packages
('cccccccc-2222-2222-2222-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'SH25003', 'shipped', 'Jane Smith', '+1234567891',
 '456 Oak Ave, Suite 200, Los Angeles, CA 90210', 'Los Angeles', 'USA', 5.0, 400.00,
 35.00, 'standard', NOW() + INTERVAL '7 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days');

-- ============================================
-- 5. LINK PACKAGES TO SHIPMENTS
-- ============================================

INSERT INTO package_shipments (package_id, shipment_id) VALUES
-- John's packages
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb'),
-- Jane's packages in same shipment
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-2222-2222-2222-cccccccccccc'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-2222-2222-2222-cccccccccccc');

-- ============================================
-- 6. INSERT NOTIFICATIONS
-- ============================================

INSERT INTO notifications (
    user_id, title, message, type, is_read, action_url, created_at
) VALUES
-- John Doe notifications
('11111111-1111-1111-1111-111111111111', 'Package Delivered', 'Your Nike shoes have been delivered successfully!', 'package_update', true, '/app/tracking?id=VC25001', NOW() - INTERVAL '2 days'),
('11111111-1111-1111-1111-111111111111', 'Package Arrived in Ghana', 'Your iPhone case has arrived in Ghana and is ready for delivery.', 'package_update', false, '/app/tracking?id=VC25002', NOW() - INTERVAL '1 day'),

-- Jane Smith notifications
('22222222-2222-2222-2222-222222222222', 'Shipment Shipped', 'Your shipment with 2 packages has been shipped to Ghana.', 'shipment_update', false, '/app/tracking?id=SH25003', NOW() - INTERVAL '3 days'),
('22222222-2222-2222-2222-222222222222', 'Welcome to Vanguard Cargo', 'Thank you for choosing our logistics service!', 'system', true, '/app/dashboard', NOW() - INTERVAL '25 days'),

-- Mike Johnson notifications
('33333333-3333-3333-3333-333333333333', 'Package Received', 'Your gaming setup has been received at our warehouse.', 'package_update', false, '/app/tracking?id=VC25005', NOW() - INTERVAL '1 day'),

-- Sarah Wilson notifications
('44444444-4444-4444-4444-444444444444', 'Package Pending', 'We are waiting for your H&M package to arrive at our warehouse.', 'package_update', false, '/app/tracking?id=VC25006', NOW() - INTERVAL '3 days');

-- ============================================
-- 7. INSERT USER PREFERENCES
-- ============================================

INSERT INTO user_preferences (
    user_id, language, units, auto_refresh, email_notifications, sms_notifications,
    whatsapp_notifications, push_notifications, created_at, updated_at
) VALUES
('11111111-1111-1111-1111-111111111111', 'en', 'imperial', true, true, true, true, true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', 'en', 'metric', true, true, false, true, true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('33333333-3333-3333-3333-333333333333', 'en', 'imperial', false, true, true, false, true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('44444444-4444-4444-4444-444444444444', 'en', 'metric', true, false, true, true, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('55555555-5555-5555-5555-555555555555', 'en', 'metric', true, true, true, true, true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
('66666666-6666-6666-6666-666666666666', 'en', 'imperial', true, true, true, true, true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days');

-- ============================================
-- 8. INSERT NOTIFICATION PREFERENCES
-- ============================================

INSERT INTO notification_preferences (
    user_id, email_notifications, sms_notifications, whatsapp_notifications, push_notifications,
    email_package_updates, whatsapp_package_updates, notification_frequency, created_at, updated_at
) VALUES
('11111111-1111-1111-1111-111111111111', true, true, true, true, true, true, 'immediate', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', true, false, true, true, true, true, 'daily', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('33333333-3333-3333-3333-333333333333', true, true, false, true, true, false, 'immediate', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('44444444-4444-4444-4444-444444444444', false, true, true, false, false, true, 'weekly', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('55555555-5555-5555-5555-555555555555', true, true, true, true, true, true, 'immediate', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
('66666666-6666-6666-6666-666666666666', true, true, true, true, true, true, 'immediate', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Verify data insertion
SELECT 'USERS_CREATED' as status, COUNT(*) as count FROM users;
SELECT 'ADDRESSES_CREATED' as status, COUNT(*) as count FROM addresses;  
SELECT 'PACKAGES_CREATED' as status, COUNT(*) as count FROM packages;
SELECT 'SHIPMENTS_CREATED' as status, COUNT(*) as count FROM shipments;
SELECT 'NOTIFICATIONS_CREATED' as status, COUNT(*) as count FROM notifications;
SELECT 'USER_PREFERENCES_CREATED' as status, COUNT(*) as count FROM user_preferences;
SELECT 'NOTIFICATION_PREFERENCES_CREATED' as status, COUNT(*) as count FROM notification_preferences;

-- Show complete user overview
SELECT 
    u.suite_number,
    u.first_name || ' ' || u.last_name as full_name,
    u.email,
    u.role,
    COUNT(DISTINCT p.id) as total_packages,
    COUNT(DISTINCT s.id) as total_shipments,
    COUNT(DISTINCT n.id) as total_notifications
FROM users u
LEFT JOIN packages p ON u.id = p.user_id
LEFT JOIN shipments s ON u.id = s.user_id  
LEFT JOIN notifications n ON u.id = n.user_id
GROUP BY u.id, u.suite_number, u.first_name, u.last_name, u.email, u.role
ORDER BY u.suite_number;
