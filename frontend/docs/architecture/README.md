# Architecture Documentation

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05

---

## Overview

This directory contains comprehensive architecture documentation for the Distribution Management System, including system design, data flows, security architecture, and deployment strategies.

---

## Documentation Index

### 1. [System Overview](./system-overview.md)
**Purpose**: High-level system architecture and technology stack

**Contents**:
- Architecture diagrams (Client, Frontend, Backend layers)
- Technology stack breakdown
- System components explanation
- Data flow patterns
- Security architecture overview
- Scalability considerations
- Performance optimization strategies
- Deployment architecture

**When to Read**: Start here for overall system understanding

---

### 2. [Database Schema](./database-schema.md)
**Purpose**: Complete database design documentation

**Contents**:
- Entity Relationship Diagram (ERD)
- All table schemas with constraints
- Indexes and performance optimization
- Row Level Security (RLS) policies
- Database functions and triggers
- Views and aggregations
- Migration strategy

**When to Read**: When working with database queries, adding tables, or understanding data relationships

---

### 3. [Authentication Flow](./auth-flow.md)
**Purpose**: Authentication and authorization documentation

**Contents**:
- Login/logout flows
- Session management
- JWT token structure
- Role-Based Access Control (RBAC)
- Security features (CSRF, XSS protection)
- Password requirements
- Rate limiting
- Cookie security

**When to Read**: When implementing auth features or debugging login issues

---

### 4. [Order Flow](./order-flow.md)
**Purpose**: Complete order lifecycle documentation

**Contents**:
- Order creation flow
- Order status transitions
- Driver assignment process
- Delivery workflow
- Real-time updates
- Error handling
- Cancellation flow

**When to Read**: When working on order management features

---

## Quick Reference Diagrams

### System Architecture (3-Tier)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Browser    │  │   Mobile     │  │   Desktop    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                       HTTPS / WSS
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                  PRESENTATION TIER (Next.js)                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  React Components + Server/Client Components              │    │
│  │  State Management (Zustand + React Query)                 │    │
│  │  Real-time Subscriptions                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                     REST / GraphQL / WS
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                   DATA TIER (Supabase)                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database (RLS-enabled)                         │    │
│  │  Authentication Service (JWT)                              │    │
│  │  Real-time Service (WebSocket)                             │    │
│  │  Storage Service (S3-compatible)                           │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Database Relationships

```
┌──────────────┐
│ auth.users   │ (Supabase managed)
└──────┬───────┘
       │
       │ 1:1
       ▼
┌──────────────┐
│  profiles    │ (role: admin, restaurant, driver)
└──────┬───────┘
       │
       ├─────────────────────┐
       │                     │
       │ restaurant_id       │ driver_id
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│   orders     │      │   orders     │
└──────┬───────┘      └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐      ┌──────────────┐
│ order_items  │──N:1─│   products   │
└──────────────┘      └──────┬───────┘
                             │
                             │ N:1
                             ▼
                      ┌──────────────┐
                      │  categories  │
                      └──────────────┘
```

---

### User Role Hierarchy

```
                         ┌───────┐
                         │ ADMIN │
                         └───┬───┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
             ┌────▼────┐          ┌────▼────┐
             │RESTAURANT│          │ DRIVER  │
             └─────────┘          └─────────┘

Permissions:
• Admin: Full system access, user management, driver assignment
• Restaurant: Create orders, view own orders, manage products
• Driver: View assigned orders, update delivery status, manage availability
```

---

### Order Status Flow

```
pending → confirmed → priced → assigned → picked_up → in_transit → delivered
   ↓         ↓         ↓          ↓           ↓            ↓
cancelled cancelled cancelled cancelled  cancelled   cancelled

Actors:
• pending → confirmed: Restaurant
• confirmed → priced: Restaurant/Admin
• priced → assigned: Admin/System
• assigned → picked_up: Driver
• picked_up → in_transit: Driver
• in_transit → delivered: Driver
• any → cancelled: All roles (with restrictions)
```

