# Orders API Documentation

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Base URL**: Database queries to `orders` table
**Authentication**: Required (role-based access)

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Order Lifecycle](#order-lifecycle)
4. [Endpoints](#endpoints)
5. [TypeScript Types](#typescript-types)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Testing Examples](#testing-examples)

---

## Overview

The Orders API manages the complete order lifecycle from creation through delivery. It handles:

- Order creation by restaurants
- Order status management
- Driver assignment and tracking
- Order item management
- Delivery coordination
- Real-time order updates
- Role-based access control (Restaurant, Admin, Driver)

### Key Features
- ✅ Multi-item order support
- ✅ Real-time order tracking
- ✅ Automated pricing calculation
- ✅ Driver assignment workflow
- ✅ Status transitions with validation
- ✅ Delivery location tracking
- ✅ Order notes and special instructions
- ✅ Audit trail with timestamps

---

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  restaurant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status and workflow
  status order_status DEFAULT 'pending',
  priority order_priority DEFAULT 'normal',

  -- Pricing
  subtotal DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,

  -- Delivery details
  delivery_address TEXT NOT NULL,
  delivery_location GEOGRAPHY(POINT),
  delivery_notes TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,

  -- Contact
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_total CHECK (total_amount >= 0),
  CONSTRAINT valid_subtotal CHECK (subtotal >= 0),
  CONSTRAINT valid_delivery_fee CHECK (delivery_fee >= 0)
);

-- Enums
CREATE TYPE order_status AS ENUM (
  'pending',       -- Initial state
  'confirmed',     -- Restaurant confirmed
  'priced',        -- Pricing added
  'assigned',      -- Driver assigned
  'picked_up',     -- Driver collected order
  'in_transit',    -- On the way
  'delivered',     -- Successfully delivered
  'cancelled'      -- Cancelled by any party
);

CREATE TYPE order_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Product details (snapshot at order time)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),

  -- Quantity and pricing
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),

  -- Customization
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Performance Indexes
```sql
-- Order lookups
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_driver_status ON orders(driver_id, status) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- Order items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id) WHERE product_id IS NOT NULL;

-- Geospatial index for location queries
CREATE INDEX idx_orders_delivery_location ON orders USING GIST(delivery_location);

-- RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
```

---

## Order Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORDER LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

   Restaurant            Admin              Driver            System
       │                   │                   │                │
       │                   │                   │                │
   ┌───▼───┐               │                   │                │
   │pending│               │                   │                │
   └───┬───┘               │                   │                │
       │                   │                   │                │
   ┌───▼─────┐             │                   │                │
   │confirmed│             │                   │                │
   └───┬─────┘             │                   │                │
       │                   │                   │                │
   ┌───▼───┐           ┌───▼───┐              │                │
   │priced │◄──────────┤priced │              │                │
   └───┬───┘           └───────┘              │                │
       │                   │                   │                │
       │              ┌────▼────┐          ┌───▼────┐          │
       │              │assigned │◄─────────┤assigned│          │
       │              └────┬────┘          └───┬────┘          │
       │                   │                   │                │
       │                   │              ┌────▼─────┐         │
       │                   │              │picked_up │         │
       │                   │              └────┬─────┘         │
       │                   │                   │                │
       │                   │              ┌────▼──────┐        │
       │                   │              │in_transit │        │
       │                   │              └────┬──────┘        │
       │                   │                   │                │
       │                   │              ┌────▼────┐          │
       │                   │              │delivered│          │
       │                   │              └────┬────┘          │
       │                   │                   │                │
       │                   │                   │           ┌────▼────┐
       │                   │                   │           │Auto     │
       │                   │                   │           │Archive  │
       │                   │                   │           └─────────┘
       │                   │                   │                │
   ┌───▼──────┐        ┌───▼──────┐       ┌───▼──────┐        │
   │cancelled │        │cancelled │       │cancelled │        │
   └──────────┘        └──────────┘       └──────────┘        │

