const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  console.log('Resetting password for admin@example.com...');
  
  // First, find the user to get ID (optional, but good for verification)
  // Actually updateUserById needs ID. updateUser (admin) needs ID?
  // No, admin.updateUserById needs ID.
  // Is there a way to update by email? No.
  // So we list users to find the ID.
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('List users failed:', listError);
    return;
  }
  
  const adminUser = users.find(u => u.email === 'admin@example.com');
  
  if (!adminUser) {
    console.error('Admin user not found!');
    return;
  }
  
  console.log(`Found admin user: ${adminUser.id}`);
  
  const { data, error } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    { password: 'AdminPass123!' }
  );
  
  if (error) {
    console.error('Update password failed:', error);
  } else {
    console.log('Password updated successfully!');
  }
}

resetPassword();
