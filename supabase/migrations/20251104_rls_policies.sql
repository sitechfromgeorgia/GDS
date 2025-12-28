-- Georgian Distribution System - Comprehensive RLS Policies
-- Created: November 4, 2025
-- Description: Enhanced Row Level Security policies with role-based access control
--              and comprehensive business logic validation

-- ========================================
-- POLICY HELPER FUNCTIONS
-- ========================================

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = user_uuid);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'demo'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_uuid) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is restaurant
CREATE OR REPLACE FUNCTION is_restaurant(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_uuid) = 'restaurant';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is driver
CREATE OR REPLACE FUNCTION is_driver(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_uuid) = 'driver';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is demo
CREATE OR REPLACE FUNCTION is_demo(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_uuid) = 'demo';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to validate demo session limits
CREATE OR REPLACE FUNCTION validate_demo_session()
RETURNS BOOLEAN AS $$
DECLARE
    active_sessions INTEGER;
    max_demo_sessions INTEGER := 10;
BEGIN
    -- Count active demo sessions for this user
    SELECT COUNT(*) INTO active_sessions
    FROM demo_sessions ds
    JOIN profiles p ON p.id = ds.session_id
    WHERE p.id = auth.uid() 
    AND ds.ended_at IS NULL;
    
    -- Allow if under limit
    RETURN active_sessions < max_demo_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================
-- DROP EXISTING POLICIES (CLEAN RESET)
-- ========================================

-- Drop existing policies for clean reset
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Everyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

DROP POLICY IF EXISTS "Restaurants can view own orders" ON orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Restaurants can create orders" ON orders;
DROP POLICY IF EXISTS "Restaurants and admins can update orders" ON orders;

DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

DROP POLICY IF EXISTS "Everyone can view demo sessions" ON demo_sessions;
DROP POLICY IF EXISTS "System can manage demo sessions" ON demo_sessions;

-- ========================================
-- PROFILES TABLE POLICIES
-- ========================================

-- SELECT Policies for profiles
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin_all" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "profiles_select_restaurant_others" ON profiles
    FOR SELECT USING (
        get_user_role() IN ('restaurant', 'driver', 'demo') AND
        role IN ('admin', 'restaurant')
    );

-- INSERT Policies for profiles
CREATE POLICY "profiles_insert_system" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL OR 
        is_admin() OR
        -- Allow self-insertion during signup
        (auth.uid() = id AND auth.uid() IS NOT NULL)
    );

-- UPDATE Policies for profiles
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (
        auth.uid() = id AND 
        NOT is_demo()
    ) WITH CHECK (
        auth.uid() = id AND 
        NOT is_demo()
    );

CREATE POLICY "profiles_update_admin_all" ON profiles
    FOR UPDATE USING (is_admin())
    WITH CHECK (is_admin());

-- DELETE Policies for profiles
CREATE POLICY "profiles_delete_admin_only" ON profiles
    FOR DELETE USING (is_admin());

-- ========================================
-- PRODUCTS TABLE POLICIES
-- ========================================

-- SELECT Policies for products
CREATE POLICY "products_select_public_active" ON products
    FOR SELECT USING (
        active = true AND
        NOT is_demo()
    );

CREATE POLICY "products_select_own_restaurant" ON products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'restaurant'
        )
    );

CREATE POLICY "products_select_admin_all" ON products
    FOR SELECT USING (is_admin());

-- INSERT Policies for products
CREATE POLICY "products_insert_admin_all" ON products
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "products_insert_restaurant_own" ON products
    FOR INSERT WITH CHECK (
        is_restaurant() AND
        NOT is_demo()
    );

-- UPDATE Policies for products
CREATE POLICY "products_update_admin_all" ON products
    FOR UPDATE USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "products_update_restaurant_own" ON products
    FOR UPDATE USING (
        is_restaurant() AND
        NOT is_demo()
    )
    WITH CHECK (
        is_restaurant() AND
        NOT is_demo()
    );

-- DELETE Policies for products
CREATE POLICY "products_delete_admin_all" ON products
    FOR DELETE USING (is_admin());

CREATE POLICY "products_delete_restaurant_own" ON products
    FOR DELETE USING (
        is_restaurant() AND
        NOT is_demo()
    );

-- ========================================
-- ORDERS TABLE POLICIES
-- ========================================

-- SELECT Policies for orders
CREATE POLICY "orders_select_own_restaurant" ON orders
    FOR SELECT USING (
        restaurant_id = auth.uid() OR
        is_admin()
    );

CREATE POLICY "orders_select_assigned_driver" ON orders
    FOR SELECT USING (
        driver_id = auth.uid() OR
        (driver_id IS NULL AND is_driver() AND status IN ('pending', 'confirmed')) OR
        is_admin()
    );

CREATE POLICY "orders_select_demo_limited" ON orders
    FOR SELECT USING (
        is_demo() AND
        validate_demo_session() AND
        created_at >= NOW() - INTERVAL '1 hour'
    );

