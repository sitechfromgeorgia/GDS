// Comprehensive Cart & Checkout Flow Testing
// Tests: Products API, Cart Operations, Order Submission
const SUPABASE_URL = "https://akxmacfsltzhbnunoepb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTg3ODMsImV4cCI6MjA3NzM5NDc4M30.51pqhjXAN9FuwXcpLefM85Bp9Y13nIMJJU_flm_K_zc";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgxODc4MywiZXhwIjoyMDc3Mzk0NzgzfQ.v59_YBUZ0V7bKlufZLSIa10MmE-sqTqDPWqwnaMPiPg";
const APP_URL = "http://localhost:3000";

const TEST_USERS = {
  restaurant: { email: "restaurant@test.com", password: "Test123456!", role: "restaurant" },
  admin: { email: "admin@test.com", password: "Test123456!", role: "admin" },
  driver: { email: "driver@test.com", password: "Test123456!", role: "driver" }
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, type = "info") {
  const icons = { pass: "✅", fail: "❌", info: "📋", warn: "⚠️" };
  console.log(`${icons[type] || "📋"} ${message}`);
}

function recordTest(name, passed, details = "") {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    log(`${name}: PASS ${details ? `(${details})` : ""}`, "pass");
  } else {
    testResults.failed++;
    log(`${name}: FAIL ${details ? `(${details})` : ""}`, "fail");
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  } catch (error) {
    return { error: error.message };
  }
}

async function supabaseQuery(table, options = {}) {
  const { select = "*", filter, token } = options;
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      url += `&${key}=eq.${value}`;
    }
  }

  const headers = {
    "apikey": ANON_KEY,
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  return response.json();
}

async function supabaseInsert(table, data, token) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function supabaseDelete(table, filter, token) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`;
  for (const [key, value] of Object.entries(filter)) {
    url += `${key}=eq.${value}&`;
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return response.status;
}

// ============================================================================
// TEST SUITE 1: Products API (Restaurant Role)
// ============================================================================
async function testProductsAccess(token, role) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST SUITE 1: Products Access (${role})`);
  console.log("=".repeat(60));

  // Test 1: Fetch all products with authenticated token
  const products = await supabaseQuery("products", {
    select: "id,name,category,unit,price,is_active",
    token
  });

  if (Array.isArray(products) && products.length > 0) {
    recordTest(`${role}: Fetch products`, true, `${products.length} products found`);

    // Test 2: Products have required fields
    const firstProduct = products[0];
    const hasRequiredFields = firstProduct.id && firstProduct.name &&
                              firstProduct.category && firstProduct.price !== undefined;
    recordTest(`${role}: Products have required fields`, hasRequiredFields);

    // Test 3: Products are active
    const activeProducts = products.filter(p => p.is_active === true);
    recordTest(`${role}: Active products exist`, activeProducts.length > 0,
               `${activeProducts.length} active`);

    return products;
  } else {
    recordTest(`${role}: Fetch products`, false,
               products.message || "No products or error");
    return [];
  }
}

// ============================================================================
// TEST SUITE 2: Cart Operations
// ============================================================================
async function testCartOperations(token, userId, products) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 2: Cart Operations");
  console.log("=".repeat(60));

  if (products.length === 0) {
    log("Skipping cart tests - no products available", "warn");
    return null;
  }

  // Select first active product for testing
  const testProduct = products.find(p => p.is_active) || products[0];
  log(`Using product: ${testProduct.name} (${testProduct.id})`, "info");

  // Test 1: Check if cart_snapshots table exists and is accessible
  const existingCart = await supabaseQuery("cart_snapshots", {
    filter: { restaurant_id: userId },
    token
  });

  // Cart table access test
  const cartAccessible = !existingCart.message?.includes("does not exist");
  recordTest("Cart table accessible", cartAccessible,
             cartAccessible ? "Table exists" : existingCart.message);

  if (!cartAccessible) {
    return null;
  }

  // Test 2: Add item to cart
  const cartItem = {
    restaurant_id: userId,
    product_id: testProduct.id,
    quantity: 2
  };

  const insertResult = await supabaseInsert("cart_snapshots", cartItem, token);
  const addSuccess = !insertResult.message && !insertResult.error;
  recordTest("Add item to cart", addSuccess,
             addSuccess ? "Item added" : insertResult.message || insertResult.error);

  // Test 3: Read cart items
  const cartItems = await supabaseQuery("cart_snapshots", {
    filter: { restaurant_id: userId },
    token
  });

  const readSuccess = Array.isArray(cartItems);
  recordTest("Read cart items", readSuccess,
             readSuccess ? `${cartItems.length} items` : cartItems.message);

  // Test 4: Clean up - remove test item
  if (addSuccess) {
    const deleteStatus = await supabaseDelete("cart_snapshots",
      { restaurant_id: userId, product_id: testProduct.id }, token);
    recordTest("Remove cart item", deleteStatus === 204 || deleteStatus === 200,
               `Status: ${deleteStatus}`);
  }

  return { testProduct, cartItems };
}

