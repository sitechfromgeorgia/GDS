# Real-Time WebSocket Performance Strategies

## Table of Contents

- [Executive Summary](#executive-summary)
- [Industry Context & Best Practices](#industry-context--best-practices)
- [Implementation Guide](#implementation-guide)
- [docker-compose.yml (self-hosted Supabase)](#docker-composeyml-self-hosted-supabase)
- [/etc/nginx/nginx.conf](#etcnginxnginxconf)
- [Performance Monitoring](#performance-monitoring)
- [Actionable Checklist](#actionable-checklist)
- [Further Resources](#further-resources)

---

## Executive Summary

WebSocket-based real-time features are **mission-critical** for modern SaaS applications, enabling instant updates for order status, notifications, and live tracking. However, scaling WebSockets to thousands of concurrent connections requires careful architectural decisions and performance optimization strategies. This guide provides battle-tested patterns for building production-grade real-time systems.

### Key Takeaways

- WebSocket connections are **stateful and resource-intensive** (5KB memory + file descriptor per connection)
- Horizontal scaling requires **sticky sessions** or distributed state management (Redis Pub/Sub)
- **Reconnection storms can DDoS** your infrastructure—jittered exponential backoff is mandatory
- **Message queuing** prevents data loss during brief disconnections
- **Heartbeat/ping-pong mechanisms** detect silent connection failures within 30-60 seconds

### Performance Targets

- **Connection establishment:** <100ms
- **Message delivery latency:** <50ms (same datacenter), <200ms (cross-region)
- **Reconnection time:** <2 seconds
- **Memory per connection:** <10KB
- **Concurrent connections per server:** 10,000+ (with proper tuning)

---

## Industry Context & Best Practices

### WebSocket vs. Alternatives (2024-2025)

#### Technology Comparison

| Technology | Latency | Scalability | Complexity | Use Case |
|-----------|---------|-------------|------------|----------|
| **WebSocket** | 10-50ms | High* | Medium | Bidirectional real-time |
| **Server-Sent Events (SSE)** | 50-100ms | Medium | Low | Server → Client only |
| **Long Polling** | 200-500ms | Low | Low | Legacy browser support |
| **HTTP/2 Push** | 50-100ms | Medium | Medium | Static content push |
| **WebRTC** | 5-20ms | High | High | Peer-to-peer, A/V |

*Requires load balancing strategy

#### When to Use WebSockets

✅ **Use WebSockets for:**
- Order status updates (your use case)
- Real-time notifications
- Live chat/messaging
- Collaborative editing
- GPS tracking
- Stock tickers, dashboards

❌ **Don't use WebSockets for:**
- Static content delivery (use CDN)
- Bulk file transfers (use HTTP)

### Scaling Challenges

#### The 10K Connection Problem

Traditional Node.js servers handle **5,000-10,000** concurrent WebSocket connections before hitting resource limits:

**Memory Usage:**
```
- Base Node.js process: 50MB
- Per-connection overhead: 5-10KB
- 10,000 connections: 50MB + (10,000 × 5KB) = 100MB
```

**File Descriptors:**
```
- Linux default limit: 1,024 per process
- Required for 10,000 connections: 10,000 FDs
- Must increase with: ulimit -n 65535
```

**CPU Usage:**
```
- Heartbeat for 10,000 connections: ~1% CPU (if optimized)
- Message broadcasting: O(n) complexity
- JSON serialization bottleneck at scale
```

#### Solutions

1. **Vertical scaling** (bigger servers)
2. **Horizontal scaling** (load balancing + sticky sessions)
3. **Dedicated real-time servers** (separate from API servers)
4. **Managed services** (Supabase Realtime, Pusher, Ably)

---

## Implementation Guide

### Step 1: Production-Grade Connection Manager

Your current 494-line WebSocket manager is a solid foundation. Here are production enhancements:

#### Enhanced Connection Manager

```typescript
// lib/websocket/connection-manager.ts
import { RealtimeChannel } from '@supabase/supabase-js'

interface ConnectionConfig {
  maxReconnectAttempts: number
  baseReconnectDelay: number
  maxReconnectDelay: number
  heartbeatInterval: number
  messageQueueSize: number
  connectionTimeout: number
}

export class WebSocketConnectionManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private messageQueue: Array<QueuedMessage> = []
  private reconnectAttempts: number = 0
  private heartbeatInterval: NodeJS.Timeout | null = null
  private connectionState: ConnectionState = 'disconnected'
  private metrics: ConnectionMetrics = {
    totalMessages: 0,
    failedMessages: 0,
    avgLatency: 0,
    reconnectCount: 0,
  }

  private config: ConnectionConfig = {
    maxReconnectAttempts: 10,
    baseReconnectDelay: 1000,    // 1 second
    maxReconnectDelay: 30000,    // 30 seconds
    heartbeatInterval: 30000,    // 30 seconds
    messageQueueSize: 100,
    connectionTimeout: 10000,    // 10 seconds
  }

  async connect(channel: string, callbacks: ChannelCallbacks) {
    try {
      this.connectionState = 'connecting'

      // Create channel with timeout
      const channel = await Promise.race([
        this.createChannel(channel, callbacks),
        this.timeout(this.config.connectionTimeout)
      ])

      this.channels.set(channel, channel)
      this.connectionState = 'connected'
      this.reconnectAttempts = 0

      // Start heartbeat monitoring
      this.startHeartbeat()

      // Flush queued messages
      await this.flushMessageQueue()

      return channel
    } catch (error) {
      this.connectionState = 'disconnected'
      this.handleConnectionError(error)
      throw error
    }
  }

  private async reconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.connectionState = 'failed'
      this.emit('max_reconnect_attempts_reached')
      return
    }

    this.connectionState = 'reconnecting'
    this.reconnectAttempts++
    this.metrics.reconnectCount++

    // Exponential backoff with jitter
    const delay = this.calculateBackoffDelay()
    await this.sleep(delay)

    try {
      await this.connect()
    } catch (error) {
      await this.reconnect() // Recursive retry
    }
  }

  private calculateBackoffDelay(): number {
    const { baseReconnectDelay, maxReconnectDelay } = this.config

    // Exponential: 1s → 2s → 4s → 8s → 16s → 30s (max)
    const exponentialDelay = Math.min(
      baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      maxReconnectDelay
    )

    // Add jitter: ±25% randomization to prevent thundering herd
    const jitter = 0.75 + Math.random() * 0.5 // 0.75 to 1.25
    return Math.floor(exponentialDelay * jitter)
  }

  private startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatInterval = setInterval(async () => {
      const startTime = Date.now()

      try {
        // Send ping and measure latency
        await this.ping()
        const latency = Date.now() - startTime
        this.updateLatencyMetric(latency)

        // Alert if latency degrades
        if (latency > 500) {
          console.warn(`High WebSocket latency: ${latency}ms`)
        }
      } catch (error) {
        console.error('Heartbeat failed, reconnecting...', error)
        await this.reconnect()
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  async sendMessage(message: Message) {
    // Queue if disconnected
    if (this.connectionState !== 'connected') {
      this.queueMessage(message)
      return
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: message.event,
        payload: message.payload,
      })

      this.metrics.totalMessages++
    } catch (error) {
      this.metrics.failedMessages++
      this.queueMessage(message)
      throw error
    }
  }

  private queueMessage(message: Message) {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      // Drop oldest message (FIFO)
      this.messageQueue.shift()
      console.warn('Message queue full, dropped oldest message')
    }

    this.messageQueue.push({
      ...message,
      queuedAt: Date.now(),
    })
  }

  private async flushMessageQueue() {
    const messages = [...this.messageQueue]
    this.messageQueue = []

    for (const message of messages) {
      try {
        await this.sendMessage(message)
      } catch (error) {
        console.error('Failed to flush queued message', error)
        // Re-queue failed messages
        this.queueMessage(message)
      }
    }
  }

  getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      queueSize: this.messageQueue.length,
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
    }
  }

  disconnect() {
    this.stopHeartbeat()
    for (const [name, channel] of this.channels) {
      channel.unsubscribe()
    }
    this.channels.clear()
    this.connectionState = 'disconnected'
  }
}
```

#### Key Improvements

1. **Jittered Exponential Backoff** - Prevents reconnection storms
2. **Connection Timeout** - Fails fast if server unresponsive
3. **Latency Tracking** - Monitors connection quality
4. **Message Queue Overflow Handling** - Drops oldest messages gracefully
5. **Comprehensive Metrics** - Observability into connection health

### Step 2: Server-Side Optimization (Supabase Realtime)

#### Supabase Realtime Configuration

```yaml
# docker-compose.yml (self-hosted Supabase)
services:
  realtime:
    image: supabase/realtime:latest
    environment:
      # Connection pool settings
      DB_POOL_SIZE: 20  # PostgreSQL connections
      DB_SSL: "true"

      # Performance tuning
      MAX_CONNECTIONS: 5000  # Total WebSocket connections
      MAX_CHANNELS_PER_CLIENT: 10
      MAX_JOINS_PER_SECOND: 100

      # Heartbeat configuration
      HEARTBEAT_INTERVAL: 30000  # 30 seconds

      # Message rate limiting
      MAX_MESSAGES_PER_SECOND: 100

      # Memory management
      MAX_HEAP_SIZE: 2048  # MB

    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

#### PostgreSQL Optimizations for Realtime

```sql
-- Increase max connections for Realtime listeners
ALTER SYSTEM SET max_connections = 200;

-- Optimize LISTEN/NOTIFY performance
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET wal_level = 'logical';

-- Reduce latency for small transactions
ALTER SYSTEM SET synchronous_commit = 'local'; -- Don't wait for replica

-- Restart PostgreSQL to apply
SELECT pg_reload_conf();
```

### Step 3: Horizontal Scaling Architecture

**Problem:** Single Realtime server limits to ~10K connections

**Solution:** Load balancing with sticky sessions

```
┌─────────────────┐
│ Load Balancer   │
│ (Nginx/HAProxy) │
│ Sticky Sessions │
└────────┬────────┘
         │
┌────────┼────────┬────────┐
│        │        │        │
┌──────▼─────┐ ┌─────▼──────┐ ┌────▼───────┐
│ Realtime 1 │ │ Realtime 2 │ │ Realtime 3 │
│ 5K users   │ │ 5K users   │ │ 5K users   │
└──────┬─────┘ └─────┬──────┘ └────┬───────┘
       │             │             │
       └─────────────┼─────────────┘
                     │
             ┌───────▼────────┐
             │ Redis Pub/Sub  │
             │ (Message Fanout)│
             └───────┬────────┘
                     │
             ┌───────▼────────┐
             │  PostgreSQL    │
             └────────────────┘
```

#### Nginx Load Balancer Configuration

```nginx
# /etc/nginx/nginx.conf
upstream realtime_backend {
  # Sticky sessions based on client IP
  ip_hash;

  server realtime1.example.com:4000 max_fails=3 fail_timeout=30s;
  server realtime2.example.com:4000 max_fails=3 fail_timeout=30s;
  server realtime3.example.com:4000 max_fails=3 fail_timeout=30s;
}

server {
  listen 443 ssl http2;
  server_name realtime.greenland77.ge;

  # WebSocket upgrade headers
  location / {
    proxy_pass http://realtime_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # Timeouts for long-lived connections
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Buffer settings
    proxy_buffering off;
  }
}
```

#### Redis Pub/Sub for Cross-Server Communication

```typescript
// lib/realtime/redis-bridge.ts
import Redis from 'ioredis'

export class RealtimeRedisBridge {
  private publisher: Redis
  private subscriber: Redis

  constructor() {
    this.publisher = new Redis({
      host: 'redis.example.com',
      port: 6379,
    })

    this.subscriber = new Redis({
      host: 'redis.example.com',
      port: 6379,
    })

    this.subscriber.on('message', this.handleMessage.bind(this))
  }

  async subscribeToChannel(channel: string) {
    await this.subscriber.subscribe(`realtime:${channel}`)
  }

  async publishMessage(channel: string, message: any) {
    await this.publisher.publish(
      `realtime:${channel}`,
      JSON.stringify(message)
    )
  }

  private handleMessage(channel: string, message: string) {
    const data = JSON.parse(message)

    // Broadcast to local WebSocket connections
    this.localBroadcast(channel, data)
  }
}
```

### Step 4: Client-Side Resilience Patterns

#### Connection Quality Detection

```typescript
// lib/websocket/connection-quality.ts
export class ConnectionQualityMonitor {
  private latencyHistory: number[] = []
  private maxHistorySize = 20

  recordLatency(latency: number) {
    this.latencyHistory.push(latency)

    if (this.latencyHistory.length > this.maxHistorySize) {
      this.latencyHistory.shift()
    }
  }

  getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'disconnected' {
    if (this.latencyHistory.length === 0) {
      return 'disconnected'
    }

    const avgLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length

    if (avgLatency < 100) return 'excellent'
    if (avgLatency < 300) return 'good'
    return 'poor'
  }

  shouldReconnect(): boolean {
    const quality = this.getConnectionQuality()

    // Reconnect if consistently poor (last 5 pings > 500ms)
    const recentLatencies = this.latencyHistory.slice(-5)
    const poorConnectionCount = recentLatencies.filter(l => l > 500).length

    return quality === 'disconnected' || poorConnectionCount >= 4
  }
}
```

#### Progressive Fallback Strategy

```typescript
// components/OrderStatus.tsx
'use client'

import { useState, useEffect } from 'react'
import { useWebSocket } from '@/lib/websocket'

export function OrderStatus({ orderId }) {
  const [status, setStatus] = useState('pending')
  const { connectionQuality } = useWebSocket()

  // Real-time updates (primary)
  useEffect(() => {
    if (connectionQuality === 'disconnected' || connectionQuality === 'poor') {
      // Fallback to polling
      const interval = setInterval(async () => {
        const order = await fetch(`/api/orders/${orderId}`).then(r => r.json())
        setStatus(order.status)
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    } else {
      // Use WebSocket (preferred)
      const channel = supabase
        .channel(`order:${orderId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, (payload) => {
          setStatus(payload.new.status)
        })
        .subscribe()

      return () => { channel.unsubscribe() }
    }
  }, [orderId, connectionQuality])

  return (
    <div>
      <StatusBadge status={status} />
      {connectionQuality === 'poor' && (
        <WarningBanner>Connection quality degraded</WarningBanner>
      )}
    </div>
  )
}
```

### Step 5: Message Ordering & Idempotency

**Problem:** Network issues can cause duplicate or out-of-order messages

**Solution:** Message IDs + Client-Side Deduplication

```typescript
// lib/websocket/message-handler.ts
export class MessageDeduplicator {
  private processedMessages: Set<string> = new Set()
  private maxCacheSize = 1000

  isNewMessage(messageId: string): boolean {
    if (this.processedMessages.has(messageId)) {
      return false // Duplicate
    }

    this.processedMessages.add(messageId)

    // Limit cache size (LRU eviction)
    if (this.processedMessages.size > this.maxCacheSize) {
      const firstMessage = this.processedMessages.values().next().value
      this.processedMessages.delete(firstMessage)
    }

    return true
  }
}

// Usage
const deduplicator = new MessageDeduplicator()

channel.on('order_update', (payload) => {
  const messageId = payload.message_id || `${payload.order_id}-${payload.updated_at}`

  if (deduplicator.isNewMessage(messageId)) {
    updateOrderStatus(payload)
  } else {
    console.log('Duplicate message ignored:', messageId)
  }
})
```

#### Sequence Numbers for Ordering

```typescript
// Server-side: Add sequence numbers
interface Message {
  id: string
  sequence: number
  timestamp: number
  payload: any
}

let messageSequence = 0

function broadcastOrderUpdate(orderId: string, update: any) {
  messageSequence++

  const message: Message = {
    id: crypto.randomUUID(),
    sequence: messageSequence,
    timestamp: Date.now(),
    payload: update,
  }

  realtimeChannel.send(message)
}

// Client-side: Buffer out-of-order messages
class MessageOrderBuffer {
  private buffer: Map<number, Message> = new Map()
  private nextExpectedSequence = 1

  handleMessage(message: Message, callback: (msg: Message) => void) {
    if (message.sequence === this.nextExpectedSequence) {
      // In order, process immediately
      callback(message)
      this.nextExpectedSequence++

      // Check buffer for next messages
      this.processBufferedMessages(callback)
    } else if (message.sequence > this.nextExpectedSequence) {
      // Out of order, buffer it
      this.buffer.set(message.sequence, message)
    }
    // Ignore messages with sequence < expected (duplicates)
  }

  private processBufferedMessages(callback: (msg: Message) => void) {
    while (this.buffer.has(this.nextExpectedSequence)) {
      const message = this.buffer.get(this.nextExpectedSequence)!
      this.buffer.delete(this.nextExpectedSequence)
      callback(message)
      this.nextExpectedSequence++
    }
  }
}
```

---

## Performance Monitoring

### WebSocket Metrics Dashboard

```typescript
// lib/monitoring/websocket-metrics.ts
export interface WebSocketMetrics {
  activeConnections: number
  totalMessages: number
  failedMessages: number
  avgLatency: number
  p95Latency: number
  p99Latency: number
  reconnectRate: number
  messageQueueSize: number
}

export class WebSocketMetricsCollector {
  private metrics: WebSocketMetrics = {
    activeConnections: 0,
    totalMessages: 0,
    failedMessages: 0,
    avgLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    reconnectRate: 0,
    messageQueueSize: 0,
  }

  private latencyBuffer: number[] = []

  recordMessage(success: boolean, latency?: number) {
    this.metrics.totalMessages++

    if (!success) {
      this.metrics.failedMessages++
    }

    if (latency) {
      this.latencyBuffer.push(latency)

      if (this.latencyBuffer.length > 1000) {
        this.calculatePercentiles()
        this.latencyBuffer = []
      }
    }
  }

  private calculatePercentiles() {
    const sorted = [...this.latencyBuffer].sort((a, b) => a - b)

    this.metrics.avgLatency = sorted.reduce((a, b) => a + b, 0) / sorted.length
    this.metrics.p95Latency = sorted[Math.floor(sorted.length * 0.95)]
    this.metrics.p99Latency = sorted[Math.floor(sorted.length * 0.99)]
  }

  getMetrics(): WebSocketMetrics {
    return { ...this.metrics }
  }

  // Send to monitoring service (Sentry, DataDog, etc.)
  async reportToMonitoring() {
    // Example: Send to custom endpoint
    await fetch('/api/metrics/websocket', {
      method: 'POST',
      body: JSON.stringify(this.metrics),
    })
  }
}
```

### Alerting Thresholds

```typescript
const ALERT_THRESHOLDS = {
  maxLatency: 500,         // Alert if p95 > 500ms
  maxReconnectRate: 0.1,   // Alert if >10% of connections reconnecting
  maxFailureRate: 0.05,    // Alert if >5% of messages failing
  maxQueueSize: 50,        // Alert if queue backing up
}

function checkAlerts(metrics: WebSocketMetrics) {
  if (metrics.p95Latency > ALERT_THRESHOLDS.maxLatency) {
    alertOps('High WebSocket latency', { latency: metrics.p95Latency })
  }

  const failureRate = metrics.failedMessages / metrics.totalMessages
  if (failureRate > ALERT_THRESHOLDS.maxFailureRate) {
    alertOps('High WebSocket message failure rate', { rate: failureRate })
  }
}
```

---

## Actionable Checklist

### Production Readiness

- [ ] Jittered exponential backoff implemented
- [ ] Message queue with overflow handling
- [ ] Heartbeat/ping-pong monitoring (30s interval)
- [ ] Connection timeout handling (<10s)
- [ ] Latency tracking and alerting
- [ ] Message deduplication (prevent duplicate processing)
- [ ] Graceful degradation (fallback to polling)
- [ ] Connection quality monitoring
- [ ] Load balancing with sticky sessions (if >5K users)
- [ ] Redis Pub/Sub for horizontal scaling
- [ ] Metrics collection and dashboards
- [ ] Alert thresholds configured
- [ ] Rate limiting per client (prevent abuse)
- [ ] Connection limit per user (prevent resource exhaustion)

---

## Further Resources

### Official Documentation

- **Supabase Realtime:** [https://supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime)
- **WebSocket API (MDN):** [https://developer.mozilla.org/en-US/docs/Web/API/WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- **Ably WebSocket Guide:** [https://ably.com/topic/websocket-architecture-best-practices](https://ably.com/topic/websocket-architecture-best-practices)

### Scaling Guides

- **"Scaling WebSockets to Millions" (YouTube):** High-level architecture patterns
- **EMQX WebSocket Performance:** [https://www.emqx.com/en/blog/a-deep-dive-into-emqx-s-websocket-performance](https://www.emqx.com/en/blog/a-deep-dive-into-emqx-s-websocket-performance)
- **Building Scalable WebSockets (Leapcell):** [https://leapcell.io/blog/building-a-scalable-go-websocket-service](https://leapcell.io/blog/building-a-scalable-go-websocket-service)

---

*Document converted from PDF - Real-Time WebSocket Performance Strategies (16 pages)*
