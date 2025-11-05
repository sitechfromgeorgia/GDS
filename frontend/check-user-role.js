/**
 * Check User Role Script
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserRole() {
  const email = 'sitech.georgia@gmail.com';

  console.log('🔍 Checking user role for:', email);
  console.log('');

  try {
    // Check in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      console.log('⚠️  Profile not found:', profileError.message);
      console.log('');
      console.log('📝 Creating admin profile...');

      // Get user ID from auth
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'Chemax1993...'
      });

      if (signInData?.user) {
        console.log('✅ User found with ID:', signInData.user.id);

        // Create profile with admin role
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: signInData.user.id,
            email: email,
            role: 'admin',
            full_name: 'Admin User'
          });

        if (createError) {
          console.error('❌ Failed to create profile:', createError.message);
        } else {
          console.log('✅ Admin profile created successfully!');
        }

        await supabase.auth.signOut();
      }
    } else {
      console.log('✅ Profile found!');
      console.log('   Role:', profile.role);
      console.log('   ID:', profile.id);
      console.log('   Name:', profile.full_name);
      console.log('');

      if (profile.role !== 'admin') {
        console.log('⚠️  User is not admin, updating role...');

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', profile.id);

        if (updateError) {
          console.error('❌ Failed to update role:', updateError.message);
        } else {
          console.log('✅ Role updated to admin!');
        }
      }
    }

    console.log('');
    console.log('🌐 Now you can access:');
    console.log('   Login: http://localhost:3001/login');
    console.log('   Admin Dashboard: http://localhost:3001/dashboard/admin');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserRole();
