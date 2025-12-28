# PWA Offline-First Architecture Best Practices

## Table of Contents

- [Executive Summary](#executive-summary)
- [Service Worker Fundamentals](#service-worker-fundamentals)
  - [Installation & Registration](#installation--registration)
  - [Caching Strategies](#caching-strategies)
  - [Offline Fallback Page](#offline-fallback-page)
- [IndexedDB for Offline Data Storage](#indexeddb-for-offline-data-storage)
  - [Database Setup](#database-setup)
  - [Offline-First Data Access Layer](#offline-first-data-access-layer)
- [Background Sync](#background-sync)
  - [Service Worker Background Sync](#service-worker-background-sync)
  - [Client-Side Sync Trigger](#client-side-sync-trigger)
- [Conflict Resolution Strategies](#conflict-resolution-strategies)
  - [Last-Write-Wins (Simple)](#last-write-wins-simple)
  - [Operational Transform (Advanced)](#operational-transform-advanced)
- [Push Notifications](#push-notifications)
  - [Service Worker Notification Handler](#service-worker-notification-handler)
  - [Push Subscription Management](#push-subscription-management)
- [Testing Offline Functionality](#testing-offline-functionality)
- [Actionable Checklist](#actionable-checklist)
- [Further Resources](#further-resources)

---

## Executive Summary

Progressive Web Apps (PWAs) with offline-first architecture provide app-like experiences in the browser, enabling users to work seamlessly regardless of network connectivity. For business-critical applications like order management systems, offline capabilities prevent lost sales, improve user experience, and ensure data integrity through smart synchronization strategies.

### Key Takeaways:

- ✅ **Service Workers** enable caching strategies for instant load times and offline functionality
- ✅ **IndexedDB** provides robust client-side storage for complex data structures
- ✅ **Background Sync** queues operations performed offline for automatic submission when online
- ✅ **Conflict resolution strategies** prevent data loss during concurrent offline edits
- ✅ **Push notifications** re-engage users with real-time updates

### Business Impact:

- **53% faster** perceived load times with proper caching
- **Zero data loss** with background sync queuing
- **40% increase** in user engagement with push notifications
- Works on **2G/3G networks** common in developing markets

---

## Service Worker Fundamentals

### Installation & Registration

#### Service Worker Registration:

```typescript
// app/layout.tsx - Register service worker
'use client'

import { useEffect } from 'react'

export default function RootLayout({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope)

          // Check for updates every hour
          setInterval(() => {
            registration.update()
          }, 3600000)
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error)
        })
    }
  }, [])

  return (
    <html>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#317EFB" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

#### Web App Manifest (manifest.json):

```json
{
  "name": "Georgian Distribution Management",
  "short_name": "Distribution",
  "description": "B2B food distribution order management system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#317EFB",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "New Order",
      "short_name": "New Order",
      "description": "Create a new order",
      "url": "/orders/new",
      "icons": [{ "src": "/icons/new-order.png", "sizes": "96x96" }]
    },
    {
      "name": "View Orders",
      "url": "/orders",
      "icons": [{ "src": "/icons/orders.png", "sizes": "96x96" }]
    }
  ]
}
```

---

### Caching Strategies

#### Strategy Selection by Resource Type:

```javascript
// public/sw.js
const CACHE_VERSION = 'v1.2.0'
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
}

// Cache-First: App shell (HTML, CSS, JS)
// Instant load, update in background
const cacheFirstStrategy = async (request) => {
  const cache = await caches.open(CACHE_NAMES.static)
  const cached = await cache.match(request)

  if (cached) {
    // Serve from cache immediately
    return cached
  }

  // Not in cache, fetch from network
  const response = await fetch(request)
  cache.put(request, response.clone())
  return response
}

// Network-First: API calls (orders, products)
// Fresh data preferred, fallback to cache
const networkFirstStrategy = async (request) => {
  const cache = await caches.open(CACHE_NAMES.dynamic)

  try {
    const response = await fetch(request, { timeout: 3000 })
    cache.put(request, response.clone())
    return response
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

// Stale-While-Revalidate: Product catalog
// Instant cached response + background update
const staleWhileRevalidateStrategy = async (request) => {
  const cache = await caches.open(CACHE_NAMES.dynamic)
  const cached = await cache.match(request)

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone())
    return response
  })

  // Return cached immediately if available
  return cached || fetchPromise
}

// Cache-Only: Offline fallback page
const cacheOnlyStrategy = async (request) => {
  const cache = await caches.open(CACHE_NAMES.static)
  return cache.match(request)
}

// Fetch event handler
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Route to appropriate strategy
  if (url.pathname === '/' || url.pathname.match(/\.(js|css)$/)) {
    // App shell: Cache-First
    event.respondWith(cacheFirstStrategy(request))
  } else if (url.pathname.startsWith('/api/')) {
    // API calls: Network-First
    event.respondWith(networkFirstStrategy(request))
  } else if (url.pathname.startsWith('/products')) {
    // Product catalog: Stale-While-Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request))
  } else if (url.pathname.match(/\.(png|jpg|svg|webp)$/)) {
    // Images: Cache-First
    event.respondWith(cacheFirstStrategy(request))
  } else {
    // Default: Network-First
    event.respondWith(networkFirstStrategy(request))
  }
})
```

---

### Offline Fallback Page:

```javascript
// Install event: Cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then(cache => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/styles/main.css',
        '/scripts/main.js',
        '/icons/icon-192.png',
      ])
    })
  )
  self.skipWaiting()
})

// Activate event: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => !Object.values(CACHE_NAMES).includes(key))
          .map(key => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})
```

---

## IndexedDB for Offline Data Storage

### Database Setup:

```typescript
// lib/offline/db.ts
import Dexie, { Table } from 'dexie'

export interface Order {
  id: string
  restaurant_id: string
  status: string
  total_amount: number
  items: OrderItem[]
  created_at: string
  synced: boolean
  offline_created?: boolean
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
}

export class OfflineDatabase extends Dexie {
  orders!: Table<Order>
  products!: Table<Product>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('DistributionDB')

    this.version(1).stores({
      orders: 'id, restaurant_id, status, created_at, synced',
      products: 'id, category, name',
      syncQueue: '++id, operation, timestamp, synced',
    })
  }
}

export const db = new OfflineDatabase()
```

---

### Offline-First Data Access Layer:

```typescript
// lib/offline/orders.ts
import { db } from './db'
import { createClient } from '@/lib/supabase/client'

export class OfflineOrderService {
  private supabase = createClient()

  // Fetch orders (online) or load from IndexedDB (offline)
  async getOrders(restaurantId: string): Promise<Order[]> {
    if (navigator.onLine) {
      try {
        const { data, error } = await this.supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('restaurant_id', restaurantId)

        if (error) throw error

        // Cache in IndexedDB
        await db.orders.bulkPut(data.map(order => ({
          ...order,
          synced: true,
          offline_created: false,
        })))

        return data
      } catch (error) {
        console.warn('Online fetch failed, loading from cache')
        return this.getOrdersFromCache(restaurantId)
      }
    } else {
      return this.getOrdersFromCache(restaurantId)
    }
  }

  private async getOrdersFromCache(restaurantId: string): Promise<Order[]> {
    return db.orders
      .where('restaurant_id')
      .equals(restaurantId)
      .toArray()
  }

  // Create order (queued if offline)
  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      synced: false,
      offline_created: !navigator.onLine,
    }

    // Save to IndexedDB immediately
    await db.orders.add(newOrder)

    if (navigator.onLine) {
      // Try immediate sync
      try {
        await this.syncOrder(newOrder)
      } catch (error) {
        // Will retry later via background sync
        await this.queueForSync(newOrder)
      }
    } else {
      // Queue for sync when online
      await this.queueForSync(newOrder)
    }

    return newOrder
  }

  private async syncOrder(order: Order): Promise<void> {
    const { error } = await this.supabase
      .from('orders')
      .insert(order)

    if (error) throw error

    // Mark as synced
    await db.orders.update(order.id, { synced: true })
  }

  private async queueForSync(order: Order): Promise<void> {
    await db.syncQueue.add({
      operation: 'create_order',
      data: order,
      timestamp: Date.now(),
      synced: false,
    })
  }
}
```

---

## Background Sync

### Service Worker Background Sync:

```javascript
// public/sw.js
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders())
  }
})

