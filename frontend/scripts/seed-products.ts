
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for seeding

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars (URL or SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
  {
    name: 'Fresh Apples',
    name_georgian: 'ვაშლი',
    description: 'Crisp and sweet local apples',
    price: 2.50,
    category: 'Fruits',
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=80',
    unit: 'kg',
    available: true,
    is_active: true
  },
  {
    name: 'Whole Milk',
    name_georgian: 'რძე',
    description: 'Fresh whole milk from local farms',
    price: 3.20,
    category: 'Dairy',
    image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
    unit: 'liter',
    available: true,
    is_active: true
  },
  {
    name: 'Sourdough Bread',
    name_georgian: 'პური',
    description: 'Artisanal sourdough bread',
    price: 4.50,
    category: 'Bakery',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    unit: 'piece',
    available: true,
    is_active: true
  },
  {
    name: 'Tomatoes',
    name_georgian: 'პომიდორი',
    description: 'Ripe red tomatoes',
    price: 1.80,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80',
    unit: 'kg',
    available: true,
    is_active: true
  }
];

async function seedProducts() {
  console.log('Seeding products...');

  for (const product of products) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('name', product.name)
      .single();

    if (existing) {
      console.log(`Product "${product.name}" already exists. Skipping.`);
    } else {
      const { error } = await supabase.from('products').insert(product);
      if (error) {
        console.error(`Error creating "${product.name}":`, error.message);
      } else {
        console.log(`Created product "${product.name}"`);
      }
    }
  }

  console.log('Product seeding completed.');
}

seedProducts();
