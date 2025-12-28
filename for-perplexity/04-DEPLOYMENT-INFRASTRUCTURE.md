# Deployment Infrastructure - VPS, Docker & Self-Hosted Supabase

## VPS Infrastructure

### Contabo VPS Specifications

**Provider:** Contabo
**Location:** Germany (data.greenland77.ge)
**Domain:** greenland77.ge (frontend), data.greenland77.ge (backend)

**Server Specs:**
- vCPU: Scalable (current allocation: 3 CPU for frontend container)
- RAM: Scalable (current allocation: 6GB max for frontend)
- Storage: SSD-based
- Network: 1 Gbps

**Operating System:**
- Linux-based (likely Ubuntu/Debian)
- Docker Engine installed
- Dockploy orchestration platform

---

## Docker Configuration

### Frontend Container - Dockerfile.production

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build arguments (passed at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SENTRY_DSN

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Stage 3: Runner (Production)
FROM node:22-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set to production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/liveness || exit 1

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### Key Dockerfile Features

1. **Multi-Stage Build**
   - **deps:** Production dependencies only (smaller final image)
   - **builder:** Full build with all dependencies
   - **runner:** Minimal runtime with built app

2. **Security**
   - Non-root user (nextjs:1001)
   - Minimal base image (node:22-alpine)
   - dumb-init for proper signal handling

3. **Optimization**
   - Layer caching (package.json copied first)
   - npm cache cleaned
   - Only production files copied to final image

4. **Health Checks**
   - Interval: 30 seconds
   - Timeout: 10 seconds
   - Start period: 60 seconds (grace for slow starts)
   - Retries: 3 before marking unhealthy

---

## Docker Compose Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_SENTRY_DSN: ${NEXT_PUBLIC_SENTRY_DSN}

    container_name: distribution-frontend

    ports:
      - "3003:3000"  # External:Internal

    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

    healthcheck:
      test: ["CMD", "wget", "--spider", "--quiet", "http://localhost:3000/api/health/liveness"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

    restart: unless-stopped

    deploy:
      resources:
        limits:
          cpus: '3'
          memory: 6G
        reservations:
          cpus: '1'
          memory: 1G

    networks:
      - distribution-network

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  distribution-network:
    driver: bridge
```

### Resource Limits Explained

**Limits (Maximum):**
- CPUs: 3 cores max
- Memory: 6GB max
- Prevents container from consuming all host resources

**Reservations (Guaranteed):**
- CPUs: 1 core guaranteed
- Memory: 1GB guaranteed
- Ensures minimum resources always available

---

## Health Check Endpoints

### Liveness Probe (/api/health/liveness)

```typescript
// frontend/src/app/api/health/liveness/route.ts
export async function GET() {
  // Simple check: Is the app running?
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'distribution-frontend'
    },
    { status: 200 }
  )
}
```

**Purpose:** Verify application is alive and responding
**Action if fails:** Container restart

### Readiness Probe (/api/health/readiness)

```typescript
// frontend/src/app/api/health/readiness/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connectivity
    const { error } = await supabase.from('profiles').select('count').limit(1).single()

    if (error) throw error

    return Response.json(
      {
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected',
        service: 'distribution-frontend'
      },
      { status: 200 }
    )
  } catch (error) {
    return Response.json(
      {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      },
      { status: 503 }
    )
  }
}
```

**Purpose:** Verify application is ready to serve traffic
**Checks:** Database connectivity, external service availability
**Action if fails:** Remove from load balancer (if applicable)

---

## Self-Hosted Supabase Setup

### Supabase Components

**Core Services:**

1. **PostgreSQL 15+**
   - Port: 5432
   - Database: postgres
   - User: postgres
   - SSL: Required in production

2. **GoTrue (Authentication)**
   - Port: 9999
   - JWT signing
   - User management
   - MFA support

3. **Realtime Server**
   - Port: 4000
   - WebSocket connections
   - Postgres change subscriptions
   - Broadcast channels

4. **Storage API**
   - Port: 5000
   - File uploads
   - Image CDN
   - Access control

5. **Kong (API Gateway)**
   - Port: 8000 (HTTP), 8443 (HTTPS)
   - Routing to services
   - Rate limiting
   - JWT verification

6. **PostgREST**
   - Port: 3000
   - Auto-generated REST API
   - RLS enforcement
   - Query optimization

### Self-Hosted Supabase Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Kong Gateway                        │
│           (API Routing, Rate Limiting, JWT)            │
└──────────┬──────────┬──────────┬──────────┬────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
    ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
    │PostgreSQL│ │ GoTrue │ │ Realtime │ │ Storage  │
    │   DB     │ │  Auth  │ │ WebSocket│ │   API    │
    └──────────┘ └────────┘ └──────────┘ └──────────┘
         │
         ▼
    ┌──────────┐
    │PostgREST │
    │REST API  │
    └──────────┘
```

### Supabase Docker Compose (Simplified)

```yaml
version: '3.8'

services:
  postgres:
    image: supabase/postgres:15.1.0.117
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  auth:
    image: supabase/gotrue:v2.99.0
    depends_on:
      - postgres
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
      GOTRUE_SITE_URL: https://greenland77.ge
      GOTRUE_JWT_SECRET: ${JWT_SECRET}

  realtime:
    image: supabase/realtime:v2.25.35
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: postgres
      JWT_SECRET: ${JWT_SECRET}

  storage:
    image: supabase/storage-api:v0.43.11
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
      PGRST_JWT_SECRET: ${JWT_SECRET}

  kong:
    image: kong:3.4.2
    ports:
      - "8000:8000"
      - "8443:8443"
    depends_on:
      - auth
      - realtime
      - storage
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml

volumes:
  postgres-data:
```

