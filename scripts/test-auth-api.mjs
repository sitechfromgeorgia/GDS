// Test authenticated API access
const SUPABASE_URL = "https://akxmacfsltzhbnunoepb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTg3ODMsImV4cCI6MjA3NzM5NDc4M30.51pqhjXAN9FuwXcpLefM85Bp9Y13nIMJJU_flm_K_zc";
const APP_URL = "http://localhost:3000";

const TEST_USERS = [
  { email: "admin@test.com", password: "Test123456!", role: "admin" },
  { email: "restaurant@test.com", password: "Test123456!", role: "restaurant" },
  { email: "driver@test.com", password: "Test123456!", role: "driver" }
];

async function login(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

async function testApiWithAuth(endpoint, token, description) {
  console.log(`\n=== Testing: ${description} ===`);
  console.log(`Endpoint: ${endpoint}`);

  const response = await fetch(`${APP_URL}${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Cookie": `sb-akxmacfsltzhbnunoepb-auth-token=${token}`
    }
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Response: ${text.substring(0, 500)}`);

  return { status: response.status, body: text };
}

async function main() {
  console.log("=== AUTHENTICATED API ACCESS TESTING ===\n");

  for (const user of TEST_USERS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing as ${user.role.toUpperCase()} (${user.email})`);
    console.log("=".repeat(60));

    // Login
    console.log("\n1. Logging in...");
    const authResult = await login(user.email, user.password);

    if (authResult.error) {
      console.log(`ERROR: ${authResult.error} - ${authResult.error_description || authResult.msg}`);
      continue;
    }

    const token = authResult.access_token;
    console.log(`   Login successful! Token received (${token.length} chars)`);

    // Test products API
    await testApiWithAuth("/api/products", token, `${user.role} - Products API`);

    // Test orders API
    await testApiWithAuth("/api/orders", token, `${user.role} - Orders API`);

    // Test health API (public - should work without auth)
    await testApiWithAuth("/api/health", token, `${user.role} - Health API`);

    // Test role-specific dashboard endpoints
    if (user.role === "admin") {
      await testApiWithAuth("/api/analytics/kpis", token, `${user.role} - Analytics KPIs`);
    }
  }

  console.log("\n=== ALL TESTS COMPLETED ===\n");
}

main().catch(console.error);
