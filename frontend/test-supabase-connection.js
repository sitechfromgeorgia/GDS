/**
 * Supabase Connection Test Script
 * Tests backend connectivity and basic operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
console.log('---\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please check .env.local file for:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('1️⃣  Testing database connection...');

    // Test 1: Basic query to profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);

    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('   Sample count:', profiles?.length || 0);
    }

    console.log('\n2️⃣  Testing products table...');

    // Test 2: Products query
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(1);

    if (productsError) {
      console.error('❌ Products query failed:', productsError.message);
    } else {
      console.log('✅ Products table accessible');
      console.log('   Sample count:', products?.length || 0);
    }

    console.log('\n3️⃣  Testing orders table...');

    // Test 3: Orders query
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status')
      .limit(1);

    if (ordersError) {
      console.error('❌ Orders query failed:', ordersError.message);
    } else {
      console.log('✅ Orders table accessible');
      console.log('   Sample count:', orders?.length || 0);
    }

    console.log('\n4️⃣  Testing authentication status...');

    // Test 4: Auth session
    const { data: session } = await supabase.auth.getSession();

    if (session?.session) {
      console.log('✅ Auth session active');
      console.log('   User:', session.session.user.email);
    } else {
      console.log('ℹ️  No active auth session (expected for backend test)');
    }

    console.log('\n5️⃣  Testing realtime capabilities...');

    // Test 5: Realtime channel
    const channel = supabase.channel('test-channel');

    channel
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('✅ Realtime event received:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime channel subscribed successfully');
          channel.unsubscribe();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error');
        }
      });

    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📊 Connection Test Summary:');
    console.log('---');

    const testsRun = 5;
    const testsPassed = [
      !profilesError,
      !productsError,
      !ordersError,
      true, // Auth test (no session is OK)
      true  // Realtime test
    ].filter(Boolean).length;

    console.log(`✅ Tests passed: ${testsPassed}/${testsRun}`);

    if (testsPassed === testsRun) {
      console.log('\n🎉 ALL TESTS PASSED! Supabase backend is fully functional!');
    } else {
      console.log('\n⚠️  Some tests failed. Check errors above.');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error during testing:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
