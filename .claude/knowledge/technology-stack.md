# Technology Stack

> **ტექნოლოგიური სტეკი** | Complete technology breakdown

---

## 🎨 Frontend Stack

### Core Framework
- **Next.js 15.5.0** - React framework with App Router
  - Server Components by default
  - Streaming SSR
  - Built-in optimization
  - API routes
- **React 19.2.0** - UI library
  - React Compiler enabled
  - Concurrent features
  - Server Components
  - Actions

### Language & Type Safety
- **TypeScript 5+** - Strict mode enabled
  - Type-safe database queries
  - Zod schema inference
  - Full IDE support

### Styling
- **Tailwind CSS v4** - Utility-first CSS
  - Custom design system
  - Responsive design
  - Dark mode ready (planned)
- **shadcn/ui** - Component library
  - 99.3% registry compatibility ⭐
  - Accessible components
  - Customizable themes

### State Management
- **Zustand** - Client state
  - Simple, lightweight
  - No boilerplate
  - TypeScript support
- **TanStack Query v5.90.5** - Server state
  - Caching
  - Optimistic updates
  - Real-time synchronization
  - Automatic refetching

### Forms & Validation
- **React Hook Form** - Form management
  - Performance optimized
  - Easy validation
- **Zod v4.1.12** - Schema validation
  - Runtime type checking
  - TypeScript integration
  - Custom error messages

### Data Visualization
- **Recharts v2.12.7** - Charts library
  - Line charts for trends
  - Bar charts for comparisons
  - Pie charts for distribution
  - Responsive design

---

## 🗄️ Backend Stack

### Database
- **PostgreSQL 15+** - Relational database
  - JSONB support
  - Full-text search
  - Geospatial data (PostGIS ready)
- **Supabase** - Backend-as-a-Service
  - **Development:** Official hosted (akxmacfsltzhbnunoepb.supabase.co)
  - **Production:** Self-hosted VPS (data.greenland77.ge)

### Supabase Services
- **PostgREST** - Automatic REST API from database schema
- **GoTrue** - Authentication service (JWT-based)
- **Realtime** - WebSocket server for live updates
- **Storage** - File storage (S3-compatible)
- **Edge Functions** - Serverless functions (Deno runtime)

### Security
- **Row-Level Security (RLS)** - Database-level security
  - 25+ comprehensive policies
  - Multi-tenant isolation
  - Role-based access control
- **JWT** - Stateless authentication
  - Short-lived access tokens
  - Refresh token rotation
  - Role claims in token

---

## 🚀 Infrastructure

### Hosting
- **Frontend:** Dockploy on Contabo VPS
  - Domain: greenland77.ge
  - HTTPS with Let's Encrypt
  - CDN: Cloudflare (planned)
- **Backend:** Self-hosted Supabase
  - Domain: data.greenland77.ge
  - PostgreSQL 15
  - All Supabase services containerized

### Container Orchestration
- **Docker** - Containerization
- **Docker Compose** - Multi-container management
- **Dockploy** - Deployment platform
  - Git-based deployments
  - Zero-downtime deployments
  - Automatic SSL

### VPS Specifications
- **Provider:** Contabo Cloud VPS
- **OS:** Ubuntu 22.04 LTS
- **Resources:** Scalable based on needs
- **Location:** Europe (Georgia-optimized routing)

---

## 🧪 Testing & Quality

### Testing Framework
- **Vitest v2.1.8** - Unit & integration testing
  - Fast execution
  - Vite integration
  - Coverage reporting
- **Testing Library** - React component testing
  - User-centric queries
  - Async utilities
- **Puppeteer v24.27.0** - E2E testing
  - Browser automation
  - Screenshot testing

### Code Quality
- **ESLint** - Linting
  - Next.js rules
  - TypeScript rules
  - Custom rules
- **Prettier** - Code formatting
  - Consistent style
  - Automatic formatting
- **Trunk** - Code quality platform
  - Multiple linters
  - Security scanning

---

## 📊 Monitoring & Observability

### Error Tracking
- **Sentry** - Application monitoring
  - Organization: sitech-bg
  - Project: georgian-distribution
  - Region: EU (Germany)
  - Real-time error alerts
  - Performance monitoring

### Analytics (Planned)
- **Plausible** - Privacy-friendly analytics
- **Custom Analytics** - Business metrics dashboard

---

## 🔧 Development Tools

