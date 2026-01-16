
const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\SITECH\\.gemini\\antigravity\\brain\\53249b05-65c3-4d30-9500-d1ff570af5c7\\greenland77_logo_clean_1768518127250.png';
const dest = path.join(__dirname, 'public', 'icons', 'logo.png');

console.log(`Copying from ${src} to ${dest}`);

try {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied logo.png');
} catch (err) {
  console.error('Error copying file:', err);
  process.exit(1);
}
