const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configuration
const BUCKET_NAME = 'product-images';
const TABLE_NAME = 'products';
const COLUMN_NAME = 'image';

// Get credentials from arguments, env vars, or .env file (if using dotenv)
// In Dockploy/Production, these should be ENV vars.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.argv[2];
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[3]; // MUST be Service Role Key for Admin access

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing credentials.');
  console.error('Usage: node optimize-images.cjs <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>');
  console.error('Or set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY
    }
  }
});

async function main() {
  console.log('🚀 Starting image optimization migration (GDS)...');

  // 1. Ensure bucket exists
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('❌ Error listing buckets:', bucketError.message);
    // If it's a connection error, fail hard. If it's permission, we might can't create either.
    process.exit(1);
  }

  const bucket = buckets.find(b => b.name === BUCKET_NAME);
  if (!bucket) {
    console.log(`📦 Creating bucket: ${BUCKET_NAME}`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });
    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message);
      process.exit(1);
    }
  } else {
    console.log(`✅ Bucket '${BUCKET_NAME}' already exists.`);
  }

  // 2. Fetch products needing migration
  console.log('🔍 Scanning database for Base64 images...');
  
  // Checking for strings starting with 'data:image'
  const { data: products, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select(`id, name, ${COLUMN_NAME}`);

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError.message);
    process.exit(1);
  }

  // Filter locally since 'ILIBE' with 'data:%' might be tricky depending on DB collation/types (if JSONB vs Text)
  const productsToMigrate = products.filter(p => {
    const img = p[COLUMN_NAME];
    return img && typeof img === 'string' && img.startsWith('data:image');
  });

  console.log(`📊 Found ${productsToMigrate.length} images to migrate/optimize.`);

  if (productsToMigrate.length === 0) {
    console.log('🎉 No images need migration!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const product of productsToMigrate) {
    const originalName = product.name || 'product';
    // Simplified log
    console.log(`Processing: ${product.id}`);

    try {
      const base64Data = product[COLUMN_NAME];
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        console.warn(`   ⚠️ Invalid Base64 format. Skipping.`);
        failCount++;
        continue;
      }

      const buffer = Buffer.from(matches[2], 'base64');
      
      // Optimize with Sharp
      // console.log('   🎨 Optimizing...'); // Quiet log
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer();

      const fileName = `product-${product.id}-${Date.now()}.jpg`;
      const filePath = `migrated/${fileName}`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, optimizedBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // Update Database
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({ [COLUMN_NAME]: publicUrl })
        .eq('id', product.id);

      if (updateError) {
        throw new Error(`DB Update failed: ${updateError.message}`);
      }

      console.log(`   ✅ Migrated: ${product.id}`);
      successCount++;

    } catch (err) {
      console.error(`   ❌ Failed (${product.id}): ${err.message}`);
      failCount++;
    }
  }

  console.log(`Migration result: ${successCount} success, ${failCount} failed.`);
}

main().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