-- INSERT Policies for orders
CREATE POLICY "orders_insert_restaurant_own" ON orders
    FOR INSERT WITH CHECK (
        restaurant_id = auth.uid() AND
        is_restaurant() AND
        NOT is_demo()
    );

CREATE POLICY "orders_insert_admin_all" ON orders
    FOR INSERT WITH CHECK (
        is_admin() OR
        (is_restaurant() AND NOT is_demo())
    );

-- UPDATE Policies for orders
CREATE POLICY "orders_update_restaurant_own" ON orders
    FOR UPDATE USING (
        restaurant_id = auth.uid() AND
        is_restaurant() AND
        status NOT IN ('completed', 'cancelled')
    )
    WITH CHECK (
        restaurant_id = auth.uid() AND
        is_restaurant() AND
        -- Prevent status regression
        CASE 
            WHEN status = 'confirmed' THEN OLD.status = 'pending'
            WHEN status = 'priced' THEN OLD.status IN ('pending', 'confirmed')
            WHEN status = 'assigned' THEN OLD.status IN ('pending', 'confirmed', 'priced')
            WHEN status = 'out_for_delivery' THEN OLD.status = 'assigned'
            WHEN status = 'delivered' THEN OLD.status = 'out_for_delivery'
            WHEN status = 'completed' THEN OLD.status = 'delivered'
            WHEN status = 'cancelled' THEN OLD.status IN ('pending', 'confirmed', 'priced')
            ELSE true
        END
    );

CREATE POLICY "orders_update_driver_assigned" ON orders
    FOR UPDATE USING (
        driver_id = auth.uid() AND
        is_driver() AND
        status IN ('assigned', 'out_for_delivery')
    )
    WITH CHECK (
        driver_id = auth.uid() AND
        is_driver() AND
        status IN ('out_for_delivery', 'delivered')
    );

CREATE POLICY "orders_update_admin_all" ON orders
    FOR UPDATE USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "orders_update_driver_assignment" ON orders
    FOR UPDATE USING (
        driver_id IS NULL AND
        is_driver() AND
        status IN ('pending', 'confirmed') AND
        OLD.driver_id IS NULL
    )
    WITH CHECK (
        driver_id = auth.uid() AND
        is_driver() AND
        status = 'assigned'
    );

-- DELETE Policies for orders
CREATE POLICY "orders_delete_admin_only" ON orders
    FOR DELETE USING (
        is_admin() AND
        status NOT IN ('out_for_delivery', 'delivered')
    );

-- ========================================
-- ORDER_ITEMS TABLE POLICIES
-- ========================================

-- SELECT Policies for order_items
CREATE POLICY "order_items_select_related_orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND (
                o.restaurant_id = auth.uid() OR
                o.driver_id = auth.uid() OR
                is_admin()
            )
        )
    );

CREATE POLICY "order_items_select_demo_limited" ON order_items
    FOR SELECT USING (
        is_demo() AND
        validate_demo_session() AND
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.created_at >= NOW() - INTERVAL '1 hour'
        )
    );

-- INSERT Policies for order_items
CREATE POLICY "order_items_insert_restaurant_own" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.restaurant_id = auth.uid()
            AND o.status IN ('pending', 'confirmed')
        ) AND
        is_restaurant() AND
        NOT is_demo()
    );

CREATE POLICY "order_items_insert_admin_all" ON order_items
    FOR INSERT WITH CHECK (is_admin());

-- UPDATE Policies for order_items
CREATE POLICY "order_items_update_restaurant_own" ON order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.restaurant_id = auth.uid()
            AND o.status NOT IN ('completed', 'cancelled')
        ) AND
        is_restaurant() AND
        NOT is_demo()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.restaurant_id = auth.uid()
            AND o.status NOT IN ('completed', 'cancelled')
        ) AND
        is_restaurant() AND
        NOT is_demo()
    );

CREATE POLICY "order_items_update_admin_all" ON order_items
    FOR UPDATE USING (is_admin())
    WITH CHECK (is_admin());

-- DELETE Policies for order_items
CREATE POLICY "order_items_delete_restaurant_own" ON order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.restaurant_id = auth.uid()
            AND o.status NOT IN ('completed', 'cancelled')
        ) AND
        is_restaurant() AND
        NOT is_demo()
    );

CREATE POLICY "order_items_delete_admin_all" ON order_items
    FOR DELETE USING (is_admin());

-- ========================================
-- NOTIFICATIONS TABLE POLICIES
-- ========================================

-- SELECT Policies for notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- INSERT Policies for notifications
CREATE POLICY "notifications_insert_system" ON notifications
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        is_admin()
    );

-- UPDATE Policies for notifications
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid() OR
        is_admin()
    )
    WITH CHECK (
        user_id = auth.uid() OR
        is_admin()
    );

