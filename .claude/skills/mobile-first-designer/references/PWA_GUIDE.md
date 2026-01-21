# Progressive Web App (PWA) Implementation Guide

## Complete PWA Checklist

Progressive Web Apps combine the best of web and native apps, providing fast, reliable, and engaging experiences across all devices.

---

## Core Requirements

### 1. HTTPS (Required)

**Why**: Security and trust
- Required for service workers
- Required for modern APIs (geolocation, camera, etc.)
- Builds user trust
- Required by app stores

**Implementation**:
- Use Let's Encrypt (free SSL)
- Use hosting providers with automatic HTTPS (Netlify, Vercel, Cloudflare Pages)
- Enable HTTPS redirect from HTTP

**nginx Configuration**:
```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Strong SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

---

### 2. Web App Manifest (Required)

**Purpose**: Defines how your app appears when installed

**Location**: `/manifest.json` (referenced in HTML `<head>`)

**Complete Example**:
```json
{
  "name": "My Progressive Web App",
  "short_name": "MyPWA",
  "description": "A comprehensive progressive web application",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
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
  "categories": ["productivity", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "New Document",
      "short_name": "New",
      "description": "Create a new document",
      "url": "/new",
      "icons": [
        {
          "src": "/icons/new.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

**Link in HTML**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- PWA manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Theme color -->
  <meta name="theme-color" content="#007bff">
  
  <!-- iOS specific -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="MyPWA">
  <link rel="apple-touch-icon" href="/icons/icon-180.png">
  
  <title>My PWA</title>
</head>
<body>
  <!-- App content -->
</body>
</html>
```

**Key Manifest Properties**:

- **name**: Full application name (45 chars max recommended)
- **short_name**: Short name for home screen (12 chars max recommended)
- **display**: `fullscreen`, `standalone`, `minimal-ui`, or `browser`
- **start_url**: URL loaded when app launches
- **scope**: Navigation scope (URLs outside this open in browser)
- **theme_color**: Browser UI color
- **background_color**: Splash screen background
- **orientation**: `portrait`, `landscape`, `any`

---

### 3. Service Worker (Required)

**Purpose**: Enables offline functionality, caching, background sync, push notifications

**Basic Service Worker** (`sw.js`):
```javascript
const CACHE_NAME = 'my-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
    .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return cached response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the new response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
```

**Register Service Worker** (`main.js`):
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
```

---

## Caching Strategies

### 1. Cache First (Best for Static Assets)

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

**Use for**: CSS, JavaScript, images, fonts

### 2. Network First (Best for Dynamic Content)

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
```

**Use for**: API calls, user-generated content

### 3. Stale While Revalidate (Best for Frequently Updated Content)

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

**Use for**: News feeds, social media posts

### 4. Cache Only (Best for App Shell)

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request));
});
```

**Use for**: App shell, critical UI components

### 5. Network Only (No Caching)

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
```

**Use for**: Analytics, real-time data

---

## Advanced PWA Features

### Install Prompt

```javascript
let deferredPrompt;
const installButton = document.getElementById('install-button');

// Hide button initially
installButton.style.display = 'none';

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent automatic prompt
  e.preventDefault();
  
  // Store event for later
  deferredPrompt = e;
  
  // Show install button
  installButton.style.display = 'block';
});

// Handle install button click
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  // Show install prompt
  deferredPrompt.prompt();
  
  // Wait for user choice
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User ${outcome} the install prompt`);
  
  // Clear deferred prompt
  deferredPrompt = null;
  
  // Hide button
  installButton.style.display = 'none';
});

// Track successful installation
window.addEventListener('appinstalled', (e) => {
  console.log('PWA installed successfully');
  
  // Send analytics event
  analytics.track('pwa_installed');
});
```

---

### Push Notifications

**Request Permission**:
```javascript
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('Notification permission granted');
    
    // Subscribe to push notifications
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    // Send subscription to server
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  }
}
```

**Handle Push in Service Worker**:
```javascript
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

---

### Background Sync

**Register Sync**:
```javascript
async function saveData(data) {
  try {
    // Try to send immediately
    await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    // Store for later
    const db = await openDB();
    await db.add('pending', data);
    
    // Register background sync
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-data');
  }
}
```

**Handle Sync in Service Worker**:
```javascript
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const db = await openDB();
  const pending = await db.getAll('pending');
  
  for (const data of pending) {
    try {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      await db.delete('pending', data.id);
    } catch (error) {
      // Will retry on next sync
      console.error('Sync failed:', error);
    }
  }
}
```

---

### Offline Page

```javascript
const OFFLINE_PAGE = '/offline.html';

// Cache offline page during install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(OFFLINE_PAGE))
  );
});

