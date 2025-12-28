
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminV2() {
  const email = 'admin2@example.com';
  const password = 'password123';

  console.log(`Creating user ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin Two' }
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
      console.error('No user ID returned');
      return;
  }

  console.log(`User created with ID: ${userId}`);

  // Upsert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      role: 'admin',
      full_name: 'Admin Two',
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Profile created successfully with admin role.');
  }
}

createAdminV2();