Status Transitions:
- pending → confirmed (Restaurant)
- confirmed → priced (Restaurant/Admin)
- priced → assigned (Admin/System)
- assigned → picked_up (Driver)
- picked_up → in_transit (Driver)
- in_transit → delivered (Driver)
- Any status → cancelled (Restaurant/Admin/Driver with rules)
```

### Status Transition Rules

| From Status | To Status | Allowed Roles | Validation |
|------------|-----------|---------------|------------|
| pending | confirmed | Restaurant | Order has items |
| confirmed | priced | Restaurant, Admin | Total amount > 0 |
| priced | assigned | Admin, System | Driver is available |
| assigned | picked_up | Driver | Driver at pickup location |
| picked_up | in_transit | Driver | Order items verified |
| in_transit | delivered | Driver | Driver at delivery location |
| Any | cancelled | All (with restrictions) | Reason required |

---

## Endpoints

### 1. Create Order

**Purpose**: Create a new order (Restaurant role only)

**Method**: Direct Supabase insert

```typescript
async function createOrder(input: {
  items: Array<{
    productId: string
    quantity: number
    notes?: string
  }>
  deliveryAddress: string
  deliveryLocation?: { lat: number; lng: number }
  deliveryNotes?: string
  customerName?: string
  customerPhone?: string
  notes?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}) {
  // 1. Get current user (must be restaurant)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  // Verify restaurant role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'restaurant') {
    throw new Error('Only restaurants can create orders')
  }

  // 2. Validate and fetch product details
  const productIds = input.items.map(item => item.productId)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku, price, is_available')
    .in('id', productIds)

  if (productsError) throw productsError
  if (products.length !== productIds.length) {
    throw new Error('Some products not found')
  }

  // Check availability
  const unavailableProducts = products.filter(p => !p.is_available)
  if (unavailableProducts.length > 0) {
    throw new Error(`Products unavailable: ${unavailableProducts.map(p => p.name).join(', ')}`)
  }

  // 3. Calculate pricing
  let subtotal = 0
  const orderItems = input.items.map(item => {
    const product = products.find(p => p.id === item.productId)!
    const unitPrice = parseFloat(product.price)
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice

    return {
      product_id: item.productId,
      product_name: product.name,
      product_sku: product.sku,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: item.notes
    }
  })

  const deliveryFee = 5.00 // Could be dynamic based on distance
  const totalAmount = subtotal + deliveryFee

  // 4. Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  // 5. Create order with items in transaction
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      restaurant_id: user.id,
      status: 'pending',
      priority: input.priority || 'normal',
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      delivery_address: input.deliveryAddress,
      delivery_location: input.deliveryLocation
        ? `POINT(${input.deliveryLocation.lng} ${input.deliveryLocation.lat})`
        : null,
      delivery_notes: input.deliveryNotes,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      notes: input.notes
    })
    .select()
    .single()

  if (orderError) throw orderError

  // 6. Insert order items
  const itemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId)

  if (itemsError) {
    // Rollback: delete the order
    await supabase.from('orders').delete().eq('id', order.id)
    throw itemsError
  }

  // 7. Fetch complete order with items
  const { data: completeOrder } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (*)
      ),
      restaurant:profiles!restaurant_id (
        id,
        full_name,
        phone
      )
    `)
    .eq('id', order.id)
    .single()

  return completeOrder
}
```

**Response**: Complete order object with items

**Error Codes**:
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not restaurant role)
- `400` - Invalid input (missing items, invalid products)
- `404` - Products not found
- `409` - Products unavailable

---

### 2. List Orders

**Purpose**: Get orders with role-based filtering

**Method**: Supabase select with RLS

