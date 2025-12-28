# Georgian Distribution Management System - Comprehensive Research Request for Perplexity Labs

## 🎯 Research Objective

I need **deep, comprehensive research** with **industry best practices** and **expert recommendations** for a production-ready B2B food distribution SaaS platform. This research should result in **5-10 detailed markdown files** (each 2000-3000 words) covering specific technical domains with actionable recommendations, code examples, and implementation strategies.

---

## 📋 PART 1: Executive Summary

### What We're Building

**Georgian Distribution Management System** is an enterprise-grade B2B food distribution platform serving the Georgian market. It connects **restaurants** (buyers) with **distributors** (sellers) through a real-time order management system, featuring:

- **Multi-tenant SaaS architecture** with 4 distinct user roles
- **Real-time order tracking** via WebSocket connections
- **Progressive Web App (PWA)** for mobile-first experience
- **Self-hosted infrastructure** on VPS for full data sovereignty
- **Georgian + English bilingual** support

**Tech Stack:**
- Frontend: Next.js 15.5.0 + React 19.2.0 + TypeScript
- Backend: Self-hosted Supabase (PostgreSQL + Realtime + Auth)
- Deployment: Contabo VPS + Docker + Dockploy
- State Management: TanStack Query + Zustand
- UI: shadcn/ui + Tailwind CSS v4

**Current Status:**
- ✅ Analytics Dashboard (100% complete - 17/17 tasks)
- 🔄 Restaurant Order Management (starting - 0/12 tasks)
- ⏳ Driver Mobile Optimization (planned)
- ⏳ Performance Monitoring (planned)

**Scale Target:**
- 50-100 concurrent users initially
- 1,000+ orders per day capacity
- <200ms API response times
- 99.9% uptime SLA

---

## 📋 PART 2: System Architecture Overview

### 2.1 Dual-Environment Strategy

**Development:**
- Official Supabase Cloud (akxmacfsltzhbnunoepb.supabase.co)
- Fast iteration without infrastructure management
- Full dashboard access for debugging
- Automatic backups and scaling

**Production:**
- Self-hosted Supabase on Contabo VPS (data.greenland77.ge)
- Complete data sovereignty (critical for Georgian market)
- No vendor lock-in
- Cost optimization at scale
- Custom backup and monitoring

