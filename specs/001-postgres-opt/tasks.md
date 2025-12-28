# Tasks: PostgreSQL Production Optimization

**Input**: Design documents from `/specs/001-postgres-opt/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Tests**: This feature includes comprehensive testing as specified in User Story 6. Tests are required for all critical flows.

**Organization**: Tasks are grouped by implementation phase, following the 4-phase approach from plan.md. Each phase builds on the previous one and can be independently validated.

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which phase this task belongs to (SETUP, PHASE1-4, POLISH)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `frontend/src/`, `database/migrations/`, `infrastructure/`
- Frontend: Next.js 15 App Router with TypeScript
- Database: PostgreSQL 15+ migrations
- Infrastructure: Docker Compose configs

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and documentation structure

- [X] T001 Create infrastructure directory structure at `infrastructure/pgbouncer/`, `infrastructure/redis/`, `infrastructure/nginx/`, `infrastructure/monitoring/`
- [X] T002 Create load test scripts directory at `scripts/load-tests/`
- [X] T003 [P] Create performance monitoring types at `frontend/src/types/performance.ts`
- [X] T004 [P] Initialize k6 load testing framework with baseline script at `scripts/load-tests/baseline-test.js`

**Checkpoint**: Infrastructure directories ready for configuration files

---

## Phase 2: Foundational (Database Foundation - Weeks 1-2)

**Purpose**: Core database optimizations that MUST be complete before frontend and scaling work

**⚠️ CRITICAL**: This phase implements User Stories 1, 2, and partially 3 (database aspects)

### User Story 1 - Restaurant Orders Load Instantly (Priority: P1)

**Goal**: Optimize database queries and connections so restaurant dashboard loads in <1s even with 500+ orders

**Independent Test**: Measure page load time on restaurant dashboard before and after. Success = 95% of loads under 1 second.

#### Database Optimization Tasks

- [X] T005 Create PgBouncer configuration file at `infrastructure/pgbouncer/pgbouncer.ini` with transaction mode, pool_size=20, max_client_conn=100
- [X] T006 Create PgBouncer Docker Compose config at `infrastructure/pgbouncer/docker-compose.yml`
- [X] T007 Create database migration `database/migrations/20251125000001_create_indexes_orders.sql` with composite index on (restaurant_id, status, created_at DESC)
- [X] T008 [P] Create database migration `database/migrations/20251125000002_create_partial_index_active_orders.sql` with partial index for active orders only
- [X] T009 [P] Create database migration `database/migrations/20251125000003_create_covering_index_orders.sql` with covering index including (id, status, total_amount, customer_name)
- [X] T010 Deploy PgBouncer container to development environment and test with 100 concurrent connections
- [X] T011 Apply index migrations to development database using CONCURRENTLY flag
- [X] T012 Validate index usage with `EXPLAIN ANALYZE` on restaurant orders query
- [X] T013 Measure baseline query performance before optimization (record p50, p95, p99 latencies) ✅ See baseline-performance-report.md
- [X] T014 Audit all restaurant API routes in `frontend/src/app/api/orders/` for SELECT * queries
- [X] T015 Optimize restaurant orders API route at `frontend/src/lib/restaurant-utils.ts` to select specific columns only
- [X] T016 Implement cursor-based pagination in `frontend/src/lib/supabase/server.ts` helper function `getOrdersPaginated()`
- [X] T017 Update restaurant dashboard component at `frontend/src/components/dashboard/RestaurantDashboardContent.tsx` to use paginated query with "Load More" button
- [X] T018 Measure post-optimization query performance and validate 100X improvement ✅ All queries <1ms (baseline-performance-report.md)
- [ ] T019 Deploy PgBouncer and indexes to production using low-traffic window (2am-4am UTC)

**Checkpoint**: Restaurant orders query should now complete in <100ms p95, dashboard loads in <1s

---

### User Story 2 - Drivers See Real-Time Order Updates Without Lag (Priority: P1)

**Goal**: Optimize database queries for real-time subscriptions so WebSocket updates reach drivers in <200ms

**Independent Test**: Measure WebSocket message delivery latency. Success = 99% of messages under 200ms.

#### Real-Time Optimization Tasks

- [X] T020 Create database migration `database/migrations/20251125000004_create_index_orders_user_id.sql` for RLS policy optimization
- [X] T021 [P] Create database migration `database/migrations/20251125000005_create_index_profiles_role.sql` with partial index on role column
- [X] T022 Analyze RLS policy performance on orders table with `EXPLAIN ANALYZE` showing policy overhead ✅ Policies use indexed columns
- [X] T023 Update orders RLS policy in `database/migrations/20251125000006_optimize_rls_policies.sql` to use indexed columns
- [X] T024 Create real-time connection manager at `frontend/src/lib/realtime/connection-manager.ts` with health monitoring
- [X] T025 Implement connection health monitoring with 30s ping/pong interval in connection manager
- [X] T026 Add subscription limit enforcement (max 50 per client) to connection manager
- [X] T027 Update driver delivery subscription in `frontend/src/hooks/useRealtimeOrders.ts` to use optimized connection manager
- [X] T028 Measure WebSocket latency baseline (instrument message send/receive times)
- [ ] T029 Apply RLS optimization migration to development database
- [ ] T030 Measure post-optimization WebSocket latency and validate <200ms p99
- [ ] T031 Load test real-time system with 50 concurrent driver connections using k6 script at `scripts/load-tests/realtime-test.js`
- [ ] T032 Deploy real-time optimizations to production and monitor latency metrics

**Checkpoint**: WebSocket updates should reach drivers in <200ms, connection drops should auto-reconnect

---

### User Story 3 (Partial) - Admin Analytics Database Performance (Priority: P2)

**Goal**: Optimize database queries for analytics so complex aggregations complete in <3s

**Independent Test**: Run predefined analytics queries against production-scale data (10,000+ orders). Success = 90% under 3 seconds.

#### Analytics Database Optimization Tasks

- [x] T033 Create database migration `database/migrations/20251125000007_create_indexes_products.sql` with composite index on (category, active, created_at DESC)
- [x] T034 [P] Create database migration `database/migrations/20251125000008_create_fulltext_index_products.sql` with GIN index for product search
- [ ] T035 Apply product indexes to development database using CONCURRENTLY flag
- [x] T036 Audit admin analytics queries in `frontend/src/app/api/analytics/` for performance issues
- [x] T037 Optimize revenue analytics query in `frontend/src/app/api/analytics/kpis/route.ts` using efficient aggregations
- [ ] T038 Test analytics queries with production-scale dataset (10,000+ orders) and measure response times
- [ ] T039 Deploy analytics optimizations to production

**Checkpoint**: Analytics queries should complete in <3s, admin dashboard should load complex reports quickly

---

### Database Monitoring Dashboard

**Goal**: Create performance monitoring dashboard to track database health

#### Monitoring Tasks

- [X] T040 [P] Create PerformanceMetric type at `frontend/src/types/performance.ts` ✅ Already exists
- [X] T041 [P] Create SlowQueryLog type at `frontend/src/types/performance.ts` ✅ Already exists
- [X] T042 [P] Create ConnectionPoolStatus type at `frontend/src/types/performance.ts` ✅ Already exists
- [X] T043 Create database performance API endpoint at `frontend/src/app/api/performance/database/route.ts` ✅ Created
- [X] T044 Create slow queries API endpoint at `frontend/src/app/api/performance/slow-queries/route.ts` ✅ Created
- [X] T045 Implement pg_stat_statements integration in database performance API for slow query detection (>100ms threshold) ✅ Implemented with fallback
- [X] T046 Create DatabaseMetrics component at `frontend/src/components/performance/DatabaseMetrics.tsx` ✅ Created
- [X] T047 [P] Create SlowQueryList component at `frontend/src/components/performance/SlowQueryList.tsx` ✅ Created
- [X] T048 [P] Create ConnectionPoolStatus component at `frontend/src/components/performance/ConnectionPoolStatus.tsx` ✅ Created
- [X] T049 Add performance dashboard page at `frontend/src/app/dashboard/admin/performance/database/page.tsx` ✅ Created
- [X] T050 Configure alerts for database performance thresholds (>200ms p95, >80% connection pool utilization) ✅ Configured in components

**Checkpoint**: Phase 2 Complete - Database foundation is optimized, monitoring is in place

---

## Phase 3: Frontend Performance (Weeks 3-4)

**Purpose**: Optimize frontend bundle size, implement ISR, and add structured logging

**⚠️ CRITICAL**: This phase completes User Story 1 (frontend) and implements User Stories 3 (frontend) and 4 (caching)

### User Story 1 (Continued) - Frontend Loading Optimization

**Goal**: Reduce bundle size and implement caching so pages load in <1s

#### ISR Implementation Tasks

- [ ] T051 Convert product catalog page at `frontend/src/app/catalog/page.tsx` to use generateStaticParams
- [ ] T052 Add `revalidate: 3600` (1 hour) to product catalog page for ISR
- [ ] T053 Test stale-while-revalidate behavior on product catalog page
- [ ] T054 Verify cache headers (Cache-Control: s-maxage=3600, stale-while-revalidate) in browser DevTools
- [ ] T055 Measure product catalog load time before optimization
- [ ] T056 Measure product catalog load time after ISR implementation (target: <1s)

#### Code Splitting Tasks

- [ ] T057 Create dynamic import for AdminDashboard at `frontend/src/app/(dashboard)/admin/page.tsx`
- [ ] T058 [P] Create dynamic import for RestaurantDashboard at `frontend/src/app/(dashboard)/restaurant/page.tsx`
- [ ] T059 [P] Create dynamic import for DriverDashboard at `frontend/src/app/(dashboard)/driver/page.tsx`
- [ ] T060 Install next/bundle-analyzer package and configure in `frontend/next.config.ts`
- [ ] T061 Run bundle analyzer and identify largest chunks (target: initial <500KB, routes <200KB each)
- [ ] T062 Optimize Recharts imports to tree-shake unused components in analytics dashboard
- [ ] T063 [P] Lazy load react-leaflet map library on driver routes only at `frontend/src/app/(dashboard)/driver/map/page.tsx`
- [ ] T064 Measure bundle size reduction (baseline vs optimized, target: 40% reduction)
- [ ] T065 Test lazy loading in Network tab to verify chunks load on demand
- [ ] T066 Verify offline PWA functionality still works after code splitting

**Checkpoint**: Pages load in <1s, bundle size reduced by 40%, ISR caching active

---

### User Story 3 (Continued) - Admin Analytics Frontend Performance

**Goal**: Optimize admin dashboard loading for complex analytics

#### Analytics Frontend Tasks

- [ ] T067 Optimize analytics dashboard component at `frontend/src/app/dashboard/admin/analytics/page.tsx` with Server Components for data fetching
- [ ] T068 Move Recharts to Client Component boundary for interactivity only
- [ ] T069 Implement loading skeletons for analytics charts during data fetch
- [ ] T070 Test analytics dashboard load time with 6-month date range (target: <3s total)

---

### User Story 4 - System Remains Responsive During Traffic Spikes

**Goal**: Implement caching and logging to maintain performance during 5X traffic

#### Structured Logging Tasks

- [ ] T071 Install pino and pino-pretty packages in `frontend/package.json`
- [ ] T072 Create logger utility at `frontend/src/lib/monitoring/logger.ts` with Pino configuration
- [ ] T073 Configure log levels (DEBUG in dev, INFO in production)
- [ ] T074 Implement correlation ID generation (X-Request-ID header) in middleware at `frontend/src/middleware.ts`
- [ ] T075 Replace all console.log calls in API routes (`frontend/src/app/api/**/*.ts`) with logger.info/error/debug
- [ ] T076 [P] Replace console.log calls in service files (`frontend/src/lib/services/**/*.ts`) with structured logging
- [ ] T077 Test log output format (should be JSON in production, pretty in development)

#### Sentry APM Configuration Tasks

- [ ] T078 Update Sentry client config at `frontend/sentry.client.config.ts` with tracesSampleRate: 0.1
- [ ] T079 [P] Update Sentry server config at `frontend/sentry.server.config.ts` with performance instrumentation
- [ ] T080 Add custom metrics to Sentry (database query duration, cache hit ratio)
- [ ] T081 Test Sentry transaction capture in dashboard (verify 10% sampling)
- [ ] T082 Configure Sentry alert for performance degradation (>200ms p95 API latency)

**Checkpoint**: Phase 3 Complete - Frontend is optimized, logging and APM are configured

---

## Phase 4: Security & Testing (Weeks 5-6)

**Purpose**: Achieve 70%+ test coverage and implement security hardening

**⚠️ CRITICAL**: This phase implements User Story 6 (testing) and security requirements

### User Story 6 - Comprehensive Test Coverage Prevents Regressions

**Goal**: Build test suite with 70%+ coverage, 100% for critical flows

**Independent Test**: Run `npm run test:coverage`. Success = 70%+ overall, 100% for order submission, status updates, payment.

#### Unit Testing Tasks (Vitest)

- [ ] T083 Create unit test for useAuth hook at `frontend/src/hooks/__tests__/useAuth.test.ts`
- [ ] T084 [P] Create unit test for useCart hook at `frontend/src/hooks/__tests__/useCart.test.ts`
- [ ] T085 [P] Create unit test for useRealtimeOrders hook at `frontend/src/hooks/__tests__/useRealtimeOrders.test.ts`
- [ ] T086 Create unit test for OrderCard component at `frontend/src/components/orders/__tests__/OrderCard.test.tsx`
- [ ] T087 [P] Create unit test for ProductCard component at `frontend/src/components/catalog/__tests__/ProductCard.test.tsx`
- [ ] T088 [P] Create unit test for DatabaseMetrics component at `frontend/src/components/performance/__tests__/DatabaseMetrics.test.tsx`
- [ ] T089 Create unit test for logger utility at `frontend/src/lib/monitoring/__tests__/logger.test.ts`
- [ ] T090 [P] Create unit test for cache operations at `frontend/src/lib/cache/__tests__/cache-operations.test.ts`
- [ ] T091 Run unit tests and achieve 70%+ coverage for hooks and utilities

#### Integration Testing Tasks (Vitest)

- [ ] T092 Create integration test for orders API at `frontend/src/app/api/orders/__tests__/route.test.ts`
- [ ] T093 [P] Create integration test for products API at `frontend/src/app/api/products/__tests__/route.test.ts`
- [ ] T094 [P] Create integration test for analytics API at `frontend/src/app/api/analytics/__tests__/kpis.test.ts`
- [ ] T095 [P] Create integration test for performance API at `frontend/src/app/api/performance/__tests__/database.test.ts`
- [ ] T096 Create integration test for order service at `frontend/src/lib/services/__tests__/order.service.test.ts`
- [ ] T097 [P] Create integration test for product service at `frontend/src/lib/services/__tests__/product.service.test.ts`
- [ ] T098 Run integration tests and verify API route coverage

#### E2E Testing Tasks (Playwright)

- [ ] T099 Create E2E test for restaurant order placement at `frontend/tests/e2e/restaurant-order-flow.spec.ts` (Critical: 100% coverage required)
- [ ] T100 Create E2E test for driver delivery workflow at `frontend/tests/e2e/driver-workflow.spec.ts` (Critical: 100% coverage required)
- [ ] T101 Create E2E test for admin analytics dashboard at `frontend/tests/e2e/admin-analytics.spec.ts`
- [ ] T102 Configure Playwright for parallel execution in `frontend/playwright.config.ts`
- [ ] T103 Run E2E tests and verify critical flows complete in <10 minutes total

#### Load Testing Tasks (k6)

- [ ] T104 Create baseline load test script at `scripts/load-tests/baseline-test.js` (100 req/s for 5 minutes)
- [ ] T105 Create spike load test script at `scripts/load-tests/spike-test.js` (100→500 req/s spike pattern)
- [ ] T106 Create stress load test script at `scripts/load-tests/stress-test.js` (gradual increase to failure point)
- [ ] T107 Create soak test script at `scripts/load-tests/soak-test.js` (200 req/s for 1 hour to detect memory leaks)
- [ ] T108 Run baseline test and establish performance benchmarks (record p50, p95, p99 latencies)
- [ ] T109 Run spike test and verify system handles 5X traffic without degradation (p95 latency <2X baseline)
- [ ] T110 Run stress test and identify bottlenecks (database, cache, API)
- [ ] T111 Update load test thresholds: p95 <200ms, error rate <1%

#### Test Coverage Validation

- [ ] T112 Run full test suite: `npm run test && npm run test:e2e`
- [ ] T113 Generate coverage report: `npm run test:coverage`
- [ ] T114 Verify 70%+ overall coverage achieved
- [ ] T115 Verify 100% coverage for critical flows: order submission at `frontend/src/app/api/orders/submit/route.ts`, status updates via WebSocket
- [ ] T116 Verify test suite completes in under 10 minutes

**Checkpoint**: Test coverage targets met, load testing validates 5X capacity

---

### Security Hardening

**Goal**: Implement CSP, rate limiting, and optimize RLS policies

#### Security Tasks

- [ ] T117 Implement nonce-based CSP in `frontend/next.config.ts` (experimental.csp configuration)
- [ ] T118 Configure CSP directives: script-src, style-src, img-src, connect-src
- [ ] T119 Test CSP violations in browser console (should be zero violations)
- [ ] T120 Create rate limiting middleware at `frontend/src/middleware/rate-limit.ts` (100 req/min per IP, 1000 req/hr per user)
- [ ] T121 Apply rate limiting to API routes in `frontend/src/middleware.ts`
- [ ] T122 Configure security headers (HSTS, X-Frame-Options, X-Content-Type-Options) in `frontend/next.config.ts`
- [ ] T123 Create RLS policy unit tests at `database/tests/rls-policies.test.sql`
- [ ] T124 Run RLS policy tests and verify role isolation (admin, restaurant, driver)
- [ ] T125 Measure RLS policy overhead with EXPLAIN ANALYZE (should be <10ms with indexes)
- [ ] T126 Run automated security scan: `npm audit`
- [ ] T127 Fix any identified security vulnerabilities (target: zero high-severity issues)

**Checkpoint**: Security hardening complete, CSP active, rate limiting prevents abuse

---

### CI/CD Enhancement

**Goal**: Add automated testing to deployment pipeline

#### CI/CD Tasks

- [ ] T128 Create GitHub Actions workflow file at `.github/workflows/test.yml`
- [ ] T129 Add test job to workflow (runs `npm run test`)
- [ ] T130 [P] Add type-check job to workflow (runs `tsc --noEmit`)
- [ ] T131 [P] Add lint job to workflow (runs `npm run lint`)
- [ ] T132 [P] Add build job to workflow (runs `npm run build`)
- [ ] T133 Configure workflow to run on pull request creation/update
- [ ] T134 Require all checks to pass before allowing PR merge (branch protection rules)
- [ ] T135 Test workflow by creating test PR and verifying all jobs pass

**Checkpoint**: Phase 4 Complete - Testing suite complete, security hardened, CI/CD automated

---

## Phase 5: Horizontal Scaling (Weeks 7-8)

**Purpose**: Deploy read replicas, Redis caching, and Nginx load balancing

**⚠️ CRITICAL**: This phase implements User Story 4 (scaling) and completes infrastructure optimization

### User Story 4 (Continued) - Horizontal Scaling for 5X Traffic

**Goal**: Deploy scaling infrastructure to handle 500 req/s sustained

**Independent Test**: Load test with 500 req/s for 10 minutes. Success = p95 latency <2X baseline, 99.9% success rate.

#### PostgreSQL Read Replicas

- [ ] T136 Create PostgreSQL replication configuration at `infrastructure/database/postgresql.conf` (enable streaming replication)
- [ ] T137 Configure primary database for replication (wal_level = replica, max_wal_senders = 3)
- [ ] T138 Set up 2 read replicas with async streaming replication
- [ ] T139 Configure replication slots to prevent WAL deletion
- [ ] T140 Create read-only Supabase client at `frontend/src/lib/supabase/read-client.ts`
- [ ] T141 Update analytics queries to use read replica client (route read-only to replicas)
- [ ] T142 Update admin reports to use read replica client
- [ ] T143 Test failover: promote replica to primary and verify automatic recovery
- [ ] T144 Monitor replication lag (target: <1s) using pg_stat_replication
- [ ] T145 Deploy read replicas to production VPS

**Checkpoint**: Read replicas serving 50%+ of SELECT queries, analytics no longer impacts primary

---

#### Redis Caching Layer

- [ ] T146 Create Redis configuration at `infrastructure/redis/redis.conf` (maxmemory 2gb, maxmemory-policy allkeys-lru)
- [ ] T147 Create Redis Docker Compose config at `infrastructure/redis/docker-compose.yml`
- [ ] T148 Configure Redis persistence (RDB + AOF for durability)
- [ ] T149 Deploy Redis container to development environment
- [ ] T150 Create Redis client at `frontend/src/lib/cache/redis-client.ts`
- [ ] T151 Create cache operations utility at `frontend/src/lib/cache/cache-operations.ts` (get, set, delete, ttl)
- [ ] T152 Implement product cache with 1 hour TTL (cache key: `product:{id}`)
- [ ] T153 [P] Implement order cache with 15 min TTL (cache key: `order:{id}`)
- [ ] T154 [P] Implement session cache with 24 hour TTL (cache key: `user:{id}:session`)
- [ ] T155 Add cache warming on deployment (pre-populate product catalog)
- [ ] T156 Create cache API endpoint at `frontend/src/app/api/cache/route.ts` (get, set, invalidate operations)
- [ ] T157 Create CacheStatus component at `frontend/src/components/performance/CacheStatus.tsx`
- [ ] T158 Add cache hit ratio monitoring to performance dashboard
- [ ] T159 Measure cache hit ratio (target: 80%+ for products)
- [ ] T160 Implement cache invalidation on product/order updates (invalidate on write)
- [ ] T161 Deploy Redis to production VPS

**Checkpoint**: Redis caching active, 80%+ cache hit ratio, database load reduced

---

#### Nginx Load Balancing

- [ ] T162 Create Nginx configuration at `infrastructure/nginx/nginx.conf` (upstream backend, round-robin algorithm)
- [ ] T163 Configure upstream servers in Nginx (frontend-1:3000, frontend-2:3000)
- [ ] T164 Add health check endpoint at `frontend/src/app/api/health/route.ts`
- [ ] T165 Configure Nginx health checks (every 10s, 3 max fails, 30s fail timeout)
- [ ] T166 Configure Nginx proxy settings (timeouts, headers, WebSocket support)
- [ ] T167 Create Nginx Docker Compose config at `infrastructure/nginx/docker-compose.yml`
- [ ] T168 Deploy Nginx container to development environment
- [ ] T169 Test load balancing (verify requests distributed evenly to both frontend instances)
- [ ] T170 Test health check failover (stop one frontend, verify traffic routes to healthy instance)
- [ ] T171 Deploy Nginx to production VPS

**Checkpoint**: Nginx load balancer active, traffic distributed evenly, automatic failover working

---

#### Zero-Downtime Deployments

- [ ] T172 Update deployment script at `scripts/deploy.sh` to support rolling updates (10% increments)
- [ ] T173 Add health check wait to deployment script (30s timeout, 3 retry attempts)
- [ ] T174 Configure Docker healthcheck in `frontend/Dockerfile.production` (verify Next.js server listening)
- [ ] T175 Test rolling update in staging environment (deploy new version with zero downtime)
- [ ] T176 Test rollback procedure (simulate failed deployment, verify quick rollback <5 min)
- [ ] T177 Document deployment process in `specs/001-postgres-opt/quickstart.md`
- [ ] T178 Monitor deployment success rate (target: 99% with zero downtime)

**Checkpoint**: Phase 5 Complete - Horizontal scaling infrastructure deployed, zero-downtime deployments working

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple areas

### Documentation & Cleanup

- [ ] T179 [P] Generate TypeScript types from Supabase schema: `npm run supabase:generate-types`
- [ ] T180 [P] Create API documentation for performance endpoints in `docs/api/performance.md`
- [ ] T181 [P] Create deployment runbook at `docs/deployment/zero-downtime-procedure.md`
- [ ] T182 Update README.md with optimization results and performance metrics
- [ ] T183 Create optimization completion report at `specs/001-postgres-opt/completion-report.md`

### Performance Validation

- [ ] T184 Run final baseline load test (500 req/s for 10 minutes) and record all metrics
- [ ] T185 Validate all success criteria from spec.md:
  - [ ] SC-001: 5X connection efficiency (500→100 connections)
  - [ ] SC-002: 100X query speedup for indexed operations
  - [ ] SC-003: 95% of queries <100ms
  - [ ] SC-005: Product catalog <1s load time
  - [ ] SC-006: 40% bundle size reduction
  - [ ] SC-007: 80% cache hit ratio
  - [ ] SC-009: <200ms WebSocket latency
  - [ ] SC-011: 70%+ test coverage
  - [ ] SC-016: 5X traffic handling without degradation
- [ ] T186 Create before/after performance comparison report
- [ ] T187 Update `.claude/context.md` with optimization results and lessons learned

### Code Quality

- [ ] T188 Run final type check: `npm run type-check`
- [ ] T189 Run final lint check: `npm run lint`
- [ ] T190 Run final test suite: `npm run test && npm run test:e2e`
- [ ] T191 Fix any remaining issues (target: zero errors, zero warnings)

**Checkpoint**: All optimization work complete, documented, and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - includes US1, US2, US3 (partial) database work
- **Frontend (Phase 3)**: Depends on Phase 2 database optimizations - completes US1, US3, US4 (partial)
- **Testing (Phase 4)**: Depends on Phases 2 & 3 - implements US6 and security hardening
- **Scaling (Phase 5)**: Depends on all previous phases - completes US4 with horizontal scaling
- **Polish (Phase 6)**: Depends on all implementation phases

### User Story Dependencies

- **User Story 1** (Restaurant Orders): Phases 2 (database) + 3 (frontend) = Complete
- **User Story 2** (Driver Real-Time): Phase 2 (database + real-time) = Complete
- **User Story 3** (Admin Analytics): Phases 2 (database) + 3 (frontend) = Complete
- **User Story 4** (Traffic Spikes): Phases 3 (caching/logging) + 5 (scaling) = Complete
- **User Story 5** (Offline PWA): Already implemented, tested in Phase 3 (verify no regression)
- **User Story 6** (Test Coverage): Phase 4 (testing) = Complete

### Critical Path

```
Setup → Foundational (Phase 2: US1, US2, US3 DB work)
  ↓
