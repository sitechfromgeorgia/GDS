#!/usr/bin/env node
/**
 * Apply RLS Migration using Supabase Management API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_ACCESS_TOKEN = "sbp_e5043b9e80d4bd9d8a08c23798099cef576abfff";
const PROJECT_REF = "akxmacfsltzhbnunoepb";

async function executeSQLViaAPI(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Quick SQL statements to fix RLS - broken into individual statements
const SQL_STATEMENTS = [
  // 1. Create is_admin function
  `CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE`,

  // 2. Grant execute on is_admin
  `GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated`,
  `GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role`,

  // 3. Products: Drop old policies
  `DROP POLICY IF EXISTS "products_select_safe" ON public.products`,
  `DROP POLICY IF EXISTS "products_select_recursive" ON public.products`,
  `DROP POLICY IF EXISTS "products_select" ON public.products`,
  `DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products`,
  `DROP POLICY IF EXISTS "Admins can manage products" ON public.products`,

  // 4. Products: Create new policies
  `CREATE POLICY "service_role_full_access_products" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "authenticated_can_read_products" ON public.products FOR SELECT TO authenticated USING (true)`,
  `CREATE POLICY "admin_can_manage_products" ON public.products FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())`,

  // 5. Orders: Drop old policies
  `DROP POLICY IF EXISTS "orders_select_safe" ON public.orders`,
  `DROP POLICY IF EXISTS "orders_select_recursive" ON public.orders`,
  `DROP POLICY IF EXISTS "Restaurants can view own orders" ON public.orders`,
  `DROP POLICY IF EXISTS "Drivers can view assigned orders" ON public.orders`,
  `DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders`,

  // 6. Orders: Create new policies
  `CREATE POLICY "service_role_full_access_orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "restaurant_can_view_own_orders" ON public.orders FOR SELECT TO authenticated USING (restaurant_id = auth.uid())`,
  `CREATE POLICY "restaurant_can_create_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (restaurant_id = auth.uid())`,
  `CREATE POLICY "driver_can_view_assigned_orders" ON public.orders FOR SELECT TO authenticated USING (driver_id = auth.uid())`,
  `CREATE POLICY "driver_can_update_assigned_orders" ON public.orders FOR UPDATE TO authenticated USING (driver_id = auth.uid()) WITH CHECK (driver_id = auth.uid())`,
  `CREATE POLICY "admin_full_access_orders" ON public.orders FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())`,

  // 7. Create cart_snapshots table
  `CREATE TABLE IF NOT EXISTS public.cart_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, product_id)
  )`,

  // 8. Cart snapshots RLS
  `ALTER TABLE public.cart_snapshots ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "service_role_full_access_cart" ON public.cart_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "users_can_manage_own_cart" ON public.cart_snapshots FOR ALL TO authenticated USING (restaurant_id = auth.uid()) WITH CHECK (restaurant_id = auth.uid())`,

  // 9. Grant permissions
  `GRANT USAGE ON SCHEMA public TO authenticated`,
  `GRANT USAGE ON SCHEMA public TO service_role`,
  `GRANT ALL ON public.products TO service_role`,
  `GRANT SELECT ON public.products TO authenticated`,
  `GRANT ALL ON public.orders TO service_role`,
  `GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated`,
  `GRANT ALL ON public.cart_snapshots TO service_role`,
  `GRANT ALL ON public.cart_snapshots TO authenticated`
];

async function main() {
  console.log('='.repeat(60));
  console.log('🔧 Applying RLS Fix Migration via Supabase API');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_REF}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const sql = SQL_STATEMENTS[i];
    const shortSql = sql.substring(0, 60).replace(/\n/g, ' ');

    try {
      console.log(`[${i + 1}/${SQL_STATEMENTS.length}] ${shortSql}...`);
      const result = await executeSQLViaAPI(sql);
      console.log(`   ✅ Success`);
      successCount++;
    } catch (error) {
      console.log(`   ⚠️ ${error.message.substring(0, 80)}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${SQL_STATEMENTS.length}`);
  console.log(`⚠️ Failed: ${failCount}/${SQL_STATEMENTS.length}`);

  if (failCount === 0) {
    console.log('\n✅ All statements executed successfully!');
    console.log('Run: node scripts/apply-rls-fix.mjs to verify');
  } else {
    console.log('\n⚠️ Some statements failed. This may be expected for:');
    console.log('   - Policies that already exist');
    console.log('   - Functions that already exist');
    console.log('\nRun: node scripts/apply-rls-fix.mjs to check current state');
  }
}

main().catch(console.error);
