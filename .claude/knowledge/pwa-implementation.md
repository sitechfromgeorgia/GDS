# PWA Implementation Guide

> **Progressive Web App** | Complete offline-first implementation

**Status:** ✅ FULLY IMPLEMENTED

---

## 🎯 Overview

Our PWA implementation provides a native app-like experience with:
- Complete offline functionality
- Background synchronization
- Push notifications
- Install to home screen
- Fast, reliable performance

---

## 🏗️ Architecture

### Service Worker Stack

```
Application Layer
   ↓
Service Worker (Workbox)
   ├─> Caching Strategies
   ├─> Background Sync
   ├─> Push Notifications
   └─> Offline Fallbacks
   ↓
IndexedDB Storage
   ├─> Offline Orders Queue
   ├─> Cached Products
   ├─> User Preferences
   └─> Draft Data
   ↓
Network Layer (Supabase)
```

---

## 📦 Core Files

### 1. Service Worker Registration
**Location:** `frontend/src/components/ServiceWorkerRegistration.tsx`

```typescript
// Registers service worker on app load
// Handles updates and offline detection
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])
}
```

### 2. PWA Utilities
**Location:** `frontend/src/lib/pwa.ts`

**Features:**
- Install prompt management
- Offline detection
- Background sync registration
- Push notification handling
- IndexedDB operations

### 3. PWA Hook
**Location:** `frontend/src/hooks/usePWA.ts`

```typescript
const {
  isInstalled,
  isOffline,
  promptInstall,
  requestNotifications
} = usePWA()
```

---

## 🔄 Caching Strategies

### Static Assets (Cache First)
```
Request → Cache → Return (if found)
       → Network → Cache → Return (if not in cache)
```

**Cached:**
- HTML pages
- CSS stylesheets
- JavaScript bundles
- Fonts
- Images

### API Requests (Network First)
```
Request → Network → Return + Cache
       → Cache → Return (if network fails)
```

**Cached:**
- Product catalog API
- User profile API
- Order history API

### Images (Cache First with Expiration)
```
Request → Cache → Check age → Return (if fresh)
       → Network → Cache → Return (if stale)
```

**Max age:** 7 days

---

## 💾 Offline Storage (IndexedDB)

### Database Schema

```javascript
// Orders Store
{
  id: string,
  data: object,
  timestamp: number,
  synced: boolean
}

// Products Store
{
  id: string,
  data: object,
  cached_at: number
}

// Preferences Store
{
  key: string,
  value: any
}
```

### Usage Example

```typescript
// Save order offline
await saveOfflineOrder({
  id: uuid(),
  restaurant_id: userId,
  items: cartItems,
  synced: false
})

// Retrieve offline orders
const offlineOrders = await getOfflineOrders()

// Mark as synced
await markOrderSynced(orderId)
```

---

## 🔄 Background Sync

### Order Sync Flow

```
1. User creates order while offline
   ↓
2. Order saved to IndexedDB with synced: false
   ↓
3. Service Worker registers sync event
   ↓
4. When connection restored:
   ├─> Service worker triggers sync
   ├─> Upload all unsynced orders to Supabase
   ├─> Mark orders as synced: true
   └─> Show success notification
```

### Implementation

```typescript
// Register sync in service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders())
  }
})

async function syncOfflineOrders() {
  const orders = await getUnsyncedOrders()

  for (const order of orders) {
    try {
      await uploadToSupabase(order)
      await markOrderSynced(order.id)
    } catch (error) {
      // Will retry on next sync
      console.error('Sync failed:', error)
    }
  }
}
```

---

## 🔔 Push Notifications

### Setup

```typescript
// Request permission
const permission = await Notification.requestPermission()

if (permission === 'granted') {
  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: PUBLIC_VAPID_KEY
  })

  // Send subscription to server
  await saveSubscription(subscription)
}
```

### Notification Types

1. **Order Status Updates**
   ```
   Title: "Order Confirmed"
   Body: "Your order #1234 has been confirmed"
   Action: View Order
   ```

2. **Driver Assignments**
   ```
   Title: "New Delivery"
   Body: "You have been assigned to order #1234"
   Action: Start Delivery
   ```

