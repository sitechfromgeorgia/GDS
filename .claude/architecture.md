# System Architecture

> **სისტემის არქიტექტურა** | Technical architecture and design decisions

---

## 🏛️ High-Level Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │   Mobile     │  │   Tablet     │     │
│  │  (Desktop)   │  │   (PWA)      │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js 15 Frontend (App Router)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Server Components (SSR)  │  Client Components       │  │
│  │  - SEO optimized pages   │  - Interactive UI        │  │
│  │  - Data fetching         │  - Real-time updates     │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         API Routes (Next.js API)                     │  │
│  │  - /api/orders  - /api/analytics  - /api/products   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ PostgreSQL Protocol
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (with RLS)                      │  │
│  │  - profiles  - products  - orders  - notifications   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Services                                   │  │
│  │  - Auth (GoTrue)  - Realtime  - Storage             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  - Sentry (Error Tracking)  - MCP Servers (Dev Tools)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌍 Dual Environment Strategy

### Development Environment
**Purpose:** Fast iteration, team collaboration, official Supabase features

```
Developer Machine
    ↓
Next.js Dev Server (localhost:3000)
    ↓
Official Supabase Hosted Instance
    - URL: akxmacfsltzhbnunoepb.supabase.co
    - Full Supabase dashboard access
    - Automatic backups
    - Latest features
```

**Benefits:**
- ✅ No local infrastructure setup required
- ✅ Official Supabase dashboard for database management
- ✅ Fast development cycles
- ✅ Easy team collaboration
- ✅ Automatic updates and maintenance

### Production Environment
**Purpose:** Data sovereignty, cost control, Georgian market requirements

```
User Browser
    ↓
Frontend Domain (greenland77.ge)
    ↓
Dockploy on Contabo VPS
    ↓
Self-hosted Supabase (data.greenland77.ge)
    - PostgreSQL 15+
    - GoTrue (Auth)
    - PostgREST (API)
    - Realtime Server
    - Storage API
```

**Benefits:**
- ✅ Full control over data (Georgian data sovereignty)
- ✅ Cost predictability (fixed VPS cost)
- ✅ Custom configurations
- ✅ No vendor lock-in
- ✅ Scalable on-demand

### Migration Strategy
- Database schema defined in `database/` folder
- Migration scripts ready for VPS deployment
- Environment switching via `.env` configuration
- No code changes required for environment switch

---

## 🎨 Frontend Architecture

### Next.js 15 App Router Structure

```
src/app/
├── (auth)/                    # Auth route group
│   ├── login/
│   ├── reset-password/
│   └── layout.tsx            # Auth-specific layout
│
├── (dashboard)/              # Dashboard route group
│   ├── admin/
│   │   ├── analytics/        # 📊 Analytics dashboard
│   │   ├── orders/           # 📦 Order management
│   │   ├── products/         # 🛍️ Product catalog
│   │   └── users/            # 👥 User management
│   ├── restaurant/
│   │   ├── order/            # 🍕 Place orders
│   │   ├── history/          # 📋 Order history
│   │   └── page.tsx          # Restaurant home
│   ├── driver/
│   │   ├── deliveries/       # 🚚 Active deliveries
│   │   ├── history/          # ✅ Completed deliveries
│   │   └── page.tsx          # Driver home
│   ├── demo/                 # 🎭 Demo environment
│   └── layout.tsx            # Shared dashboard layout
│
├── (public)/                 # Public route group
│   ├── page.tsx              # Landing page
│   ├── about/
│   └── contact/
│
├── api/                      # API routes
│   ├── orders/
│   │   ├── route.ts
│   │   ├── analytics/route.ts
│   │   ├── submit/route.ts
│   │   └── track/route.ts
│   ├── products/route.ts
│   ├── analytics/route.ts
│   ├── contact/route.ts
│   └── csrf/route.ts
│
├── layout.tsx                # Root layout
├── providers.tsx             # Global providers
└── globals.css              # Global styles
```

