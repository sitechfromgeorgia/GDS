# System Overview

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Architecture**: Modern Full-Stack Web Application

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability Considerations](#scalability-considerations)
8. [Performance Optimization](#performance-optimization)

---

## Executive Summary

The Distribution Management System is a modern, full-stack web application designed to manage product distribution, orders, and deliveries across three user roles: Administrators, Restaurants, and Drivers.

### Key Capabilities
- ✅ **Multi-tenant Architecture**: Role-based access for Admin, Restaurant, and Driver users
- ✅ **Real-time Updates**: Live order tracking and cart synchronization
- ✅ **Scalable Backend**: Supabase PostgreSQL with Row Level Security
- ✅ **Modern Frontend**: Next.js 15 with React Server Components
- ✅ **Type-Safe**: Full TypeScript implementation
- ✅ **Mobile-Responsive**: Progressive Web App (PWA) capabilities

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Browser    │  │   Mobile     │  │   Desktop    │             │
│  │   (Chrome,   │  │   Safari     │  │   App        │             │
│  │   Firefox)   │  │   (iOS)      │  │   (Electron) │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                     │
│                            │                                         │
│                    HTTPS / WebSocket                                │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────────┐
│                   FRONTEND LAYER (Next.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐    │
│  │           App Router (Next.js 15)                          │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │    │
│  │  │   Admin    │ │ Restaurant │ │   Driver   │            │    │
│  │  │ Dashboard  │ │ Dashboard  │ │ Dashboard  │            │    │
│  │  └────────────┘ └────────────┘ └────────────┘            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         React Components & UI Layer                        │    │
│  │  • shadcn/ui Components                                    │    │
│  │  • Custom Dashboards                                       │    │
│  │  • Form Handling (React Hook Form)                         │    │
│  │  • State Management (Zustand)                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │          Data Layer                                        │    │
│  │  • React Query (Caching)                                   │    │
│  │  • Supabase Client                                         │    │
│  │  • Real-time Subscriptions                                │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                     REST API / GraphQL
                     WebSocket (Realtime)
                             │
┌────────────────────────────┼─────────────────────────────────────────┐
│                 BACKEND LAYER (Supabase)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Authentication Layer                               │    │
│  │  • Supabase Auth (JWT)                                     │    │
│  │  • Session Management                                      │    │
│  │  • Role-Based Access Control (RBAC)                        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         API Layer                                          │    │
│  │  • REST API (PostgREST)                                    │    │
│  │  • GraphQL API                                             │    │
│  │  • Real-time Server (WebSocket)                            │    │
│  │  • Edge Functions (Deno)                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Database Layer (PostgreSQL)                        │    │
│  │  • Row Level Security (RLS)                                │    │
│  │  • Database Functions & Triggers                           │    │
│  │  • Full-Text Search                                        │    │
│  │  • Geospatial Queries (PostGIS)                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                             │                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Storage Layer                                      │    │
│  │  • Object Storage (S3-compatible)                          │    │
│  │  • Image Uploads                                           │    │
│  │  • Document Storage                                        │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 15.5.6 | React framework with SSR/SSG |
| **UI Library** | React | 18.x | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **UI Components** | shadcn/ui | Latest | Accessible component library |
| **Forms** | React Hook Form | 7.x | Form state management |
| **Validation** | Zod | 3.x | Schema validation |
| **State Management** | Zustand | 4.x | Lightweight state management |
| **Data Fetching** | React Query | 5.x | Server state management |
| **Icons** | Lucide React | Latest | Icon library |

### Backend Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Backend Service** | Supabase | Backend-as-a-Service |
| **Database** | PostgreSQL | 15.x | Relational database |
| **Authentication** | Supabase Auth | JWT-based auth |
| **Real-time** | Supabase Realtime | WebSocket subscriptions |
| **Storage** | Supabase Storage | Object storage |
| **Edge Functions** | Deno | Serverless functions |
| **API** | PostgREST | Auto-generated REST API |

### Development Tools

| Category | Tool | Purpose |
|----------|------|---------|
| **Package Manager** | npm | Dependency management |
| **Linting** | ESLint | Code quality |
| **Formatting** | Prettier | Code formatting |
| **Testing** | Vitest | Unit testing |
| **E2E Testing** | Playwright | End-to-end testing |
| **CI/CD** | GitHub Actions | Automated workflows |

---

## System Components

### 1. Frontend Application (Next.js)

**Location**: `/frontend`

**Key Features**:
- Server-Side Rendering (SSR) for initial page loads
- Client-Side Rendering for dynamic interactions
- Automatic code splitting and lazy loading
- Progressive Web App (PWA) support
- SEO optimization

**Directory Structure**:
```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React Context providers
│   ├── services/         # API service layer
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles
├── public/               # Static assets
└── tests/                # Test files
```

---

### 2. Authentication System

**Provider**: Supabase Auth

**Features**:
- Email/password authentication
- JWT token-based sessions
- 5-hour session duration (configurable)
- Optional "Remember Me" (30-day sessions)
- Role-based access control (RBAC)
- Automatic session refresh

**Roles**:
1. **Admin**: Full system access, user management, analytics
2. **Restaurant**: Order creation, product management, order tracking
3. **Driver**: View assigned orders, update delivery status, earnings

---

### 3. Database Layer

**Engine**: PostgreSQL 15.x

**Key Tables**:
- `profiles` - User profiles and roles
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Order records
- `order_items` - Order line items
- `cart_sessions` - Shopping cart sessions
- `cart_items` - Cart line items
- `cart_activities` - Cart activity log

**Security**:
- Row Level Security (RLS) on all tables
- Role-based policies
- Encrypted at rest
- SSL/TLS for connections

---

### 4. Real-time System

**Technology**: Supabase Realtime (WebSocket)

**Features**:
- Live order updates
- Cart synchronization
- Driver location tracking
- Notifications

**Implementation**:
```typescript
// Subscribe to order updates
const channel = supabase
  .channel('orders:restaurant_id')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${userId}`
  }, handleUpdate)
  .subscribe()
```

---

### 5. Storage System

**Provider**: Supabase Storage (S3-compatible)

**Buckets**:
- `profiles` - User avatars and profile images
- `products` - Product images
- `documents` - Order documents and receipts

**Features**:
- Automatic image optimization
- CDN delivery
- Access control policies
- 5MB file size limit

---

## Data Flow

### Order Creation Flow

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│Restaurant│       │ Next.js  │       │ Supabase │       │PostgreSQL│
│  Client  │       │  Server  │       │   API    │       │ Database │
└────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                   │                   │
     │ 1. Submit Order  │                   │                   │
     ├─────────────────>│                   │                   │
     │                  │                   │                   │
     │                  │ 2. Validate Data  │                   │
     │                  │────────┐          │                   │
     │                  │        │          │                   │
     │                  │<───────┘          │                   │
     │                  │                   │                   │
     │                  │ 3. Create Order   │                   │
     │                  ├──────────────────>│                   │
     │                  │                   │                   │
     │                  │                   │ 4. Insert Order   │
     │                  │                   ├──────────────────>│
     │                  │                   │                   │
     │                  │                   │ 5. Return Order   │
     │                  │                   │<──────────────────┤
     │                  │                   │                   │
     │                  │ 6. Order Created  │                   │
     │                  │<──────────────────┤                   │
     │                  │                   │                   │
     │ 7. Order Response│                   │                   │
     │<─────────────────┤                   │                   │
     │                  │                   │                   │
     │                  │ 8. Real-time Event│                   │
     │<─────────────────┴───────────────────┤                   │
     │                  │                   │                   │
```

### Authentication Flow

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  Client  │       │ Next.js  │       │ Supabase │       │   Auth   │
│          │       │  Server  │       │   Auth   │       │ Database │
└────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                   │                   │
     │ 1. Login Request │                   │                   │
     ├─────────────────>│                   │                   │
     │                  │                   │                   │
     │                  │ 2. Authenticate   │                   │
     │                  ├──────────────────>│                   │
     │                  │                   │                   │
     │                  │                   │ 3. Verify Creds   │
     │                  │                   ├──────────────────>│
     │                  │                   │                   │
     │                  │                   │ 4. User Found     │
     │                  │                   │<──────────────────┤
     │                  │                   │                   │
     │                  │                   │ 5. Generate JWT   │
     │                  │                   │────────┐          │
     │                  │                   │        │          │
     │                  │                   │<───────┘          │
     │                  │                   │                   │
     │                  │ 6. Session + JWT  │                   │
     │                  │<──────────────────┤                   │
     │                  │                   │                   │
     │ 7. Set Cookies   │                   │                   │
     │<─────────────────┤                   │                   │
     │                  │                   │                   │
     │ 8. Redirect      │                   │                   │
     │<─────────────────┤                   │                   │
```

---

## Security Architecture

### 1. Authentication Security

**JWT Token Structure**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "restaurant",
  "iat": 1699564800,
  "exp": 1699582800
}
```

**Session Management**:
- Access tokens expire after 5 hours
- Refresh tokens for automatic renewal
- HttpOnly cookies prevent XSS attacks
- SameSite cookies prevent CSRF attacks

---

### 2. Row Level Security (RLS)

**Example Policy**:
```sql
-- Restaurants can only see their own orders
CREATE POLICY "restaurants_view_own_orders"
  ON orders FOR SELECT
  USING (auth.uid() = restaurant_id);

-- Admins can see all orders
CREATE POLICY "admins_view_all_orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

---

### 3. Input Validation

**Client-Side** (Zod):
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
```

**Server-Side** (PostgreSQL Constraints):
```sql
ALTER TABLE orders
  ADD CONSTRAINT valid_total
  CHECK (total_amount >= 0);
```

---

### 4. API Security

- ✅ HTTPS only in production
- ✅ CORS configuration
- ✅ Rate limiting (100 req/min)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)

