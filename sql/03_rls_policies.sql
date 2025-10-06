-- Row Level Security (RLS) Policies
-- Simple security rules for data access
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Warehouse staff can search users for package intake" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('warehouse_admin', 'admin', 'superadmin')
        )
    );

-- Addresses table policies
CREATE POLICY "Users can view own addresses" ON addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Packages table policies
CREATE POLICY "Users can view own packages" ON packages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packages" ON packages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all packages" ON packages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins can update all packages" ON packages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Shipments table policies
CREATE POLICY "Users can view own shipments" ON shipments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shipments" ON shipments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shipments" ON shipments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all shipments" ON shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins can update all shipments" ON shipments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Notifications table policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- User preferences table policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- No warehouse table - hardcoded in frontend
