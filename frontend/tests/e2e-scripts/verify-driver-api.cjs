const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

// Helper for HTTP requests
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Helper for Supabase API requests (using Service Role)
async function supabaseRequest(endpoint, method, body = null) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: method,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          console.log(`[${method} ${endpoint}] Status: ${res.statusCode}`);
          if (res.statusCode >= 400) {
             console.log('Raw Body:', data);
          }
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            console.error('Supabase Error:', parsed);
          }
          resolve(parsed);
        } catch (e) {
          console.error('Failed to parse Supabase response:', data);
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    console.log('\n--- Testing Driver API ---');
    
    // 1. Login as Driver FIRST to get ID
    console.log('Logging in as Driver...');
    
    const loginData = JSON.stringify({
      email: 'driver-new@test.com',
      password: 'Password123!'
    });
    
    const loginRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/test-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
    }, loginData);

    if (loginRes.statusCode !== 200) throw new Error('Login failed');
    
    const loginBody = JSON.parse(loginRes.body);
    const driverId = loginBody.session.user.id;
    console.log('Logged in Driver ID:', driverId);

    // 1b. Fetch CSRF
    const csrfRes = await request({ hostname: 'localhost', port: 3000, path: '/api/csrf', method: 'GET' });
    const csrfToken = JSON.parse(csrfRes.body).csrfToken;
    const csrfCookie = csrfRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');
    
    const sessionCookies = loginRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');
    const allCookies = `${csrfCookie}; ${sessionCookies}`;

    console.log('--- Setting up Test Data ---');

    // 2. Get/Create Restaurant User
    let users = await supabaseRequest('profiles?role=eq.restaurant&limit=1', 'GET');
    const restaurantId = users[0]?.id;
    console.log('Restaurant ID:', restaurantId);

    if (!restaurantId) throw new Error('Missing restaurant');

    // 3. Create Order (Assigned to Driver)
    const order = (await supabaseRequest('orders', 'POST', {
      restaurant_id: restaurantId,
      driver_id: driverId, // Assign to logged in driver
      total_amount: 50.00,
      delivery_address: 'Test Driver Address',
      status: 'pending' 
    }))[0];
    console.log('Order Created:', order.id);

    // 6. GET Deliveries
    console.log('Fetching Deliveries...');
    const getRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/driver/deliveries',
      method: 'GET',
      headers: { 'Cookie': allCookies }
    });
    
    console.log('GET Status:', getRes.statusCode);
    const deliveries = JSON.parse(getRes.body);
    console.log('Deliveries Found:', deliveries.length);
    
    const targetDelivery = deliveries.find(d => d.id === order.id); // ID matches order ID now
    if (!targetDelivery) throw new Error('Created delivery (order) not found in API response');
    console.log('Target Delivery Found:', targetDelivery.id);

    // 7. PATCH Delivery (Accept/Pickup)
    console.log('Updating Delivery Status...');
    // Valid statuses: 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'
    // Let's try 'out_for_delivery'
    const updateData = JSON.stringify({
      delivery_id: order.id,
      status: 'out_for_delivery'
    });

    const patchRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/driver/deliveries',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': updateData.length,
        'Cookie': allCookies,
        'X-CSRF-Token': csrfToken,
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/dashboard/driver'
      }
    }, updateData);

    console.log('PATCH Status:', patchRes.statusCode);
    console.log('PATCH Body:', patchRes.body);

    if (patchRes.statusCode !== 200) throw new Error('Update failed');
    
    const updatedDelivery = JSON.parse(patchRes.body);
    if (updatedDelivery.status !== 'out_for_delivery') throw new Error('Status not updated');
    console.log('Success! Delivery status updated to:', updatedDelivery.status);

  } catch (e) {
    console.error('TEST FAILED:', e);
  }
}

run();
