
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

async function resetPassword() {
  const email = 'admin@example.com';
  const newPassword = 'password123';

  console.log(`Resetting password for ${email}...`);

  // 1. Get user ID
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = listData.users.find(u => u.email === email);
  if (!user) {
    console.error(`User ${email} not found.`);
    return;
  }

  // 2. Update password
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword, email_confirm: true }
  );

  if (updateError) {
    console.error('Error updating password:', updateError);
  } else {
    console.log('Password updated successfully.');
  }
  
  // 3. Verify Profile Role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
      console.log('Profile error (might not exist):', profileError.message);
      // Upsert profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            role: 'admin',
            full_name: 'System Admin',
            updated_at: new Date().toISOString()
        });
       if (upsertError) console.error('Error upserting profile:', upsertError);
       else console.log('Profile upserted with admin role.');
  } else {
      console.log('Current profile role:', profile.role);
      if (profile.role !== 'admin') {
          const { error: roleError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
          if (roleError) console.error('Error updating role:', roleError);
          else console.log('Role updated to admin.');
      }
  }
}

resetPassword();
