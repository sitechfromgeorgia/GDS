# Dockploy Deployment Diagnostics Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## Executive Summary

Multiple critical issues prevent successful Dockploy deployment:

1. **Missing build arguments** - `docker-compose.yml` doesn't pass required `NEXT_PUBLIC_*` env vars as build args
2. **Dockerfile mismatch** - `docker-compose.yml` uses `Dockerfile` but `Dockerfile.production` is the optimized version
3. **Standalone output mismatch** - `Dockerfile.production` expects `.next/standalone` but regular `Dockerfile` doesn't use standalone
4. **Missing dependencies** - TypeScript errors indicate missing `winston` module
5. **Health check tool missing** - `docker-compose.yml` uses `wget` but Alpine images don't include it by default

---

## Issue 1: Missing Build Arguments in docker-compose.yml

**File:** `docker-compose.yml`  
**Severity:** 🔴 CRITICAL

### Problem
`docker-compose.yml` sets environment variables but doesn't pass them as build arguments. Next.js requires `NEXT_PUBLIC_*` variables at **build time**, not just runtime.

### Current Configuration
```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production  # ❌ Missing NEXT_PUBLIC_* build args
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}  # ❌ Only runtime, not build time
```

### Required Fix
```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
        - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
        - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
```

### Impact
- Build will succeed but Next.js static optimization will fail
- Environment variables will be `undefined` in client-side code
- Application will not connect to Supabase

---

## Issue 2: Dockerfile Mismatch

**File:** `docker-compose.yml` vs `Dockerfile.production`  
**Severity:** 🟡 HIGH

### Problem
- `docker-compose.yml` uses `Dockerfile` (basic version)
- `Dockerfile.production` exists with optimizations but isn't used
- `Dockerfile.production` expects build args that aren't passed

### Current State
- `docker-compose.yml` → uses `Dockerfile`
- `Dockerfile` → doesn't accept build args for `NEXT_PUBLIC_*` variables
- `Dockerfile.production` → expects build args but isn't used

### Required Fix
**Option A:** Update `docker-compose.yml` to use `Dockerfile.production`
```yaml
build:
  context: ./frontend
  dockerfile: Dockerfile.production  # ✅ Use optimized version
  args:
    - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
    - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
```

**Option B:** Update `Dockerfile` to accept build args (simpler for Dockploy)

---

## Issue 3: Standalone Output Mismatch

**File:** `Dockerfile.production` line 86  
**Severity:** 🔴 CRITICAL (if using Dockerfile.production)

### Problem
`Dockerfile.production` expects `.next/standalone` directory:
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
```

But `next.config.ts` only enables standalone in production:
```typescript
output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
```

### Current State
- `Dockerfile.production` line 86: expects `./.next/standalone`
- `Dockerfile.production` line 105: runs `node server.js` (from standalone)
- Regular `Dockerfile`: doesn't use standalone, uses `npm run start:docker`

### Required Fix
If using `Dockerfile.production`, ensure `NODE_ENV=production` is set during build:
```dockerfile
ENV NODE_ENV=production  # ✅ Must be set before npm run build
RUN npm run build  # This will create .next/standalone
```

---

## Issue 4: Missing Dependencies

**File:** `src/lib/winston-logger.ts`  
**Severity:** 🟡 MEDIUM

### Problem
TypeScript compilation error:
```
src/lib/winston-logger.ts(6,21): error TS2307: Cannot find module 'winston'
```

### Current State
- `winston` is listed in `package.json` dependencies
- But TypeScript can't find it (likely `node_modules` not installed or out of sync)

### Required Fix
```bash
cd frontend
npm ci  # Clean install
```

### Verification
```bash
npm run type-check  # Should not show winston errors
```

---

## Issue 5: Health Check Tool Missing

**File:** `docker-compose.yml` line 25  
**Severity:** 🟡 MEDIUM

### Problem
Health check uses `wget`:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
```

But `node:22-alpine` doesn't include `wget` by default.

### Required Fix
**Option A:** Install wget in Dockerfile
```dockerfile
RUN apk add --no-cache wget
```

**Option B:** Use curl (already available in some Alpine images)
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
```

**Option C:** Use Node.js health check (no external tools needed)
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
```

---

## Issue 6: TypeScript Errors in Source Code

**File:** Multiple test files  
**Severity:** 🟢 LOW (tests don't block production build)

### Problem
Many TypeScript errors in `__tests__/` directory, but these won't block production build since:
- `next.config.ts` has `typescript.ignoreBuildErrors: false` (should be true for tests)
- Tests are excluded from build

### Impact
- Won't block Docker build
- But indicates code quality issues

---

## Recommended Fix Priority

### Priority 1: CRITICAL (Blocks Deployment)
1. ✅ **Add build args to docker-compose.yml** - Required for environment variables
2. ✅ **Fix Dockerfile to accept build args** - Or switch to Dockerfile.production
3. ✅ **Fix standalone output** - If using Dockerfile.production

### Priority 2: HIGH (Causes Runtime Issues)
4. ✅ **Install missing dependencies** - Run `npm ci` in Dockerfile
5. ✅ **Fix health check tool** - Install wget or use alternative

### Priority 3: MEDIUM (Code Quality)
6. ✅ **Fix TypeScript errors in tests** - Won't block build but good practice

---

## Quick Fix for Dockploy

### Step 1: Update docker-compose.yml
```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
        - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
        - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    restart: unless-stopped
    networks:
      - distribution-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '3.0'
          memory: 6G
        reservations:
          cpus: '1.0'
          memory: 1G

networks:
  distribution-network:
    driver: bridge
```

### Step 2: Update Dockerfile to Accept Build Args
```dockerfile
# Add after line 20 (after ENV NODE_OPTIONS)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
```

### Step 3: Ensure Dependencies are Installed
The `npm ci` in Dockerfile should handle this, but verify `package.json` includes all required dependencies.

---

## Environment Variables Required in Dockploy

Make sure these are set in Dockploy's environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=https://greenland77.ge
```

**Important:** These must be set in Dockploy's UI before deployment, as they're referenced in `docker-compose.yml` as `${NEXT_PUBLIC_SUPABASE_URL}`.

---

## Testing the Fix

After applying fixes, test locally:

```bash
# Build the image
docker build -f frontend/Dockerfile \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  --build-arg NEXT_PUBLIC_APP_URL=https://greenland77.ge \
  -t test-build frontend/

# Run the container
docker run -p 3000:3000 test-build

# Test health endpoint
curl http://localhost:3000/api/health
```

---

## Next Steps

1. ✅ Apply fixes to `docker-compose.yml` and `Dockerfile`
2. ✅ Test build locally
3. ✅ Verify environment variables in Dockploy
4. ✅ Deploy via Dockploy
5. ✅ Monitor logs for any runtime errors

---

**Report End**

