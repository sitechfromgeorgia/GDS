const http = require('http');

// Helper to make HTTP requests
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

async function run() {
  try {
    // 1. Get CSRF Token
    console.log('Fetching CSRF Token...');
    const csrfRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/csrf',
      method: 'GET'
    });
    
    if (csrfRes.statusCode !== 200) throw new Error(`CSRF fetch failed: ${csrfRes.body}`);
    
    const csrfBody = JSON.parse(csrfRes.body);
    const csrfToken = csrfBody.csrfToken;
    const csrfCookie = csrfRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');
    
    console.log('CSRF Token:', csrfToken);
    console.log('CSRF Cookie:', csrfCookie);

    // 2. Login
    console.log('Logging in...');
    const loginData = JSON.stringify({
      email: 'driver-new@test.com',
      password: 'Password123!'
    });
    
    const loginRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/test-login',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': loginData.length,
        'Cookie': csrfCookie // Pass CSRF cookie just in case
      }
    }, loginData);
    
    if (loginRes.statusCode !== 200) throw new Error(`Login failed: ${loginRes.body}`);
    
    // Extract session cookie and merge with CSRF cookie
    const sessionCookies = loginRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');
    const allCookies = `${csrfCookie}; ${sessionCookies}`;
    
    console.log('Login successful. Cookies:', allCookies.substring(0, 50) + '...');

    // 3. Create Order
    console.log('Creating order...');
    const randomProductId = '00000000-0000-0000-0000-000000000000'; 
    const orderData = JSON.stringify({
      items: [
        { product: { id: randomProductId, price: 10 }, quantity: 1 }
      ],
      delivery_address: '123 Test St',
      delivery_notes: 'Test Order via Script'
    });
    
    const orderRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': orderData.length,
        'Cookie': allCookies,
        'X-CSRF-Token': csrfToken,
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/dashboard/restaurant/order'
      }
    }, orderData);
    
    console.log(`Order Response: ${orderRes.statusCode}`);
    console.log(`Body: ${orderRes.body}`);
    
    if (orderRes.statusCode === 200) {
      console.log('Order created successfully!');
    } else if (orderRes.body.includes('foreign key constraint')) {
      console.log('Order creation attempted (Auth/RLS/CSRF passed) but failed on Product ID (Expected).');
    } else {
      console.log('Order creation failed.');
    }
    
  } catch (e) {
    console.error(e);
  }
}

run();
