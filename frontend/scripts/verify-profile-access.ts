
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfileAccess() {
  const email = 'qa_admin_1764070522220@example.com'; // Use the user we just created
  const password = 'password123';

  console.log(`Attempting login as ${email}...`);

  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('Login failed:', loginError.message);
    return;
  }

  if (!session) {
    console.error('No session returned');
    return;
  }

  console.log('Login successful. User ID:', session.user.id);
  console.log('Attempting to fetch profile...');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch FAILED:', profileError);
    console.error('Code:', profileError.code);
    console.error('Details:', profileError.details);
    console.error('Hint:', profileError.hint);
  } else {
    console.log('Profile fetch SUCCESS:', profile);
  }
}

checkProfileAccess();
