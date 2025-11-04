# Order Workflow

> **შეკვეთის პროცესი** | Complete order lifecycle from creation to delivery

---

## 📊 Order Lifecycle Overview

```
1. PENDING → 2. CONFIRMED → 3. IN_TRANSIT → 4. DELIVERED
     ↓                                              ↑
5. CANCELLED ←──────────────────────────────────────┘
```

---

## 1️⃣ Order Creation (PENDING)

### Restaurant Side
```typescript
// 1. Restaurant browses catalog
GET /api/products
// Returns available products

// 2. Restaurant adds items to cart (client-side state)
const cart = [
  { product_id: 'uuid-1', quantity: 5 },
  { product_id: 'uuid-2', quantity: 3 },
]

// 3. Restaurant submits order
POST /api/orders/submit
{
  restaurant_id: 'uuid-restaurant',
  items: cart,
  notes: 'Please deliver before 10 AM'
}

// 4. Order created with status 'pending'
// No pricing yet - admin will set prices
```

### Database Changes
```sql
-- Insert order
INSERT INTO orders (id, restaurant_id, status, notes)
VALUES ('order-uuid', 'rest-uuid', 'pending', 'Notes');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
VALUES
  ('order-uuid', 'product-1', 5, NULL, NULL),  -- Prices NULL initially
  ('order-uuid', 'product-2', 3, NULL, NULL);

-- Create notification for admin
INSERT INTO notifications (user_id, type, title, message)
VALUES ('admin-uuid', 'new_order', 'New Order', 'Restaurant X placed order');
```

### Real-time Broadcast
```typescript
// Supabase broadcasts to subscribed clients
channel.send({
  type: 'broadcast',
  event: 'order_created',
  payload: { order_id: 'order-uuid', status: 'pending' }
})
```

---

## 2️⃣ Admin Pricing & Confirmation (CONFIRMED)

### Admin Side
```typescript
// 1. Admin receives notification
// 2. Admin reviews order details
GET /api/orders/order-uuid

// 3. Admin sets pricing for each item
PATCH /api/orders/order-uuid/pricing
{
  items: [
    { order_item_id: 'item-1', unit_price: 12.50 },
    { order_item_id: 'item-2', unit_price: 8.00 },
  ],
  total_amount: 86.50,
  profit_margin: 15.5  // 15.5% profit
}

// 4. Admin assigns driver
PATCH /api/orders/order-uuid/assign-driver
{
  driver_id: 'driver-uuid'
}

// 5. Admin confirms order
PATCH /api/orders/order-uuid
{
  status: 'confirmed'
}
```

### Database Changes
```sql
-- Update order with pricing
UPDATE orders
SET
  total_amount = 86.50,
  status = 'confirmed',
  confirmed_at = NOW(),
  driver_id = 'driver-uuid'
WHERE id = 'order-uuid';

-- Update order items with prices
UPDATE order_items
SET
  unit_price = 12.50,
  total_price = 12.50 * quantity
WHERE id = 'item-1';

-- Notify restaurant
INSERT INTO notifications (user_id, type, title, message)
VALUES ('rest-uuid', 'order_confirmed', 'Order Confirmed', 'Your order has been confirmed');

-- Notify driver
INSERT INTO notifications (user_id, type, title, message)
VALUES ('driver-uuid', 'delivery_assigned', 'New Delivery', 'You have been assigned a delivery');
```

---

## 3️⃣ Driver Pickup & Transit (IN_TRANSIT)

### Driver Side
```typescript
// 1. Driver sees assigned delivery
GET /api/orders?driver_id=driver-uuid&status=confirmed

// 2. Driver picks up order
PATCH /api/orders/order-uuid
{
  status: 'in_transit',
  picked_up_at: '2025-11-03T12:00:00Z'
}

// 3. Real-time location updates (planned)
POST /api/orders/order-uuid/location
{
  lat: 41.7151,
  lng: 44.8271,
  timestamp: '2025-11-03T12:15:00Z'
}
```

### Database Changes
```sql
-- Update order status
UPDATE orders
SET
  status = 'in_transit',
  picked_up_at = NOW()
WHERE id = 'order-uuid';

-- Notify restaurant
INSERT INTO notifications (user_id, type, title, message)
VALUES ('rest-uuid', 'order_in_transit', 'Order In Transit', 'Your order is on the way');
```