Frontend (Phase 3: US1, US3, US4 frontend)
  ↓
Testing (Phase 4: US6, security)
  ↓
Scaling (Phase 5: US4 horizontal scaling)
  ↓
Polish (Phase 6: documentation, validation)
```

### Parallel Opportunities

**Within Phase 2 (Database Foundation)**:
- T007, T008, T009 (different index migrations) can run in parallel
- T020, T021 (different RLS indexes) can run in parallel
- T040, T041, T042 (different TypeScript types) can run in parallel
- T046, T047, T048 (different React components) can run in parallel

**Within Phase 3 (Frontend Performance)**:
- T058, T059 (different dashboard imports) can run in parallel
- T063 (map lazy load) can run in parallel with other route optimizations
- T076 (service file logging) can run in parallel with T075 (API route logging)
- T079 (Sentry server config) can run in parallel with T078 (Sentry client config)

**Within Phase 4 (Testing)**:
- T084, T085, T086, T087, T088, T089, T090 (different unit tests) can all run in parallel
- T093, T094, T095, T097 (different integration tests) can run in parallel
- T130, T131, T132 (different CI/CD jobs) run in parallel automatically

**Within Phase 5 (Scaling)**:
- T153, T154 (different cache implementations) can run in parallel
- Read replica setup and Redis setup can partially overlap (different infrastructure)

---

## Parallel Example: Phase 2 - Database Foundation

```bash
# Launch database index migrations together (CONCURRENTLY flag allows parallel execution):
Task T007: "Create composite index on orders"
Task T008: "Create partial index on active orders"
Task T009: "Create covering index on orders"

