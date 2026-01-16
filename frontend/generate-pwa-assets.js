const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'public', 'icons', 'logo.png');
const iconsDir = path.join(__dirname, 'public', 'icons');

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  if (!fs.existsSync(logoPath)) {
    console.error('❌ Error: public/icons/logo.png not found.');
    console.error('👉 Please copy your logo file to: ' + logoPath);
    console.error('   You can run: node copy_logo.js');
    process.exit(1);
  }

  console.log('🎨 Generating PWA icons from logo.png...');

  try {
    // Generate standard icons
    for (const size of iconSizes) {
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`  ✓ Generated icon-${size}x${size}.png`);
    }

    // Generate badge icon (monochrome/small)
    await sharp(logoPath)
      .resize(72, 72)
      .toFile(path.join(iconsDir, 'badge-72x72.png'));
    console.log('  ✓ Generated badge-72x72.png');

    console.log('\n✅ PWA assets generated successfully!');
  } catch (err) {
    console.error('❌ Error generating icons:', err);
    process.exit(1);
  }
}

generateIcons();
