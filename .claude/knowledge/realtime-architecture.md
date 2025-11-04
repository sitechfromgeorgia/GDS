# Real-time Architecture

> **Real-time System** | Enterprise-grade WebSocket implementation with sophisticated connection management

**Status:** ✅ FULLY IMPLEMENTED (Enterprise-Grade)

---

## 🎯 Overview

Our real-time system is built on Supabase Realtime with a sophisticated **Connection Manager** providing:
- Automatic reconnection with exponential backoff
- Offline message queuing
- Heartbeat monitoring
- Connection quality tracking
- Multiple real-time channels for different features

**Code Base:** `frontend/src/lib/realtime/connection-manager.ts` (494 lines)

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│              React Application                       │
│  ┌─────────────────────────────────────────────┐   │
│  │     Real-time Hooks Layer                   │   │
│  │  - useUserPresence                          │   │
│  │  - useInventoryTracking                     │   │
│  │  - useGPSTracking                          │   │
│  │  - useChatMessages                         │   │
│  │  - useOrderUpdates                         │   │
│  └─────────────────────────────────────────────┘   │
│                      ↕                              │
│  ┌─────────────────────────────────────────────┐   │
│  │     Connection Manager (Core)               │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  Connection Quality Monitor         │   │   │
│  │  │  - Latency tracking                 │   │   │
│  │  │  - State management                 │   │   │
│  │  │  - Heartbeat (30s)                  │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  Exponential Backoff System        │   │   │
│  │  │  - Min: 1s, Max: 30s               │   │   │
│  │  │  - Automatic retry                  │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  Message Queue (Offline)           │   │   │
│  │  │  - Max 100 messages                │   │   │
│  │  │  - Auto-sync on reconnect          │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                      ↕ WebSocket
┌─────────────────────────────────────────────────────┐
│           Supabase Realtime Server                  │
│  - PostgreSQL Change Data Capture (CDC)            │
│  - WebSocket connection management                 │
│  - RLS policy enforcement                          │
└─────────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                    │
│  - orders, notifications, products                 │
│  - user_presence, inventory, chat                  │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 Connection Manager

### Core Features

**1. Connection State Management**
```typescript
type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting'
```

**2. Exponential Backoff**
```
Attempt 1: Wait 1s
Attempt 2: Wait 2s
Attempt 3: Wait 4s
Attempt 4: Wait 8s
Attempt 5: Wait 16s
Attempt 6+: Wait 30s (max)
```

**3. Heartbeat System**
```
Every 30 seconds:
  - Send ping to server
  - Measure round-trip time
  - Update connection quality
  - If no response: Trigger reconnection
```

**4. Message Queue**
```
When offline:
  - Queue all outgoing messages
  - Max 100 messages (FIFO)
  - Persist to memory
When reconnected:
  - Automatically send all queued messages
  - Clear queue on success
```

### Connection Manager API

```typescript
import { ConnectionManager } from '@/lib/realtime/connection-manager'

const manager = new ConnectionManager()

// Subscribe to connection state changes
manager.onStateChange((state) => {
  console.log('Connection state:', state)
})

// Subscribe to quality changes
manager.onQualityChange((quality) => {
  console.log('Latency:', quality.latency, 'ms')
})

// Get current state
const state = manager.getState()
const quality = manager.getConnectionQuality()

// Manual control (usually automatic)
manager.connect()
manager.disconnect()
```

---

## 📡 Real-time Channels

### 1. Orders Channel

**Purpose:** Real-time order status updates

```typescript
supabase
  .channel('orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${userId}` // RLS enforced
  }, (payload) => {
    // Handle order change
    console.log('Order updated:', payload.new)
  })
  .subscribe()
```

**Events:**
- `INSERT` - New order created
- `UPDATE` - Order status changed
- `DELETE` - Order cancelled

### 2. Notifications Channel

**Purpose:** User notifications

```typescript
supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    showNotification(payload.new)
  })
  .subscribe()
```

### 3. User Presence Channel

**Purpose:** Track online/offline status

**Location:** `frontend/src/hooks/useUserPresence.ts`

```typescript
const { onlineUsers, updatePresence } = useUserPresence()

// Update presence every 30s
useEffect(() => {
  const interval = setInterval(() => {
    updatePresence({ status: 'online' })
  }, 30000)

  return () => clearInterval(interval)
}, [])
```

**Features:**
- Real-time online user list
- Last seen timestamps
- Activity status
- Auto cleanup on disconnect

### 4. Inventory Tracking Channel

**Purpose:** Real-time stock level monitoring

**Location:** `frontend/src/hooks/useInventoryTracking.ts`

```typescript
const { inventory, lowStockItems } = useInventoryTracking()

