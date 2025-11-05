// Generate PWA assets script
const fs = require('fs');
const path = require('path');

// Create a simple base64 encoded 1x1 transparent PNG
const transparentPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Icon sizes needed
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

const iconsDir = path.join(__dirname, 'public', 'icons');
const soundsDir = path.join(__dirname, 'public', 'sounds');

// Ensure directories exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Generate placeholder icon PNGs
console.log('Generating placeholder icon files...');
iconSizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, transparentPNG);
  console.log(`✓ Created ${filename}`);
});

// Generate badge icon
const badgePath = path.join(iconsDir, 'badge-72x72.png');
fs.writeFileSync(badgePath, transparentPNG);
console.log('✓ Created badge-72x72.png');

// Create a simple notification sound file (silence)
// This is a minimal valid MP3 file (ID3v2 tag + 1 frame of silence)
const silentMP3 = Buffer.from([
  // ID3v2 header
  0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  // MP3 frame header (MPEG 1 Layer 3, 128kbps, 44.1kHz)
  0xFF, 0xFB, 0x90, 0x00,
  // Frame data (minimal silence)
  ...Array(416).fill(0x00)
]);

const soundPath = path.join(soundsDir, 'notification.mp3');
fs.writeFileSync(soundPath, silentMP3);
console.log('✓ Created notification.mp3 (silent placeholder)');

console.log('\n✅ PWA assets generated successfully!');
console.log('\n⚠️  Note: These are placeholder files.');
console.log('   Replace icon PNGs with your actual logo/branding.');
console.log('   Replace notification.mp3 with your actual notification sound.');
