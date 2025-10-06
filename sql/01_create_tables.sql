-- Simplified Supabase Database Schema
-- Clean architecture for logistics application
-- No warehouse table - hardcoded in frontend
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- 1. Create users table with suite numbers and roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'warehouse_admin', 'admin', 'superadmin')),
    suite_number TEXT UNIQUE,
    avatar_url TEXT,
    phone_number TEXT,
    whatsapp_number TEXT,
    street_address TEXT,
    city TEXT,
    country TEXT,
    postal_code TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'reported')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    reported_by UUID REFERENCES users(id),
    report_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create addresses table for shipping addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing', 'both')),
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state_province TEXT,
    postal_code TEXT,
    country TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create packages table with warehouse intake support
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id TEXT UNIQUE NOT NULL,
    tracking_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'processing', 'shipped', 'delivered')),
    description TEXT,
    weight DECIMAL(10,2),
    declared_value DECIMAL(10,2),
    store_name TEXT,
    vendor_name TEXT,
    notes TEXT,
    scanned_by UUID REFERENCES users(id),
    intake_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create shipments table for consolidated shipping
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tracking_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'in_transit', 'delivered')),
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT,
    delivery_address TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    delivery_country TEXT NOT NULL,
    total_weight DECIMAL(10,2),
    total_value DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    service_type TEXT DEFAULT 'standard' CHECK (service_type IN ('standard', 'express', 'overnight')),
    estimated_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('package_update', 'shipment_update', 'system', 'promotion')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user preferences table with WhatsApp/SMS settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de', 'zh', 'ja')),
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    auto_refresh BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    whatsapp_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create package-shipment relationship table
CREATE TABLE IF NOT EXISTS package_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(package_id, shipment_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_suite_number ON users(suite_number);
CREATE INDEX IF NOT EXISTS idx_packages_package_id ON packages(package_id);
CREATE INDEX IF NOT EXISTS idx_packages_tracking_number ON packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_package_shipments_package_id ON package_shipments(package_id);
CREATE INDEX IF NOT EXISTS idx_package_shipments_shipment_id ON package_shipments(shipment_id);

-- No warehouse data needed - hardcoded in frontend
-- Users identified by suite_number only (any format: VC-001, S001, A123, etc.)
