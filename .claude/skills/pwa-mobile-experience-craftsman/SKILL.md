## SKILL 6: PWA Mobile Experience Craftsman

### Metadata
- **Name:** PWA Mobile Experience Craftsman
- **Category:** Mobile & Progressive Enhancement
- **Priority:** P1 (Critical for driver/restaurant mobile use)
- **Domain:** Service Workers, Web App Manifest, touch gestures, installability
- **Owner Role:** Frontend Engineer
- **Complexity:** Medium-High
- **Skills Required:** Service Workers, manifest.json, Touch APIs, iOS/Android quirks

### Mission
Build production-grade PWA capabilities for iOS and Android driver delivery app. Enable offline-first functionality, home screen installation, touch gesture support, and native app-like experience. Handle iOS/Android platform differences gracefully.

### Key Directives

1. **Service Worker Strategy**
   - Cache strategy: Network-first for orders/updates, Cache-first for static assets
   - Activate new Service Worker: wait for user to close all tabs or use skipWaiting
   - Periodic sync: schedule background sync every 15 min to check for new deliveries
   - Push notifications: register for Web Push API, handle notification clicks

2. **Web App Manifest**
   - icons: 192px, 512px (PNG, multiple densities for Android)
   - theme_color, background_color matching Tailwind CSS theme
   - orientation: portrait (drivers hold phone upright)
   - scope: "/" (entire app is installable)
   - `"display": "standalone"` (full-screen without address bar)
   - screenshots: for app store listing (1280x720, 540x720)

3. **iOS-Specific Handling**
   - No Service Worker persistence on iOS (Safari limitation)
   - Use Web App Manifest `apple-touch-icon` (180x180)
   - `apple-mobile-web-app-status-bar-style: black-translucent`
   - Home screen apps don't show browser chrome; design for full-screen
   - Local storage (IndexedDB) works but with quota limits (50MB typical)

4. **Android-Specific Handling**
   - Install prompt: listen to `beforeinstallprompt`, show custom button
   - Chrome has full PWA support; Firefox has partial support
   - Service Worker works reliably (push notifications, background sync)
   - Longer quota: 50MB+ for IndexedDB on newer Android versions

5. **Touch Gesture Support**
   - Disable double-tap zoom (200ms tap delay): `user-select: none`, viewport meta
   - Swipe gestures: left (go back), right (open menu) using Framer Motion drag
   - Long-press: open context menu for order/delivery actions
   - Pinch-to-zoom for maps (preserve with `touch-action: pinch-zoom`)

6. **Installability Checklist**
   - HTTPS only (except localhost)
   - Valid manifest.json with name, icons, start_url
   - Service Worker registered and working
   - Responsive design (pass viewport meta)
   - No JS errors on load
   - Manifest must be linked in `<head>`: `<link rel="manifest" href="/manifest.json">`

### Workflows

**Workflow: Service Worker Installation & Caching**
```typescript
// public/service-worker.ts
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';
const CACHE_ASSETS = `${CACHE_VERSION}-assets`;
const CACHE_ORDERS = `${CACHE_VERSION}-orders`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/app.js',
  '/offline.html',
];

// Install: cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_ASSETS).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_ASSETS && name !== CACHE_ORDERS) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Fetch: Network-first for API, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_ORDERS).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(JSON.stringify({ offline: true }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
  }
  // Static assets: cache-first
  else {
    event.respondWith(
      caches
        .match(request)
        .then((cached) => cached || fetch(request))
        .catch(() => caches.match('/offline.html'))
    );
  }
});

// Background Sync: retry failed API calls periodically
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-deliveries') {
    event.waitUntil(syncDeliveryUpdates());
  }
});

async function syncDeliveryUpdates() {
  try {
    const response = await fetch('/api/deliveries/sync', { method: 'POST' });
    return response.ok;
  } catch (error) {
    throw error; // Retry will be scheduled by browser
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const options: NotificationOptions = {
    badge: '/icon-192.png',
    icon: '/icon-192.png',
    tag: data.deliveryId,
    actions: [
      { action: 'open', title: 'View Delivery' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Delivery', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windows) => {
        return windows[0]?.navigate(`/deliveries/${event.notification.tag}`) ||
               clients.openWindow(`/deliveries/${event.notification.tag}`);
      })
    );
  }
});
```

**Setup in `app/layout.tsx`:**
```typescript
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then((reg) => {
        console.log('Service Worker registered:', reg);
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available; show "Update available" notification
              console.log('New app version available, please refresh.');
            }
          });
        });
      });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return <>{children}</>;
}
```

**manifest.json:**
```json
{
  "name": "Food Delivery - Driver App",
  "short_name": "FoodDel",
  "description": "Real-time delivery tracking and order management",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1e293b",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
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
      "src": "/screenshot-540x720.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-1280x720.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "View Active Deliveries",
      "short_name": "Active",
      "description": "See your current delivery list",
      "url": "/deliveries/active",
      "icons": [{ "src": "/icon-96.png", "sizes": "96x96", "type": "image/png" }]
    }
  ],
  "categories": ["utilities", "logistics"]
}
```

### Tooling

**Core**
- Service Worker Workbox (optional, higher-level abstraction)
- `next-pwa` (Next.js PWA plugin, but ensure compatibility with App Router)
- Web App Manifest validator (online tools)
- Chrome DevTools: Applications tab for testing Service Workers

**Testing**
- Playwright: test offline scenarios, Service Worker activation
- Chrome Lighthouse: audit PWA score, installability
- Mobile device testing: real iOS iPhone + Android phone for Safari/Chrome testing

**Monitoring**
- Track Service Worker registration rate, update frequency
- Monitor push notification delivery + click rate
- Measure home screen install rate (analytics)
