const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderFlow() {
  console.log('--- Starting Order Flow Test ---');

  // 1. Login
  console.log('Logging in...');
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test-restaurant-browser@example.com',
    password: 'Password123!',
  });

  if (loginError) {
    console.error('Login failed:', loginError.message);
    process.exit(1);
  }
  console.log('Login successful. User ID:', session.user.id);

  // 2. Get a product
  console.log('Fetching a product...');
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (productError) {
    console.error('Fetch products failed:', productError.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.error('No products found. Cannot create order.');
    process.exit(1);
  }

  const product = products[0];
  console.log('Found product:', product.name, 'ID:', product.id);

  // 3. Create Order
  console.log('Creating order...');
  const orderData = {
    restaurant_id: session.user.id,
    total_amount: product.price * 2, // 2 items
    delivery_address: 'Test Script Address 123',
    status: 'pending',
    // delivery_notes: 'Created via test script', // Commented out to test if column exists
  };

  // Update profile to restaurant
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'restaurant' })
    .eq('id', session.user.id);

  if (updateError) {
    console.error('Update profile failed:', updateError.message);
  } else {
    console.log('Profile role updated to restaurant');
  }

  // Check profile again
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('Fetch profile failed:', profileError.message);
  } else {
    console.log('User Profile:', profile);
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('Create order failed:', orderError.message);
    process.exit(1);
  }
  console.log('Order created successfully. ID:', order.id);

  // Verify visibility
  const { data: fetchedOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order.id)
    .single();

  if (fetchError) {
    console.error('Verify order visibility failed:', fetchError.message);
  } else {
    console.log('Order is visible to user.');
    console.log('Order Restaurant ID:', fetchedOrder.restaurant_id);
    console.log('Session User ID:    ', session.user.id);
    console.log('IDs Match:', fetchedOrder.restaurant_id === session.user.id);
  }

  // 4. Create Order Items
  console.log('Adding order items...');
  const orderItemData = {
    order_id: order.id,
    product_id: product.id,
    quantity: 2,
    unit_price: product.price,
    total_price: product.price * 2,
  };

  const { error: itemError } = await supabase
    .from('order_items')
    .insert(orderItemData);

  if (itemError) {
    console.error('Create order item failed:', itemError.message);
    process.exit(1);
  }
  console.log('Order items added successfully.');

  console.log('--- Order Flow Test PASSED ---');
}

testOrderFlow();
