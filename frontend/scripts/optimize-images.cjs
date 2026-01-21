const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// Configuration
const BUCKET_NAME = 'product-images';
const TABLE_NAME = 'products';
const COLUMN_NAME = 'image';

// Get credentials from arguments or environment
const SUPABASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Usage: node optimize-images.cjs <SUPABASE_URL> <SUPABASE_SERVICE_KEY>');
  console.error('Or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
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
  console.log('🚀 Starting image optimization migration...');

  // 1. Ensure bucket exists
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('❌ Error listing buckets:', bucketError.message);
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
  
  // Fetch all products first (batching would be better for huge datasets, but valid for <1000)
  const { data: products, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select(`id, name, ${COLUMN_NAME}`)
    .not(COLUMN_NAME, 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError.message);
    process.exit(1);
  }

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
    console.log(`\n🔄 Processing: ${originalName} (${product.id})...`);

    try {
      // Ensure we have a string to match against
      if (typeof product[COLUMN_NAME] !== 'string') {
          continue;
      }
      const base64Data = product[COLUMN_NAME];
      // Extract matches
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        console.warn(`   ⚠️ Invalid Base64 format. Skipping.`);
        failCount++;
        continue;
      }

      const buffer = Buffer.from(matches[2], 'base64');
      
      // Optimize with Sharp
      console.log('   🎨 Optimizing...');
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();

      const fileName = `product-${product.id}-${Date.now()}.jpg`;
      const filePath = `migrated/${fileName}`;

      // Upload
      console.log('   pV Uploading to Storage...');
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
      console.log('   💾 Updating database record...');
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({ [COLUMN_NAME]: publicUrl })
        .eq('id', product.id);

      if (updateError) {
        throw new Error(`DB Update failed: ${updateError.message}`);
      }

      console.log(`   ✅ Success! New URL: ${publicUrl}`);
      successCount++;

    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n=============================================');
  console.log(`🏁 Migration Completed`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('=============================================');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