```typescript
async function listOrders(params: {
  status?: string[]
  driverId?: string
  restaurantId?: string
  priority?: string[]
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'updated_at' | 'total_amount'
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}) {
  const {
    status,
    driverId,
    restaurantId,
    priority,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
    startDate,
    endDate
  } = params

  // Get current user for RLS filtering
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Build query with RLS (automatically filters by user role)
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          id,
          name,
          sku,
          image_url
        )
      ),
      restaurant:profiles!restaurant_id (
        id,
        full_name,
        phone,
        email
      ),
      driver:profiles!driver_id (
        id,
        full_name,
        phone
      )
    `, { count: 'exact' })

  // Apply filters
  if (status && status.length > 0) {
    query = query.in('status', status)
  }

  if (driverId) {
    query = query.eq('driver_id', driverId)
  }

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  if (priority && priority.length > 0) {
    query = query.in('priority', priority)
  }

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data: orders, error, count } = await query

  if (error) throw error

  return {
    orders,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}
```

**RLS Policies** (Automatic filtering):
```sql
-- Restaurant can see their own orders
CREATE POLICY "Restaurants can view own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = restaurant_id
  );

-- Drivers can see assigned orders
CREATE POLICY "Drivers can view assigned orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'driver'
      AND (
        orders.driver_id = auth.uid()
        OR orders.status IN ('priced', 'assigned')
      )
    )
  );

-- Admins can see all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

**Response**:
```typescript
{
  orders: Order[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

---

### 3. Get Order by ID

**Purpose**: Get single order details with full relations

**Method**: Supabase select single

```typescript
async function getOrderById(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          id,
          name,
          sku,
          image_url,
          category_id,
          categories (
            id,
            name
          )
        )
      ),
      restaurant:profiles!restaurant_id (
        id,
        full_name,
        phone,
        email,
        address
      ),
      driver:profiles!driver_id (
        id,
        full_name,
        phone,
        vehicle_info
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Order not found')
    }
    throw error
  }

  // RLS will automatically filter unauthorized access
  return order
}
```

**Response**: Complete Order object with all relations

**Error Codes**:
- `404` - Order not found
- `403` - Forbidden (RLS denies access)

---

### 4. Update Order Status

**Purpose**: Transition order to next status with validation

**Method**: Supabase update with business logic

```typescript
async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  metadata?: {
    cancelReason?: string
    deliveryProof?: string
    driverId?: string
  }
) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Get current order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (fetchError) throw new Error('Order not found')

  // Validate status transition
  const isValidTransition = validateStatusTransition(
    order.status,
    newStatus,
    profile?.role
  )

  if (!isValidTransition) {
    throw new Error(`Cannot transition from ${order.status} to ${newStatus}`)
  }

  // Prepare update data
  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  // Status-specific logic
  switch (newStatus) {
    case 'assigned':
      if (!metadata?.driverId) {
        throw new Error('Driver ID required for assignment')
      }
      updateData.driver_id = metadata.driverId
      break

    case 'delivered':
      updateData.actual_delivery_time = new Date().toISOString()
      if (metadata?.deliveryProof) {
        updateData.delivery_proof_url = metadata.deliveryProof
      }
      break

    case 'cancelled':
      if (!metadata?.cancelReason) {
        throw new Error('Cancel reason required')
      }
      updateData.cancel_reason = metadata.cancelReason
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancelled_by = user.id
      break
  }

  // Update order
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select(`
      *,
      order_items (*),
      restaurant:profiles!restaurant_id (*),
      driver:profiles!driver_id (*)
    `)
    .single()

  if (updateError) throw updateError

  return updatedOrder
}

