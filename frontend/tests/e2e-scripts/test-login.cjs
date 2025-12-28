const http = require('http');

const data = JSON.stringify({
  email: 'admin@example.com',
  password: 'AdminPass123!'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/test-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`StatusCode: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
