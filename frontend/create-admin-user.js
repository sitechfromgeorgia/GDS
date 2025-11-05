/**
 * Create Admin User Script
 * Creates a test admin user in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Creating Admin User...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // Test admin credentials
    const email = 'admin@test.com';
    const password = 'admin123456'; // Change this to a secure password

    console.log('📧 Creating user account...');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: 'admin',
          full_name: 'Test Admin'
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, trying to sign in...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
          return;
        }

        console.log('✅ Signed in successfully!');
        console.log('   User ID:', signInData.user?.id);

        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user?.id)
          .single();

        if (profileError) {
          console.log('⚠️  Profile not found, creating...');

          // Create profile
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: signInData.user?.id,
              email: email,
              role: 'admin',
              full_name: 'Test Admin'
            });

          if (createProfileError) {
            console.error('❌ Profile creation failed:', createProfileError.message);
            return;
          }

          console.log('✅ Admin profile created!');
        } else {
          console.log('✅ Profile exists:', profile.role);
        }

      } else {
        console.error('❌ Sign up failed:', authError.message);
        return;
      }
    } else {
      console.log('✅ User created successfully!');
      console.log('   User ID:', authData.user?.id);

      // Wait a bit for auth to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          email: email,
          role: 'admin',
          full_name: 'Test Admin'
        });

      if (profileError) {
        console.log('⚠️  Profile creation note:', profileError.message);
      } else {
        console.log('✅ Admin profile created!');
      }
    }

    console.log('\n🎉 Admin user ready!');
    console.log('\n📝 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🌐 Login at: http://localhost:3001/login');
    console.log('   Then go to: http://localhost:3001/dashboard/admin');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

createAdminUser();