// Serve offline page when network fails
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_PAGE))
    );
  }
});
```

**Offline Page HTML**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
      background: #f5f5f5;
    }
    .container {
      max-width: 400px;
    }
    h1 {
      color: #333;
      margin-bottom: 16px;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Please check your connection and try again.</p>
    <button onclick="location.reload()">Retry</button>
  </div>
</body>
</html>
```

---

## Testing Your PWA

### Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Generate report"

**Required Scores**:
- Fast and reliable: ✅ All checks pass
- Installable: ✅ All checks pass
- PWA optimized: ✅ All checks pass

### Manual Testing

**Installability**:
- [ ] Install prompt appears on desktop/mobile
- [ ] App installs successfully
- [ ] Icon appears on home screen/app drawer
- [ ] App opens in standalone mode (no browser UI)

**Offline Functionality**:
- [ ] App loads when offline
- [ ] Cached content displays correctly
- [ ] Offline page appears for uncached pages
- [ ] Data syncs when connection restores

**Performance**:
- [ ] Loads in < 3 seconds on 3G
- [ ] Responds quickly to user interactions
- [ ] Smooth scrolling and animations
- [ ] No layout shifts

---

## Platform-Specific Considerations

### iOS

**Limitations**:
- No install prompt (user must add manually via Share menu)
- Limited push notification support
- Service worker restrictions
- No background sync

**Required Meta Tags**:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="MyPWA">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<link rel="apple-touch-startup-image" href="/splash.png">
```

### Android

**Full PWA Support**:
- Install prompts work
- Push notifications supported
- Background sync supported
- Full service worker support

**Enhanced Features**:
```json
{
  "display_override": ["window-controls-overlay", "standalone"],
  "handle_links": "preferred",
  "launch_handler": {
    "client_mode": "navigate-existing"
  }
}
```

---

## Best Practices

✅ **HTTPS everywhere** - Required for PWA features
✅ **Responsive design** - Works on all screen sizes
✅ **Fast load times** - Target < 3s on 3G
✅ **Offline support** - Core functionality works offline
✅ **Install prompt** - Clear, non-intrusive
✅ **Update notifications** - Alert users to new versions
✅ **Proper caching** - Cache static assets, network for dynamic
✅ **Icon sizes** - Provide all required sizes (192px, 512px minimum)
✅ **Manifest complete** - All required fields filled
✅ **Service worker** - Handles offline, caching, updates

---

## Common Issues and Solutions

### Issue: Service Worker Not Updating

**Solution**:
```javascript
self.addEventListener('install', event => {
  event.waitUntil(
    // ... cache setup
    self.skipWaiting() // Force activation
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // ... cache cleanup
    self.clients.claim() // Take control immediately
  );
});
```

### Issue: Install Prompt Not Appearing

**Checklist**:
- [ ] Served over HTTPS
- [ ] Manifest linked correctly
- [ ] Service worker registered
- [ ] All manifest icons present
- [ ] start_url accessible
- [ ] Not already installed

### Issue: Poor Offline Experience

**Solution**: Implement proper caching strategy
```javascript
// Cache app shell
const SHELL = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js'
];

// Pre-cache during install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
  );
});
```

---

This guide provides everything needed to implement a production-ready PWA with offline support, installability, and excellent user experience.