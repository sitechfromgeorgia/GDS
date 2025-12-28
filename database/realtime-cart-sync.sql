-- Real-time Cart Synchronization Schema
-- Georgian Distribution System - Cart persistence for real-time synchronization

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cart Sessions Table (for real-time cart persistence)
CREATE TABLE IF NOT EXISTS cart_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Items Table (for real-time cart storage)
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_session_id UUID REFERENCES cart_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique product per cart session
    UNIQUE(cart_session_id, product_id)
);

-- Cart Activities Table (for tracking cart changes for real-time updates)
CREATE TABLE IF NOT EXISTS cart_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_session_id UUID REFERENCES cart_sessions(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'item_added', 'item_updated', 'item_removed', 'cart_cleared'
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    old_quantity INTEGER,
    new_quantity INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_token ON cart_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_active ON cart_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_cart_activities_session_id ON cart_activities(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_cart_activities_created_at ON cart_activities(created_at);

-- RLS Policies for Cart Sessions
-- Users can only access their own cart sessions
CREATE POLICY "Users can manage their own cart sessions" ON cart_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Users can only access cart items for their own sessions
CREATE POLICY "Users can manage cart items for their own sessions" ON cart_items
    FOR ALL USING (
        cart_session_id IN (
            SELECT id FROM cart_sessions WHERE user_id = auth.uid()
        )
    );

-- Users can only access cart activities for their own sessions
CREATE POLICY "Users can manage cart activities for their own sessions" ON cart_activities
    FOR ALL USING (
        cart_session_id IN (
            SELECT id FROM cart_sessions WHERE user_id = auth.uid()
        )
    );

-- Anonymous users can manage temporary cart sessions
CREATE POLICY "Anonymous users can manage temporary cart sessions" ON cart_sessions
    FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can manage cart items for temporary sessions" ON cart_items
    FOR INSERT WITH CHECK (
        cart_session_id IN (
            SELECT id FROM cart_sessions WHERE user_id IS NULL
        )
    );

-- Enable Realtime for cart-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE cart_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_activities;

-- Function to update cart session activity
CREATE OR REPLACE FUNCTION update_cart_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the session's last_activity timestamp
    UPDATE cart_sessions 
    SET 
        last_activity = NOW(),
        updated_at = NOW()
    WHERE id = NEW.cart_session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for cart items changes
CREATE TRIGGER cart_items_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_cart_session_activity();

-- Function to clean up expired cart sessions
CREATE OR REPLACE FUNCTION cleanup_expired_cart_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired cart sessions and their items
    DELETE FROM cart_sessions 
    WHERE expires_at < NOW() OR (is_active = FALSE AND last_activity < NOW() - INTERVAL '1 hour');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for cart session summaries
CREATE OR REPLACE VIEW cart_session_summary AS
SELECT 
    cs.id,
    cs.user_id,
    cs.session_token,
    cs.expires_at,
    cs.is_active,
    cs.last_activity,
    cs.created_at,
    COALESCE(COUNT(ci.id), 0) as item_count,
    COALESCE(SUM(ci.total_price), 0) as total_price,
    COALESCE(SUM(ci.quantity), 0) as total_quantity
FROM cart_sessions cs
LEFT JOIN cart_items ci ON cs.id = ci.cart_session_id
WHERE cs.is_active = TRUE
GROUP BY cs.id, cs.user_id, cs.session_token, cs.expires_at, cs.is_active, cs.last_activity, cs.created_at;

-- RLS Policy for cart session summary (authenticated users only)
CREATE POLICY "Users can view their cart session summaries" ON cart_session_summary
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (user_id IS NULL AND session_token = current_setting('app.current_cart_token', true))
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_activities TO authenticated;
GRANT SELECT ON cart_session_summary TO authenticated;

-- Also grant permissions to anon role for anonymous cart functionality
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_activities TO anon;
GRANT SELECT ON cart_session_summary TO anon;

-- Comments for documentation
COMMENT ON TABLE cart_sessions IS 'Manages cart sessions for both authenticated and anonymous users';
COMMENT ON TABLE cart_items IS 'Stores individual cart items for real-time synchronization';
COMMENT ON TABLE cart_activities IS 'Tracks cart changes for real-time updates and audit purposes';
COMMENT ON VIEW cart_session_summary IS 'Provides cart overview data for UI components';
COMMENT ON FUNCTION cleanup_expired_cart_sessions() IS 'Removes expired cart sessions and associated data';