3. **Price Updates**
   ```
   Title: "Price Set"
   Body: "Admin set price for order #1234: 150 GEL"
   Action: Review Order
   ```

### Service Worker Notification Handler

```typescript
self.addEventListener('push', (event) => {
  const data = event.data.json()

  const options = {
    body: data.message,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    data: {
      url: data.url
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    clients.openWindow(event.notification.data.url)
  }
})
```

---

## 📱 Installation Flow

### 1. Eligibility Check

PWA can be installed when:
- ✅ Site served over HTTPS
- ✅ Service worker registered
- ✅ Web app manifest present
- ✅ User visited site at least twice

### 2. Install Prompt

```typescript
// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  setInstallPrompt(e)
})

// Show custom install button
const handleInstall = async () => {
  if (!installPrompt) return

  installPrompt.prompt()
  const { outcome } = await installPrompt.userChoice

  if (outcome === 'accepted') {
    console.log('PWA installed')
  }

  setInstallPrompt(null)
}
```

### 3. Post-Install

```typescript
window.addEventListener('appinstalled', () => {
  // Track installation
  analytics.track('pwa_installed')

  // Hide install button
  setIsInstalled(true)
})
```

---

## 🎨 Manifest Configuration

**Location:** `frontend/public/manifest.json`

```json
{
  "name": "Georgian Distribution Management",
  "short_name": "GDM",
  "description": "Distribution management system for Georgian restaurants",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

---

## 🔧 Development & Testing

### Local Testing

```bash
# Build production version (PWA only works in production)
npm run build

# Serve production build
npm run start

# Test on mobile devices
# Use ngrok for HTTPS: ngrok http 3000
```

### Chrome DevTools Audit

1. Open DevTools
2. Navigate to "Application" tab
3. Check "Manifest" section
4. Check "Service Workers" section
5. Run "Lighthouse" audit for PWA score

### Testing Checklist

- [ ] Service worker registers successfully
- [ ] Offline mode works (disable network in DevTools)
- [ ] Background sync triggers when online
- [ ] Push notifications work
- [ ] Install prompt appears
- [ ] App installs to home screen
- [ ] Standalone mode displays correctly
- [ ] Icons display at all sizes
- [ ] Splash screen works

---

## 📊 Performance Metrics

### Target Metrics
- **Install rate:** > 25%
- **Offline usage:** > 15%
- **Notification opt-in:** > 40%
- **Background sync success:** > 95%

### Monitoring

```typescript
// Track PWA metrics
analytics.track('pwa_installed')
analytics.track('offline_order_created')
analytics.track('background_sync_success')
analytics.track('notification_clicked')
```

---

## 🐛 Troubleshooting

### Service Worker Not Registering

**Check:**
1. HTTPS enabled (required except localhost)
2. `sw.js` file exists in public folder
3. No console errors
4. Browser supports service workers

**Fix:**
```bash
# Clear service worker cache
Chrome DevTools > Application > Service Workers > Unregister
```

### Background Sync Not Working

**Check:**
1. Service worker active
2. Sync event registered correctly
3. Network connection restored
4. No errors in service worker console

**Debug:**
```typescript
// In service worker
self.addEventListener('sync', (event) => {
  console.log('Sync event triggered:', event.tag)
  // Add debugging logs
})
```

### Push Notifications Not Showing

**Check:**
1. Permission granted
2. Push subscription active
3. VAPID keys configured
4. Service worker running
5. Browser supports push API

---

## 📱 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️ | ✅ |
| Add to Home Screen | ✅ | ✅ | ✅ | ✅ |
| Standalone Mode | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Full support
- ⚠️ Partial support
- ❌ Not supported

---

## 🚀 Future Enhancements

### Planned Features
1. **Web Share API** - Share orders via native share
2. **File System API** - Export data to device
3. **Contacts API** - Quick customer selection
4. **Payment Request API** - Native payment UI
5. **Periodic Background Sync** - Automatic data refresh

---

**Last Updated:** 2025-11-04
**Status:** Production-ready PWA implementation
**Coverage:** Complete offline-first architecture