### Component Architecture

**Atomic Design Pattern:**

```
src/components/
├── ui/                       # 🎨 Atomic components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── alert.tsx
│   └── ...
│
├── auth/                     # 🔐 Authentication components
│   ├── AuthProvider.tsx
│   ├── LoginForm.tsx
│   ├── PasswordResetForm.tsx
│   └── SessionTimeoutModal.tsx
│
├── admin/                    # 👑 Admin-specific components
│   ├── AnalyticsDashboard.tsx
│   ├── OrderManagementTable.tsx
│   ├── OrderPricingModal.tsx
│   ├── ProductForm.tsx
│   └── ProductTable.tsx
│
├── restaurant/               # 🍕 Restaurant components
│   ├── ProductCatalog.tsx
│   ├── OrderHistoryTable.tsx
│   └── ...
│
├── orders/                   # 📦 Order management
│   ├── OrderCard.tsx
│   ├── OrderTable.tsx
│   ├── OrderDetailModal.tsx
│   └── OrderManagementClient.tsx
│
├── demo/                     # 🎭 Demo environment
│   ├── DemoBanner.tsx
│   ├── ConversionPrompt.tsx
│   ├── GuidedTour.tsx
│   └── FeedbackForm.tsx
│
└── notifications/            # 🔔 Notification system
    └── NotificationCenter.tsx
```

### State Management Strategy

**Three-Layer State Architecture:**

1. **Server State** (TanStack Query)
   ```typescript
   // Handles server data fetching, caching, synchronization
   const { data: orders } = useQuery({
     queryKey: ['orders'],
     queryFn: fetchOrders,
   })
   ```

2. **Client State** (Zustand)
   ```typescript
   // Handles UI state, user preferences, temporary data
   const useStore = create((set) => ({
     theme: 'light',
     sidebarOpen: true,
     setTheme: (theme) => set({ theme }),
   }))
   ```

3. **Real-time State** (Supabase Realtime)
   ```typescript
   // Handles WebSocket updates
   supabase
     .channel('orders')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'orders'
     }, handleChange)
     .subscribe()
   ```

---

## 🗄️ Backend Architecture

### Database Schema

**Core Tables:**

```sql
-- User Management
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'restaurant', 'driver', 'demo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_georgian TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Management
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Order Line Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo Sessions
CREATE TABLE demo_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### Row-Level Security (RLS) Architecture

**Multi-Tenant Security Model:**

```sql
-- Example: Orders table RLS policies

-- Admin: Full access
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Restaurant: Own orders only
CREATE POLICY "restaurant_own_orders" ON orders
  FOR SELECT
  USING (restaurant_id = auth.uid());

-- Driver: Assigned orders only
CREATE POLICY "driver_assigned_orders" ON orders
  FOR SELECT
  USING (driver_id = auth.uid());

-- Demo: Read-only, limited data
CREATE POLICY "demo_read_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'demo'
    )
    AND created_at > NOW() - INTERVAL '7 days'
  );
```

**RLS Coverage:**
- ✅ 25+ comprehensive policies across 6 tables
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenant isolation
- ✅ Data filtering per user role
- ✅ Cascade delete protection

### Database Optimization

**Strategic Indexes (12 total):**

```sql
-- Performance-critical indexes
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_products_available ON products(available);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_demo_sessions_session_id ON demo_sessions(session_id);
```

---

## 🔐 Security Architecture

### Authentication Flow

```
1. User Login Request
   ↓
2. Next.js API Route (/api/auth)
   ↓
3. Supabase Auth (GoTrue)
   - Password validation
   - MFA if enabled
   ↓
4. JWT Token Generation
   - User ID
   - Role claim
   - Expiration
   ↓
5. Client receives tokens
   - Access token (short-lived)
   - Refresh token (long-lived)
   ↓
6. Subsequent requests include JWT
   ↓
7. RLS policies verify permissions
   ↓