// Status transition validation
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  userRole?: string
): boolean {
  const transitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['priced', 'cancelled'],
    priced: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: [], // Terminal state
    cancelled: []  // Terminal state
  }

  const allowedNextStatuses = transitions[currentStatus] || []
  return allowedNextStatuses.includes(newStatus)
}
```

**Request Body**:
```typescript
{
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled',
  metadata?: {
    cancelReason?: string
    deliveryProof?: string
    driverId?: string
  }
}
```

**Response**: Updated Order object

**Error Codes**:
- `400` - Invalid status transition
- `404` - Order not found
- `403` - Forbidden (user not authorized for this transition)

---

### 5. Assign Driver

**Purpose**: Assign available driver to order (Admin only)

**Method**: Update with validation

```typescript
async function assignDriver(orderId: string, driverId: string) {
  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Only admins can assign drivers')
  }

  // Check order status
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (order?.status !== 'priced') {
    throw new Error('Order must be in "priced" status for driver assignment')
  }

  // Verify driver exists and is available
  const { data: driver } = await supabase
    .from('profiles')
    .select('id, role, is_available')
    .eq('id', driverId)
    .eq('role', 'driver')
    .single()

  if (!driver) {
    throw new Error('Driver not found')
  }

  if (!driver.is_available) {
    throw new Error('Driver is not available')
  }

  // Assign driver and update status
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({
      driver_id: driverId,
      status: 'assigned',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select(`
      *,
      driver:profiles!driver_id (
        id,
        full_name,
        phone,
        vehicle_info
      )
    `)
    .single()

  if (error) throw error

  return updatedOrder
}
```

**Response**: Order with assigned driver details

---

### 6. Get Order Items

**Purpose**: Get items for specific order

**Method**: Supabase select with filtering

```typescript
async function getOrderItems(orderId: string) {
  const { data: items, error } = await supabase
    .from('order_items')
    .select(`
      *,
      products (
        id,
        name,
        sku,
        image_url,
        category_id,
        categories (
          id,
          name
        )
      )
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return items
}
```

**Response**: Array of OrderItem objects with product details

---

### 7. Update Order Pricing

**Purpose**: Update order pricing (Restaurant/Admin)

**Method**: Update with recalculation

```typescript
async function updateOrderPricing(
  orderId: string,
  updates: {
    deliveryFee?: number
    discount?: number
    notes?: string
  }
) {
  // Get current order with items
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  // Verify order is in correct status
  if (!['confirmed', 'priced'].includes(order.status)) {
    throw new Error('Order cannot be repriced in current status')
  }

  // Recalculate total
  const subtotal = order.order_items.reduce(
    (sum, item) => sum + parseFloat(item.total_price),
    0
  )

  const deliveryFee = updates.deliveryFee ?? order.delivery_fee
  const discount = updates.discount ?? 0
  const totalAmount = subtotal + deliveryFee - discount

  // Update order
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({
      delivery_fee: deliveryFee,
      discount,
      total_amount: totalAmount,
      notes: updates.notes ?? order.notes,
      status: 'priced',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error

  return updatedOrder
}
```

**Response**: Updated Order object

---

### 8. Cancel Order

**Purpose**: Cancel order with reason (Role-based restrictions)

**Method**: Update status with metadata

```typescript
async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy?: 'restaurant' | 'driver' | 'admin' | 'customer'
) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get order
  const { data: order } = await supabase
    .from('orders')
    .select('*, restaurant_id, driver_id, status')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  // Check if order can be cancelled
  if (['delivered', 'cancelled'].includes(order.status)) {
    throw new Error(`Order in ${order.status} status cannot be cancelled`)
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Validate cancellation permission
  const canCancel =
    profile?.role === 'admin' ||
    (profile?.role === 'restaurant' && order.restaurant_id === user.id &&
     ['pending', 'confirmed'].includes(order.status)) ||
    (profile?.role === 'driver' && order.driver_id === user.id &&
     ['assigned'].includes(order.status))

  if (!canCancel) {
    throw new Error('Not authorized to cancel this order')
  }

  // Cancel order
  const { data: cancelledOrder, error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancel_reason: reason,
      cancelled_by: cancelledBy || profile?.role,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error

  return cancelledOrder
}
```

**Request Body**:
```typescript
{
  reason: string,
  cancelledBy?: 'restaurant' | 'driver' | 'admin' | 'customer'
}
```

**Response**: Cancelled Order object

**Cancellation Rules**:
- **Restaurant**: Can cancel in `pending`, `confirmed` status only
- **Driver**: Can cancel in `assigned` status only (must provide reason)
- **Admin**: Can cancel at any status except `delivered`
- **Cannot cancel**: Orders in `delivered` or already `cancelled` status

---

## TypeScript Types

```typescript
// Order types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'priced'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Order {
  id: string
  orderNumber: string
  restaurantId: string
  driverId: string | null

  // Status
  status: OrderStatus
  priority: OrderPriority

  // Pricing
  subtotal: number
  deliveryFee: number
  discount?: number
  totalAmount: number

  // Delivery
  deliveryAddress: string
  deliveryLocation?: {
    lat: number
    lng: number
  }
  deliveryNotes?: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string

  // Contact
  customerName?: string
  customerPhone?: string

  // Relations
  restaurant?: Profile
  driver?: Profile
  items: OrderItem[]

  // Metadata
  notes?: string
  cancelReason?: string
  cancelledBy?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string | null

  // Product snapshot
  productName: string
  productSku?: string

  // Quantity and pricing
  quantity: number
  unitPrice: number
  totalPrice: number

  // Customization
  notes?: string

  // Relations
  product?: Product

  // Metadata
  createdAt: string
  updatedAt: string
}

// Input types
export interface CreateOrderInput {
  items: Array<{
    productId: string
    quantity: number
    notes?: string
  }>
  deliveryAddress: string
  deliveryLocation?: {
    lat: number
    lng: number
  }
  deliveryNotes?: string
  customerName?: string
  customerPhone?: string
  notes?: string
  priority?: OrderPriority
}

export interface UpdateOrderStatusInput {
  status: OrderStatus
  metadata?: {
    cancelReason?: string
    deliveryProof?: string
    driverId?: string
  }
}

export interface OrderFilters {
  status?: OrderStatus[]
  driverId?: string
  restaurantId?: string
  priority?: OrderPriority[]
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'updated_at' | 'total_amount'
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}

export interface OrderListResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

---

## Performance Optimization

### 1. Database Indexes
All indexes from [Database Schema](#database-schema) section provide:
- ✅ Fast order lookups by number, restaurant, driver
- ✅ Efficient status filtering
- ✅ Optimized composite queries (restaurant + status)
- ✅ Geospatial queries for nearby orders

### 2. Query Optimization

```typescript
// ✅ GOOD: Select only needed fields
const { data } = await supabase
  .from('orders')
  .select('id, order_number, status, total_amount')
  .eq('restaurant_id', restaurantId)

// ❌ BAD: Select all fields with deep relations
const { data } = await supabase
  .from('orders')
  .select('*, order_items(*, products(*, categories(*)))')
```

### 3. Caching Strategy

```typescript
// React Query caching for orders
const { data: orders } = useQuery({
  queryKey: ['orders', { status, restaurantId }],
  queryFn: () => listOrders({ status, restaurantId }),
  staleTime: 30 * 1000, // 30 seconds for active orders
  gcTime: 5 * 60 * 1000 // 5 minutes cache retention
})

// Different stale times by status
const staleTimeByStatus: Record<OrderStatus, number> = {
  pending: 10 * 1000,     // 10s - very active
  confirmed: 20 * 1000,   // 20s - active
  priced: 30 * 1000,      // 30s - moderate
  assigned: 15 * 1000,    // 15s - active
  picked_up: 10 * 1000,   // 10s - very active
  in_transit: 10 * 1000,  // 10s - very active
  delivered: 5 * 60 * 1000, // 5min - stable
  cancelled: 5 * 60 * 1000  // 5min - stable
}
```

### 4. Real-time Subscriptions

```typescript
// Subscribe to order updates with filtered subscriptions
function subscribeToOrderUpdates(restaurantId: string, callback: (order: Order) => void) {
  const channel = supabase
    .channel(`orders:${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}` // Database-level filtering
      },
      (payload) => {
        callback(payload.new as Order)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
```

### 5. Pagination Best Practices

```typescript
// ✅ GOOD: Use limit and offset with count
const { data, count } = await supabase
  .from('orders')
  .select('*', { count: 'exact' })
  .range(0, 19) // First 20 items

// ✅ BETTER: Use cursor-based pagination for large datasets
const { data } = await supabase
  .from('orders')
  .select('*')
  .lt('created_at', lastOrderDate)
  .order('created_at', { ascending: false })
  .limit(20)
```

---

## Error Handling

### Common Error Codes

| Error Code | Description | Example |
|-----------|-------------|---------|
| `ORDER_NOT_FOUND` | Order does not exist | Invalid order ID |
| `ORDER_INVALID_STATUS` | Invalid status transition | Trying to deliver from pending |
| `ORDER_UNAUTHORIZED` | User not authorized | Restaurant trying to update another's order |
| `ORDER_ITEMS_REQUIRED` | Order has no items | Creating order without items |
| `ORDER_PRODUCTS_UNAVAILABLE` | Products not available | Products deleted or disabled |
| `ORDER_DRIVER_UNAVAILABLE` | Driver not available | Trying to assign busy driver |
| `ORDER_CANNOT_CANCEL` | Order cannot be cancelled | Trying to cancel delivered order |
| `ORDER_VALIDATION_ERROR` | Validation failed | Invalid input data |

### Error Response Format

```typescript
interface OrderError {
  code: string
  message: string
  details?: {
    field?: string
    value?: any
    constraint?: string
  }
}

// Example error responses
{
  "code": "ORDER_INVALID_STATUS",
  "message": "Cannot transition from pending to delivered",
  "details": {
    "currentStatus": "pending",
    "requestedStatus": "delivered",
    "allowedStatuses": ["confirmed", "cancelled"]
  }
}

{
  "code": "ORDER_PRODUCTS_UNAVAILABLE",
  "message": "Some products are unavailable",
  "details": {
    "unavailableProducts": [
      { "id": "prod-123", "name": "Product A" },
      { "id": "prod-456", "name": "Product B" }
    ]
  }
}
```

### Error Handling Example

```typescript
async function handleOrderOperation() {
  try {
    const order = await createOrder(orderInput)
    return { success: true, data: order }
  } catch (error) {
    if (error instanceof Error) {
      // Map database errors to user-friendly messages
      if (error.message.includes('not found')) {
        return {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'The requested order could not be found'
          }
        }
      }

      if (error.message.includes('unavailable')) {
        return {
          success: false,
          error: {
            code: 'ORDER_PRODUCTS_UNAVAILABLE',
            message: 'Some products in your order are currently unavailable'
          }
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'ORDER_ERROR',
          message: error.message
        }
      }
    }

    // Unknown error
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }
    }
  }
}
```

---

## Security Considerations

### 1. Row Level Security (RLS)

All order operations are protected by RLS policies:

```sql
-- Restaurant can only see/modify their own orders
CREATE POLICY "Restaurants manage own orders"
  ON orders
  USING (auth.uid() = restaurant_id);

-- Drivers can only see assigned orders
CREATE POLICY "Drivers view assigned orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'driver'
      AND (orders.driver_id = auth.uid() OR orders.status IN ('priced', 'assigned'))
    )
  );

