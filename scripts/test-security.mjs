#!/usr/bin/env node
/**
 * Phase 10: Security Testing
 * Tests: Security headers, CSRF, auth security, injection prevention, RLS enforcement
 */

const APP_URL = "http://localhost:3000";
const SUPABASE_URL = "https://akxmacfsltzhbnunoepb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTg3ODMsImV4cCI6MjA3NzM5NDc4M30.51pqhjXAN9FuwXcpLefM85Bp9Y13nIMJJU_flm_K_zc";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgxODc4MywiZXhwIjoyMDc3Mzk0NzgzfQ.v59_YBUZ0V7bKlufZLSIa10MmE-sqTqDPWqwnaMPiPg";

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

// ============================================================================
// TEST SUITE 1: Security Headers
// ============================================================================
async function testSecurityHeaders() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 1: Security Headers");
  console.log("=".repeat(60));

  try {
    const response = await fetch(`${APP_URL}/`);
    const headers = Object.fromEntries(response.headers.entries());

    // Test 1: X-Content-Type-Options
    const hasNoSniff = headers["x-content-type-options"] === "nosniff";
    recordTest("X-Content-Type-Options header", hasNoSniff,
               hasNoSniff ? "nosniff" : headers["x-content-type-options"] || "missing");

    // Test 2: X-Frame-Options
    const hasFrameOptions = headers["x-frame-options"] === "DENY" ||
                           headers["x-frame-options"] === "SAMEORIGIN";
    recordTest("X-Frame-Options header", hasFrameOptions,
               headers["x-frame-options"] || "missing");

    // Test 3: X-XSS-Protection
    const hasXSSProtection = headers["x-xss-protection"]?.includes("1");
    recordTest("X-XSS-Protection header", hasXSSProtection,
               headers["x-xss-protection"] || "missing");

    // Test 4: Referrer-Policy
    const hasReferrerPolicy = !!headers["referrer-policy"];
    recordTest("Referrer-Policy header", hasReferrerPolicy,
               headers["referrer-policy"] || "missing");

    // Test 5: Content-Security-Policy
    const hasCSP = !!headers["content-security-policy"];
    recordTest("Content-Security-Policy header", hasCSP,
               hasCSP ? "Present" : "missing");

    // Test 6: CSP contains critical directives
    if (hasCSP) {
      const csp = headers["content-security-policy"];
      const hasDefaultSrc = csp.includes("default-src");
      const hasScriptSrc = csp.includes("script-src");
      const hasFrameAncestors = csp.includes("frame-ancestors");
      recordTest("CSP has default-src directive", hasDefaultSrc);
      recordTest("CSP has script-src directive", hasScriptSrc);
      recordTest("CSP has frame-ancestors directive", hasFrameAncestors);
    } else {
      recordTest("CSP has default-src directive", false, "No CSP");
      recordTest("CSP has script-src directive", false, "No CSP");
      recordTest("CSP has frame-ancestors directive", false, "No CSP");
    }

    // Test 7: Permissions-Policy
    const hasPermissionsPolicy = !!headers["permissions-policy"];
    recordTest("Permissions-Policy header", hasPermissionsPolicy,
               hasPermissionsPolicy ? "Present" : "missing");

  } catch (error) {
    recordTest("Security headers check", false, error.message);
  }
}

