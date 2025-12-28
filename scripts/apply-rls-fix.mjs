#!/usr/bin/env node
/**
 * RLS Fix Verification and Test Script
 * Tests database access with service role and authenticated users
 */

const SUPABASE_URL = "https://akxmacfsltzhbnunoepb.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTg3ODMsImV4cCI6MjA3NzM5NDc4M30.51pqhjXAN9FuwXcpLefM85Bp9Y13nIMJJU_flm_K_zc";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgxODc4MywiZXhwIjoyMDc3Mzk0NzgzfQ.v59_YBUZ0V7bKlufZLSIa10MmE-sqTqDPWqwnaMPiPg";

const TEST_USERS = {
  restaurant: { email: "restaurant@test.com", password: "Test123456!", role: "restaurant" },
  admin: { email: "admin@test.com", password: "Test123456!", role: "admin" },
  driver: { email: "driver@test.com", password: "Test123456!", role: "driver" }
};

async function testTableAccess(tableName, apiKey, description) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=5`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    const contentRange = response.headers.get('content-range');
    const count = contentRange ? contentRange.split('/')[1] : '?';

    if (response.ok) {
      const data = await response.json();
      return { success: true, count, sample: data.length, error: null };
    } else {
      const errorText = await response.text();
      return { success: false, count: 0, sample: 0, error: errorText };
    }
  } catch (error) {
    return { success: false, count: 0, sample: 0, error: error.message };
  }
}

async function authenticateUser(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const data = await response.json();
  return { success: true, access_token: data.access_token, user: data.user };
}

async function testAuthenticatedAccess(accessToken, tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=5`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    const contentRange = response.headers.get('content-range');
    const count = contentRange ? contentRange.split('/')[1] : '?';

    if (response.ok) {
      const data = await response.json();
      return { success: true, count, sample: data.length };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 RLS VERIFICATION AND DATABASE ACCESS TEST');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const tables = ['profiles', 'products', 'orders', 'order_items', 'cart_snapshots'];
  const results = { serviceRole: {}, authenticated: {} };

  // Test 1: Service Role Access
  console.log('📊 TEST 1: Service Role Access');
  console.log('-'.repeat(50));

  for (const table of tables) {
    const result = await testTableAccess(table, SERVICE_ROLE_KEY, `service_role → ${table}`);
    results.serviceRole[table] = result;

    if (result.success) {
      console.log(`   ✅ ${table}: ${result.count} rows (sampled ${result.sample})`);
    } else {
      const shortError = result.error.substring(0, 60);
      console.log(`   ❌ ${table}: ${shortError}...`);
    }
  }

  // Test 2: Authenticated User Access
  console.log('\n📊 TEST 2: Authenticated User Access');
  console.log('-'.repeat(50));

  for (const [roleName, userInfo] of Object.entries(TEST_USERS)) {
    console.log(`\n   👤 Testing as ${roleName} (${userInfo.email}):`);

    const auth = await authenticateUser(userInfo.email, userInfo.password);
    if (!auth.success) {
      console.log(`      ❌ Authentication failed: ${auth.error}`);
      continue;
    }
    console.log(`      ✅ Authenticated successfully`);

    results.authenticated[roleName] = {};
    for (const table of tables) {
      const result = await testAuthenticatedAccess(auth.access_token, table);
      results.authenticated[roleName][table] = result;

      if (result.success) {
        console.log(`      ✅ ${table}: ${result.count} rows`);
      } else {
        const shortError = (result.error || 'unknown error').substring(0, 50);
        console.log(`      ❌ ${table}: ${shortError}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 SUMMARY');
  console.log('='.repeat(70));

  const serviceRoleIssues = Object.entries(results.serviceRole)
    .filter(([_, r]) => !r.success)
    .map(([name]) => name);

  if (serviceRoleIssues.length === 0) {
    console.log('✅ Service Role: All tables accessible');
  } else {
    console.log(`❌ Service Role: Issues with: ${serviceRoleIssues.join(', ')}`);
  }

  for (const [role, tableResults] of Object.entries(results.authenticated)) {
    const issues = Object.entries(tableResults)
      .filter(([_, r]) => !r.success)
      .map(([name]) => name);

    if (issues.length === 0) {
      console.log(`✅ ${role}: All expected tables accessible`);
    } else {
      console.log(`⚠️ ${role}: Limited access to: ${issues.join(', ')}`);
    }
  }

  // Check if migration is needed
  if (serviceRoleIssues.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  ACTION REQUIRED: Apply RLS Fix Migration');
    console.log('='.repeat(70));
    console.log(`
The following tables have RLS issues blocking service_role access:
${serviceRoleIssues.map(t => `  - ${t}`).join('\n')}

TO FIX:
1. Go to: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/sql/new
2. Copy the SQL from: database/migrations/20251128000001_fix_rls_complete.sql
3. Run the migration
4. Re-run this test script to verify
`);
  } else {
    console.log('\n✅ All RLS policies are working correctly!');
    console.log('You can proceed with cart and checkout testing.');
  }

  console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