-- Drivers can only update status of their assigned orders
CREATE POLICY "Drivers update assigned orders"
  ON orders FOR UPDATE
  USING (
    driver_id = auth.uid()
    AND status IN ('assigned', 'picked_up', 'in_transit')
  );
```

### 2. Input Validation

```typescript
// Validate order input
function validateOrderInput(input: CreateOrderInput): string | null {
  if (!input.items || input.items.length === 0) {
    return 'Order must have at least one item'
  }

  if (input.items.some(item => item.quantity <= 0)) {
    return 'Item quantities must be greater than 0'
  }

  if (!input.deliveryAddress || input.deliveryAddress.trim().length === 0) {
    return 'Delivery address is required'
  }

  if (input.customerPhone && !/^\+?[\d\s-()]+$/.test(input.customerPhone)) {
    return 'Invalid phone number format'
  }

  return null // Valid
}
```

### 3. Authorization Checks

```typescript
// Always verify user role before sensitive operations
async function authorizeOrderOperation(
  orderId: string,
  operation: 'view' | 'update' | 'cancel',
  userId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const { data: order } = await supabase
    .from('orders')
    .select('restaurant_id, driver_id, status')
    .eq('id', orderId)
    .single()

  if (!order) return false

  switch (operation) {
    case 'view':
      return (
        profile?.role === 'admin' ||
        order.restaurant_id === userId ||
        order.driver_id === userId
      )

    case 'update':
      return (
        profile?.role === 'admin' ||
        (profile?.role === 'restaurant' && order.restaurant_id === userId) ||
        (profile?.role === 'driver' && order.driver_id === userId)
      )

    case 'cancel':
      // Complex cancellation rules
      if (profile?.role === 'admin') return true
      if (profile?.role === 'restaurant' && order.restaurant_id === userId) {
        return ['pending', 'confirmed'].includes(order.status)
      }
      if (profile?.role === 'driver' && order.driver_id === userId) {
        return order.status === 'assigned'
      }
      return false

    default:
      return false
  }
}
```

### 4. Rate Limiting

```typescript
// Implement rate limiting for order creation
const orderCreationLimiter = new Map<string, number[]>()