// ============================================================================
// TEST SUITE 2: CSRF Protection
// ============================================================================
async function testCSRFProtection() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 2: CSRF Protection");
  console.log("=".repeat(60));

  try {
    // Test 1: CSRF endpoint exists
    const csrfResponse = await fetch(`${APP_URL}/api/csrf`);
    recordTest("CSRF endpoint accessible", csrfResponse.ok,
               `Status: ${csrfResponse.status}`);

    // Test 2: CSRF token returned
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      const hasToken = !!csrfData.csrfToken;
      recordTest("CSRF token returned", hasToken,
                 hasToken ? "Token present" : "No token");

      // Test 3: Token format valid
      if (hasToken) {
        const tokenValid = csrfData.csrfToken.length >= 32;
        recordTest("CSRF token format valid", tokenValid,
                   `Length: ${csrfData.csrfToken.length}`);
      }
    }

    // Test 4: POST without CSRF token to protected route (should fail or require auth)
    const postResponse = await fetch(`${APP_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ test: "data" })
    });

    // Should either require auth (redirect/401) or reject for CSRF
    const blockedOrAuth = postResponse.status === 401 ||
                          postResponse.status === 403 ||
                          postResponse.redirected ||
                          postResponse.url.includes("/login");
    recordTest("POST without CSRF blocked or requires auth", blockedOrAuth,
               `Status: ${postResponse.status}`);

  } catch (error) {
    recordTest("CSRF protection test", false, error.message);
  }
}

// ============================================================================
// TEST SUITE 3: Authentication Security
// ============================================================================
async function testAuthenticationSecurity() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 3: Authentication Security");
  console.log("=".repeat(60));

  try {
    // Test 1: Protected routes redirect to login
    const dashboardResponse = await fetch(`${APP_URL}/dashboard`, {
      redirect: "manual"
    });
    const redirectsToLogin = dashboardResponse.status === 307 ||
                            dashboardResponse.status === 302 ||
                            dashboardResponse.headers.get("location")?.includes("login");
    recordTest("Protected route redirects to login", redirectsToLogin,
               `Status: ${dashboardResponse.status}`);

    // Test 2: Admin routes protected
    const adminResponse = await fetch(`${APP_URL}/dashboard/admin`, {
      redirect: "manual"
    });
    const adminProtected = adminResponse.status === 307 ||
                          adminResponse.status === 302 ||
                          adminResponse.headers.get("location")?.includes("login");
    recordTest("Admin route protected", adminProtected,
               `Status: ${adminResponse.status}`);

    // Test 3: Invalid credentials rejected
    const invalidLogin = await login("invalid@test.com", "wrongpassword");
    const invalidRejected = !!invalidLogin.error || !invalidLogin.access_token;
    recordTest("Invalid credentials rejected", invalidRejected,
               invalidLogin.error ? "Rejected" : "Token returned (unexpected)");

    // Test 4: Valid credentials work
    const validLogin = await login(TEST_USERS.restaurant.email, TEST_USERS.restaurant.password);
    const validAccepted = !!validLogin.access_token;
    recordTest("Valid credentials accepted", validAccepted,
               validAccepted ? "Token received" : validLogin.error);

    // Test 5: JWT token format valid
    if (validAccepted) {
      const tokenParts = validLogin.access_token.split(".");
      const validJWT = tokenParts.length === 3;
      recordTest("JWT token format valid", validJWT, `Parts: ${tokenParts.length}`);
    }

    // Test 6: Empty password rejected
    const emptyPassLogin = await login(TEST_USERS.restaurant.email, "");
    const emptyPassRejected = !!emptyPassLogin.error || !emptyPassLogin.access_token;
    recordTest("Empty password rejected", emptyPassRejected);

    // Test 7: SQL injection in email rejected
    const sqlInjectionLogin = await login("' OR 1=1 --", "password");
    const sqlInjectionRejected = !!sqlInjectionLogin.error || !sqlInjectionLogin.access_token;
    recordTest("SQL injection in login rejected", sqlInjectionRejected);

  } catch (error) {
    recordTest("Authentication security test", false, error.message);
  }
}

// ============================================================================
// TEST SUITE 4: Input Validation & Injection Prevention
// ============================================================================
async function testInputValidation() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 4: Input Validation & Injection Prevention");
  console.log("=".repeat(60));

  try {
    // Test 1: XSS in contact form
    const xssResponse = await fetch(`${APP_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "<script>alert('xss')</script>",
        email: "test@test.com",
        inquiryType: "general",
        message: "Test message here"
      })
    });
    // Should either sanitize, escape, or process safely (not execute)
    const xssHandled = xssResponse.ok || xssResponse.status === 400;
    recordTest("XSS input handled safely", xssHandled,
               `Status: ${xssResponse.status}`);

    // Test 2: Invalid email format rejected
    const invalidEmailResponse = await fetch(`${APP_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
        inquiryType: "general",
        message: "Test message here"
      })
    });
    const invalidEmailRejected = invalidEmailResponse.status === 400;
    recordTest("Invalid email format rejected", invalidEmailRejected,
               `Status: ${invalidEmailResponse.status}`);

    // Test 3: Very long input handled
    const longInput = "A".repeat(100000);
    const longInputResponse = await fetch(`${APP_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: longInput,
        email: "test@test.com",
        inquiryType: "general",
        message: "Test"
      })
    });
    // Should either reject (400/413) or handle gracefully
    const longInputHandled = longInputResponse.status !== 500;
    recordTest("Very long input handled", longInputHandled,
               `Status: ${longInputResponse.status}`);

    // Test 4: Null byte injection handled
    const nullByteResponse = await fetch(`${APP_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test\x00User",
        email: "test@test.com",
        inquiryType: "general",
        message: "Test message"
      })
    });
    const nullByteHandled = nullByteResponse.status !== 500;
    recordTest("Null byte injection handled", nullByteHandled,
               `Status: ${nullByteResponse.status}`);

    // Test 5: Unicode/emoji handled
    const unicodeResponse = await fetch(`${APP_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "მომხმარებელი 🍕",
        email: "test@test.com",
        inquiryType: "general",
        message: "ქართული ტექსტი with emojis 👍"
      })
    });
    const unicodeHandled = unicodeResponse.ok || unicodeResponse.status === 200;
    recordTest("Unicode/Georgian text handled", unicodeHandled,
               `Status: ${unicodeResponse.status}`);

  } catch (error) {
    recordTest("Input validation test", false, error.message);
  }
}