-- DELETE Policies for notifications
CREATE POLICY "notifications_delete_admin_only" ON notifications
    FOR DELETE USING (
        is_admin() OR
        (user_id = auth.uid() AND NOT is_demo())
    );

-- ========================================
-- DEMO_SESSIONS TABLE POLICIES
-- ========================================

-- SELECT Policies for demo_sessions
CREATE POLICY "demo_sessions_select_own" ON demo_sessions
    FOR SELECT USING (
        session_id = auth.uid()::text OR
        is_admin()
    );

-- INSERT Policies for demo_sessions
CREATE POLICY "demo_sessions_insert_system" ON demo_sessions
    FOR INSERT WITH CHECK (
        session_id = auth.uid()::text OR
        is_admin()
    );

-- UPDATE Policies for demo_sessions
CREATE POLICY "demo_sessions_update_own" ON demo_sessions
    FOR UPDATE USING (
        session_id = auth.uid()::text OR
        is_admin()
    )
    WITH CHECK (
        session_id = auth.uid()::text OR
        is_admin()
    );

-- DELETE Policies for demo_sessions
CREATE POLICY "demo_sessions_delete_admin_only" ON demo_sessions
    FOR DELETE USING (
        is_admin() OR
        (session_id = auth.uid()::text AND NOT is_demo())
    );

-- ========================================
-- STORAGE POLICIES
-- ========================================

-- Enhanced storage policies with role validation
CREATE POLICY "storage_avatars_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "storage_avatars_insert_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        NOT is_demo()
    );

CREATE POLICY "storage_avatars_update_own" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        NOT is_demo()
    );

CREATE POLICY "storage_product_images_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "storage_product_images_insert_admin" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND
        is_admin()
    );

CREATE POLICY "storage_product_images_insert_restaurant" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND
        is_restaurant() AND
        NOT is_demo()
    );

CREATE POLICY "storage_product_images_update_admin_restaurant" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' AND
        (is_admin() OR is_restaurant()) AND
        NOT is_demo()
    );

-- ========================================
-- AUDIT AND MONITORING
-- ========================================

-- Create audit log table for policy violations
CREATE TABLE IF NOT EXISTS policy_audit_log (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    policy_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    allowed BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to log policy violations
CREATE OR REPLACE FUNCTION log_policy_violation(
    p_user_id UUID,
    p_policy_name TEXT,
    p_table_name TEXT,
    p_operation TEXT,
    p_allowed BOOLEAN,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO policy_audit_log (
        user_id, policy_name, table_name, operation, allowed, error_message
    ) VALUES (
        p_user_id, p_policy_name, p_table_name, p_operation, p_allowed, p_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for audit log
CREATE INDEX idx_policy_audit_log_user_id ON policy_audit_log(user_id);
CREATE INDEX idx_policy_audit_log_created_at ON policy_audit_log(created_at DESC);
CREATE INDEX idx_policy_audit_log_policy_name ON policy_audit_log(policy_name);

-- ========================================
-- COMMENTS AND DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION get_user_role(UUID) IS 'Get role for a specific user or current authenticated user';
COMMENT ON FUNCTION is_admin(UUID) IS 'Check if user is admin role';
COMMENT ON FUNCTION is_restaurant(UUID) IS 'Check if user is restaurant role';
COMMENT ON FUNCTION is_driver(UUID) IS 'Check if user is driver role';
COMMENT ON FUNCTION is_demo(UUID) IS 'Check if user is demo role';
COMMENT ON FUNCTION validate_demo_session() IS 'Validate demo session limits and permissions';

COMMENT ON TABLE policy_audit_log IS 'Audit log for RLS policy violations and access tracking';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON policy_audit_log TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- Enable RLS on audit log
ALTER TABLE policy_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit log
CREATE POLICY "audit_log_select_admin_only" ON policy_audit_log
    FOR SELECT USING (is_admin());

CREATE POLICY "audit_log_insert_system" ON policy_audit_log
    FOR INSERT WITH CHECK (true);

-- ========================================
-- FINAL SETUP
-- ========================================

-- Add helpful comments for all policies
COMMENT ON POLICY "profiles_select_own" ON profiles IS 'Users can view their own profile';
COMMENT ON POLICY "profiles_select_admin_all" ON profiles IS 'Admins can view all profiles';
COMMENT ON POLICY "products_select_public_active" ON products IS 'Anyone can view active products';
COMMENT ON POLICY "orders_select_own_restaurant" ON orders IS 'Restaurants can view their own orders';
COMMENT ON POLICY "orders_select_assigned_driver" ON orders IS 'Drivers can view assigned orders';
COMMENT ON POLICY "orders_insert_restaurant_own" ON orders IS 'Restaurants can create orders for themselves';
COMMENT ON POLICY "demo_sessions_select_own" ON demo_sessions IS 'Users can view their own demo sessions';

-- Ensure all policies are active
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE policy_audit_log FORCE ROW LEVEL SECURITY;