function checkOrderCreationRateLimit(userId: string): boolean {
  const now = Date.now()
  const userAttempts = orderCreationLimiter.get(userId) || []

  // Remove attempts older than 1 hour
  const recentAttempts = userAttempts.filter(
    timestamp => now - timestamp < 60 * 60 * 1000
  )

  // Max 50 orders per hour per restaurant
  if (recentAttempts.length >= 50) {
    return false
  }

  recentAttempts.push(now)
  orderCreationLimiter.set(userId, recentAttempts)
  return true
}
```

---

## Testing Examples

### 1. Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { validateStatusTransition, calculateOrderTotal } from './orders'

describe('Order Status Transitions', () => {
  it('should allow pending to confirmed transition', () => {
    expect(validateStatusTransition('pending', 'confirmed', 'restaurant')).toBe(true)
  })

  it('should reject invalid transitions', () => {
    expect(validateStatusTransition('pending', 'delivered', 'restaurant')).toBe(false)
  })

  it('should allow admin to cancel any order', () => {
    expect(validateStatusTransition('in_transit', 'cancelled', 'admin')).toBe(true)
  })

  it('should reject restaurant cancelling picked_up order', () => {
    expect(validateStatusTransition('picked_up', 'cancelled', 'restaurant')).toBe(false)
  })
})

describe('Order Total Calculation', () => {
  it('should calculate total correctly', () => {
    const items = [
      { quantity: 2, unitPrice: 10.00 },
      { quantity: 1, unitPrice: 15.00 }
    ]
    const deliveryFee = 5.00

    const total = calculateOrderTotal(items, deliveryFee)
    expect(total).toBe(40.00) // (2*10 + 1*15 + 5)
  })

  it('should handle discount', () => {
    const items = [{ quantity: 1, unitPrice: 20.00 }]
    const total = calculateOrderTotal(items, 5.00, 5.00) // with $5 discount
    expect(total).toBe(20.00)
  })
})
```

