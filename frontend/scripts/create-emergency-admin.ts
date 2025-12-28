
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Client for Signup (Public API)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin Client for Role Escalation (Service Role)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createEmergencyAdmin() {
  const timestamp = Date.now();
  const email = `qa_admin_${timestamp}@example.com`;
  const password = 'password123';

  console.log(`Creating emergency admin: ${email}`);

  try {
    // 1. Create User (Admin API - bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'QA Emergency Admin' }
    });

    if (authError) {
      console.error('Error creating user:', authError.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.error('User creation successful but no User ID returned');
      return;
    }

    console.log(`User created. ID: ${userId}`);

    // 2. Escalate Role (Service Role)
    // We update the profile directly, bypassing auth.admin if possible, or using it if needed.
    // First, let's try updating the profile table directly as that's where our app checks roles.
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        role: 'admin',
        full_name: 'QA Emergency Admin',
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error escalating role in profiles:', profileError.message);
    } else {
      console.log('SUCCESS: User role updated to ADMIN in profiles table.');
      console.log('---------------------------------------------------');
      console.log(`EMAIL: ${email}`);
      console.log(`PASSWORD: ${password}`);
      console.log('---------------------------------------------------');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createEmergencyAdmin();