// Subscribe to product updates
useEffect(() => {
  const channel = supabase
    .channel('inventory')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'products'
    }, (payload) => {
      if (payload.new.stock_level < 10) {
        showLowStockAlert(payload.new)
      }
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

**Features:**
- Low stock alerts
- Out of stock notifications
- Real-time quantity updates
- Automatic reorder triggers (future)

### 5. GPS Tracking Channel

**Purpose:** Live driver location updates

**Location:** `frontend/src/hooks/useGPSTracking.ts`

```typescript
const {
  driverLocation,
  updateLocation,
  isTracking
} = useGPSTracking(driverId)

// Update location every 10s when driving
useEffect(() => {
  if (!isTracking) return

  const interval = setInterval(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      updateLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: Date.now()
      })
    })
  }, 10000)

  return () => clearInterval(interval)
}, [isTracking])
```

**Features:**
- Real-time driver tracking
- Delivery ETA calculation
- Geofencing support
- Location history

### 6. Chat Channel

**Purpose:** Real-time messaging

**Location:** `frontend/src/hooks/useChatMessages.ts`

```typescript
const {
  messages,
  sendMessage,
  markAsRead
} = useChatMessages(channelId)

// Send message
await sendMessage({
  text: 'Hello!',
  attachments: []
})

// Messages update in real-time
useEffect(() => {
  console.log('New messages:', messages)
}, [messages])
```

**Features:**
- Real-time message delivery
- Read receipts
- Typing indicators
- File attachments (future)
- Message history

---

## 🔄 Connection Lifecycle

### 1. Initial Connection

```
1. User opens application
   ↓
2. Connection Manager initializes
   ↓
3. Establish WebSocket connection to Supabase
   ↓
4. Start heartbeat monitoring
   ↓
5. Subscribe to relevant channels
   ↓
6. Connection state: CONNECTED
   ↓
7. Start listening for database changes
```

### 2. During Normal Operation

```
Every 30 seconds:
  - Send heartbeat ping
  - Measure latency
  - Update connection quality

On database change:
  - Receive change event
  - Apply RLS policies
  - Broadcast to subscribed clients
  - Update React state
```

### 3. Connection Loss Detection

```
1. Heartbeat timeout (no response for 45s)
   ↓
2. Connection state: DISCONNECTED
   ↓
3. Start exponential backoff
   ↓
4. Queue any new messages
   ↓
5. Show offline indicator to user
```

### 4. Reconnection

```
1. Network restored
   ↓
2. Connection state: RECONNECTING
   ↓
3. Attempt reconnection with backoff
   ↓
4. Resubscribe to all channels
   ↓
5. Sync queued messages
   ↓
6. Connection state: CONNECTED
   ↓
7. Resume normal operation
```

### 5. Clean Disconnect

```
1. User logs out or closes app
   ↓
2. Stop heartbeat
   ↓
3. Unsubscribe from all channels
   ↓
4. Close WebSocket connection
   ↓
5. Clear message queue
   ↓
6. Connection state: DISCONNECTED
```

---

## 📊 Connection Quality Monitoring

### Metrics Tracked

```typescript
interface ConnectionQuality {
  state: ConnectionState
  latency: number // milliseconds
  lastHeartbeat: number // timestamp
  messagesQueued: number
  reconnectAttempts: number
}
```

### Quality Levels

```
Excellent: latency < 100ms
Good: latency < 300ms
Fair: latency < 1000ms
Poor: latency >= 1000ms
Offline: no connection
```

### UI Indicators

```typescript
function ConnectionIndicator() {
  const { state, quality } = useConnectionManager()

  return (
    <div className={cn(
      'flex items-center gap-2',
      state === 'connected' && 'text-green-500',
      state === 'reconnecting' && 'text-yellow-500',
      state === 'disconnected' && 'text-red-500'
    )}>
      <Dot className="animate-pulse" />
      <span>
        {state === 'connected' && `Connected (${quality.latency}ms)`}
        {state === 'reconnecting' && 'Reconnecting...'}
        {state === 'disconnected' && 'Offline'}
      </span>
    </div>
  )
}
```

---

## 💾 Offline Message Queue

### Queue Management

```typescript
class MessageQueue {
  private queue: Message[] = []
  private readonly maxSize = 100

  enqueue(message: Message) {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift() // Remove oldest
    }
    this.queue.push(message)
  }

  async flush() {
    const messages = [...this.queue]
    this.queue = []

    for (const message of messages) {
      await this.send(message)
    }
  }
}
```

### Usage Example

```typescript
// Automatically handled by Connection Manager
const manager = new ConnectionManager()

// When offline, messages are queued
await manager.send({
  channel: 'orders',
  event: 'update',
  payload: { status: 'confirmed' }
}) // Queued automatically

// When connection restored
// Queue automatically flushed
```

---

## 🔐 Security & RLS

### Row-Level Security Enforcement

All real-time subscriptions respect RLS policies:

```sql
-- Example: Users only see their own notifications
CREATE POLICY "users_own_notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);
```

Real-time subscription automatically enforces this:
```typescript
// User only receives their notifications
// Even though subscribed to entire table
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications'
    // No filter needed - RLS handles it!
  }, handleNotification)
  .subscribe()
```

### Authentication

```typescript
// WebSocket connection authenticated via JWT
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      // JWT token automatically included
    }
  }
})
```

---

## 🧪 Testing Real-time Features

### Unit Tests

```typescript
describe('ConnectionManager', () => {
  it('should connect successfully', async () => {
    const manager = new ConnectionManager()
    await manager.connect()
    expect(manager.getState()).toBe('connected')
  })

  it('should handle reconnection', async () => {
    const manager = new ConnectionManager()
    await manager.connect()

    // Simulate disconnect
    manager.simulateDisconnect()

    // Should reconnect automatically
    await waitFor(() => {
      expect(manager.getState()).toBe('connected')
    })
  })

  it('should queue messages when offline', () => {
    const manager = new ConnectionManager()
    manager.simulateDisconnect()

    manager.send({ type: 'test' })

    expect(manager.getQueueSize()).toBe(1)
  })
})
```

### Integration Tests

```typescript
describe('Real-time Order Updates', () => {
  it('should receive order updates in real-time', async () => {
    const { result } = renderHook(() => useOrderUpdates())

    // Create order in database
    await createOrder({ restaurant_id: userId })

    // Should receive update within 100ms
    await waitFor(() => {
      expect(result.current.orders).toHaveLength(1)
    }, { timeout: 100 })
  })
})
```

---

## 📈 Performance Optimization

### Best Practices

1. **Channel Cleanup**
```typescript
useEffect(() => {
  const channel = supabase.channel('orders').subscribe()

  // ALWAYS cleanup!
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

2. **Debounce Updates**
```typescript
const debouncedUpdate = useMemo(
  () => debounce((data) => updateState(data), 300),
  []
)

supabase.channel('orders')
  .on('postgres_changes', {}, debouncedUpdate)
  .subscribe()
```

3. **Selective Subscriptions**
```typescript
// BAD: Subscribe to everything
.on('postgres_changes', { event: '*', table: 'orders' })

// GOOD: Subscribe only to what you need
.on('postgres_changes', {
  event: 'UPDATE',
  table: 'orders',
  filter: `restaurant_id=eq.${userId}`
})
```

---

## 🐛 Troubleshooting

### Connection Won't Establish

**Check:**
1. Supabase URL and anon key correct
2. Network connection active
3. No firewall blocking WebSockets
4. HTTPS enabled (required for production)

**Debug:**
```typescript
supabase.channel('debug')
  .on('system', {}, (payload) => {
    console.log('System event:', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })
```

### Missing Updates

**Check:**
1. RLS policies allow SELECT
2. Channel subscription filter correct
3. User authenticated
4. Channel still subscribed

### High Latency

**Causes:**
- Slow network connection
- Server overload
- Too many active subscriptions
- Large payload sizes

**Solutions:**
- Reduce subscription count
- Filter data server-side
- Optimize queries
- Use connection quality indicators

---

## 🚀 Future Enhancements

### Planned Features

1. **Connection Pooling** - Reuse connections across components
2. **Message Compression** - Reduce bandwidth usage
3. **Offline Conflict Resolution** - Handle concurrent offline edits
4. **Selective Sync** - Only sync relevant data
5. **WebRTC Integration** - Peer-to-peer for chat/video

---

**Last Updated:** 2025-11-04
**Status:** Production-ready enterprise real-time system
**Lines of Code:** 494 (connection-manager.ts)
**Coverage:** Complete real-time architecture
