-- Georgian Distribution System - Initial Database Schema Migration
-- Created: November 2, 2025
-- Description: This migration creates the complete database schema for the Georgian Distribution System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'restaurant', 'driver', 'demo');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'priced', 'assigned', 'out_for_delivery', 'delivered', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'demo',
    full_name TEXT,
    restaurant_name TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_user_role CHECK (role IN ('admin', 'restaurant', 'driver', 'demo'))
);

-- Create products table (with Georgian language support)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ka TEXT NOT NULL,
    description TEXT,
    description_ka TEXT,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    image_url TEXT,
    tags TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT positive_cost_price CHECK (cost_price >= 0),
    CONSTRAINT non_negative_stock CHECK (stock_quantity >= 0),
    CONSTRAINT non_negative_min_stock CHECK (min_stock_level >= 0)
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    delivery_address TEXT,
    delivery_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_order_status CHECK (status IN ('pending', 'confirmed', 'priced', 'assigned', 'out_for_delivery', 'delivered', 'completed', 'cancelled')),
    CONSTRAINT non_negative_delivery_fee CHECK (delivery_fee >= 0),
    CONSTRAINT non_negative_tax_amount CHECK (tax_amount >= 0),
    CONSTRAINT non_negative_discount_amount CHECK (discount_amount >= 0)
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_ka TEXT,
    message TEXT NOT NULL,
    message_ka TEXT,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_notification_type CHECK (type IN ('info', 'success', 'warning', 'error'))
);

-- Create demo_sessions table
CREATE TABLE demo_sessions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    session_id TEXT NOT NULL,
    role user_role NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_demo_sessions_session_id ON demo_sessions(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for products
CREATE POLICY "Everyone can view active products" ON products
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for orders
CREATE POLICY "Restaurants can view own orders" ON orders
    FOR SELECT USING (
        restaurant_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Drivers can view assigned orders" ON orders
    FOR SELECT USING (
        driver_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Restaurants can create orders" ON orders
    FOR INSERT WITH CHECK (
        restaurant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('restaurant', 'admin')
        )
    );

CREATE POLICY "Restaurants and admins can update orders" ON orders
    FOR UPDATE USING (
        restaurant_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for their orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.restaurant_id = auth.uid() OR orders.driver_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Admins can manage all order items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- RLS Policies for demo_sessions
CREATE POLICY "Everyone can view demo sessions" ON demo_sessions
    FOR SELECT USING (true);

CREATE POLICY "System can manage demo sessions" ON demo_sessions
    FOR ALL USING (true);

-- Create function to handle new user creation
COMMENT ON TABLE order_items IS 'Order line items with pricing';
COMMENT ON TABLE notifications IS 'User notification system with Georgian localization';
COMMENT ON TABLE demo_sessions IS 'Demo session tracking for testing';