---

## Scalability Considerations

### Horizontal Scaling

**Database**:
- Read replicas for read-heavy operations
- Connection pooling (PgBouncer)
- Query optimization with indexes

**Frontend**:
- CDN for static assets (Vercel Edge Network)
- Image optimization (Next.js Image component)
- Code splitting and lazy loading

**Real-time**:
- Connection throttling (5 updates/sec)
- Reconnection with exponential backoff
- Filtered subscriptions

---

### Vertical Scaling

**Database**:
- Current: Supabase Free Tier (500MB)
- Upgrade path: Pro ($25/mo, 8GB)
- Enterprise: Custom configuration

**Compute**:
- Serverless Edge Functions auto-scale
- Next.js serverless functions on Vercel

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**:
   - Lazy loading dashboards
   - Dynamic imports for heavy components
   - Route-based code splitting

2. **Caching Strategy**:
   - React Query for server state (staleTime: 30s-5min)
   - Browser caching for static assets
   - Service Worker for offline support

3. **Image Optimization**:
   - Next.js Image component
   - WebP format with fallbacks
   - Responsive images

4. **Performance Hooks**:
   - `useDebounce` for search (300ms)
   - `useThrottle` for scroll/resize (300ms)
   - `React.memo` for expensive components

---

### Backend Optimization

