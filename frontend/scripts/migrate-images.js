
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const sharp = require('sharp');

// Environment variables should be provided by the container/runtime
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer Service Role Key for admin tasks, fallback to Anon Key (might fail RLS)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function migrateImages() {
  console.log('Starting image migration check...');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Missing Supabase credentials. Skipping migration.');
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 1. Check Product Images Bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
        console.error('Error listing buckets:', bucketError.message);
        // Don't exit, might be just listing permission, try to proceed
    } else {
        const bucketExists = buckets.find(b => b.name === 'product-images');
        if (!bucketExists) {
            console.log('Creating product-images bucket...');
            const { error: createError } = await supabase.storage.createBucket('product-images', {
                public: true,
                fileSizeLimit: 10485760,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });
            if (createError) console.error('Failed to create bucket:', createError.message);
        }
    }

    // 2. Fetch products with base64 images
    // Note: We look for 'data:image' prefix
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image')
      // .like('image', 'data:image%') // 'like' operator might be case sensitive or vary
      .not('image', 'is', null);

    if (fetchError) {
      console.error('Error fetching products:', fetchError.message);
      return;
    }

    const productsToMigrate = products.filter(p => p.image && p.image.startsWith('data:image'));

    console.log(`Found ${productsToMigrate.length} images to migrate.`);

    if (productsToMigrate.length === 0) {
        console.log('No images to migrate.');
        return;
    }

    let successCount = 0;

    for (const product of productsToMigrate) {
      try {
        // Decode Base64
        const matches = product.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) continue;

        const type = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Resize and compress using sharp
        const resizedBuffer = await sharp(buffer)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();
            
        const ext = 'jpg'; // We convert to jpeg
        const fileName = `product-${product.id}-${Date.now()}.${ext}`;
        const filePath = `products/${fileName}`;

        // Upload
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, resizedBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
            console.error(`Failed to upload ${product.name}: ${uploadError.message}`);
            continue;
        }

        // Get URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        // Update DB
        const { error: updateError } = await supabase
          .from('products')
          .update({ image: publicUrl })
          .eq('id', product.id);

        if (updateError) {
            console.error(`Failed to update DB for ${product.name}: ${updateError.message}`);
        } else {
            console.log(`Migrated and resized: ${product.name}`);
            successCount++;
        }

      } catch (err) {
        console.error(`Error processing ${product.id}:`, err.message);
      }
    }

    console.log(`Migration completed. Successfully migrated ${successCount}/${productsToMigrate.length} images.`);

  } catch (error) {
    console.error('Migration script error:', error);
  }
}

// Execute
migrateImages().then(() => {
    console.log('Migration script finished.');
    process.exit(0);
}).catch(err => {
    console.error('Migration script failed:', err);
    process.exit(0); // Exit 0 to not break the deployment
});