---

### Authentication Flow (Simplified)

```
User → Browser → Next.js Server → Supabase Auth → Database
                      ↓
                 Set Cookies
                 (HttpOnly)
                      ↓
                  Redirect to
                  Dashboard
```

---

### Real-time Data Flow

```
┌──────────────┐
│  Database    │ (PostgreSQL)
└──────┬───────┘
       │
       │ Change event
       ▼
┌──────────────┐
│  Realtime    │ (Supabase)
│  Server      │
└──────┬───────┘
       │
       │ WebSocket
       ▼
┌──────────────┐
│  Client      │ (Browser)
│  Component   │
└──────────────┘
       │
       │ Update UI
       ▼
    Display
```

---

## Architecture Principles

### 1. **Separation of Concerns**
- **Presentation**: Next.js + React components
- **Business Logic**: Server actions + API routes
- **Data Access**: Supabase client with RLS
- **Security**: Row Level Security policies

### 2. **Security First**
- All database tables have RLS enabled
- JWT-based authentication
- HttpOnly cookies for session tokens
- Input validation on client and server
- HTTPS-only in production

### 3. **Performance Optimization**
- Code splitting with lazy loading
- React Query for data caching
- Database indexes on frequent queries
- Image optimization with Next.js Image
- CDN for static assets

### 4. **Scalability**
- Serverless architecture (Next.js + Supabase)
- Horizontal scaling via cloud providers
- Database connection pooling
- Caching strategies (React Query)

### 5. **Real-time by Default**
- WebSocket connections for live updates
- Optimistic UI updates
- Automatic reconnection
- Throttled updates (5/sec max)

---

## Technology Decisions

### Why Next.js 15?
✅ **Server Components**: Reduced client-side JavaScript
✅ **App Router**: Better routing and layouts
✅ **Server Actions**: Type-safe API calls
✅ **Image Optimization**: Automatic WebP conversion
✅ **SEO**: Built-in meta tags and sitemaps

### Why Supabase?
✅ **PostgreSQL**: Industry-standard relational database
✅ **Row Level Security**: Built-in authorization
✅ **Real-time**: Native WebSocket support
✅ **Authentication**: JWT-based, battle-tested
✅ **Storage**: S3-compatible object storage
✅ **Edge Functions**: Serverless compute

### Why TypeScript?
✅ **Type Safety**: Catch errors at compile time
✅ **IntelliSense**: Better developer experience
✅ **Refactoring**: Safer code changes
✅ **Documentation**: Types serve as docs

### Why Tailwind CSS?
✅ **Utility-First**: Rapid UI development
✅ **Consistency**: Design system built-in
✅ **Performance**: Purges unused CSS
✅ **Dark Mode**: First-class support

---

## Performance Benchmarks

### Core Web Vitals (Target)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ~2.1s | ✅ Good |
| **FID** (First Input Delay) | < 100ms | ~45ms | ✅ Good |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ~0.05 | ✅ Good |

### Database Query Performance

| Query Type | Target | Average | Status |
|------------|--------|---------|--------|
| **Simple SELECT** | < 50ms | ~25ms | ✅ Fast |
| **JOIN (2 tables)** | < 100ms | ~60ms | ✅ Fast |
| **JOIN (3+ tables)** | < 200ms | ~150ms | ✅ Acceptable |
| **Full-text search** | < 500ms | ~300ms | ✅ Good |

### API Response Times

| Endpoint | Target | P95 | Status |
|----------|--------|-----|--------|
| **/api/auth/login** | < 500ms | ~350ms | ✅ Good |
| **/api/orders** (list) | < 300ms | ~200ms | ✅ Good |
| **/api/products** (list) | < 200ms | ~120ms | ✅ Fast |
| **/api/orders/:id** | < 150ms | ~80ms | ✅ Fast |

---

## Security Considerations

