# Dockploy Deployment - Required Fixes

## Critical Issues Blocking Deployment

### 1. Build Failure: Missing winston Module

**Error:**
```
Type error: Cannot find module 'winston' or its corresponding type declarations.
./src/lib/winston-logger.ts:6:21
```

**Root Cause:**
- `winston-logger.ts` exists but is NOT imported anywhere in the codebase
- Next.js still compiles it during build, causing failure
- `winston` is in `package.json` but `node_modules` may not be installed locally

**Fix Options:**

**Option A: Remove unused file (Recommended)**
```bash
# Delete the unused winston-logger.ts file
rm frontend/src/lib/winston-logger.ts
```

**Option B: Ensure winston is installed in Docker**
The Dockerfile already runs `npm ci`, which should install winston. But if the file isn't used, it's better to remove it.

**Recommendation:** Delete `winston-logger.ts` since it's not used anywhere.

---

### 2. Missing Build Arguments in docker-compose.yml

**Problem:**
`docker-compose.yml` doesn't pass `NEXT_PUBLIC_*` variables as build arguments. Next.js requires these at **build time** for static optimization.

**Current (Broken):**
```yaml
build:
  context: ./frontend
  dockerfile: Dockerfile
  args:
    - NODE_ENV=production  # ❌ Missing NEXT_PUBLIC_* args
```

**Fix:**
```yaml
build:
  context: ./frontend
  dockerfile: Dockerfile
  args:
    - NODE_ENV=production
    - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
    - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
```

---

### 3. Dockerfile Doesn't Accept Build Arguments

**Problem:**
`Dockerfile` doesn't have `ARG` declarations for `NEXT_PUBLIC_*` variables, so they can't be passed from docker-compose.yml.

**Current (Broken):**
```dockerfile
# No ARG declarations for NEXT_PUBLIC_* variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

**Fix:**
Add after line 20 (after `ENV NODE_OPTIONS`):
```dockerfile
# Build arguments for environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
```

---

### 4. Health Check Tool Missing

**Problem:**
`docker-compose.yml` uses `wget` for health check, but `node:22-alpine` doesn't include it.

**Current (Broken):**
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
```

**Fix Options:**

**Option A: Use Node.js (No extra tools needed)**
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
```

**Option B: Install wget in Dockerfile**
```dockerfile
RUN apk add --no-cache wget
```

**Recommendation:** Use Option A (Node.js) - no extra dependencies needed.

---

### 5. Edge Runtime Warning (Non-blocking)

**Warning:**
```
./src/lib/csrf-utils.ts
A Node.js module is loaded ('crypto' at line 12) which is not supported in the Edge Runtime.
```

**Impact:** Warning only, won't block build. But if you use Edge Runtime, this will fail.

**Fix:** Add runtime configuration to routes that use csrf-utils:
```typescript
export const runtime = 'nodejs' // Force Node.js runtime
```

---

## Complete Fix Implementation

### Step 1: Fix docker-compose.yml

```yaml
# Georgian Distribution Management - Production Environment
# Docker Compose configuration for production deployment via Dockploy

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
    ports:
      - "3000:3000"
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

### Step 2: Fix Dockerfile

Add after line 21 (after `ENV NODE_OPTIONS`):

```dockerfile
# Build arguments for environment variables (provided at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
```

### Step 3: Remove Unused winston-logger.ts

```bash
# Delete the unused file
rm frontend/src/lib/winston-logger.ts
```

Or if you want to keep it for future use, add it to `.dockerignore` or exclude it from TypeScript compilation.

---

## Environment Variables Required in Dockploy

Make sure these are set in Dockploy's environment variables UI:

```env
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=https://greenland77.ge
```

**Important:** These must be set in Dockploy BEFORE deployment, as they're referenced in `docker-compose.yml` as `${NEXT_PUBLIC_SUPABASE_URL}`.

---

## Testing the Fixes

### Local Test

```bash
# Build the image with build args
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

### Expected Results

- ✅ Build completes without errors
- ✅ Container starts successfully
- ✅ Health endpoint returns 200
- ✅ Environment variables are available in client-side code

---

## Summary of Changes

1. ✅ **docker-compose.yml**: Add build args for NEXT_PUBLIC_* variables, fix health check
2. ✅ **Dockerfile**: Add ARG declarations and ENV assignments for build-time variables
3. ✅ **winston-logger.ts**: Delete unused file (or ensure winston is installed)
4. ✅ **Dockploy UI**: Set environment variables before deployment

---

## Priority Order

1. **CRITICAL**: Fix build args (docker-compose.yml + Dockerfile) - Blocks deployment
2. **CRITICAL**: Remove/fix winston-logger.ts - Blocks build
3. **HIGH**: Fix health check - Causes container restart issues
4. **MEDIUM**: Edge runtime warning - Non-blocking but should be fixed

---

**After applying these fixes, the Dockploy deployment should succeed!**

