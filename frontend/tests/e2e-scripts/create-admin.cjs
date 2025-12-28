const http = require('http');

const data = JSON.stringify({
  email: 'admin2@example.com',
  password: 'AdminPass123!',
  role: 'admin',
  full_name: 'System Admin'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/create-test-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`StatusCode: ${res.statusCode}`);
  
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