### Authentication Security
- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT token expiry (5 hours)
- ✅ HttpOnly cookies (XSS protection)
- ✅ SameSite cookies (CSRF protection)
- ✅ Rate limiting (5 attempts / 15 min)

### Database Security
- ✅ Row Level Security on all tables
- ✅ Parameterized queries (SQL injection protection)
- ✅ Input validation with Zod schemas
- ✅ Encrypted connections (SSL/TLS)
- ✅ Automatic backups (daily)

### API Security
- ✅ CORS configuration
- ✅ Rate limiting (100 req/min per user)
- ✅ Request size limits (10MB max)
- ✅ HTTPS-only in production
- ✅ API key rotation

---

## Deployment Strategy

### Environments

| Environment | Purpose | URL | Database |
|-------------|---------|-----|----------|
| **Development** | Local development | localhost:3000 | Local Supabase |
| **Staging** | Testing before production | staging.app.com | Staging DB |
| **Production** | Live application | app.com | Production DB |

### Deployment Pipeline

```
┌──────────────┐
│   Git Push   │
│   to main    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   GitHub     │
│   Actions    │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Build      │  │    Tests     │
│   (Next.js)  │  │ (Vitest+E2E) │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
         ┌──────────────┐
         │   Deploy to  │
         │    Vercel    │
         └──────────────┘
```

---

## Monitoring and Logging

### Application Monitoring
- **Vercel Analytics**: Performance metrics
- **Supabase Dashboard**: Database metrics
- **Custom Logger**: Application logs

### Error Tracking
- **Console logging**: Development
- **Sentry** (future): Production error tracking
- **Log levels**: debug, info, warn, error

### Metrics Collected
- Page load times
- API response times
- Database query performance
- Error rates
- User activity

---

## Future Considerations

### Planned Improvements
1. **Caching Layer**: Redis for frequently accessed data
2. **Search**: Elasticsearch for advanced product search
3. **Mobile Apps**: React Native for iOS/Android
4. **Analytics**: Advanced dashboards and reporting
5. **Notifications**: Push notifications for order updates
6. **Payment Integration**: Stripe/PayPal integration
7. **Multi-language**: i18n support (Georgian + English)

### Scalability Roadmap
- **Phase 1** (Current): Serverless architecture (0-1000 users)
- **Phase 2**: Database read replicas (1000-10,000 users)
- **Phase 3**: Microservices architecture (10,000+ users)
- **Phase 4**: Multi-region deployment (Global scale)

---

## Related Documentation

### API Documentation
- [Authentication API](../api/authentication.md)
- [Products API](../api/products.md)
- [Orders API](../api/orders.md)
- [Users API](../api/users.md)
- [Swagger/OpenAPI Spec](../api/swagger.yaml)

### Component Documentation
- [Component Overview](../components/README.md)
- [Button Component](../components/button.md)
- [Card Component](../components/card.md)
- [Form Component](../components/form.md)
- [Dialog Component](../components/dialog.md)

### Deployment Documentation
- [Prerequisites](../deployment/prerequisites.md)
- [Environment Setup](../deployment/environment-setup.md)
- [Database Setup](../deployment/database-setup.md)
- [Frontend Deployment](../deployment/frontend-deployment.md)
- [CI/CD Pipeline](../deployment/ci-cd.md)

---

## Glossary

| Term | Definition |
|------|------------|
| **RLS** | Row Level Security - PostgreSQL security feature |
| **JWT** | JSON Web Token - Authentication token format |
| **SSR** | Server-Side Rendering - Next.js rendering strategy |
| **SSG** | Static Site Generation - Pre-rendered pages |
| **CSR** | Client-Side Rendering - Browser rendering |
| **RBAC** | Role-Based Access Control - Authorization model |
| **CORS** | Cross-Origin Resource Sharing - HTTP header |
| **CSRF** | Cross-Site Request Forgery - Security vulnerability |
| **XSS** | Cross-Site Scripting - Security vulnerability |
| **CDN** | Content Delivery Network - Asset distribution |

---

**End of Architecture Documentation README**