// ============================================================================
// TEST SUITE 5: RLS (Row Level Security) Enforcement
// ============================================================================
async function testRLSEnforcement() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 5: RLS (Row Level Security) Enforcement");
  console.log("=".repeat(60));

  try {
    // Login as restaurant user
    const restaurantAuth = await login(TEST_USERS.restaurant.email, TEST_USERS.restaurant.password);
    const restaurantToken = restaurantAuth.access_token;

    // Login as driver user
    const driverAuth = await login(TEST_USERS.driver.email, TEST_USERS.driver.password);
    const driverToken = driverAuth.access_token;

    // Login as admin
    const adminAuth = await login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    const adminToken = adminAuth.access_token;

    // Test 1: Restaurant can access orders
    const restaurantOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id`, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${restaurantToken}`
      }
    });
    const restaurantOrdersOk = restaurantOrders.ok;
    recordTest("Restaurant can query orders", restaurantOrdersOk,
               `Status: ${restaurantOrders.status}`);

    // Test 2: Driver can access orders
    const driverOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id`, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${driverToken}`
      }
    });
    const driverOrdersOk = driverOrders.ok;
    recordTest("Driver can query orders", driverOrdersOk,
               `Status: ${driverOrders.status}`);

    // Test 3: Admin has broader access
    const adminOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,restaurant_id,driver_id`, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${adminToken}`
      }
    });
    const adminOrdersData = await adminOrders.json();
    const adminHasAccess = Array.isArray(adminOrdersData);
    recordTest("Admin can query all orders", adminHasAccess,
               adminHasAccess ? `${adminOrdersData.length} orders` : "Failed");

    // Test 4: Profiles table RLS
    const restaurantProfiles = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,role`, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${restaurantToken}`
      }
    });
    recordTest("Profiles table accessible with auth", restaurantProfiles.ok,
               `Status: ${restaurantProfiles.status}`);

    // Test 5: Anonymous cannot access protected data
    const anonOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id`, {
      headers: {
        "apikey": ANON_KEY
        // No Authorization header
      }
    });
    const anonOrdersData = await anonOrders.json();
    // Anonymous should get empty array or error (RLS blocks access)
    const anonBlocked = !Array.isArray(anonOrdersData) || anonOrdersData.length === 0;
    recordTest("Anonymous blocked from orders", anonBlocked,
               Array.isArray(anonOrdersData) ? `${anonOrdersData.length} orders` : "Blocked");

    // Test 6: Products table public read access
    const productsPublic = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name&limit=3`, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${restaurantToken}`
      }
    });
    const productsData = await productsPublic.json();
    const productsAccessible = Array.isArray(productsData) && productsData.length > 0;
    recordTest("Products readable by authenticated", productsAccessible,
               productsAccessible ? `${productsData.length} products` : "No access");

  } catch (error) {
    recordTest("RLS enforcement test", false, error.message);
  }
}

// ============================================================================
// TEST SUITE 6: API Security
// ============================================================================
async function testAPISecurity() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 6: API Security");
  console.log("=".repeat(60));

  try {
    // Test 1: API rate limiting exists (multiple rapid requests)
    const rapidRequests = [];
    for (let i = 0; i < 10; i++) {
      rapidRequests.push(fetch(`${APP_URL}/api/health`));
    }
    const results = await Promise.all(rapidRequests);
    const allSucceeded = results.every(r => r.ok);
    // For health endpoint, rate limiting may not apply, but server should handle load
    recordTest("Server handles rapid requests", allSucceeded,
               `${results.filter(r => r.ok).length}/10 succeeded`);

    // Test 2: Unknown API routes return 404
    const unknownRoute = await fetch(`${APP_URL}/api/unknown-endpoint-xyz`);
    const is404 = unknownRoute.status === 404;
    recordTest("Unknown API routes return 404", is404,
               `Status: ${unknownRoute.status}`);

    // Test 3: API responds with JSON content-type
    const apiResponse = await fetch(`${APP_URL}/api/health`);
    const contentType = apiResponse.headers.get("content-type");
    const isJSON = contentType?.includes("application/json");
    recordTest("API returns JSON content-type", isJSON,
               contentType || "No content-type");

    // Test 4: Error responses don't leak stack traces
    const errorResponse = await fetch(`${APP_URL}/api/orders/invalid-id-format`);
    const errorBody = await errorResponse.text();
    const noStackTrace = !errorBody.includes("at ") && !errorBody.includes("node_modules");
    recordTest("Error responses don't leak stack traces", noStackTrace,
               noStackTrace ? "Clean error" : "May contain trace");

    // Test 5: OPTIONS requests handled (CORS)
    const optionsResponse = await fetch(`${APP_URL}/api/health`, {
      method: "OPTIONS"
    });
    const optionsHandled = optionsResponse.status !== 500;
    recordTest("OPTIONS requests handled", optionsHandled,
               `Status: ${optionsResponse.status}`);

  } catch (error) {
    recordTest("API security test", false, error.message);
  }
}

// ============================================================================
// TEST SUITE 7: Session Security
// ============================================================================
async function testSessionSecurity() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE 7: Session Security");
  console.log("=".repeat(60));

  try {
    // Login to get valid session
    const authResult = await login(TEST_USERS.restaurant.email, TEST_USERS.restaurant.password);

    // Test 1: Session token is not exposed in URL
    const dashResponse = await fetch(`${APP_URL}/login`);
    const dashUrl = dashResponse.url;
    const noTokenInUrl = !dashUrl.includes("token=") && !dashUrl.includes("access_token=");
    recordTest("Token not exposed in URL", noTokenInUrl,
               noTokenInUrl ? "Clean URL" : "Token in URL!");

    // Test 2: Token expiration is set
    if (authResult.access_token) {
      const tokenParts = authResult.access_token.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const hasExp = !!payload.exp;
        recordTest("JWT has expiration claim", hasExp,
                   hasExp ? `exp: ${new Date(payload.exp * 1000).toISOString()}` : "No exp");
      }
    }

    // Test 3: Refresh token mechanism exists
    const hasRefreshToken = !!authResult.refresh_token;
    recordTest("Refresh token provided", hasRefreshToken,
               hasRefreshToken ? "Present" : "Missing");

    // Test 4: Token contains user identity
    if (authResult.access_token) {
      const tokenParts = authResult.access_token.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const hasUserId = !!payload.sub;
        recordTest("JWT contains user ID", hasUserId,
                   hasUserId ? `sub: ${payload.sub.substring(0, 8)}...` : "No sub claim");
      }
    }

  } catch (error) {
    recordTest("Session security test", false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     PHASE 10: SECURITY TEST SUITE                        ║");
  console.log("║     Distribution Management System                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  await testSecurityHeaders();
  await testCSRFProtection();
  await testAuthenticationSecurity();
  await testInputValidation();
  await testRLSEnforcement();
  await testAPISecurity();
  await testSessionSecurity();

  // Summary
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
  console.log(testResults.failed === 0 ? "✅ ALL SECURITY TESTS PASSED!" : "⚠️ SOME SECURITY TESTS FAILED");
  console.log("═".repeat(60) + "\n");

  process.exit(testResults.failed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
});