8. Data returned (filtered by role)
```

### Authorization Layers

**Three-Layer Security:**

1. **Application Layer**
   - Role checks in UI components
   - Route protection with middleware
   - Form validation with Zod

2. **API Layer**
   - JWT verification
   - CSRF protection
   - Rate limiting

3. **Database Layer** (Primary enforcement)
   - Row-Level Security (RLS)
   - Column-level permissions
   - Foreign key constraints

### Data Flow Security

```
User Input → Zod Validation → API Route → CSRF Check →
JWT Verification → RLS Policies → Data Access
```

---

## 🔄 Real-time Architecture

### Advanced Connection Manager

**Enterprise-Grade Real-time System** with sophisticated connection management:

```
Connection Manager Architecture
   ↓
┌─────────────────────────────────────────┐
│    Connection Quality Monitor           │
│  - Latency tracking                     │
│  - Heartbeat system (30s interval)      │
│  - Connection state management          │
└─────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────┐
│    Exponential Backoff System           │
│  - Initial: 1s delay                    │
│  - Max: 30s delay                       │
│  - Automatic reconnection               │
└─────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────┐
│    Message Queue (Offline Resilience)   │
│  - Queue messages when disconnected     │
│  - Auto-sync on reconnection            │
│  - Max 100 queued messages              │
└─────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────┐
│    Real-time Channels                   │
│  - orders (status updates)              │
│  - notifications (user alerts)          │
│  - user-presence (online status)        │
│  - inventory-tracking (stock levels)    │
│  - gps-tracking (driver location)       │
│  - chat (messaging)                     │
└─────────────────────────────────────────┘
```

### WebSocket Connection Flow

```
Client connects to Supabase Realtime
   ↓
Connection Manager initializes
   ├─> Start heartbeat monitoring
   ├─> Initialize message queue
   └─> Set up exponential backoff
   ↓
Subscribe to specific channels:
   - 'orders' channel (order updates)
   - 'notifications' channel (user notifications)
   - 'user-presence' channel (online users)
   - 'inventory-tracking' channel (stock updates)
   - 'gps-tracking' channel (driver location)
   - 'chat' channel (messages)
   ↓
Database change triggers
   ↓
Supabase Realtime broadcasts to subscribed clients
   ↓
Connection Manager handles delivery
   ├─> If online: Immediate delivery
   └─> If offline: Queue for later
   ↓
