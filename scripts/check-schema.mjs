// Check database schema using service role key
const SUPABASE_URL = "https://akxmacfsltzhbnunoepb.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgxODc4MywiZXhwIjoyMDc3Mzk0NzgzfQ.v59_YBUZ0V7bKlufZLSIa10MmE-sqTqDPWqwnaMPiPg";

async function query(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sql })
  });
  return response.json();
}

async function queryTable(table, select = "*") {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=1`, {
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    }
  });
  return response.json();
}

async function main() {
  console.log("=== DATABASE SCHEMA CHECK ===\n");

  // Check products table columns
  console.log("1. PRODUCTS TABLE:");
  const products = await queryTable("products");
  if (Array.isArray(products) && products.length > 0) {
    console.log("   Columns found:", Object.keys(products[0]).join(", "));
  } else {
    console.log("   Result:", JSON.stringify(products));
  }

  // Check orders table columns
  console.log("\n2. ORDERS TABLE:");
  const orders = await queryTable("orders");
  if (Array.isArray(orders) && orders.length > 0) {
    console.log("   Columns found:", Object.keys(orders[0]).join(", "));
  } else if (Array.isArray(orders)) {
    console.log("   Table exists but empty");
  } else {
    console.log("   Result:", JSON.stringify(orders));
  }

  // Check profiles table
  console.log("\n3. PROFILES TABLE:");
  const profiles = await queryTable("profiles");
  if (Array.isArray(profiles) && profiles.length > 0) {
    console.log("   Columns found:", Object.keys(profiles[0]).join(", "));
  } else {
    console.log("   Result:", JSON.stringify(profiles));
  }

  // Check cart_snapshots table
  console.log("\n4. CART_SNAPSHOTS TABLE:");
  const cart = await queryTable("cart_snapshots");
  if (Array.isArray(cart) && cart.length >= 0) {
    if (cart.length > 0) {
      console.log("   Columns found:", Object.keys(cart[0]).join(", "));
    } else {
      console.log("   Table exists but empty");
    }
  } else {
    console.log("   Result:", JSON.stringify(cart));
  }

  // Fetch a product with all columns to see actual schema
  console.log("\n5. PRODUCT SAMPLE (actual columns):");
  const allProducts = await queryTable("products", "*");
  if (Array.isArray(allProducts) && allProducts.length > 0) {
    const sample = allProducts[0];
    for (const [key, value] of Object.entries(sample)) {
      console.log(`   ${key}: ${typeof value} = ${JSON.stringify(value).substring(0, 50)}`);
    }
  }
}

main().catch(console.error);
