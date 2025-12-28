// Quick test to check Supabase connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://akxmacfsltzhbnunoepb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTg3ODMsImV4cCI6MjA3NzM5NDc4M30.51pqhjXAN9FuwXcpLefM85Bp9Y13nIMJJU_flm_K_zc'

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseAnonKey.substring(0, 50) + '...')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('\n📊 Attempting to query profiles table...')
  const { data, error } = await supabase
    .from('profiles')
    .select('id', { head: true })
    .limit(1)

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log('✅ Success! Connection works')
  console.log('Data:', data)
}

testConnection()