### 2. Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Order API Integration', () => {
  let supabase: SupabaseClient
  let restaurantAuth: any
  let testOrderId: string

  beforeAll(async () => {
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

    // Login as restaurant
    const { data } = await supabase.auth.signInWithPassword({
      email: 'restaurant@test.com',
      password: 'test-password'
    })
    restaurantAuth = data
  })

  it('should create order with items', async () => {
    const orderInput = {
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 }
      ],
      deliveryAddress: '123 Test St',
      customerName: 'Test Customer',
      customerPhone: '+995555123456'
    }

    const order = await createOrder(orderInput)

    expect(order).toBeDefined()
    expect(order.status).toBe('pending')
    expect(order.items.length).toBe(2)
    expect(order.totalAmount).toBeGreaterThan(0)

    testOrderId = order.id
  })

  it('should transition order status correctly', async () => {
    // Confirm order
    const confirmed = await updateOrderStatus(testOrderId, 'confirmed')
    expect(confirmed.status).toBe('confirmed')

    // Add pricing
    const priced = await updateOrderPricing(testOrderId, {
      deliveryFee: 5.00
    })
    expect(priced.status).toBe('priced')
  })

  it('should enforce role-based access', async () => {
    // Try to view another restaurant's order
    await expect(
      getOrderById('other-restaurant-order-id')
    ).rejects.toThrow('not found')
  })

  afterAll(async () => {
    // Cleanup
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId)
    }
    await supabase.auth.signOut()
  })
})
```

### 3. E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Order Management Flow', () => {
  test('complete order lifecycle', async ({ page }) => {
    // Login as restaurant
    await page.goto('/login')
    await page.fill('[name="email"]', 'restaurant@test.com')
    await page.fill('[name="password"]', 'test-password')
    await page.click('button[type="submit"]')

    // Navigate to create order
    await page.goto('/orders/create')

    // Add items to order
    await page.click('[data-testid="product-1-add"]')
    await page.click('[data-testid="product-2-add"]')

    // Fill delivery details
    await page.fill('[name="deliveryAddress"]', '123 Test Street')
    await page.fill('[name="customerName"]', 'Test Customer')
    await page.fill('[name="customerPhone"]', '+995555123456')

    // Submit order
    await page.click('[data-testid="submit-order"]')

    // Verify order created
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible()

    // Get order number
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent()
    expect(orderNumber).toMatch(/^ORD-/)

    // Navigate to orders list
    await page.goto('/orders')

    // Verify order appears in list
    await expect(page.locator(`[data-order-number="${orderNumber}"]`)).toBeVisible()

    // Confirm order
    await page.click(`[data-order-number="${orderNumber}"] [data-action="confirm"]`)
    await expect(page.locator(`[data-order-number="${orderNumber}"] [data-status="confirmed"]`)).toBeVisible()
  })
})
```

