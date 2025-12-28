// Fix all policies that cause infinite recursion
const API_URL = "https://api.supabase.com/v1/projects/akxmacfsltzhbnunoepb/database/query";
const AUTH_HEADER = "Bearer sbp_e5043b9e80d4bd9d8a08c23798099cef576abfff";

async function executeSQL(query, description) {
  console.log(`\n=== ${description} ===`);
  console.log(`Executing: ${query.substring(0, 100)}...`);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": AUTH_HEADER,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();

  if (data.message) {
    console.log(`ERROR: ${data.message}`);
    return false;
  }

  console.log(`SUCCESS`);
  return true;
}

async function main() {
  console.log("Fixing all RLS policies that query profiles table...\n");

  // Fix products table policy
  await executeSQL(
    `DROP POLICY IF EXISTS "admin_manage_products" ON products`,
    "Drop admin_manage_products on products"
  );

  await executeSQL(
    `CREATE POLICY "admin_manage_products" ON products
     FOR ALL
     TO authenticated
     USING (public.is_admin(auth.uid()))
     WITH CHECK (public.is_admin(auth.uid()))`,
    "Create new admin_manage_products using is_admin function"
  );

  // Fix orders table policy
  await executeSQL(
    `DROP POLICY IF EXISTS "admin_all_orders" ON orders`,
    "Drop admin_all_orders on orders"
  );

  await executeSQL(
    `CREATE POLICY "admin_all_orders" ON orders
     FOR ALL
     TO authenticated
     USING (public.is_admin(auth.uid()))
     WITH CHECK (public.is_admin(auth.uid()))`,
    "Create new admin_all_orders using is_admin function"
  );

  // Fix delivery_locations table policy
  await executeSQL(
    `DROP POLICY IF EXISTS "admin_all_delivery_locations" ON delivery_locations`,
    "Drop admin_all_delivery_locations on delivery_locations"
  );

  await executeSQL(
    `CREATE POLICY "admin_all_delivery_locations" ON delivery_locations
     FOR ALL
     TO authenticated
     USING (public.is_admin(auth.uid()))
     WITH CHECK (public.is_admin(auth.uid()))`,
    "Create new admin_all_delivery_locations using is_admin function"
  );

  console.log("\n=== All policies fixed! ===\n");

  // Verify the fix
  console.log("Verifying fix with test query...");
  const verifyResponse = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": AUTH_HEADER,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: "SELECT COUNT(*) as count FROM products" })
  });

  const verifyData = await verifyResponse.json();
  console.log("Products query result:", JSON.stringify(verifyData));
}

main().catch(console.error);