---

## Deployment Process with Dockploy

### Current Deployment Workflow

**Dockploy Features:**
- Git integration (GitHub)
- Auto-deployment on push to `main`
- Environment variable management
- Container orchestration
- Health check monitoring
- Rollback capability

**Deployment Steps:**

1. **Code Push**
   ```bash
   git push origin main
   ```

2. **Dockploy Detects Change**
   - Webhook triggered from GitHub
   - Dockploy pulls latest code

3. **Build Phase**
   - Docker build from Dockerfile.production
   - Build args passed (env variables)
   - Multi-stage build executed

4. **Health Check Phase**
   - Wait for container start (60s grace period)
   - Liveness check (30s interval)
   - Readiness check (database connectivity)

5. **Deployment**
   - Old container stopped (graceful shutdown)
   - New container started
   - Traffic routed to new container

6. **Verification**
   - Health checks pass (3 consecutive)
   - Sentry deployment event
   - Logs monitored

### Manual Deployment Commands

```bash
# SSH into VPS
ssh user@data.greenland77.ge

# Navigate to project
cd /path/to/distribution-management

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# View logs
docker-compose logs -f frontend

# Check health
curl http://localhost:3003/api/health/liveness
curl http://localhost:3003/api/health/readiness
```

---

## Monitoring & Logging

### Container Logs

**Log Configuration:**
- Driver: json-file
- Max size: 10MB per file
- Max files: 3 (30MB total)
- Rotation: Automatic

**View Logs:**
```bash
# All logs
docker logs distribution-frontend

# Follow logs (real-time)
docker logs -f distribution-frontend

# Last 100 lines
docker logs --tail 100 distribution-frontend

# With timestamps
docker logs -t distribution-frontend
```

### Monitoring Tools (Planned)

**Prometheus + Grafana:**
- Container metrics (CPU, memory, network)
- Application metrics (request rate, latency)
- Database metrics (connections, query time)
- Custom business metrics

**Sentry:**
- Frontend errors
- Backend errors
- Performance monitoring
- Release tracking
- User feedback

---

## Backup Strategy

### Database Backups

**Automated Daily Backups:**
```bash
#!/bin/bash
# /scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/postgres
RETENTION_DAYS=30

# Create backup
pg_dump -h localhost -U postgres -Fc -d postgres > $BACKUP_DIR/backup_$DATE.dump

# Remove old backups
find $BACKUP_DIR -name "backup_*.dump" -mtime +$RETENTION_DAYS -delete

# Upload to remote storage (optional)
# rclone copy $BACKUP_DIR/backup_$DATE.dump remote:backups/
```

**Cron Job:**
```cron
# Daily at 2 AM
0 2 * * * /scripts/backup-db.sh
```

### Application Backups

**Docker Images:**
- Pushed to Docker Hub after successful build
- Tagged with commit SHA and version
- Retention: Last 10 images

**Configuration:**
- Git repository (version controlled)
- Environment variables (encrypted storage)
- SSL certificates (backed up separately)

---

## Disaster Recovery Procedures

### Scenario 1: Container Failure

**Detection:**
- Health check failures (3 consecutive)
- Dockploy alerts

**Action:**
```bash
# Automatic: Container restart (restart policy: unless-stopped)

# Manual if needed:
docker restart distribution-frontend
```

### Scenario 2: Database Corruption

**Detection:**
- Readiness check failures
- Error logs (Sentry)

**Action:**
```bash
# Stop application
docker-compose down

# Restore from backup
pg_restore -h localhost -U postgres -d postgres /backups/postgres/backup_latest.dump

# Restart application
docker-compose up -d

# Verify health
curl http://localhost:3003/api/health/readiness
```

### Scenario 3: Complete Server Failure

**RTO:** 4 hours
**RPO:** 24 hours

**Recovery Steps:**
1. Provision new VPS server
2. Install Docker + Dockploy
3. Clone Git repository
4. Restore database from backup
5. Configure environment variables
6. Deploy application
7. Update DNS (if needed)
8. Verify all services

---

## Security Hardening

### VPS Security

**Firewall (ufw):**
```bash
# Allow SSH (port 22)
ufw allow 22/tcp

# Allow HTTP (port 80)
ufw allow 80/tcp

# Allow HTTPS (port 443)
ufw allow 443/tcp

# Allow custom port 3003 (frontend)
ufw allow 3003/tcp

# Enable firewall
ufw enable
```

**SSH Security:**
- Key-based authentication only
- Disable root login
- Change default port (optional)
- fail2ban for brute-force protection

**Docker Security:**
- Non-root containers
- Read-only root filesystem (where possible)
- Capability dropping
- Resource limits

---

## SSL/TLS Certificates

**Certificate Management:**
- Let's Encrypt via Certbot
- Auto-renewal every 90 days
- Certificates for:
  - greenland77.ge (frontend)
  - data.greenland77.ge (backend)

**Renewal Script:**
```bash
#!/bin/bash
# Auto-renewal with Certbot
certbot renew --quiet

# Reload Nginx (if applicable)
systemctl reload nginx
```

---

**This document provides complete deployment infrastructure details, Docker configurations, self-hosted Supabase setup, and disaster recovery procedures for the Georgian Distribution Management System.**