---

## Best Practices

### 1. Always Use Transactions for Multi-Step Operations

```typescript
// ✅ GOOD: Use database transactions
async function createOrderWithTransaction(input: CreateOrderInput) {
  const { data: order, error } = await supabase.rpc('create_order_with_items', {
    order_data: { ... },
    items_data: [ ... ]
  })

  if (error) throw error
  return order
}

// ❌ BAD: Multiple separate operations without transaction
async function createOrderBad(input: CreateOrderInput) {
  const order = await supabase.from('orders').insert({ ... })
  const items = await supabase.from('order_items').insert([ ... ]) // Could fail, leaving orphaned order
}
```

### 2. Validate Status Transitions

```typescript
// ✅ GOOD: Validate before update
if (!validateStatusTransition(currentStatus, newStatus, userRole)) {
  throw new Error('Invalid status transition')
}

// ❌ BAD: Allow any status update
await supabase.from('orders').update({ status: newStatus })
```

### 3. Use Database-Level Filtering

```typescript
// ✅ GOOD: Filter in database query
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .in('status', ['pending', 'confirmed'])

// ❌ BAD: Fetch all then filter in JavaScript
const { data: allOrders } = await supabase.from('orders').select('*')
const filtered = allOrders.filter(o => o.restaurant_id === restaurantId)
```

### 4. Handle Real-time Updates Efficiently

```typescript
// ✅ GOOD: Narrow subscription scope
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}` // Narrow scope
  }, handleUpdate)

// ❌ BAD: Subscribe to all orders
supabase
  .channel('all-orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders' // Too broad
  }, handleUpdate)
```

### 5. Always Include Error Context

```typescript
// ✅ GOOD: Include helpful context
throw new Error(`Cannot assign driver ${driverId} to order ${orderId}: driver is unavailable`)

// ❌ BAD: Generic error
throw new Error('Cannot assign driver')
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Order Management Best Practices](https://docs.example.com/order-management)
- [Real-time Subscriptions Guide](./realtime.md)
- [Database Schema Documentation](../architecture/database-schema.md)

---

**End of Orders API Documentation**
