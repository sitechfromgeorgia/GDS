#!/usr/bin/env node
/**
 * Fix Remaining RLS Issues: order_items and profiles tables
 */

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

const SQL_STATEMENTS = [
  // ============================================
  // ORDER_ITEMS TABLE - FIX RLS
  // ============================================

  // Check if table exists and enable RLS
  `DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$`,

  // Drop any existing problematic policies on order_items
  `DROP POLICY IF EXISTS "service_role_full_access_order_items" ON public.order_items`,
  `DROP POLICY IF EXISTS "users_can_view_own_order_items" ON public.order_items`,
  `DROP POLICY IF EXISTS "admin_full_access_order_items" ON public.order_items`,
  `DROP POLICY IF EXISTS "order_items_select_safe" ON public.order_items`,
  `DROP POLICY IF EXISTS "order_items_select" ON public.order_items`,
  `DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items`,

  // Create new service_role policy for order_items
  `CREATE POLICY "service_role_full_access_order_items"
    ON public.order_items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true)`,

  // Users can view order_items linked to their orders
  `CREATE POLICY "users_can_view_own_order_items"
    ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND (orders.restaurant_id = auth.uid() OR orders.driver_id = auth.uid())
      )
    )`,

  // Admin full access to order_items
  `CREATE POLICY "admin_full_access_order_items"
    ON public.order_items
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin())`,

  // Grant permissions on order_items
  `GRANT ALL ON public.order_items TO service_role`,
  `GRANT SELECT ON public.order_items TO authenticated`,

  // ============================================
  // PROFILES TABLE - FIX RLS FOR AUTHENTICATED USERS
  // ============================================

  // Drop potentially problematic policies on profiles
  `DROP POLICY IF EXISTS "profiles_select_safe" ON public.profiles`,
  `DROP POLICY IF EXISTS "profiles_select_recursive" ON public.profiles`,
  `DROP POLICY IF EXISTS "profiles_select" ON public.profiles`,
  `DROP POLICY IF EXISTS "service_role_full_access_profiles" ON public.profiles`,
  `DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles`,
  `DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles`,
  `DROP POLICY IF EXISTS "admin_can_view_all_profiles" ON public.profiles`,
  `DROP POLICY IF EXISTS "admin_can_manage_profiles" ON public.profiles`,
  `DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles`,
  `DROP POLICY IF EXISTS "Profiles are viewable by users" ON public.profiles`,
  `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles`,

  // Create service_role full access policy for profiles
  `CREATE POLICY "service_role_full_access_profiles"
    ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true)`,

  // Users can view their own profile
  `CREATE POLICY "users_can_view_own_profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid())`,

  // Users can update their own profile
  `CREATE POLICY "users_can_update_own_profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid())`,

  // Admin can view all profiles (using is_admin function with SECURITY DEFINER)
  `CREATE POLICY "admin_can_view_all_profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (is_admin())`,

  // Admin can manage all profiles
  `CREATE POLICY "admin_can_manage_profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin())`,

  // Grant permissions on profiles
  `GRANT ALL ON public.profiles TO service_role`,
  `GRANT SELECT, UPDATE ON public.profiles TO authenticated`
];

async function main() {
  console.log('='.repeat(60));
  console.log('🔧 Fixing Remaining RLS Issues: order_items & profiles');
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
    console.log('   - Policies that already exist or were already dropped');
    console.log('   - Tables that may not exist');
    console.log('\nRun: node scripts/apply-rls-fix.mjs to verify the final state');
  }
}

main().catch(console.error);