### MCP Integrations
- **Supabase MCP** - Database operations
- **GitHub MCP** - Repository management
- **Sentry MCP** - Error tracking
- **Perplexity MCP** - Research assistance
- **Context7 MCP** - Library documentation
- **shadcn MCP** - UI component management
- **Chrome DevTools MCP** - Browser debugging
- **Sequential Thinking MCP** - AI assistance

### Package Management
- **npm** - Package manager
  - Lock file for reproducibility
  - Scripts for common tasks

### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting
  - Actions for CI/CD
  - Branch protection
  - Pull request workflow

---

## 📦 Key Dependencies

### Production Dependencies
```json
{
  "next": "15.5.0",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "@supabase/supabase-js": "^2.50.0",
  "@tanstack/react-query": "^5.90.5",
  "zustand": "^5.0.3",
  "zod": "^4.1.12",
  "react-hook-form": "^7.55.0",
  "recharts": "^2.12.7",
  "@sentry/nextjs": "^8.50.0",
  "tailwindcss": "^4.0.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.7.3",
  "vitest": "^2.1.8",
  "@testing-library/react": "^16.1.0",
  "eslint": "^9.18.0",
  "prettier": "^3.4.2",
  "puppeteer": "^24.27.0"
}
```

---

## 🌐 API & Integration

### REST API
- **Next.js API Routes** - Backend endpoints
  - `/api/orders` - Order management
  - `/api/products` - Product catalog
  - `/api/analytics` - Analytics data
  - `/api/auth` - Authentication
  - `/api/csrf` - CSRF token

### WebSocket (Real-time) ✅ **ADVANCED IMPLEMENTATION**
- **Supabase Realtime** - Enterprise-grade live updates
  - ✅ Order status changes
  - ✅ Notifications
  - ✅ User presence tracking
  - ✅ Inventory tracking
  - ✅ GPS/Driver location tracking
  - ✅ Chat messages
- **Connection Manager** - Sophisticated connection handling
  - Exponential backoff reconnection
  - Message queuing (offline resilience)
  - Heartbeat monitoring (30s interval)
  - Connection quality tracking
  - Latency measurement
  - Max 100 queued messages

### External Services
- **Sentry** - Error tracking
- **Cloudflare** - DNS & CDN (planned)
- **Let's Encrypt** - SSL certificates

---

## 📱 Progressive Web App ✅ **IMPLEMENTED**

### PWA Features - FULLY OPERATIONAL
- ✅ **Offline support** - Service workers with Workbox
- ✅ **Install prompt** - Add to home screen
- ✅ **Push notifications** - Fully implemented
- ✅ **Background sync** - Automatic offline order sync
- ✅ **IndexedDB storage** - Offline data persistence
- ✅ **Geolocation** - Driver GPS tracking
- ✅ **Standalone mode** - App-like experience
- ✅ **Cache strategies** - Smart caching for performance

### PWA Implementation Details
- **Service Worker:** Workbox-powered with cache-first strategy
- **Offline Storage:** IndexedDB for orders, products, preferences
- **Background Sync:** Automatic upload when connection restored
- **Push Notifications:** Order status, assignments, announcements
- **Manifest:** Complete PWA manifest with icons
- **Browser Support:** Chrome, Edge, Firefox, Safari (partial)

---

## 🔒 Security Stack

### Authentication
- **Supabase Auth** - User authentication
- **JWT** - Token-based auth
- **Password hashing** - bcrypt (via Supabase)

### Authorization
- **RLS Policies** - Database-level
- **Middleware** - API route protection
- **Role-based** - Admin/Restaurant/Driver/Demo

### Protection
- **CSRF tokens** - Cross-site request forgery protection
- **Rate limiting** - API abuse prevention
- **Input validation** - Zod schemas
- **SQL injection** - Parameterized queries (via Supabase client)
- **XSS protection** - React escaping + DOMPurify

---

## 📈 Performance

### Optimization Techniques
- **Server Components** - Reduce client bundle
- **Code splitting** - Dynamic imports
- **Image optimization** - Next.js Image component
- **Database indexes** - 12 strategic indexes
- **Query optimization** - Select only needed fields
- **Caching** - TanStack Query + CDN

### Performance Targets
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Lighthouse Score:** > 90
- **Core Web Vitals:** All green

---

## 🔄 CI/CD Pipeline

### GitHub Actions
- **Test workflow** - Run on PR
- **Build workflow** - Verify build
- **Deploy workflow** - Auto-deploy on merge

### Deployment Flow
```
Git Push → GitHub → Dockploy → Docker Build → Deploy → Health Check
```

---

**Last Updated:** 2025-11-03
**Tech Stack Version:** Production-ready
**Dependencies:** 50+ packages, all up-to-date
