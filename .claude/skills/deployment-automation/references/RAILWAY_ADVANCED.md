# Railway Advanced Patterns

## Table of Contents
1. Docker Optimization Strategies
2. Database Management and Migrations
3. Monorepo Backend Deployments
4. Environment and Service Management
5. Scaling and Performance
6. Networking and Custom Domains
7. Cost Optimization
8. Troubleshooting

---

## 1. Docker Optimization Strategies

### Multi-Stage Builds for Faster Deployments

**Dockerfile (Node.js)**:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Don't run as root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**Benefits**:
- Smaller image size (only production dependencies)
- Faster deployment times
- Better security (no dev tools in production)

### Layer Caching Optimization

**Optimized Order**:
```dockerfile
# 1. Copy package files first (changes rarely)
COPY package*.json ./

# 2. Install dependencies (cached unless package.json changes)
RUN npm ci

# 3. Copy source code last (changes frequently)
COPY . .

# 4. Build
RUN npm run build
```

### Using .dockerignore

**Create `.dockerignore`**:
```
node_modules
.git
.github
.env
.env.local
*.md
Dockerfile
.dockerignore
coverage
.vscode
.idea
dist
build
```

---

## 2. Database Management and Migrations

### Database Setup on Railway

**PostgreSQL**:
```bash
# Create new PostgreSQL database
railway add postgres

# Get connection string
railway variables

# Connect to database
railway connect postgres
```

**MySQL**:
```bash
# Create MySQL database
railway add mysql

# Get credentials
railway variables
```

**Redis**:
```bash
# Add Redis
railway add redis

# Get connection URL
railway variables
```

### Database Migration Strategies

**Prisma Migrations** (Recommended):

**schema.prisma**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

**Migration Workflow**:
```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy
```

**GitHub Actions Integration**:
```yaml
# .github/workflows/deploy-with-migrations.yml
name: Deploy with Database Migrations

on:
  push:
    branches: [main]

jobs:
  migrate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx prisma migrate deploy
      
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway up --service=${{ secrets.SERVICE_ID }}
```

**Rollback Migrations**:
```bash
# List migrations
npx prisma migrate status

# Rollback last migration
npx prisma migrate resolve --rolled-back [migration-name]

# Reset database (dangerous - dev only)
npx prisma migrate reset
```

### Database Backup Strategy

**Automated Backups via Railway**:
- Railway automatically backs up databases
- Retention: 7 days for Hobby, 14 days for Pro

**Manual Backup**:
```bash
# PostgreSQL backup
railway run pg_dump > backup.sql

# Restore from backup
railway run psql < backup.sql
```

---

## 3. Monorepo Backend Deployments

### Project Structure
```
backend-monorepo/
├── services/
│   ├── api/           # Main API service
│   ├── workers/       # Background workers
│   └── webhooks/      # Webhook handlers
├── packages/
│   ├── database/      # Shared database models
│   ├── common/        # Shared utilities
│   └── types/         # Shared TypeScript types
└── railway.json       # Railway configuration
```

### Railway Configuration for Monorepo

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build:api"
  },
  "deploy": {
    "startCommand": "npm run start:api",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Deploy Specific Services

**GitHub Actions for Monorepo**:
```yaml
# .github/workflows/deploy-services.yml
name: Deploy Backend Services

on:
  push:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.filter.outputs.api }}
      workers: ${{ steps.filter.outputs.workers }}
      webhooks: ${{ steps.filter.outputs.webhooks }}
    steps:
      - uses: actions/checkout@v3
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            api:
              - 'services/api/**'
              - 'packages/**'
            workers:
              - 'services/workers/**'
              - 'packages/**'
            webhooks:
              - 'services/webhooks/**'

  deploy-api:
    needs: changes
    if: needs.changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: railway up --service=${{ secrets.API_SERVICE_ID }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-workers:
    needs: changes
    if: needs.changes.outputs.workers == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: railway up --service=${{ secrets.WORKERS_SERVICE_ID }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 4. Environment and Service Management

### Multiple Environments

**Create Separate Environments**:
```bash
# Development
railway environment create development

# Staging
railway environment create staging

# Production (default)
railway environment create production
```

**Deploy to Specific Environment**:
```bash
# Deploy to staging
railway up --environment=staging

# Switch active environment
railway environment staging
```

### Service Configuration

**Service Settings Best Practices**:

**CPU and Memory**:
```json
{
  "deploy": {
    "numReplicas": 2,
    "resources": {
      "cpu": "1000m",      # 1 CPU core
      "memory": "2Gi"       # 2GB RAM
    }
  }
}
```

**Health Checks**:
```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "healthcheckInterval": 300
  }
}
```

### Environment Variables Management

**Structured Variables**:
```bash
# Database
railway variables set DATABASE_URL=postgresql://...
railway variables set DATABASE_POOL_SIZE=20

# API Keys
railway variables set STRIPE_SECRET_KEY=sk_...
railway variables set SENDGRID_API_KEY=SG...

# Application Config
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set LOG_LEVEL=info
```

**Variable Templates**:
```bash
# Use Railway's internal variables
railway variables set API_URL="https://${RAILWAY_SERVICE_NAME}.up.railway.app"
```

---

## 5. Scaling and Performance

### Horizontal Scaling

**Multiple Replicas**:
```bash
# Scale to 3 replicas
railway scale replicas 3

