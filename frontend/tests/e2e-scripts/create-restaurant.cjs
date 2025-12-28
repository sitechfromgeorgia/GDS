const http = require('http');

const data = JSON.stringify({
  email: 'driver-new@test.com',
  password: 'Password123!',
  role: 'driver',
  full_name: 'New Test Driver'
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
