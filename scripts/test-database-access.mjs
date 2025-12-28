// Test database access for all tables
const API_URL = "https://api.supabase.com/v1/projects/akxmacfsltzhbnunoepb/database/query";
const AUTH_HEADER = "Bearer sbp_e5043b9e80d4bd9d8a08c23798099cef576abfff";

async function executeSQL(query, description) {
  console.log(`\n=== ${description} ===`);

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
    return null;
  }

  return data;
}

async function main() {
  console.log("=== COMPREHENSIVE DATABASE ACCESS TEST ===\n");

  // Test 1: List all tables
  const tables = await executeSQL(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    "1. List all tables"
  );
  console.log(JSON.stringify(tables, null, 2));

  // Test 2: Count profiles
  const profilesCount = await executeSQL(
    "SELECT COUNT(*) as count FROM profiles",
    "2. Profiles count"
  );
  console.log(JSON.stringify(profilesCount, null, 2));

  // Test 3: Count products
  const productsCount = await executeSQL(
    "SELECT COUNT(*) as count FROM products",
    "3. Products count"
  );
  console.log(JSON.stringify(productsCount, null, 2));

  // Test 4: Count orders
  const ordersCount = await executeSQL(
    "SELECT COUNT(*) as count FROM orders",
    "4. Orders count"
  );
  console.log(JSON.stringify(ordersCount, null, 2));

  // Test 5: Count order_items
  const orderItemsCount = await executeSQL(
    "SELECT COUNT(*) as count FROM order_items",
    "5. Order items count"
  );
  console.log(JSON.stringify(orderItemsCount, null, 2));

  // Test 6: Count notifications
  const notificationsCount = await executeSQL(
    "SELECT COUNT(*) as count FROM notifications",
    "6. Notifications count"
  );
  console.log(JSON.stringify(notificationsCount, null, 2));

  // Test 7: Count delivery_locations
  const locationsCount = await executeSQL(
    "SELECT COUNT(*) as count FROM delivery_locations",
    "7. Delivery locations count"
  );
  console.log(JSON.stringify(locationsCount, null, 2));

  // Test 8: Count demo_sessions
  const demoCount = await executeSQL(
    "SELECT COUNT(*) as count FROM demo_sessions",
    "8. Demo sessions count"
  );
  console.log(JSON.stringify(demoCount, null, 2));

  // Test 9: List indexes
  const indexes = await executeSQL(
    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname",
    "9. List all indexes"
  );
  console.log(JSON.stringify(indexes, null, 2));

  // Test 10: Verify RLS is enabled
  const rlsStatus = await executeSQL(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    "10. RLS status for all tables"
  );
  console.log(JSON.stringify(rlsStatus, null, 2));

  // Test 11: List sample products (Georgian names)
  const sampleProducts = await executeSQL(
    "SELECT id, name, name_ka, price, unit FROM products LIMIT 5",
    "11. Sample products (with Georgian names)"
  );
  console.log(JSON.stringify(sampleProducts, null, 2));

  // Test 12: Test is_admin function exists
  const functionTest = await executeSQL(
    "SELECT proname, prosrc FROM pg_proc WHERE proname = 'is_admin'",
    "12. Verify is_admin function exists"
  );
  console.log(JSON.stringify(functionTest, null, 2));

  console.log("\n=== ALL DATABASE TESTS COMPLETED ===\n");
}

main().catch(console.error);
