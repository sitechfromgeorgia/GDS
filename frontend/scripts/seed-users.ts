
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

const users = [
  { email: 'admin@example.com', password: 'password123', role: 'admin', full_name: 'System Admin' },
  { email: 'restaurant@example.com', password: 'password123', role: 'restaurant', full_name: 'Test Restaurant' },
  { email: 'driver@example.com', password: 'password123', role: 'driver', full_name: 'Test Driver' }
];

async function seedUsers() {
  console.log('Seeding users...');

  for (const user of users) {
    try {
      // 1. Create user in auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name }
      });

      let userId = authData.user?.id;

      if (authError) {
        // Check for various "already exists" error messages
        const isUserExists = authError.message.toLowerCase().includes('already') ||
                            authError.message.toLowerCase().includes('registered') ||
                            authError.message.toLowerCase().includes('exists');

        if (isUserExists) {
            console.log(`User ${user.email} already exists. Fetching ID...`);
            // Fetch user ID if already exists
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error(`Error listing users:`, listError.message);
                continue;
            }
            const existingUser = listData.users.find(u => u.email === user.email);
            if (existingUser) {
                userId = existingUser.id;
                console.log(`Found existing user ID: ${userId}`);
            } else {
                console.error(`Could not find existing user ${user.email}`);
                continue;
            }
        } else {
            console.error(`Error creating user ${user.email}:`, authError.message);
            continue;
        }
      } else {
        console.log(`Created user ${user.email} with ID: ${userId}`);
      }

      if (!userId) continue;

      // 2. Upsert profile with correct role and email
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`Error updating profile for ${user.email}:`, profileError.message);
      } else {
        console.log(`Updated profile for ${user.email} with role ${user.role}`);
      }

    } catch (err) {
      console.error(`Unexpected error for ${user.email}:`, err);
    }
  }

  console.log('User seeding completed.');
}

seedUsers();