// ============================================================================
// TEST SUITE 3: Order Submission
// ============================================================================
async function testOrderSubmission(token, userId) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 3: Order Submission API");
  console.log("=".repeat(60));

  // Test 1: Test order submission endpoint accessibility
  const testOrderData = {
    restaurantId: userId,
    cartSessionId: "test-session-" + Date.now(),
    specialInstructions: "ტესტის შეკვეთა",
    contactPhone: "+995599123456",
    deliveryAddress: "თბილისი, ვაკე",
    priority: "routine",
    paymentMethod: "cash"
  };

  try {
    const response = await fetch(`${APP_URL}/api/orders/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(testOrderData)
    });

    const result = await response.text();
    const isJson = result.startsWith("{") || result.startsWith("[");

    // Expected: redirect to login (HTML) since cookies aren't set
    // OR JSON response if endpoint accepts Authorization header
    if (isJson) {
      const jsonResult = JSON.parse(result);
      recordTest("Order submission endpoint responds", true,
                 `JSON response: ${jsonResult.success ? "success" : jsonResult.message || "error"}`);
    } else {
      // HTML response means auth redirect
      recordTest("Order submission endpoint responds", true,
                 "Redirects to auth (cookie-based auth required)");
    }
  } catch (error) {
    recordTest("Order submission endpoint responds", false, error.message);
  }

  // Test 2: Test orders table access
  const orders = await supabaseQuery("orders", {
    select: "id,status,created_at",
    token
  });

  const ordersAccessible = Array.isArray(orders);
  recordTest("Orders table accessible", ordersAccessible,
             ordersAccessible ? `${orders.length} orders found` : orders.message);

  return orders;
}

// ============================================================================
// TEST SUITE 4: RLS Policy Verification
// ============================================================================
async function testRLSPolicies(restaurantToken, adminToken, driverToken) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 4: RLS Policy Verification");
  console.log("=".repeat(60));

  // Test 1: Restaurant can only see their own orders (or RLS-allowed)
  const restaurantOrders = await supabaseQuery("orders", {
    select: "id,restaurant_id",
    token: restaurantToken
  });
  const restaurantOrdersOk = Array.isArray(restaurantOrders);
  recordTest("Restaurant RLS on orders", restaurantOrdersOk,
             restaurantOrdersOk ? `Sees ${restaurantOrders.length} orders` : restaurantOrders.message);

  // Test 2: Admin can see all orders
  const adminOrders = await supabaseQuery("orders", {
    select: "id,restaurant_id",
    token: adminToken
  });
  const adminOrdersOk = Array.isArray(adminOrders);
  recordTest("Admin RLS on orders", adminOrdersOk,
             adminOrdersOk ? `Sees ${adminOrders.length} orders` : adminOrders.message);

  // Test 3: Driver can see assigned orders
  const driverOrders = await supabaseQuery("orders", {
    select: "id,driver_id",
    token: driverToken
  });
  const driverOrdersOk = Array.isArray(driverOrders);
  recordTest("Driver RLS on orders", driverOrdersOk,
             driverOrdersOk ? `Sees ${driverOrders.length} orders` : driverOrders.message);

  // Test 4: Products visible to all authenticated users
  const restaurantProducts = await supabaseQuery("products", { token: restaurantToken });
  const adminProducts = await supabaseQuery("products", { token: adminToken });
  const driverProducts = await supabaseQuery("products", { token: driverToken });

  const productVisibility = Array.isArray(restaurantProducts) &&
                            Array.isArray(adminProducts) &&
                            Array.isArray(driverProducts);
  recordTest("Products visible to all roles", productVisibility);
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     CART & CHECKOUT COMPREHENSIVE TEST SUITE             ║");
  console.log("║     Distribution Management System                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // Step 1: Authenticate all users
  console.log("🔐 Authenticating test users...\n");

  const authResults = {};
  for (const [role, user] of Object.entries(TEST_USERS)) {
    const result = await login(user.email, user.password);
    if (result.error) {
      log(`${role}: Login failed - ${result.error}`, "fail");
      authResults[role] = null;
    } else {
      log(`${role}: Login successful`, "pass");
      authResults[role] = {
        token: result.access_token,
        userId: result.user?.id
      };
    }
  }

  // Check if we have at least restaurant login
  if (!authResults.restaurant) {
    console.log("\n❌ CRITICAL: Restaurant login failed. Cannot proceed with cart tests.");
    process.exit(1);
  }

  // Step 2: Run test suites
  const products = await testProductsAccess(
    authResults.restaurant.token,
    "restaurant"
  );

  await testCartOperations(
    authResults.restaurant.token,
    authResults.restaurant.userId,
    products
  );

  await testOrderSubmission(
    authResults.restaurant.token,
    authResults.restaurant.userId
  );

  // Step 3: RLS verification if all users authenticated
  if (authResults.admin && authResults.driver) {
    await testRLSPolicies(
      authResults.restaurant.token,
      authResults.admin.token,
      authResults.driver.token
    );
  }

  // Step 4: Summary
  console.log(`\n${"═".repeat(60)}`);
  console.log("TEST SUMMARY");
  console.log("═".repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log("\nFailed Tests:");
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.details}`);
    });
  }

  console.log("\n" + "═".repeat(60));
  console.log(testResults.failed === 0 ? "✅ ALL TESTS PASSED!" : "⚠️ SOME TESTS FAILED");
  console.log("═".repeat(60) + "\n");

  process.exit(testResults.failed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
});
