const { Client } = require('pg');

const config = {
    user: 'postgres',
    host: 'data.greenland77.ge',
    database: 'postgres',
    password: '3mppdicb2bihqjmjs3ks20xfdxydppxm',
    port: 5432,
    ssl: false
};

async function debugPolicies() {
  console.log('--- Debugging Policies & Triggers (Direct PG) ---');
  const client = new Client(config);
  await client.connect();

  try {
    // Check RLS status
    const resRLS = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'order_items'
    `);
    console.log('RLS Status:', resRLS.rows[0]);

    // Check Policies
    console.log('\nChecking Policies for order_items:');
    const resPolicies = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'order_items'
    `);
    console.table(resPolicies.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

debugPolicies();