async function syncPendingOrders() {
  const db = await openDB('DistributionDB', 1)

  // Get all unsynced orders
  const pendingOrders = await db.getAllFromIndex('orders', 'synced', 0)

  for (const order of pendingOrders) {
    try {
      // Attempt sync
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })

      if (response.ok) {
        // Mark as synced
        await db.put('orders', { ...order, synced: true })

        // Notify user
        self.registration.showNotification('Order Synced', {
          body: `Order ${order.id} has been submitted successfully`,
          icon: '/icons/success.png',
        })
      }
    } catch (error) {
      console.error('Sync failed for order:', order.id, error)
      // Will retry on next sync event
    }
  }
}
```

---

### Client-Side Sync Trigger:

```typescript
// hooks/useOfflineSync.ts
export function useOfflineSync() {
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Check pending orders count
    const checkPending = async () => {
      const count = await db.orders.where('synced').equals(0).count()
      setPendingCount(count)
    }

    checkPending()

    // Listen for online event
    const handleOnline = async () => {
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready
          await registration.sync.register('sync-orders')
          setSyncing(true)
        } catch (error) {
          console.error('Background sync failed:', error)
          // Fallback: Manual sync
          await manualSync()
        }
      } else {
        // Fallback for browsers without background sync
        await manualSync()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const manualSync = async () => {
    setSyncing(true)

    const pending = await db.orders.where('synced').equals(0).toArray()

    for (const order of pending) {
      try {
        const { error } = await supabase.from('orders').insert(order)
        if (!error) {
          await db.orders.update(order.id, { synced: true })
        }
      } catch (error) {
        console.error('Manual sync failed:', error)
      }
    }

    setSyncing(false)
    setPendingCount(0)
  }

  return { syncing, pendingCount, manualSync }
}
```

---

## Conflict Resolution Strategies

### Last-Write-Wins (Simple):

```typescript
// Simplest strategy: Latest timestamp wins
async function syncWithLastWriteWins(localOrder: Order, remoteOrder: Order) {
  const localTime = new Date(localOrder.updated_at).getTime()
  const remoteTime = new Date(remoteOrder.updated_at).getTime()

  if (localTime > remoteTime) {
    // Local is newer, push to server
    await supabase.from('orders').update(localOrder).eq('id', localOrder.id)
  } else {
    // Remote is newer, update local
    await db.orders.put(remoteOrder)
  }
}
```

---

### Operational Transform (Advanced):

```typescript
// Merge changes intelligently
interface OrderChange {
  field: string
  oldValue: any
  newValue: any
  timestamp: number
}