1. **Database Indexes**:
   - 15+ indexes on frequently queried columns
   - Composite indexes for common queries
   - Geospatial indexes for location queries

2. **Query Optimization**:
   - Select only needed columns
   - Limit joins to 2-3 levels
   - Use pagination (limit 20-50)

3. **Real-time Optimization**:
   - Database-level filtering
   - Throttled updates (5/sec max)
   - Auto-cleanup on unmount

---

## Monitoring and Logging

### Application Monitoring

- **Frontend**: Custom logger with levels (debug, info, warn, error)
- **Backend**: Supabase Dashboard metrics
- **Real-time**: Connection status tracking

### Performance Metrics

- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

---

## Deployment Architecture

### Production Environment

```
┌───────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               Next.js Application                   │  │
│  │  • SSR/SSG Pages                                    │  │
│  │  • Serverless Functions                             │  │
│  │  • Static Assets (CDN)                              │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────┘
                            │
                            │ HTTPS
                            │
┌───────────────────────────┼───────────────────────────────┐
│                      Supabase Cloud                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Database (PostgreSQL 15.x)                  │  │
│  │  • Row Level Security                               │  │
│  │  • Automatic Backups                                │  │
│  │  • Point-in-time Recovery                           │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Authentication Service                      │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Real-time Service (WebSocket)               │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Storage Service (S3-compatible)             │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [Database Schema](./database-schema.md)
- [Authentication Flow](./auth-flow.md)
- [Order Flow](./order-flow.md)
- [Deployment Guide](../deployment/README.md)

---

**End of System Overview Documentation**