### 2.2 Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Client Layer                          │
│  (Browser + PWA / Mobile Web / Offline Cache)          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/WSS
┌────────────────────▼────────────────────────────────────┐
│              Next.js 15 Frontend                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Server Components (SSR/SSG)                     │   │
│  │ Client Components (Interactive)                 │   │
│  │ API Routes (/api/* - 25+ endpoints)            │   │
│  │ Middleware (Auth, CSRF, Rate Limiting)         │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ PostgreSQL Protocol + WebSocket
┌────────────────────▼────────────────────────────────────┐
│         Self-Hosted Supabase Backend                    │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ PostgreSQL 15+   │  │ GoTrue Auth      │           │
│  │ - RLS enabled    │  │ - JWT tokens     │           │
│  │ - 25+ policies   │  │ - MFA support    │           │
│  │ - 12 indexes     │  │ - Role claims    │           │
│  └──────────────────┘  └──────────────────┘           │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Realtime Engine  │  │ Storage API      │           │
│  │ - WebSocket      │  │ - File uploads   │           │
│  │ - 6 channels     │  │ - Image CDN      │           │
│  └──────────────────┘  └──────────────────┘           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              External Services                          │
│  - Sentry (Error Tracking)                             │
│  - MCP Servers (Development Tools)                     │
│  - GitHub Actions (CI/CD)                              │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Multi-Tenant Security Model

**Three-Layer Security:**

1. **Application Layer**
   - Role-based UI rendering
   - Client-side permission checks
   - Route guards (RoleGuard component)
   - Form validation with Zod

2. **API Layer**
   - JWT verification on all endpoints
   - CSRF token protection
   - Rate limiting configuration
   - Input sanitization

3. **Database Layer (PRIMARY)**
   - Row-Level Security (RLS) - 25+ policies
   - Role-based data isolation
   - Cascade delete protections
   - Audit logging

**User Roles:**

- **Admin** - Full system access, order management with pricing, analytics
- **Restaurant** - Order placement, tracking, history, cost visibility
- **Driver** - Assigned delivery viewing, status updates, GPS tracking
- **Demo** - Read-only access, 7-day data limit, conversion prompts

---

## 📋 PART 3: Technical Stack Deep Dive

### 3.1 Frontend Technology Stack

**Core Framework:**
```json
{
  "next": "15.5.0",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "typescript": "^5.7.2"
}
```

**Key Dependencies:**
- **UI Framework:** shadcn/ui (99.3% compatibility) + Radix UI primitives
- **Styling:** Tailwind CSS v4 + tailwindcss-animate
- **State Management:**
  - TanStack Query v5.90.5 (server state, caching, refetching)
  - Zustand v5.0.8 (client state)
- **Forms:** React Hook Form v7.65.0 + Zod v4.1.12
- **Database Client:** @supabase/ssr v0.7.0 + @supabase/supabase-js v2.77.0
- **Charts:** Recharts v2.16.2
- **Icons:** Lucide React v0.469.0
- **Testing:** Vitest v4.0.10 + Playwright v1.56.1
- **Error Tracking:** @sentry/nextjs v8.50.0

**Build Configuration:**
- **Turbo Mode:** Enabled for faster builds
- **Code Splitting:** Vendors, Supabase, UI components separated
- **Image Optimization:** Next.js Image with remote patterns
- **Security Headers:** CSP, X-Frame-Options, HSTS
- **Source Maps:** Enabled for production debugging

### 3.2 Database Architecture

**Schema (6 Core Tables):**

1. **profiles** - User metadata, roles, multi-tenant isolation
2. **products** - Catalog (bilingual names, categories, pricing)
3. **orders** - Order master records (status workflow, timestamps)
4. **order_items** - Line items (quantity, pricing, totals)
5. **notifications** - User alerts (read/unread tracking)
6. **demo_sessions** - Demo access management

**Performance Optimizations:**
- 12 strategic indexes (foreign keys, status, timestamps)
- Efficient query patterns (select specific columns)
- Connection pooling via Supabase
- Materialized views (planned for analytics)

**RLS Policies (25+):**
- Admin: Full access override
- Restaurant: Own orders only (restaurant_id = auth.uid())
- Driver: Assigned deliveries only (driver_id = auth.uid())
- Demo: Read-only, 7-day window

### 3.3 Real-time Features

**WebSocket Connection Manager (494 lines):**
- State management: disconnected → connecting → connected → reconnecting
- Exponential backoff (1s → 30s, max 10 attempts)
- Message queuing (100 messages max, offline resilience)
- Heartbeat system (30s interval, latency tracking)
- Connection quality monitoring

**Active Channels:**
- `orders` - Order status updates
- `notifications` - User alerts
- `user-presence` - Online/offline tracking
- `inventory-tracking` - Stock changes
- `gps-tracking` - Driver locations
- `chat` - Messaging system

### 3.4 PWA Implementation

**Features:**
- Service Worker with Workbox
- IndexedDB for offline storage
- Background sync for pending orders
- Push notifications capability
- Add to home screen
- App-like standalone mode
- Cached product catalog

---

## 📋 PART 4: Current Implementation Status & Challenges

### 4.1 Completed Features (✅ Analytics Dashboard)

**17/17 Tasks Complete:**
- Real-time KPI tracking (orders, revenue, AOV)
- Interactive charts with Recharts
- Date range filtering (7/14/30 days + custom)
- Status filtering (all statuses)
- CSV export functionality
- Georgian language support
- Mobile-responsive design
- Performance optimized for large datasets

**Metrics Tracked:**
- Total orders, revenue, average order value
- Orders by status/restaurant/driver
- Daily trends and comparisons

### 4.2 In Progress (🔄 Restaurant Order Management)

**0/12 Tasks:**
- Bulk operations for restaurants
- Advanced filtering and search
- Order templates for frequent orders
- Enhanced order history
- Quick reorder functionality
- PDF invoice generation
- Order comments and notes
- Export capabilities

### 4.3 Current Challenges & Technical Debt

**Performance:**
- Large order lists need pagination optimization
- Real-time connection stability under load needs testing
- Bundle size optimization opportunities

**Testing:**
- Test coverage at baseline, target 80%+
- Need more E2E tests for critical flows
- Integration test suite for all API routes

**Database:**
- Query performance monitoring needed
- Potential for materialized views (analytics)
- Backup automation refinement

**Monitoring:**
- Comprehensive logging system needed
- Distributed tracing for debugging
- Custom metrics dashboard

**Documentation:**
- Auto-generated API documentation (OpenAPI/Swagger)
- Architecture decision records
- Runbook for operations

### 4.4 Scalability Concerns

**Current Setup:**
- Single VPS server (Contabo)
- No horizontal scaling yet
- No database replication
- Basic health checks only

**Future Needs:**
- Load balancing strategy
- Database read replicas
- Caching layer (Redis?)
- CDN for static assets
- Distributed monitoring

---

## 📋 PART 5: Self-Hosted Supabase Deployment Context

### 5.1 VPS Infrastructure

**Contabo VPS Specifications:**
- Provider: Contabo (data.greenland77.ge)
- OS: Linux (Docker-based)
- Orchestration: Dockploy automation
- Network: Bridge network (distribution-network)

**Frontend Container:**
- Base Image: node:22-alpine
- Multi-stage build (deps → builder → runner)
- Port Mapping: 3003:3000
- Resource Limits: 3 CPU / 6GB RAM max
- Health Checks: 30s interval, 10s timeout
- Non-root user (nextjs:1001)

### 5.2 Docker Configuration

**Dockerfile.production:**
- Stage 1: Install production deps only
- Stage 2: Build Next.js app
- Stage 3: Minimal runtime (alpine)
- Security: Non-root user, minimal surface
- Health checks: liveness + readiness

**Health Endpoints:**
- `/api/health/liveness` - App running check
- `/api/health/readiness` - Database connectivity check

**docker-compose.yml:**
```yaml
services:
  frontend:
    build: ./frontend/Dockerfile.production
    ports: ["3003:3000"]
    environment: [build-time variables]
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
    deploy:
      resources:
        limits: {cpus: '3', memory: 6G}
        reservations: {cpus: '1', memory: 1G}
```

### 5.3 Self-Hosted Supabase Setup

**Components:**
- PostgreSQL 15+ database
- GoTrue authentication server
- Realtime WebSocket server
- Storage API for file uploads
- Kong API gateway

**Configuration Challenges:**
- Environment variable management (dev vs prod)
- Database migration automation
- Backup and recovery procedures
- Monitoring and alerting
- SSL certificate management
- Network security (firewall rules)

### 5.4 Deployment Process

**Current Workflow:**
1. Git push to `main` branch
2. Dockploy detects changes
3. Automatic Docker build
4. Health checks pass
5. Rolling deployment (zero downtime goal)
6. Sentry deployment tracking

**Gaps:**
- No automated database migrations
- Manual health verification
- No rollback automation
- Limited monitoring

---

## 📋 PART 6: Research Questions & Expected Output

### 🔍 Research Categories

I need **deep, comprehensive research** across these 10 categories, with **best practices, code examples, architecture diagrams, and actionable recommendations** in each area:

---

### **1. Self-Hosted Supabase Production Best Practices**

**Questions:**
- What are the **production-grade deployment strategies** for self-hosted Supabase?
- How should we configure **PostgreSQL** for optimal performance (connection pooling, query optimization, vacuum strategies)?
- What are the **backup and disaster recovery** best practices (PITR, logical backups, testing recovery)?
- How to implement **high availability** with self-hosted Supabase (failover, replication)?
- What **monitoring tools** are recommended (Prometheus, Grafana, custom metrics)?
- How to handle **database migrations** safely in production (zero-downtime migrations)?
- What are the **security hardening** steps for self-hosted Supabase (network policies, encryption, access controls)?
- How to optimize **GoTrue authentication** configuration?
- What's the best approach for **Realtime server** scaling and performance?

**Expected Output:** `BEST-PRACTICES-SELFHOSTED-SUPABASE.md` (2500-3000 words)

---

### **2. Next.js 15 + React 19 Optimization Patterns**

**Questions:**
- What are the **latest performance optimization techniques** for Next.js 15 App Router?
- How to leverage **React Server Components** effectively (streaming, suspense, partial pre-rendering)?
- What are the **caching strategies** (fetch cache, data cache, full route cache)?
- How to optimize **bundle size** (code splitting, tree shaking, dynamic imports)?
- What are the **image optimization** best practices with Next.js Image?
- How to implement **incremental static regeneration (ISR)** for dynamic content?
- What **security headers** should be configured?
- How to optimize **Core Web Vitals** (LCP, FID, CLS)?
- What are the **React 19 specific features** we should leverage (React Compiler, Server Actions)?

**Expected Output:** `NEXTJS-REACT19-OPTIMIZATION-GUIDE.md` (2500-3000 words)

---

### **3. Multi-Tenant RLS Security Patterns**

**Questions:**
- What are the **industry-standard RLS patterns** for multi-tenant SaaS?
- How to prevent **RLS policy bypass** vulnerabilities?
- What are the **performance implications** of complex RLS policies?
- How to test RLS policies comprehensively (unit tests, integration tests)?
- What are the **common RLS anti-patterns** to avoid?
- How to implement **hierarchical access control** (admin override patterns)?
- What are the **audit logging** best practices for RLS?
- How to handle **RLS policy performance** at scale?
- What tools exist for **RLS policy validation** and testing?

**Expected Output:** `RLS-SECURITY-PATTERNS.md` (2000-2500 words)

---

### **4. Real-Time WebSocket Performance Strategies**

**Questions:**
- What are the **scalable architectures** for WebSocket-based real-time features?
- How to implement **connection pooling** for WebSockets?
- What are the **reconnection strategies** (exponential backoff, jitter)?
- How to handle **message queuing** during offline periods?
- What **monitoring metrics** are critical for WebSocket health (latency, dropped connections)?
- How to implement **heartbeat/ping-pong** mechanisms effectively?
- What are the **load balancing** strategies for WebSocket servers?
- How to handle **state synchronization** across multiple clients?
- What are the **security considerations** for WebSocket authentication?

**Expected Output:** `REALTIME-PERFORMANCE-STRATEGIES.md` (2000-2500 words)

---

### **5. VPS Deployment & Production Monitoring**

**Questions:**
- What is a **comprehensive deployment checklist** for production VPS?
- How to implement **zero-downtime deployments** with Docker?
- What **monitoring stack** is recommended (Prometheus + Grafana, Datadog, New Relic)?
- How to set up **alerting** for critical issues (PagerDuty, Slack integration)?
- What are the **backup automation** strategies?
- How to implement **log aggregation** (ELK stack, Loki)?
- What **security hardening** steps for VPS (firewall, SSH keys, fail2ban)?
- How to configure **reverse proxy** (Nginx, Traefik) for optimal performance?
- What are the **disaster recovery procedures**?

**Expected Output:** `VPS-DEPLOYMENT-CHECKLIST.md` (2500-3000 words)

---

### **6. Database Query Optimization Techniques**

**Questions:**
- How to identify **slow queries** (pg_stat_statements, query logging)?
- What **indexing strategies** for different query patterns (B-tree, GiST, GIN)?
- How to optimize **JOIN performance** (query planning, statistics)?
- What are the **query rewriting** techniques for performance?
- How to use **EXPLAIN ANALYZE** effectively?
- What **connection pooling** strategies are recommended (PgBouncer, Supavisor)?
- How to implement **query caching** (application-level, Redis)?
- What are the **vacuum and autovacuum** best practices?
- How to handle **N+1 query problems** in ORM contexts?

**Expected Output:** `DATABASE-OPTIMIZATION-GUIDE.md` (2500-3000 words)

---

### **7. Comprehensive Testing Strategy**

**Questions:**
- What **test pyramid** should we follow (unit, integration, E2E ratios)?
- How to structure **unit tests** for React components (Testing Library best practices)?
- What are the **integration testing** strategies for API routes?
- How to implement **E2E tests** efficiently (Playwright patterns, CI integration)?
- What **test coverage** targets are realistic (80%? by component type)?
- How to test **real-time features** (WebSocket mocking, integration)?
- What are the **RLS policy testing** approaches?
- How to implement **contract testing** for APIs?
- What **CI/CD integration** for automated testing?

**Expected Output:** `TESTING-STRATEGY-COMPREHENSIVE.md` (2500-3000 words)

---

### **8. PWA Offline-First Architecture**

**Questions:**
- What are the **offline-first** architecture patterns?
- How to implement **Service Worker** caching strategies (Cache-First, Network-First, Stale-While-Revalidate)?
- What **IndexedDB** patterns for offline data storage?
- How to handle **background sync** for pending operations?
- What are the **conflict resolution** strategies for offline edits?
- How to implement **push notifications** (subscription management, payload)?
- What **app manifest** configuration for optimal PWA experience?
- How to test **offline scenarios** comprehensively?
- What are the **performance implications** of offline-first design?

**Expected Output:** `PWA-OFFLINE-BEST-PRACTICES.md` (2000-2500 words)

---

### **9. Scaling Strategies for VPS Environment**

**Questions:**
- What are the **horizontal scaling** options for VPS (load balancers, multiple instances)?
- How to implement **database read replicas** for scaling reads?
- What **caching strategies** at different layers (CDN, application, database)?
- How to handle **session management** in distributed environment (sticky sessions vs. centralized store)?
- What are the **autoscaling** possibilities with VPS providers?
- How to implement **graceful degradation** under load?
- What **cost optimization** strategies while scaling?
- How to monitor **resource utilization** for scaling decisions?

**Expected Output:** `SCALING-STRATEGIES.md` (2000-2500 words)

---

### **10. Error Tracking & Observability Setup**

**Questions:**
- How to configure **Sentry** for optimal error tracking (sampling, breadcrumbs, context)?
- What **logging strategies** are recommended (structured logging, log levels)?
- How to implement **distributed tracing** (OpenTelemetry, Jaeger)?
- What **custom metrics** should we track (business metrics, technical metrics)?
- How to set up **alerting** based on error rates and patterns?
- What **dashboards** are essential for operations (Grafana, Sentry Dashboards)?
- How to implement **error aggregation** and deduplication?
- What are the **privacy considerations** for error tracking (PII scrubbing)?

**Expected Output:** `MONITORING-OBSERVABILITY-SETUP.md` (2500-3000 words)

---

## 🎯 Expected Research Output Format

For each of the 10 categories above, please provide:

### 📄 File Structure (per category):

```markdown
# [Category Title]

## Executive Summary
- Key takeaways (3-5 bullet points)
- Critical recommendations

## Industry Context & Best Practices
- Current state of the art (2024-2025)
- Industry standards and benchmarks
- Expert opinions and case studies

## Implementation Guide
- Step-by-step instructions
- Code examples (TypeScript/JavaScript)
- Configuration samples
- Architecture diagrams (Mermaid or ASCII)

## Common Pitfalls & Anti-Patterns
- What to avoid
- Error scenarios
- Debugging strategies

## Tools & Technologies
- Recommended tools
- Comparison tables
- Integration approaches

## Performance Considerations
- Optimization techniques
- Benchmarks and metrics
- Monitoring approaches

## Security Best Practices
- Security vulnerabilities to prevent
- Authentication/authorization patterns
- Compliance considerations

## Testing & Validation
- How to test implementations
- Validation checklists
- Quality assurance approaches

## Case Studies & Examples
- Real-world examples
- Open-source projects for reference
- Success stories

## Further Resources
- Documentation links
- Community resources
- Expert blogs and articles

## Actionable Checklist
- ✅ Implementation checklist
- Step-by-step action items
- Success criteria
```

---

## 📝 Additional Context Files

Please refer to the accompanying files in this folder for deeper technical context:

1. **01-SYSTEM-CONTEXT.md** - Business domain, user workflows, Georgian market context
2. **02-TECHNICAL-STACK-DETAILS.md** - Complete dependency list, configurations
3. **03-DATABASE-SCHEMA.md** - Full schema, RLS policies, migrations
4. **04-DEPLOYMENT-INFRASTRUCTURE.md** - VPS, Docker, Dockploy setup
5. **05-CURRENT-CHALLENGES.md** - Known issues, technical debt, bottlenecks
6. **06-FEATURE-ROADMAP.md** - Completed vs. planned features

---

## ✅ Success Criteria

**Ideal Output:**
- **5-10 comprehensive markdown files** (2000-3000 words each)
- **Actionable recommendations** with code examples
- **Industry best practices** backed by authoritative sources
- **Architecture diagrams** where applicable
- **Step-by-step implementation guides**
- **Performance benchmarks** and optimization targets
- **Security considerations** for each area
- **Testing strategies** for validation
- **Links to authoritative resources** (official docs, expert articles, case studies)

**Research Quality:**
- Cite **authoritative sources** (official documentation, industry leaders, peer-reviewed articles)
- Include **2024-2025 current best practices** (not outdated patterns)
- Provide **real-world examples** and case studies
- Balance **theory with practical implementation**
- Consider **our specific tech stack** (Next.js 15, React 19, Supabase, VPS)

---

## 🚀 Next Steps After Research

Once I receive the 5-10 comprehensive markdown files from this research:

1. **Review & Prioritize** - Assess which recommendations to implement first
2. **Create Implementation Plan** - Break down into actionable tasks
3. **Update Architecture** - Apply learned patterns
4. **Refactor & Optimize** - Implement best practices
5. **Test & Validate** - Verify improvements
6. **Document Decisions** - ADRs for future reference

---

**Thank you for conducting this comprehensive research! The insights will be instrumental in building a production-ready, scalable, and secure B2B distribution platform.** 🙏

---

**Word Count:** ~3,800 words
**Research Scope:** 10 technical categories
**Expected Output:** 5-10 detailed markdown files (20,000-30,000 words total)
**Timeline:** Deep research with authoritative sources