React components update automatically
```

### Real-time Features Implemented

**1. User Presence Tracking** (`useUserPresence`)
```typescript
// Track online/offline status of users
const { onlineUsers, updatePresence } = useUserPresence()
```

**2. Inventory Tracking** (`useInventoryTracking`)
```typescript
// Real-time product stock monitoring
const { inventory, lowStockItems } = useInventoryTracking()
```

**3. GPS Tracking** (`useGPSTracking`)
```typescript
// Live driver location updates
const { driverLocation, updateLocation } = useGPSTracking(driverId)
```

**4. Chat Messages** (`useChatMessages`)
```typescript
// Real-time messaging system
const { messages, sendMessage } = useChatMessages(channelId)
```

**5. Offline Message Queue**
```typescript
// Automatic message queuing when offline
// Auto-sync when connection restored
// Max 100 messages in queue
```

### Implementation Example

```typescript
// Real-time order updates with advanced connection management
useEffect(() => {
  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${userId}` // RLS enforced
      },
      (payload) => {
        // Update local state
        queryClient.invalidateQueries(['orders'])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [userId])
```

### Connection Quality Monitoring

```typescript
// Real-time connection health tracking
- Latency measurement per message
- Connection state: connected | connecting | disconnected
- Heartbeat system (30s interval)
- Automatic reconnection with exponential backoff
- Connection quality metrics exposed to UI
```

---

## 📊 Data Flow Patterns

### Order Creation Workflow

```
1. Restaurant selects products
   └─> Local state (Zustand cart)

2. User submits order
   └─> Form validation (Zod)
       └─> API route /api/orders/submit
           └─> Supabase insert (RLS applied)
               └─> Trigger notification creation
                   └─> Realtime broadcast to admin
                       └─> Admin dashboard updates

3. Admin reviews order
   └─> Sets pricing
       └─> Updates order status to 'confirmed'
           └─> Realtime broadcast to restaurant
               └─> Restaurant dashboard updates

4. Admin assigns driver
   └─> Updates driver_id field
       └─> Realtime broadcast to driver
           └─> Driver dashboard updates

5. Driver updates delivery status
   └─> Status changes: pickup → in_transit → delivered
       └─> Realtime broadcasts to all parties
           └─> All dashboards update automatically
```

### Analytics Data Aggregation

```
Request: Get KPIs for date range
   ↓
API Route: /api/orders/analytics
   ↓
Query Builder:
   - Filter by date range
   - Filter by status (if specified)
   - Aggregate functions (SUM, COUNT, AVG)
   - RLS automatically applied
   ↓
PostgreSQL Query Execution:
   - Optimized with indexes
   - Results filtered per user role
   ↓
Data Transformation:
   - Format for Recharts
   - Calculate derived metrics
   ↓
Response:
   - JSON with KPI data
   - CSV export if requested
   ↓
Frontend:
   - TanStack Query caches result
   - Recharts renders visualization
   - Real-time updates via WebSocket
```

---

## 🚀 Deployment Architecture

### Production Infrastructure

```
Internet
   ↓
Cloudflare DNS
   ├─> greenland77.ge → Frontend
   └─> data.greenland77.ge → Backend
   ↓
Contabo VPS (Ubuntu 22.04)
   ├─> Dockploy (Container Orchestration)
   │   ├─> Next.js Frontend Container
   │   │   └─> Node.js 20, Port 3000
   │   └─> Supabase Stack
   │       ├─> PostgreSQL 15 (Port 5432)
   │       ├─> PostgREST (Port 3001)
   │       ├─> GoTrue Auth (Port 9999)
   │       ├─> Realtime (Port 4000)
   │       └─> Storage (Port 5000)
   └─> Nginx Reverse Proxy
       ├─> SSL Termination (Let's Encrypt)
       └─> Load Balancing
```

### Container Strategy

**Docker Compose Services:**

```yaml
services:
  frontend:
    image: node:20-alpine
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]

  postgres:
    image: supabase/postgres:15
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  auth:
    image: supabase/gotrue:latest
    ports:
      - "9999:9999"
    depends_on:
      - postgres

  realtime:
    image: supabase/realtime:latest
    ports:
      - "4000:4000"
    depends_on:
      - postgres

  storage:
    image: supabase/storage-api:latest
    ports:
      - "5000:5000"
    depends_on:
      - postgres
```

---

## 📱 PWA (Progressive Web App) Architecture

### PWA Implementation Status: ✅ **FULLY IMPLEMENTED**

**Complete offline-first PWA with advanced features**

```
PWA Stack Architecture
   ↓
┌──────────────────────────────────────────┐
│    Service Worker (Workbox)             │
│  - Cache-first strategy                 │
│  - Background sync                       │
│  - Offline fallback pages                │
│  - Push notification handling            │
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│    IndexedDB (Offline Storage)           │
│  - Offline order queue                   │
│  - Cached product catalog                │
│  - User preferences                      │
│  - Draft orders                          │
└──────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────┐
│    PWA Features                          │
│  - Add to home screen                    │
│  - Splash screen                         │
│  - App-like experience                   │
│  - Offline mode                          │
│  - Background sync                       │
│  - Push notifications                    │
└──────────────────────────────────────────┘
```

### Service Worker Strategy

**Cache Strategy:**
```
Static Assets → Cache First (HTML, CSS, JS)
API Requests → Network First, Cache Fallback
Images → Cache First with Expiration
Fonts → Cache First, Forever
```

**Background Sync:**
```
User creates order offline
   ↓
Order saved to IndexedDB queue
   ↓
Service Worker registers sync event
   ↓
When online: Sync automatically triggers
   ↓
Orders uploaded to Supabase
   ↓
IndexedDB queue cleared
   ↓
User notified of successful sync
```

### Offline Capabilities

**1. Offline Order Creation**
```typescript
// Orders created offline are queued
// Auto-uploaded when connection restored
const { createOrder, offlineQueue } = useOfflineOrders()
```

**2. Offline Product Catalog**
```typescript
// Product catalog cached for offline browsing
// Updates sync when online
const { products, isOffline } = useOfflineProducts()
```

**3. Background Sync**
```typescript
// Automatic background synchronization
// No user intervention needed
navigator.serviceWorker.ready.then((registration) => {
  return registration.sync.register('sync-orders')
})
```

### Push Notifications

**Implementation:**
```typescript
// Push notification registration
const { requestPermission, subscribe } = usePushNotifications()

// Notification types:
- Order status changes
- New order assignments (drivers)
- Price confirmation (restaurants)
- System announcements
```

### Installation Flow

```
User visits site (HTTPS required)
   ↓
Service Worker registered
   ↓
After 2+ visits, install prompt shown
   ↓
User clicks "Add to Home Screen"
   ↓
PWA icon added to home screen
   ↓
Launches as standalone app
   ↓
Full-screen app experience
```

### PWA Manifest Configuration

```json
{
  "name": "Georgian Distribution Management",
  "short_name": "GDM",
  "description": "Distribution management system for Georgian restaurants",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Mobile Optimization

**Features:**
- ✅ Touch-optimized UI (44px minimum touch targets)
- ✅ Mobile-first responsive design
- ✅ Fast loading on slow networks
- ✅ Offline-first architecture
- ✅ App-like navigation
- ✅ No browser chrome in standalone mode

### Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Safari iOS (partial support)
- ✅ Firefox (full support)
- ✅ Samsung Internet (full support)

---

## 📈 Scalability Considerations

### Current Capacity
- **Users:** 100+ concurrent users (VPS capacity)
- **Orders:** 1000+ orders/day
- **Database:** 10GB+ storage
- **Real-time:** 500+ WebSocket connections

### Scaling Strategy

**Vertical Scaling (Short-term):**
- Upgrade VPS resources (CPU, RAM, Storage)
- Optimize database queries and indexes
- Implement caching layer (Redis)

**Horizontal Scaling (Long-term):**
- Multiple frontend instances behind load balancer
- Read replicas for database
- Dedicated Realtime server
- CDN for static assets

---

## 🛠️ Development Tools Integration

### MCP Server Architecture

```
Claude Code
   ↓
MCP Protocol
   ├─> Supabase MCP → Database operations
   ├─> GitHub MCP → Repository management
   ├─> Sentry MCP → Error tracking
   ├─> Perplexity MCP → Research assistance
   ├─> Context7 MCP → Library documentation
   ├─> shadcn MCP → UI component management
   └─> Chrome DevTools MCP → Browser debugging
```

**Configuration:** `.kilocode/mcp.json`

---

## 📚 Architecture Principles

### Design Decisions

1. **Server-First Approach**
   - Default to Server Components for better performance
   - Client Components only when interactivity needed

2. **Security by Default**
   - RLS as primary security layer
   - Never trust client-side checks
   - Validate all inputs

3. **Real-time When Needed**
   - WebSockets for live updates
   - Polling fallback for compatibility
   - Optimistic updates for better UX

4. **Progressive Enhancement**
   - Core functionality works without JavaScript
   - Enhanced experience with client-side features
   - Mobile-first responsive design

5. **Data Sovereignty**
   - Georgian data stays in Georgia (VPS)
   - Self-hosted production environment
   - Full control over infrastructure

---

**Last Updated:** 2025-11-03
**Version:** 1.0.0
**Status:** Production-ready architecture
