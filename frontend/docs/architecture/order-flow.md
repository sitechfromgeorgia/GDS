# Order Flow Documentation

**System**: Distribution Management System
**Last Updated**: 2025-11-05

---

## Table of Contents
1. [Overview](#overview)
2. [Order Lifecycle](#order-lifecycle)
3. [Order Creation Flow](#order-creation-flow)
4. [Order Status Transitions](#order-status-transitions)
5. [Driver Assignment Flow](#driver-assignment-flow)
6. [Delivery Flow](#delivery-flow)
7. [Real-time Updates](#real-time-updates)
8. [Error Handling](#error-handling)

---

## Overview

The order flow manages the complete lifecycle from order creation by restaurants through delivery by drivers. The system supports real-time updates and role-based status transitions.

### Order States
1. **pending** - Initial state after creation
2. **confirmed** - Restaurant confirmed the order
3. **priced** - Pricing finalized, ready for assignment
4. **assigned** - Driver assigned to order
5. **picked_up** - Driver collected the order
6. **in_transit** - Driver en route to delivery
7. **delivered** - Order successfully delivered
8. **cancelled** - Order cancelled (any stage)

---

## Order Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ORDER LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────────┘

   Restaurant            Admin              Driver            System
       │                   │                   │                │
       │                   │                   │                │
   ┌───▼───┐               │                   │                │
   │pending│◄──────────────┤                   │                │
   └───┬───┘   (create)    │                   │                │
       │                   │                   │                │
   ┌───▼─────┐             │                   │                │
   │confirmed│             │                   │                │
   └───┬─────┘             │                   │                │
       │ (confirm)         │                   │                │
   ┌───▼───┐           ┌───▼───┐              │                │
   │priced │◄──────────┤priced │              │                │
   └───┬───┘  (price)  └───────┘              │                │
       │                   │                   │                │
       │              ┌────▼────┐          ┌───▼────┐          │
       │              │assigned │◄─────────┤assigned│          │
       │              └────┬────┘ (assign) └───┬────┘          │
       │                   │                   │                │
       │                   │              ┌────▼─────┐         │
       │                   │              │picked_up │         │
       │                   │              └────┬─────┘         │
       │                   │                   │ (pickup)      │
       │                   │              ┌────▼──────┐        │
       │                   │              │in_transit │        │
       │                   │              └────┬──────┘        │
       │                   │                   │ (transit)     │
       │                   │              ┌────▼────┐          │
       │                   │              │delivered│          │
       │                   │              └────┬────┘          │
       │                   │                   │ (deliver)     │
       │                   │                   │           ┌────▼────┐
       │                   │                   │           │Complete │
       │                   │                   │           └─────────┘
       │                   │                   │                │
   ┌───▼──────┐        ┌───▼──────┐       ┌───▼──────┐        │
   │cancelled │        │cancelled │       │cancelled │        │
   └──────────┘        └──────────┘       └──────────┘        │

Status Transitions:
→ pending → confirmed → priced → assigned → picked_up → in_transit → delivered
   ↓           ↓         ↓          ↓           ↓            ↓
 cancelled  cancelled cancelled cancelled  cancelled   cancelled
```

---

## Order Creation Flow

### Complete Order Creation Sequence

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ORDER CREATION FLOW                               │
└──────────────────────────────────────────────────────────────────────┘

Restaurant      Browser         Next.js         Supabase       Database
   │               │               │               │               │
   │ 1. Fill Order │               │               │               │
   │    Form       │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │ 2. Add Items  │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │ 3. Submit     │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │               │ 4. Validate   │               │               │
   │               │────────┐      │               │               │
   │               │        │      │               │               │
   │               │<───────┘      │               │               │
   │               │               │               │               │
   │               │ 5. POST Order │               │               │
   │               ├──────────────>│               │               │
   │               │               │               │               │
   │               │               │ 6. Verify     │               │
   │               │               │    Products   │               │
   │               │               ├──────────────>│               │
   │               │               │               │               │
   │               │               │ 7. Products   │               │
   │               │               │<──────────────┤               │
   │               │               │               │               │
   │               │               │ 8. Calculate  │               │
   │               │               │    Pricing    │               │
   │               │               │────────┐      │               │
   │               │               │        │      │               │
   │               │               │<───────┘      │               │
   │               │               │               │               │
   │               │               │ 9. Insert     │               │
   │               │               │    Order      │               │
   │               │               ├──────────────────────────────>│
   │               │               │               │               │
   │               │               │               │ 10. Insert    │
   │               │               │               │     Items     │
   │               │               ├──────────────────────────────>│
   │               │               │               │               │
   │               │               │               │ 11. Order     │
   │               │               │               │     Created   │
   │               │               │<──────────────────────────────┤
   │               │               │               │               │
   │               │               │ 12. Realtime  │               │
   │               │               │     Event     │               │
   │               │               ├──────────────>│               │
   │               │               │               │               │
   │               │ 13. Order     │               │               │
   │               │     Response  │               │               │
   │               │<──────────────┤               │               │
   │               │               │               │               │
   │ 14. Success   │               │               │               │
   │     Message   │               │               │               │
   │<──────────────┤               │               │               │
   │               │               │               │               │
```

### Implementation

```typescript
// services/orders.service.ts
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const supabase = createBrowserClient()

  // 1. Get current user (restaurant)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Verify restaurant role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'restaurant') {
    throw new Error('Only restaurants can create orders')
  }

  // 3. Fetch and validate products
  const productIds = input.items.map(item => item.productId)
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (!products || products.length !== productIds.length) {
    throw new Error('Some products not found')
  }

  // Check availability
  const unavailable = products.filter(p => !p.is_available)
  if (unavailable.length > 0) {
    throw new Error(`Products unavailable: ${unavailable.map(p => p.name).join(', ')}`)
  }

  // 4. Calculate pricing
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

  const deliveryFee = 5.00 // Could be dynamic
  const totalAmount = subtotal + deliveryFee

  // 5. Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  // 6. Create order
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

  // 7. Insert order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map(item => ({ ...item, order_id: order.id })))

  if (itemsError) {
    // Rollback: delete order
    await supabase.from('orders').delete().eq('id', order.id)
    throw itemsError
  }

  // 8. Fetch complete order with relations
  const { data: completeOrder } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*, products (*)),
      restaurant:profiles!restaurant_id (*)
    `)
    .eq('id', order.id)
    .single()

  return completeOrder
}
```

---

## Order Status Transitions

### Status Transition Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│                   STATUS TRANSITION MATRIX                          │
└─────────────────────────────────────────────────────────────────────┘

Current Status  │ Allowed Next States    │ Who Can Transition
────────────────┼────────────────────────┼─────────────────────────
pending         │ confirmed, cancelled   │ Restaurant, Admin
confirmed       │ priced, cancelled      │ Restaurant, Admin
priced          │ assigned, cancelled    │ Admin, System
assigned        │ picked_up, cancelled   │ Driver, Admin
picked_up       │ in_transit, cancelled  │ Driver
in_transit      │ delivered, cancelled   │ Driver
delivered       │ (terminal state)       │ -
cancelled       │ (terminal state)       │ -
```

### Transition Implementation

```typescript
// services/orders.service.ts
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  metadata?: StatusMetadata
): Promise<Order> {
  const supabase = createBrowserClient()

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
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  // Validate transition
  if (!isValidTransition(order.status, newStatus, profile?.role)) {
    throw new Error(`Cannot transition from ${order.status} to ${newStatus}`)
  }

  // Prepare update
  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  // Status-specific logic
  switch (newStatus) {
    case 'assigned':
      if (!metadata?.driverId) throw new Error('Driver required')
      updateData.driver_id = metadata.driverId
      break

    case 'delivered':
      updateData.actual_delivery_time = new Date().toISOString()
      break

    case 'cancelled':
      if (!metadata?.cancelReason) throw new Error('Cancel reason required')
      updateData.cancel_reason = metadata.cancelReason
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancelled_by = user.id
      break
  }

  // Update order
  const { data: updated, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select(`*, order_items(*), restaurant:profiles!restaurant_id(*), driver:profiles!driver_id(*)`)
    .single()

  if (error) throw error

  return updated
}

// Validation function
function isValidTransition(
  current: OrderStatus,
  next: OrderStatus,
  role?: UserRole
): boolean {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['priced', 'cancelled'],
    priced: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: []
  }

  return transitions[current]?.includes(next) || false
}
```

---

## Driver Assignment Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                   DRIVER ASSIGNMENT FLOW                             │
└──────────────────────────────────────────────────────────────────────┘

  Admin          Browser         Next.js        Supabase       Database
   │               │               │               │               │
   │ 1. View Priced│               │               │               │
   │    Orders     │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │               │ 2. GET Orders │               │               │
   │               │    (priced)   │               │               │
   │               ├──────────────>│               │               │
   │               │               │               │               │
   │               │               │ 3. Query      │               │
   │               │               │    Orders     │               │
   │               │               ├──────────────────────────────>│
   │               │               │               │               │
   │               │               │ 4. Orders     │               │
   │               │               │<──────────────────────────────┤
   │               │               │               │               │
   │               │ 5. Orders List│               │               │
   │               │<──────────────┤               │               │
   │               │               │               │               │
   │ 6. Click      │               │               │               │
   │    "Assign    │               │               │               │
   │    Driver"    │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │               │ 7. GET        │               │               │
   │               │    Available  │               │               │
   │               │    Drivers    │               │               │
   │               ├──────────────>│               │               │
   │               │               │               │               │
   │               │               │ 8. Query      │               │
   │               │               │    Drivers    │               │
   │               │               ├──────────────────────────────>│
   │               │               │               │               │
   │               │               │ 9. Drivers    │               │
   │               │               │<──────────────────────────────┤
   │               │               │               │               │
   │               │ 10. Driver    │               │               │
   │               │     List      │               │               │
   │               │<──────────────┤               │               │
   │               │               │               │               │
   │ 11. Select    │               │               │               │
   │     Driver    │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │               │ 12. POST      │               │               │
   │               │     Assign    │               │               │
   │               ├──────────────>│               │               │
   │               │               │               │               │
   │               │               │ 13. Update    │               │
   │               │               │     Order     │               │
   │               │               ├──────────────────────────────>│
   │               │               │               │               │
   │               │               │ 14. Updated   │               │
   │               │               │<──────────────────────────────┤
   │               │               │               │               │
   │               │               │ 15. Notify    │               │
   │               │               │     Driver    │               │
   │               │               ├──────────────>│               │
   │               │               │               │               │
   │               │ 16. Success   │               │               │
   │               │<──────────────┤               │               │
   │               │               │               │               │
   │ 17. Updated   │               │               │               │
   │     Order     │               │               │               │
   │<──────────────┤               │               │               │
   │               │               │               │               │
```

---

## Delivery Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DELIVERY FLOW                                 │
└──────────────────────────────────────────────────────────────────────┘

  Driver          Mobile          Next.js        Supabase       Database
   │               │               │               │               │
   │ 1. View       │               │               │               │
   │    Assigned   │               │               │               │
   │    Orders     │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │               │ 2. GET Orders │               │               │
   │               │    (assigned) │               │               │
   │               ├──────────────>│               │               │
   │               │               │               │               │
   │               │ 3. Orders List│               │               │
   │               │<──────────────┤               │               │
   │               │               │               │               │
   │ 4. Navigate   │               │               │               │
   │    to Pickup  │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │ 5. Arrive at  │               │               │               │
   │    Restaurant │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │ 6. Mark       │               │               │               │
   │    "Picked Up"│               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │               │ 7. Update     │               │               │
   │               │    Status     │               │               │
   │               ├──────────────>│               │               │
   │               │               │               │               │
   │               │               │ 8. Update     │               │
   │               │               │    Order      │               │
   │               │               ├──────────────────────────────>│
   │               │               │               │               │
   │               │ 9. Success    │               │               │
   │               │<──────────────┤               │               │
   │               │               │               │               │
   │ 10. Navigate  │               │               │               │
   │     to        │               │               │               │
   │     Customer  │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │ 11. Mark      │               │               │               │
   │     "In       │               │               │               │
   │     Transit"  │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │ 12. Arrive at │               │               │               │
   │     Delivery  │               │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │ 13. Mark      │               │               │               │
   │     "Delivered"│              │               │               │
   ├──────────────>│               │               │               │
   │               │               │               │               │
   │               │ 14. Update    │               │               │
   │               │     Final     │               │               │
   │               ├──────────────>│               │               │
   │               │               │               │               │
   │               │               │ 15. Complete  │               │
   │               │               │     Order     │               │
   │               │               ├──────────────────────────────>│
   │               │               │               │               │
   │ 16. Success   │               │               │               │
   │<──────────────┤               │               │               │
   │               │               │               │               │
```

---

## Real-time Updates

### Subscription Setup

```typescript
// hooks/useOrderRealtime.ts
export function useOrderRealtime(restaurantId: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    // Subscribe to order changes
    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          handleOrderUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  function handleOrderUpdate(payload: RealtimePostgresChangesPayload) {
    switch (payload.eventType) {
      case 'INSERT':
        setOrders(prev => [...prev, payload.new as Order])
        break
      case 'UPDATE':
        setOrders(prev =>
          prev.map(order =>
            order.id === payload.new.id ? (payload.new as Order) : order
          )
        )
        break
      case 'DELETE':
        setOrders(prev => prev.filter(order => order.id !== payload.old.id))
        break
    }
  }

  return { orders }
}
```

---

## Error Handling

### Common Error Scenarios

| Error | Cause | Resolution |
|-------|-------|------------|
| **Products Unavailable** | Items out of stock | Notify restaurant, suggest alternatives |
| **Invalid Status Transition** | Wrong workflow step | Show valid next steps |
| **Driver Unavailable** | All drivers busy | Queue order for next available |
| **Delivery Failed** | Address unreachable | Contact customer, reschedule |
| **Payment Failed** | Insufficient funds | Request new payment method |

### Error Handling Implementation

```typescript
try {
  await createOrder(orderData)
} catch (error) {
  if (error.message.includes('unavailable')) {
    toast({
      title: 'Products Unavailable',
      description: 'Some items are out of stock',
      variant: 'destructive'
    })
  } else if (error.message.includes('transition')) {
    toast({
      title: 'Invalid Action',
      description: 'Cannot perform this action at current order status',
      variant: 'destructive'
    })
  } else {
    toast({
      title: 'Order Failed',
      description: 'Please try again',
      variant: 'destructive'
    })
  }
}
```

---

## Related Documentation

- [System Overview](./system-overview.md)
- [Database Schema](./database-schema.md)
- [API Documentation](../api/orders.md)

---

**End of Order Flow Documentation**
