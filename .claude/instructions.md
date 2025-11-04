# Georgian Distribution Management System - Claude Instructions

> **ქართული სადისტრიბუციო სისტემა** | B2B Food Distribution Platform for Georgian Market

## 🎯 Project Overview | პროექტის მიმოხილვა

This is a **production-ready Next.js 15 + React 19 application** that modernizes Georgian food distribution by replacing manual processes (phone calls, paper trails) with an integrated real-time digital platform.

**Purpose:** Connect restaurants with distributors through streamlined ordering, dynamic pricing, and real-time delivery tracking.

**Market:** Georgian B2B food distribution sector

**Status:** Analytics dashboard completed (branch 001), ready for restaurant order management feature

---

## 🏗️ Technology Stack

### Frontend
- **Next.js 15.5.0** (App Router) + **React 19.2.0**
- **TypeScript 5+** (strict mode enabled)
- **Tailwind CSS v4** for styling
- **shadcn/ui** (99.3% registry compatibility ✅)
- **Zustand** for state management
- **TanStack Query v5** (React Query) for server state
- **React Hook Form + Zod** for forms/validation
- **Recharts v2** for data visualization
- **Vitest v2** for testing
- **PWA** ✅ - Progressive Web App with offline support
  - Service Worker with Workbox
  - IndexedDB for offline storage
  - Background sync
  - Push notifications

### Backend
- **Supabase** (PostgreSQL + Auth + Realtime + Storage)
  - **Development:** Hosted Supabase (akxmacfsltzhbnunoepb.supabase.co)
  - **Production:** Self-hosted VPS (data.greenland77.ge)
- **Row-Level Security (RLS)** for multi-tenant architecture
- **JWT Authentication** with role-based access control
- **Advanced Real-time** ✅ - Enterprise-grade WebSocket system
  - Connection Manager with offline resilience
  - Message queuing
  - Exponential backoff reconnection
  - Connection quality monitoring

### Infrastructure
- **VPS:** Contabo cloud hosting
- **Deployment:** Dockploy container orchestration
- **Monitoring:** Sentry (georgian-distribution project)
- **Domains:** greenland77.ge (frontend), data.greenland77.ge (backend)

---

## 👥 User Roles

1. **Administrator** - Full system control, pricing, analytics, user management
2. **Restaurant** - Digital ordering, real-time tracking, order history
3. **Driver** - Delivery management, status updates, delivery confirmation
4. **Demo** - Read-only showcase for potential clients

---

## 🔄 Core Workflow

### Order Lifecycle
1. **Restaurant** places order (no prices shown initially)
2. **Admin** sets custom pricing per order (with profitability calculations)
3. **Admin** assigns driver
4. **Driver** picks up and delivers
5. **Two-step confirmation** (pickup + delivery)
6. **Order completion** with history record

**Real-time Updates:** All status changes broadcast via WebSockets

---

## 🚀 Development Environment

### Quick Start
```bash
cd frontend
npm install
npm run dev
```

**Port:** http://localhost:3000

### Environment Variables
Located in `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dev-key]
NEXT_PUBLIC_SENTRY_DSN=[sentry-dsn]
```

### Database Access
- Use **Supabase MCP server** for database operations
- No local Docker Supabase needed (using hosted for development)
- Migration tools available in `database/` for production VPS

---

## 📋 Development Guidelines

### Code Quality Standards
- ✅ **TypeScript strict mode** - No `any` types without justification
- ✅ **ESLint + Prettier** - Auto-format on save
- ✅ **Vitest tests** - Run from workspace root with `npm test`
- ✅ **shadcn/ui components** - Use existing components before creating custom
- ✅ **Tailwind CSS** - No inline styles, use Tailwind classes
- ✅ **Mobile-first design** - Design for mobile (320px+) first, then enhance
- ✅ **Touch targets** - Minimum 44px × 44px for all interactive elements
- ✅ **PWA patterns** - Support offline-first where applicable
- ❌ **No disabling lint rules** without explicit approval