async function syncWithOperationalTransform(
  localOrder: Order,
  remoteOrder: Order,
  localChanges: OrderChange[]
) {
  const mergedOrder = { ...remoteOrder }

  for (const change of localChanges) {
    const remoteValue = remoteOrder[change.field]

    if (remoteValue === change.oldValue) {
      // No conflict, apply local change
      mergedOrder[change.field] = change.newValue
    } else {
      // Conflict detected, use resolution strategy
      mergedOrder[change.field] = resolveConflict(
        change.field,
        change.newValue,
        remoteValue
      )
    }
  }

  return mergedOrder
}

function resolveConflict(field: string, localValue: any, remoteValue: any) {
  // Field-specific resolution strategies
  switch (field) {
    case 'status':
      // Status progression: pending → confirmed → picked_up → delivered
      const statusOrder = ['pending', 'confirmed', 'picked_up', 'delivered']
      const localIndex = statusOrder.indexOf(localValue)
      const remoteIndex = statusOrder.indexOf(remoteValue)
      return statusOrder[Math.max(localIndex, remoteIndex)]

    case 'items':
      // Merge item lists (union)
      return [...new Set([...localValue, ...remoteValue])]

    case 'total_amount':
      // Recalculate from merged items
      return calculateTotal(mergedOrder.items)

    default:
      // Default: Remote wins
      return remoteValue
  }
}
```

---

## Push Notifications

### Service Worker Notification Handler:

```javascript
// public/sw.js
self.addEventListener('push', event => {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: '/icons/notification.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
      order_id: data.order_id,
    },
    actions: [
      {
        action: 'view',
        title: 'View Order',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})
```

---

### Push Subscription Management:

```typescript
// lib/notifications/push.ts
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
    }

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}
```

---

## Testing Offline Functionality

### Playwright Offline Test:

```typescript
// tests/e2e/offline.spec.ts
import { test, expect } from '@playwright/test'

test('handles offline order creation', async ({ page, context }) => {
  // Go online first
  await page.goto('/orders/new')

  // Simulate offline
  await context.setOffline(true)

  // Create order offline
  await page.fill('[name="quantity"]', '5')
  await page.click('text=Submit Order')

  // Verify queued message
  await expect(page.locator('.offline-banner')).toContainText('Order will be submitted when online')

  // Go back online
  await context.setOffline(false)

  // Wait for background sync
  await page.waitForSelector('.success-message', { timeout: 10000 })

  // Verify order synced
  await expect(page.locator('.order-list')).toContainText('Status: Pending')
})
```

---

## Actionable Checklist

- [ ] Service Worker registered and caching app shell
- [ ] Manifest.json configured with icons
- [ ] IndexedDB setup for offline data storage
- [ ] Background Sync implemented for pending operations
- [ ] Conflict resolution strategy defined
- [ ] Push notifications configured
- [ ] Offline UI indicators implemented
- [ ] Sync status visible to users
- [ ] Tested offline functionality with Playwright
- [ ] Fallback pages for offline navigation

---

## Further Resources

- **MDN PWA Guide:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Workbox (Google):** https://developers.google.com/web/tools/workbox
- **Web.dev PWA Learning Path:** https://web.dev/learn/pwa/
- **Dexie.js (IndexedDB):** https://dexie.org/