# Check current scale
railway scale
```

**Load Balancing**:
Railway automatically load balances traffic across replicas.

### Vertical Scaling

**Increase Resources**:
```json
{
  "deploy": {
    "resources": {
      "cpu": "2000m",     # 2 CPU cores
      "memory": "4Gi"      # 4GB RAM
    }
  }
}
```

### Performance Optimization

**Caching Strategy**:
```javascript
// Redis caching example
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache database queries
async function getUserById(id) {
  const cacheKey = `user:${id}`
  
  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Fetch from database
  const user = await db.user.findUnique({ where: { id } })
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(user))
  
  return user
}
```

**Connection Pooling**:
```javascript
// Database connection pool
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000
})
```

---

## 6. Networking and Custom Domains

### Custom Domain Setup

**Add Domain**:
```bash
# Add custom domain to service
railway domain add api.example.com
```

**DNS Configuration**:
```
Type: CNAME
Name: api
Value: your-service.up.railway.app
```

### Internal Networking

**Service-to-Service Communication**:

Railway services in the same project can communicate using:
- Internal domain: `service-name.railway.internal`
- Environment variable reference: `${{ SERVICE_NAME.RAILWAY_PUBLIC_DOMAIN }}`

**Example**:
```javascript
// API service calling Workers service
const workersUrl = process.env.WORKERS_INTERNAL_URL || 
                  'https://workers.railway.internal'

const response = await fetch(`${workersUrl}/process`, {
  method: 'POST',
  body: JSON.stringify(data)
})
```

### Rate Limiting and Security

**Implement Rate Limiting**:
```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  # 15 minutes
  max: 100,                   # Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', limiter)
```

---

## 7. Cost Optimization

### Resource Right-Sizing

**Monitor Usage**:
```bash
# View service metrics
railway metrics

# Check current resource usage
railway ps
```

**Optimize Memory**:
- Start with minimal resources (512MB)
- Scale up based on actual usage
- Use Railway metrics to identify peaks

### Reduce Deployment Frequency

**Smart Deployments**:
```yaml
# Only deploy on specific paths
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'package.json'
      - 'Dockerfile'
```

### Database Optimization

**Connection Pooling**:
```javascript
// Reuse connections instead of creating new ones
const pool = new Pool({
  max: 10,  // Lower max connections to reduce costs
  min: 2
})
```

**Query Optimization**:
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);

-- Use EXPLAIN to analyze queries
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
```

---

## 8. Troubleshooting

### Common Issues

**Service Won't Start**:
```bash
# Check logs
railway logs --follow

# Common causes:
# - Missing environment variables
# - Port not exposed correctly
# - Health check failing
```

**Build Failures**:
```bash
# View build logs
railway logs --build

# Common causes:
# - Missing dependencies in package.json
# - Node version mismatch
# - Build command errors
```

**Database Connection Errors**:
```javascript
// Add connection retry logic
import { retry } from 'ts-retry-promise'

const connectToDatabase = retry(
  async () => {
    return await prisma.$connect()
  },
  {
    retries: 5,
    delay: 1000,
    timeout: 10000
  }
)
```

### Debugging Production Issues

**Enable Debug Logging**:
```bash
# Set log level
railway variables set LOG_LEVEL=debug

# Redeploy to apply
railway up
```

**Access Shell**:
```bash
# Open shell in running service
railway run bash

# Run commands
railway run npm run seed
```

### Performance Debugging

**Profiling**:
```javascript
// Add performance monitoring
import { performance } from 'perf_hooks'

function measurePerformance(fn, name) {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  console.log(`${name} took ${end - start}ms`)
  return result
}
```

**Memory Leak Detection**:
```javascript
// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage()
  console.log('Memory usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(used.external / 1024 / 1024)}MB`
  })
}, 60000)  // Every minute
```

---

## Advanced Patterns

### Blue-Green Deployments

**Strategy**:
1. Deploy new version to separate service (green)
2. Test green service thoroughly
3. Switch traffic to green service
4. Keep blue service running as backup
5. Decommission blue after verification

**Implementation**:
```bash
# Deploy new version as separate service
railway up --service=api-green

# Test green service
curl https://api-green.railway.app/health

# Update DNS to point to green service
# Keep blue service running for rollback
```

### Canary Deployments

**Gradual Rollout**:
1. Deploy canary with limited replicas
2. Route small percentage of traffic to canary
3. Monitor metrics
4. Gradually increase traffic
5. Full rollout or rollback based on metrics

**Using Load Balancer**:
```bash
# Deploy canary service
railway up --service=api-canary

# Configure load balancer to route 10% traffic to canary
# Monitor for 15 minutes
# If stable, increase to 50%, then 100%
```

---

## Best Practices Summary

✅ **Performance**:
- Use multi-stage Docker builds
- Implement connection pooling
- Add caching layer (Redis)
- Optimize database queries
- Monitor resource usage

✅ **Reliability**:
- Implement health checks
- Use graceful shutdown
- Add retry logic for external calls
- Set up proper error handling
- Configure restart policies

✅ **Security**:
- Never hardcode secrets
- Use environment variables
- Implement rate limiting
- Keep dependencies updated
- Use least-privilege access

✅ **Cost**:
- Right-size resources
- Use connection pooling
- Implement caching
- Monitor usage regularly
- Scale based on demand

---

For frontend deployment patterns, see `VERCEL_ADVANCED.md`. For canary deployment strategies, see `CANARY_DEPLOYMENTS.md`.