### Security Requirements
- ✅ **Row-Level Security (RLS)** on all tables
- ✅ **Input validation** with Zod schemas
- ✅ **JWT authentication** - Never expose sensitive data
- ✅ **CSRF protection** for mutations
- ❌ **No direct database queries** without RLS policies

### Database Operations
- ✅ Use **Supabase client** from `src/lib/supabase.ts`
- ✅ Use **MCP Supabase server** for schema changes
- ✅ Test RLS policies for each role
- ✅ Use **optimistic indexes** (12 strategic indexes exist)
- ❌ Never bypass RLS in application code

### Component Architecture
- ✅ **Server Components** by default (Next.js App Router)
- ✅ **Client Components** only when needed ('use client')
- ✅ **Colocation** - Keep related files together
- ✅ **Atomic design** - Reusable UI components in `src/components/ui/`
- ✅ **Feature folders** - Group by feature, not by type

---

## 🧪 Testing

### Running Tests
```bash
# From workspace root (where package.json exists)
cd frontend
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Requirements
- ✅ Unit tests for utilities and hooks
- ✅ Integration tests for API routes
- ✅ Component tests for complex UI
- ✅ Minimum 70% coverage for new features

---

## 🔧 MCP Integrations

Available MCP servers (configured in `.kilocode/mcp.json`):
- **supabase** - Database operations, schema management
- **github** - Repository operations
- **sentry** - Error tracking and monitoring
- **perplexity** - Research assistance
- **context7** - Library documentation
- **shadcn** - UI component management
- **chrome-devtools** - Browser debugging

## 🎨 Available Skills

Specialized Claude Code skills for specific tasks:

### Development & Architecture
- **api-integration-specialist** - Third-party API integration expert
- **code-quality-guardian** - Code review and best practices enforcement
- **database-schema-architect** - Database design and optimization
- **intelligent-debugger** - Systematic debugging for complex issues
- **system-architecture-advisor** - System design and scalability patterns

### Design & UX
- **mobile-first-designer** - Responsive design expert with PWA patterns
- **modern-ui-designer** - 2025 UI/UX patterns with Tailwind & shadcn/ui
- **user-feedback-interpreter** - UX research and feedback analysis

### Product & Planning
- **feature-impact-analyzer** - RICE/ICE prioritization framework for features
- **idea-validator-pro** - Product idea validation and market research
- **saas-architect** - SaaS architecture planning (Next.js + Supabase)
- **saas-launch-planner** - SaaS launch planning with subscription models
- **nextjs-supabase-saas-planner** - Complete SaaS planning for Next.js/Supabase

### Optimization & Growth
- **conversion-optimization-expert** - Conversion rate optimization
- **technical-seo-specialist** - SEO optimization and performance
- **prompt-optimization** - AI prompt engineering and optimization

**Usage:** These skills are automatically available - reference them when relevant to the task

---

## 📁 Project Structure

```
Distribution-Managment/
├── .claude/              # Claude Code configuration (this folder)
├── .kilocode/           # KiloCode memory bank & workflows
├── .specify/            # SpecKit templates & scripts
├── frontend/            # Next.js 15 application
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities & configurations
│   │   └── types/       # TypeScript type definitions
│   └── package.json
├── database/            # Migration scripts & SQL
├── specs/               # Feature specifications
│   ├── 001-analytics-dashboard/  # ✅ Completed
│   └── 002-restaurant-order-management/  # 🔄 Next
└── docs/                # Project documentation
```

---

## 🌿 Git Workflow

### Current Branch
- **Branch:** `001-analytics-dashboard` (✅ completed, ready to merge)
- **Main:** `main` (stable production branch)

### Branch Naming
- Feature: `001-feature-name`, `002-feature-name`
- Bugfix: `fix/description`
- Hotfix: `hotfix/critical-issue`

### Commit Messages
```
feat: add analytics dashboard with date filtering
fix: resolve order status update race condition
chore: update dependencies to latest versions
docs: add deployment guide for VPS setup
```

---

## 🚢 Deployment

### Development
- **Auto-deploy:** Push to branch triggers Vercel preview
- **Environment:** Official Supabase hosted instance
- **URL:** Preview URLs from Vercel

### Production
- **Platform:** Dockploy on Contabo VPS
- **Frontend:** greenland77.ge
- **Backend:** data.greenland77.ge (self-hosted Supabase)
- **Process:** See `.claude/workflows/deployment.md`

---

## 📚 Key Documentation

### Memory Bank (`.kilocode/rules/memory-bank/`)
- `architecture.md` - System architecture deep-dive
- `context.md` - Current project status & history
- `product.md` - Product vision & user workflows
- `tech.md` - Technology stack details
- `constitution.md` - Development principles
- `deployment.md` - VPS deployment guide

### Workflows (`.claude/workflows/`)
- `feature-development.md` - Feature development process
- `bug-fixing.md` - Bug investigation & resolution
- `deployment.md` - Deployment procedures
- `testing.md` - Testing strategies

### Knowledge Base (`.claude/knowledge/`)
- `user-roles.md` - Detailed role descriptions
- `order-workflow.md` - Order processing details
- `technology-stack.md` - Tech stack explanations
- `database-schema.md` - Database structure & RLS
- `pwa-implementation.md` - PWA architecture & offline features
- `realtime-architecture.md` - Real-time system & connection management
- `analytics-guide.md` - Analytics dashboard KPIs & usage
- `mobile-optimization.md` - Mobile-first design patterns

---

## ⚡ Quick Commands

Use these slash commands for common operations:

- `/dev-setup` - Setup development environment
- `/test-feature` - Run tests for current feature
- `/deploy` - Production deployment checklist

---

## 🎯 Current Focus

**Completed:** Analytics Dashboard (17/17 tasks)
- Real-time KPI tracking
- Date range filtering (7/14/30/custom days)
- Status filtering
- CSV export
- Georgian language support
- Mobile-responsive design

**Next:** Restaurant Order Management Enhancement
- See `specs/002-restaurant-order-management/` for details

---

## 🔐 Security Notes

- **RLS Policies:** 25+ policies across 6 tables
- **Authentication:** JWT-based with role claims
- **Environment:** Never commit `.env.local` or secrets
- **VPS Access:** Credentials in `.kilocode/rules/memory-bank/tech.md`
- **Sentry:** Error tracking enabled (georgian-distribution project)

---

## 💡 Best Practices

### When Writing Code
1. **Read context first** - Check `.claude/context.md` for current status
2. **Follow architecture** - Review `.claude/architecture.md` for patterns
3. **Use existing components** - Check shadcn/ui before creating new
4. **Write tests** - Run `npm test` before committing
5. **Update documentation** - Keep `.claude/context.md` updated

### When Fixing Bugs
1. **Reproduce issue** - Create test case first
2. **Check RLS policies** - Most bugs are permission-related
3. **Review Sentry** - Check error logs for context
4. **Test all roles** - Verify fix for Admin/Restaurant/Driver
5. **Update tests** - Add regression test

### When Adding Features
1. **Create spec** - Follow `specs/` template structure
2. **Break down tasks** - Use `.specify/templates/tasks-template.md`
3. **Implement incrementally** - Small PRs, frequent commits
4. **Test thoroughly** - Unit + integration + manual testing
5. **Document changes** - Update relevant `.claude/` files

---

## 📞 Support & Resources

- **Memory Bank:** `.kilocode/rules/memory-bank/` for comprehensive context
- **Specifications:** `specs/` folder for feature documentation
- **Commands:** `.claude/commands/` for quick workflows
- **Integration Help:** `.claude/integrations/` for setup guides

---

**Last Updated:** 2025-11-03
**Version:** 1.0.0
**Branch:** 001-analytics-dashboard (completed)
