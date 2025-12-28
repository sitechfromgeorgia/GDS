const https = require('https');

const SUPABASE_URL = "https://akxmacfsltzhbnunoepb.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgxODc4MywiZXhwIjoyMDc3Mzk0NzgzfQ.W3G-2EoVnE8o2NwF3zFE1nPKr2XxFJ6jN6Y4Q4ZuCXU";

const sql = `
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Restaurants can view own orders" ON orders;
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Restaurants can create orders" ON orders;
DROP POLICY IF EXISTS "Restaurants and admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

-- Create simplified policies
-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable read access for all users" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Products
CREATE POLICY "Everyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Enable all for service role" ON products FOR ALL USING (auth.role() = 'service_role');

-- Orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (restaurant_id = auth.uid() OR driver_id = auth.uid());
CREATE POLICY "Enable full access for service role" ON orders FOR ALL USING (auth.role() = 'service_role');

-- Order Items
CREATE POLICY "Users can view order items for their orders" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable all for service role" ON order_items FOR ALL USING (auth.role() = 'service_role');

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON products TO anon;
GRANT SELECT ON demo_sessions TO anon;
GRANT SELECT ON notifications TO anon;
`;

const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'akxmacfsltzhbnunoepb.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/sql',
  method: 'POST',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log("🚀 Applying RLS fixes...");

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("✅ RLS fix applied successfully.");
    } else {
      console.error("❌ Failed to apply RLS fix.");
      console.error(body);
    }
  });
});

req.on('error', (error) => {
  console.error("❌ Request error:", error);
});

req.write(data);
req.end();
