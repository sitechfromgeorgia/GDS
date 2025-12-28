// Test UI flows - login page rendering, dashboard access, etc.
const APP_URL = "http://localhost:3000";

async function testPageRendering(url, description) {
  console.log(`\n=== Testing: ${description} ===`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "(no title)";

    // Check for error indicators
    const hasError500 = html.includes("Internal Server Error") || (html.includes("500") && html.includes("This page could not be found") === false && html.includes("error") && title.includes("Error"));
    const hasError404 = html.includes("404") && (html.includes("not found") || html.includes("Not Found") || title.includes("404"));
    const hasRuntimeError = html.includes("Application error: a client-side exception has occurred") || html.includes("Runtime Error");
    const hasUnhandledException = html.includes("Unhandled Runtime Error");

    // Check for Georgian content (locale indicator)
    const hasGeorgianContent = html.includes("lang=\"ka\"") || html.includes("ქართული");

    // Check for proper page structure
    const hasHtmlTag = html.includes("<!DOCTYPE html>") || html.includes("<html");
    const hasHead = html.includes("<head>");
    const hasBody = html.includes("<body");
    const hasNextData = html.includes("__NEXT_DATA__") || html.includes("_next");

    console.log(`Status: ${response.status}`);
    console.log(`Title: ${title}`);
    console.log(`Structure:`);
    console.log(`  - HTML tag: ${hasHtmlTag ? "✅" : "❌"}`);
    console.log(`  - Head tag: ${hasHead ? "✅" : "❌"}`);
    console.log(`  - Body tag: ${hasBody ? "✅" : "❌"}`);
    console.log(`  - Next.js: ${hasNextData ? "✅" : "❌"}`);
    console.log(`  - Georgian: ${hasGeorgianContent ? "✅" : "⚠️ Not detected"}`);
    console.log(`Errors:`);
    console.log(`  - 500 Error: ${hasError500 ? "❌ FOUND" : "✅ None"}`);
    console.log(`  - 404 Error: ${hasError404 ? "❌ FOUND" : "✅ None"}`);
    console.log(`  - Runtime Error: ${hasRuntimeError ? "❌ FOUND" : "✅ None"}`);
    console.log(`  - Unhandled Exception: ${hasUnhandledException ? "❌ FOUND" : "✅ None"}`);

    // Check for specific content based on page
    if (url.includes("/login")) {
      const hasLoginForm = html.includes("type=\"email\"") || html.includes("email") || html.includes("password");
      const hasLoginButton = html.includes("შესვლა") || html.includes("login") || html.includes("Sign");
      console.log(`Login Page:`);
      console.log(`  - Login form: ${hasLoginForm ? "✅" : "❌"}`);
      console.log(`  - Login button: ${hasLoginButton ? "✅" : "❌"}`);
    }

    if (url.includes("/dashboard")) {
      const hasDashboardContent = html.includes("dashboard") || html.includes("Dashboard");
      console.log(`Dashboard Page:`);
      console.log(`  - Dashboard content: ${hasDashboardContent ? "✅" : "⚠️ May require auth"}`);
    }

    // Overall result
    const isPassing = hasHtmlTag && hasHead && hasBody && !hasError500 && !hasRuntimeError && !hasUnhandledException;
    console.log(`\n${isPassing ? "✅ PASS" : "❌ FAIL"}`);

    return {
      url,
      status: response.status,
      title,
      pass: isPassing,
      errors: { hasError500, hasError404, hasRuntimeError, hasUnhandledException }
    };
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
    return { url, pass: false, error: error.message };
  }
}

async function main() {
  console.log("=== UI FLOW TESTING ===\n");
  console.log("Testing page rendering and basic UI functionality...\n");

  const results = [];

  // Public pages
  results.push(await testPageRendering(`${APP_URL}/`, "Home Page"));
  results.push(await testPageRendering(`${APP_URL}/login`, "Login Page"));
  results.push(await testPageRendering(`${APP_URL}/demo`, "Demo Page"));
  results.push(await testPageRendering(`${APP_URL}/health`, "Health Page"));
  results.push(await testPageRendering(`${APP_URL}/welcome`, "Welcome Page"));

  // Protected pages (should redirect to login or show auth required)
  results.push(await testPageRendering(`${APP_URL}/dashboard`, "Dashboard (Protected)"));
  results.push(await testPageRendering(`${APP_URL}/dashboard/admin`, "Admin Dashboard (Protected)"));
  results.push(await testPageRendering(`${APP_URL}/dashboard/restaurant`, "Restaurant Dashboard (Protected)"));
  results.push(await testPageRendering(`${APP_URL}/dashboard/driver`, "Driver Dashboard (Protected)"));
  results.push(await testPageRendering(`${APP_URL}/dashboard/demo`, "Demo Dashboard (Protected)"));

  // Catalog page
  results.push(await testPageRendering(`${APP_URL}/catalog`, "Product Catalog"));

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  console.log(`\nTotal: ${results.length} pages tested`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed pages:");
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  - ${r.url}: ${r.error || "See errors above"}`);
    });
  }

  console.log("\n=== UI FLOW TESTING COMPLETED ===\n");
}

main().catch(console.error);
