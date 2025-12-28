
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Admin Client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createOtherUsers() {
  const timestamp = Date.now();
  const users = [
    { role: 'restaurant', email: `qa_restaurant_${timestamp}@example.com`, name: 'QA Restaurant' },
    { role: 'driver', email: `qa_driver_${timestamp}@example.com`, name: 'QA Driver' }
  ];

  for (const user of users) {
    console.log(`Creating ${user.role}: ${user.email}`);

    try {
      // 1. Create User (Admin API)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: user.name }
      });

      if (authError) {
        console.error(`Error creating ${user.role}:`, authError.message);
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) continue;

      // 2. Upsert Profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          role: user.role,
          full_name: user.name,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`Error creating profile for ${user.role}:`, profileError.message);
      } else {
        console.log(`SUCCESS: Created ${user.role} user.`);
        console.log(`EMAIL: ${user.email}`);
        console.log(`PASSWORD: password123`);
      }

    } catch (err) {
      console.error(`Unexpected error for ${user.role}:`, err);
    }
  }
}

createOtherUsers();
