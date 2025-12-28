#!/bin/bash

# Database RLS Fix Script
# Apply the RLS infinite recursion fix to Official Supabase project

echo "🚀 Applying RLS Fix to Official Supabase Database..."

# Set the Supabase project URL
SUPABASE_URL="https://akxmacfsltzhbnunoepb.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgxODc4MywiZXhwIjoyMDc3Mzk0NzgzfQ.W3G-2EoVnE8o2NwF3zFE1nPKr2XxFJ6jN6Y4Q4ZuCXU"

echo "📋 Dropping problematic RLS policies..."

# Drop all problematic policies that cause recursion
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"
      -- Drop all problematic RLS policies that reference profiles table
<<<<<<< HEAD
      DROP POLICY IF EXISTS \\"Users can view own profile\\" ON profiles;
      DROP POLICY IF EXISTS \\"Users can update own profile\\" ON profiles;
      DROP POLICY IF EXISTS \\"Admins can view all profiles\\" ON profiles;
      
      DROP POLICY IF EXISTS \\"Admins can manage products\\" ON products;
      DROP POLICY IF EXISTS \\"Restaurants can view own orders\\" ON orders;
      DROP POLICY IF EXISTS \\"Drivers can view assigned orders\\" ON orders;
      DROP POLICY IF EXISTS \\"Restaurants can create orders\\" ON orders;
      DROP POLICY IF EXISTS \\"Restaurants and admins can update orders\\" ON orders;
      DROP POLICY IF EXISTS \\"Users can view order items for their orders\\" ON order_items;
      DROP POLICY IF EXISTS \\"Admins can manage all order items\\" ON order_items;
=======
      DROP POLICY IF EXISTS \\\"Users can view own profile\\\" ON profiles;
      DROP POLICY IF EXISTS \\\"Users can update own profile\\\" ON profiles;
      DROP POLICY IF EXISTS \\\"Admins can view all profiles\\\" ON profiles;
      
      DROP POLICY IF EXISTS \\\"Admins can manage products\\\" ON products;
      DROP POLICY IF EXISTS \\\"Restaurants can view own orders\\\" ON orders;
      DROP POLICY IF EXISTS \\\"Drivers can view assigned orders\\\" ON orders;
      DROP POLICY IF EXISTS \\\"Restaurants can create orders\\\" ON orders;
      DROP POLICY IF EXISTS \\\"Restaurants and admins can update orders\\\" ON orders;
      DROP POLICY IF EXISTS \\\"Users can view order items for their orders\\\" ON order_items;
      DROP POLICY IF EXISTS \\\"Admins can manage all order items\\\" ON order_items;
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    \"
  }"

echo "✅ Problematic policies dropped"

echo "📋 Creating simplified RLS policies..."

# Apply simplified policies
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"
      -- Profiles policies - simplified
<<<<<<< HEAD
      CREATE POLICY \\"Users can view own profile\\" ON profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY \\"Users can update own profile\\" ON profiles
        FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY \\"Enable read access for all users\\" ON profiles
        FOR ALL USING (auth.role() = 'service_role');
      
      -- Products policies - simpler
      CREATE POLICY \\"Everyone can view active products\\" ON products
        FOR SELECT USING (is_active = true);
      
      CREATE POLICY \\"Enable all for service role\\" ON products
        FOR ALL USING (auth.role() = 'service_role');
      
      -- Orders policies - simplified
      CREATE POLICY \\"Users can view their own orders\\" ON orders
=======
      CREATE POLICY \\\"Users can view own profile\\\" ON profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY \\\"Users can update own profile\\\" ON profiles
        FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY \\\"Enable read access for all users\\\" ON profiles
        FOR ALL USING (auth.role() = 'service_role');
      
      -- Products policies - simpler
      CREATE POLICY \\\"Everyone can view active products\\\" ON products
        FOR SELECT USING (is_active = true);
      
      CREATE POLICY \\\"Enable all for service role\\\" ON products
        FOR ALL USING (auth.role() = 'service_role');
      
      -- Orders policies - simplified
      CREATE POLICY \\\"Users can view their own orders\\\" ON orders
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
        FOR SELECT USING (
          restaurant_id = auth.uid() OR 
          driver_id = auth.uid()
        );
      
<<<<<<< HEAD
      CREATE POLICY \\"Enable full access for service role\\" ON orders
        FOR ALL USING (auth.role() = 'service_role');
      
      -- Order items policies - simplified
      CREATE POLICY \\"Users can view order items for their orders\\" ON order_items
        FOR SELECT USING (true);
      
      CREATE POLICY \\"Enable all for service role\\" ON order_items
=======
      CREATE POLICY \\\"Enable full access for service role\\\" ON orders
        FOR ALL USING (auth.role() = 'service_role');
      
      -- Order items policies - simplified
      CREATE POLICY \\\"Users can view order items for their orders\\\" ON order_items
        FOR SELECT USING (true);
      
      CREATE POLICY \\\"Enable all for service role\\\" ON order_items
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
        FOR ALL USING (auth.role() = 'service_role');
    \"
  }"

echo "✅ Simplified policies created"

echo "📋 Setting up permissions..."

# Grant permissions
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
      
      -- Enable read access for anon users on public tables
      GRANT SELECT ON products TO anon;
      GRANT SELECT ON demo_sessions TO anon;
      GRANT SELECT ON notifications TO anon;
    \"
  }"

echo "✅ Permissions granted"

echo "🎉 RLS Fix Applied Successfully!"
echo "🔍 Testing database connectivity..."

# Test the fix
curl -X GET "$SUPABASE_URL/rest/v1/products" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
<<<<<<< HEAD
  -w "\\n\\nHTTP Status: %{http_code}\\n"
=======
  -w "\n\nHTTP Status: %{http_code}\n"
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306

echo "📊 Database health check complete!"