---

## 4️⃣ Delivery Completion (DELIVERED)

### Driver Side
```typescript
// 1. Driver arrives at restaurant
PATCH /api/orders/order-uuid
{
  status: 'delivered',
  delivered_at: '2025-11-03T12:30:00Z',
  delivery_notes: 'Delivered successfully'
}

// 2. Optional: Get delivery confirmation
POST /api/orders/order-uuid/confirm-delivery
{
  signature: 'base64-signature-data',
  photo: 'base64-photo-data'
}
```

### Database Changes
```sql
-- Update order status
UPDATE orders
SET
  status = 'delivered',
  delivered_at = NOW()
WHERE id = 'order-uuid';

-- Calculate driver performance metrics
UPDATE profiles
SET
  deliveries_completed = deliveries_completed + 1,
  on_time_rate = calculate_on_time_rate()
WHERE id = 'driver-uuid';

-- Notify restaurant
INSERT INTO notifications (user_id, type, title, message)
VALUES ('rest-uuid', 'order_delivered', 'Order Delivered', 'Your order has been delivered');

-- Archive order (move to history)
```

---

## 5️⃣ Order Cancellation (CANCELLED)

### Cancellation Rules
- **Restaurant can cancel:** Only if status = 'pending' (before admin confirmation)
- **Admin can cancel:** At any time with reason
- **Driver cannot cancel:** Must contact admin

### Cancellation Process
```typescript
PATCH /api/orders/order-uuid/cancel
{
  cancelled_by: 'admin-uuid',
  cancellation_reason: 'Restaurant requested cancellation',
  refund_required: false
}
```

### Database Changes
```sql
-- Update order status
UPDATE orders
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  cancellation_reason = 'Restaurant requested cancellation'
WHERE id = 'order-uuid';

-- Notify all parties
INSERT INTO notifications (user_id, type, title, message)
VALUES
  ('rest-uuid', 'order_cancelled', 'Order Cancelled', 'Your order has been cancelled'),
  ('driver-uuid', 'delivery_cancelled', 'Delivery Cancelled', 'Delivery no longer needed');

-- Release driver assignment
UPDATE orders
SET driver_id = NULL
WHERE id = 'order-uuid';
```

---

## 📈 Order Analytics

### Key Metrics Tracked
```sql
-- Total orders by status
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status;

-- Average order value
SELECT AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'delivered';

-- Delivery time metrics
SELECT
  AVG(EXTRACT(EPOCH FROM (delivered_at - confirmed_at))/60) as avg_delivery_minutes,
  MAX(EXTRACT(EPOCH FROM (delivered_at - confirmed_at))/60) as max_delivery_minutes
FROM orders
WHERE status = 'delivered';

-- Restaurant ordering patterns
SELECT
  restaurant_id,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_spent,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'delivered'
GROUP BY restaurant_id;
```

---

## 🔔 Notification System

### Notification Types

| Event | Recipient | Type | Priority |
|-------|-----------|------|----------|
| Order created | Admin | new_order | High |
| Order confirmed | Restaurant | order_confirmed | High |
| Driver assigned | Driver | delivery_assigned | High |
| Order in transit | Restaurant | order_in_transit | Medium |
| Order delivered | Restaurant | order_delivered | High |
| Order cancelled | All parties | order_cancelled | High |
| Status changed | All parties | status_changed | Medium |

### Notification Delivery
- **Real-time:** WebSocket push notification
- **Persistent:** Stored in notifications table
- **Email:** For important events (optional)
- **SMS:** For critical events (planned)

---

## 🎯 Business Rules

### Pricing Rules
- Admin sets per-order pricing (not fixed catalog prices)
- Minimum order amount: 50 GEL
- Maximum order amount: 10,000 GEL
- Profit margin typically 10-20%

### Delivery Rules
- Orders assigned to available drivers
- Driver can handle max 5 concurrent deliveries
- Delivery time SLA: 2 hours from confirmation
- Failed delivery attempts: Max 3 before cancellation

### Status Transition Rules
```typescript
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
}
```

---

## 🔄 Real-time Updates Throughout Workflow

### Connection Manager Integration

All order status changes use our enterprise-grade Connection Manager:

```typescript
import { ConnectionManager } from '@/lib/realtime/connection-manager'

const manager = new ConnectionManager()

// Automatic features:
// - Reconnection with exponential backoff
// - Message queuing when offline
// - Heartbeat monitoring
// - Connection quality tracking
```

### Real-time Channels by Stage

**1. Order Creation (PENDING)**
```typescript
// Restaurant sends order
// Admin receives notification instantly

supabase
  .channel('admin-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    showNotification('New order from ' + payload.new.restaurant_name)
    playSound()
  })
  .subscribe()
```

**2. Price Confirmation (CONFIRMED)**
```typescript
// Admin confirms price
// Restaurant receives update instantly

supabase
  .channel(`order:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    if (payload.new.status === 'confirmed') {
      showNotification(`Order confirmed: ${payload.new.total_amount} ₾`)
      updateOrderUI(payload.new)
    }
  })
  .subscribe()
```

**3. Driver Updates (IN_TRANSIT → DELIVERED)**
```typescript
// Driver updates status
// Restaurant and Admin see updates instantly

supabase
  .channel(`delivery:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    // Update tracking map
    // Show status badge
    // Send push notification
  })
  .subscribe()
```

### GPS Tracking (Real-time Driver Location)

```typescript
import { useGPSTracking } from '@/hooks/useGPSTracking'

// Restaurant/Admin can track driver in real-time
const { driverLocation, estimatedArrival } = useGPSTracking(driverId)

// Location updates every 10s while in transit
// Shows on map with ETA calculation
```

### User Presence (Online Status)

```typescript
import { useUserPresence } from '@/hooks/useUserPresence'

const { onlineUsers } = useUserPresence()

// See which drivers are online
// See which admin is available
// Auto-assign to online driver
```

### Offline Order Creation

Orders can be created offline and sync automatically:

```typescript
// Restaurant creates order offline
// Saved to IndexedDB
await saveOfflineOrder({
  restaurant_id: userId,
  items: cartItems,
  notes: 'Urgent delivery',
  synced: false
})

// When connection restored:
// Service Worker automatically syncs
// Admin receives notification
// Order appears in dashboard
```

### Chat/Messaging (Optional)

```typescript
import { useChatMessages } from '@/hooks/useChatMessages'

const { messages, sendMessage } = useChatMessages(`order:${orderId}`)

// Real-time chat between restaurant and driver
// "Where are you?"
// "5 minutes away"
```

---

## 📱 Mobile-Optimized Workflow

### Driver Mobile Experience

**One-Tap Status Updates:**
```tsx
<div className="grid grid-cols-3 gap-2">
  <Button
    size="lg"
    className="min-h-[60px]"
    onClick={() => updateStatus('pickup')}
  >
    📦 Picked Up
  </Button>
  <Button
    size="lg"
    className="min-h-[60px]"
    onClick={() => updateStatus('in_transit')}
  >
    🚚 In Transit
  </Button>
  <Button
    size="lg"
    className="min-h-[60px]"
    onClick={() => updateStatus('delivered')}
  >
    ✅ Delivered
  </Button>
</div>
```

**Touch-Optimized Interface:**
- Minimum 44px touch targets
- Swipe gestures for quick actions
- Pull-to-refresh for order list
- Bottom navigation for easy reach

### Restaurant Mobile Experience

**Quick Reorder:**
```typescript
// One-tap reorder from history
// Offline order creation
// Background sync when online
```

---

## ⚡ Performance Optimizations

### Query Optimization

Order queries use strategic indexes:
- `idx_orders_restaurant_id` - Fast restaurant order lookup
- `idx_orders_driver_id` - Fast driver order lookup
- `idx_orders_status` - Fast status filtering
- `idx_orders_created_at` - Fast sorting by date

### Real-time Performance

- Connection Manager reduces unnecessary reconnections
- Message queuing prevents data loss
- Heartbeat monitoring (30s) ensures live connections
- Exponential backoff avoids server overload

---

**Last Updated:** 2025-11-04
**Order States:** 5 (pending, confirmed, in_transit, delivered, cancelled)
**Average Order Time:** 2 hours from creation to delivery
**Real-time:** Enterprise-grade with Connection Manager
**Offline Support:** Full PWA with background sync
**Mobile:** Touch-optimized with 44px targets