# Launch monitoring component development together:
Task T046: "Create DatabaseMetrics component"
Task T047: "Create SlowQueryList component"
Task T048: "Create ConnectionPoolStatus component"
```

---

## Implementation Strategy

### Minimum Viable Optimization (MVO) - Phases 1 & 2 Only

**Goal**: Get fastest user-visible improvements deployed quickly

1. Complete Phase 1: Setup (4 tasks, ~1 day)
2. Complete Phase 2: Database Foundation (50 tasks, ~2 weeks)
   - PgBouncer connection pooling → immediate connection efficiency
   - Database indexes → 100X query speedup
   - Real-time optimization → <200ms latency
   - Monitoring dashboard → visibility into improvements
3. **STOP and VALIDATE**:
   - Measure restaurant dashboard load time (should be <1s now)
   - Measure WebSocket latency (should be <200ms)
   - Check monitoring dashboard (query performance improvements visible)
4. **Deploy to production** if validation successful
5. Communicate wins to team/stakeholders

**Value**: Database optimizations deliver the biggest impact (User Stories 1, 2, partial 3) with minimal risk. This is 70% of the user-facing value in just 2 weeks.

---

### Incremental Delivery

**Phase-by-Phase Rollout**:

1. **Weeks 1-2** (Phase 2): Database Foundation
   - Deploy: PgBouncer, indexes, RLS optimization, monitoring
   - Validate: Restaurant orders load fast, drivers see instant updates
   - Business Impact: Immediate order processing speed improvement

2. **Weeks 3-4** (Phase 3): Frontend Performance
   - Deploy: ISR, code splitting, Pino logging, Sentry APM
   - Validate: <1s page loads, 40% smaller bundles, monitoring active
   - Business Impact: Better user experience across all roles

3. **Weeks 5-6** (Phase 4): Testing & Security
   - Deploy: Comprehensive tests, CSP, rate limiting, CI/CD
   - Validate: 70%+ coverage, zero security violations, automated QA
   - Business Impact: Confident deployments, prevented regressions

4. **Weeks 7-8** (Phase 5): Horizontal Scaling
   - Deploy: Read replicas, Redis, Nginx load balancer
   - Validate: Handle 500 req/s sustained, 80% cache hit ratio
   - Business Impact: Ready for 5X growth, peak hour performance

5. **Week 9** (Phase 6): Polish & Documentation
   - Finalize: Documentation, validation reports
   - Celebrate: Share performance improvement metrics with team

Each phase adds value without breaking previous work.

---

### Parallel Team Strategy

**With 2 Developers**:

**Weeks 1-2** (Phase 2 - Work Together):
- Developer A: Database migrations (T007-T023), PgBouncer setup
- Developer B: Real-time optimization (T024-T032), monitoring dashboard (T040-T050)
- **Sync**: Both review and test together before production deployment

**Weeks 3-4** (Phase 3 - Can Split):
- Developer A: ISR + Code Splitting (T051-T070)
- Developer B: Logging + Sentry (T071-T082)
- **Sync**: Integration testing together

**Weeks 5-6** (Phase 4 - Parallel Testing):
- Developer A: Unit + Integration tests (T083-T098)
- Developer B: E2E + Load tests (T099-T116) + Security (T117-T127)
- **Sync**: CI/CD setup together (T128-T135)

**Weeks 7-8** (Phase 5 - Infrastructure):
- Developer A: Read replicas + Redis (T136-T161)
- Developer B: Nginx + Zero-downtime (T162-T178)
- **Sync**: Final validation together

---

## Notes

- [P] tasks = different files, can run in parallel safely
- Each phase has clear checkpoints for validation before proceeding
- Phases build on each other but deliver independent value
- User Stories map to phases: US1→P2+P3, US2→P2, US3→P2+P3, US4→P3+P5, US6→P4
- Load testing critical in Phase 4 to validate 5X capacity before Phase 5 scaling investment
- Zero-downtime requirement means all production deployments use rolling updates (T172-T178)
- Database migrations use CONCURRENTLY to avoid locking tables in production
- Test tasks in Phase 4 ensure confidence for scaling in Phase 5
- Commit after each task or logical group
- Stop at any checkpoint to validate independently before continuing
- All success criteria from spec.md are validated in Phase 6 (T185)

---

## Total Task Count: 191 Tasks

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Database Foundation): 46 tasks (US1, US2, US3 partial)
- Phase 3 (Frontend Performance): 32 tasks (US1, US3, US4 partial)
- Phase 4 (Security & Testing): 53 tasks (US6, security)
- Phase 5 (Horizontal Scaling): 43 tasks (US4 complete)
- Phase 6 (Polish): 13 tasks

**Parallel Opportunities**: 35+ tasks marked [P] can run concurrently within their phases

**Independent Test Criteria**:
- US1: Restaurant dashboard <1s load time (validated in T018, T056)
- US2: WebSocket <200ms latency (validated in T030)
- US3: Analytics queries <3s (validated in T038, T070)
- US4: 500 req/s sustained (validated in T109, T184)
- US6: 70%+ test coverage (validated in T113-T115)

**Suggested MVP**: Phases 1 + 2 (50 tasks, 2 weeks) = 70% of user value

**Estimated Timeline**: 8 weeks for full implementation, 2 weeks for MVP (database optimizations only)
