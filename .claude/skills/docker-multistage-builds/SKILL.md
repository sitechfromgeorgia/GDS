---
name: docker-nextjs-15-production
description: Builds production-grade Docker images for Next.js 15 using multi-stage builds, pnpm caching, standalone output, and security best practices. Achieves <150MB images with fast caching. Use when containerizing Next.js 15 apps, optimizing image size, implementing Docker BuildKit, or deploying to Kubernetes.
---

# Production-Grade Docker for Next.js 15

## Quick Start

Enable standalone output in `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

Create `Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile --prod --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tini && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --chown=nextjs:nodejs . .
ENV NODE_ENV=production
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
USER nextjs
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

Build with BuildKit:

```bash
DOCKER_BUILDKIT=1 docker build -t myapp:latest .
```

---

## When to Use This Skill

- **Next.js 15 containerization** – Standalone output + minimal image size
- **Microservices/Kubernetes** – Security hardening with non-root user + tini
- **CI/CD pipelines** – Docker BuildKit caching to reduce build time
- **Production deployments** – Sub-150MB images with fast startup
- **Optimizing dependencies** – pnpm with layer caching + cache mounts

---

## Architecture: The 3-Stage Build

### Stage 1: Deps (Production Dependencies)

Installs **only production dependencies** without the build tools. This layer is cached aggressively.

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile --prod --ignore-scripts
```

**Why separate?** Docker caches layers. If source code changes but `package.json` doesn't, this layer is reused.

### Stage 2: Builder (Full Environment)

Installs **all dependencies** (dev + production) and compiles the Next.js app.

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build
```

**Key points:**
- `python3 make g++` needed only for **build** (node-gyp for native modules like sharp)
- `ARG NEXT_PUBLIC_API_URL` passed at build time (e.g., `--build-arg NEXT_PUBLIC_API_URL=https://api.example.com`)
- Build cache invalidates only if source code changes

### Stage 3: Runner (Minimal Production Image)

Copies **only** the compiled app, public assets, and production dependencies. No build tools.

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tini && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --chown=nextjs:nodejs . .
ENV NODE_ENV=production
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
USER nextjs
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

**Result:** `~140MB` final image (from 900MB+ without optimization)

---

## Next.js 15 Standalone Output

### Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // Outputs a standalone folder with all dependencies bundled
  output: 'standalone',
  
  // Optional: React strict mode for development warnings
  reactStrictMode: true,
  
  // Optional: image optimization settings
  images: {
    unoptimized: true, // Set true for self-hosted (standalone doesn't include sharp automatically)
  },
};

export default nextConfig;
```

### Build Output Structure

After `npm run build`:

```
.next/
├── standalone/          # Full app with node_modules
│   ├── node_modules/
│   ├── package.json
│   └── server.js        # Entry point (not next start!)
├── static/              # Optimized static files
│   └── chunks/
└── cache/
```

### What to Copy to Docker

```dockerfile
# Standalone contains everything except static and public assets
COPY --from=builder /app/.next/standalone ./

# Must copy static explicitly
COPY --from=builder /app/.next/static ./.next/static

# User assets (favicon, robots.txt, etc.)
COPY --from=builder /app/public ./public
```

**Important:** Running `node server.js` (not `next start`) from standalone is 2-3x faster at startup.

---

## Sharp Optimization in Docker

### The Problem

Sharp (image optimization library) has OS-specific prebuilt binaries. Alpine uses `musl` (not `glibc`), causing build failures.

### Solution 1: Use Alpine with Build Dependencies (Recommended for Next.js)

Include only **during build**, remove after:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
# Install only what sharp needs at build time
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Build tools not copied to runner stage
```

### Solution 2: Use Debian-Based Image

If sharp fails with Alpine, switch to `node:20-slim`:

```dockerfile
FROM node:20-slim AS builder
# No apk add needed; apt comes with Debian
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
```

**Tradeoff:** Image larger (+50-80MB) but compatible with more native modules.

### Solution 3: Disable Image Optimization (Simple)

For standalone deployments, disable sharp entirely:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, // Browser handles optimization
  },
};
```

---

## Docker BuildKit Cache Mounts (Advanced)

### Enable Persistent Cache

BuildKit can cache the pnpm store **between builds**, drastically reducing install time.

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml package.json ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
```

### Build Command

```bash
# Enable BuildKit
DOCKER_BUILDKIT=1 docker build \
  --cache-from=type=registry,ref=myregistry/myapp:buildcache \
  -t myapp:latest \
  .
```

**Result:** 2nd build takes ~5-10 seconds instead of 30+ seconds.

### CI/CD with BuildKit Cache

For GitHub Actions:

```yaml
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ env.REGISTRY }}/myapp:latest
    cache-from: type=registry,ref=${{ env.REGISTRY }}/myapp:buildcache
    cache-to: type=registry,ref=${{ env.REGISTRY }}/myapp:buildcache,mode=max
```

---

## Security: Non-Root User & tini

### Creating a Non-Root User

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app

# Install tini (init process for PID 1)
RUN apk add --no-cache tini

# Create nodejs group and user with specific IDs
# IDs useful for Kubernetes securityContext matching
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy app with correct ownership
COPY --chown=nextjs:nodejs . .

# Drop to non-root
USER nextjs

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

### Why tini?

**Problem:** Node.js as PID 1 doesn't handle signals (`SIGTERM`) properly, causing slow shutdowns.

**Solution:** tini (lightweight init) runs as PID 1, forwards signals to Node.js, and reaps zombie processes.

```
docker stop myapp
  ↓
Docker sends SIGTERM to PID 1 (tini)
  ↓
tini forwards to node server.js
  ↓
Node gracefully closes connections
  ↓
Container exits cleanly (~100ms vs 10s timeout)
```

### Kubernetes Compatibility

If using `docker run --init`:

```dockerfile
# Option A: tini in Dockerfile (works everywhere)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

# Option B: Docker init (not Kubernetes compatible)
# docker run --init myapp
# CMD ["node", "server.js"]
```

---

## Best Practices

### ✅ Caching Optimization

- **COPY package.json before source code** – Dependencies cached separately
- **Order by frequency of change** – Files changing rarely go higher in Dockerfile
- **Use .dockerignore** – Exclude node_modules, .git, .env from build context

### ✅ Image Size

- **Multi-stage builds** – Drop dev dependencies and build tools
- **Alpine base** – ~145MB for Node.js vs 900MB+ with deps
- **Standalone output** – Only necessary files bundled

### ✅ Build Performance

- **BuildKit cache mounts** – Reuse pnpm store between builds
- **Use pnpm** – Faster installs than npm, hardlink-based storage
- **--frozen-lockfile** – Deterministic builds (crucial for reproducibility)

### ✅ Production Safety

- **Non-root user** – Limits damage if container compromised
- **tini as init** – Proper signal handling and zombie reaping
- **NODE_ENV=production** – Disables dev middleware
- **HOSTNAME=0.0.0.0** – Listens on all interfaces (required for Docker networking)

### ✅ Build Arguments

```dockerfile
ARG NODE_VERSION=20
ARG NEXT_PUBLIC_API_URL=https://api.example.com
ARG NEXT_PUBLIC_ANALYTICS=true

FROM node:${NODE_VERSION}-alpine
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ANALYTICS=${NEXT_PUBLIC_ANALYTICS}
```

Build with:

```bash
DOCKER_BUILDKIT=1 docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.prod.com \
  --build-arg NEXT_PUBLIC_ANALYTICS=true \
  -t myapp:prod .
```

---

## Common Errors & Solutions

### Error: `Module not found: Can't resolve 'next/...'`

**Cause:** Standalone doesn't include Next.js modules in expected location.

**Solution:** Verify `next.config.ts` has `output: 'standalone'`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // ← Don't forget this!
};
```

Then rebuild:

```bash
rm -rf .next && npm run build
```

### Error: `ENOENT: no such file or directory, open './public/favicon.ico'`

**Cause:** Forgot to copy `public/` folder to runner stage.

**Solution:**

```dockerfile
COPY --from=builder /app/public ./public
```

### Error: `gyp ERR! configure error` (Sharp on Alpine)

**Cause:** Missing build dependencies when sharp compiles.

**Solution:** Add to builder stage:

```dockerfile
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev
```

Or use `node:20-slim` instead.

### Error: `docker stop` takes 10+ seconds

**Cause:** No init process (tini) to forward SIGTERM.

**Solution:**

```dockerfile
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

### Error: `EACCES: permission denied` on volume mount

**Cause:** App running as non-root user, bind mount owned by host root.

**Solution (Development):** Override USER temporarily:

```bash
docker run --user root myapp
```

Or set proper ownership on host:

```bash
docker run --user nodejs:nodejs \
  -v $(pwd)/data:/app/data \
  myapp
```

### Error: `Cannot find module '/app/node'` with distroless

**Cause:** distroless doesn't have shell; CMD syntax wrong.

**Solution:** Use direct array form (not shell):

```dockerfile
# ❌ Wrong – distroless tries to execute '/app/node'
CMD ["node", "server.js"]

# ✅ Correct – distroless executes directly
CMD ["/nodejs/bin/node", "server.js"]

# Or safer: use full entrypoint
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["server.js"]
```

---

## Production-Ready Files

### Complete Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4

# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm@latest && \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm@latest && \
    pnpm install --frozen-lockfile
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_VERSION=${NEXT_PUBLIC_VERSION}

RUN pnpm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install tini and create non-root user
RUN apk add --no-cache tini && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets with correct ownership
COPY --chown=nextjs:nodejs /app/public ./public

# Runtime environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Security: run as non-root
USER nextjs

# Proper init and signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

### .dockerignore

```
.git
.gitignore
node_modules
npm-debug.log
.env
.env.local
.env.*.local
.next
dist
build
.turbo
*.md
.DS_Store
.idea
.vscode
coverage
.nyc_output
```

### docker-compose.yml (Development)

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://user:password@db:5432/nextjs_dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - db
    command: pnpm dev

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: nextjs_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Build Script (build.sh)

```bash
#!/bin/bash
set -e

IMAGE_NAME="${1:-myapp}"
VERSION="${2:-latest}"
API_URL="${3:-https://api.example.com}"

echo "Building $IMAGE_NAME:$VERSION with API_URL=$API_URL"

DOCKER_BUILDKIT=1 docker build \
  --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
  --build-arg NEXT_PUBLIC_VERSION="$VERSION" \
  -t "$IMAGE_NAME:$VERSION" \
  -t "$IMAGE_NAME:latest" \
  .

echo "✓ Build complete"
echo "Run with: docker run -p 3000:3000 $IMAGE_NAME:$VERSION"
```

### Kubernetes Deployment (deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nextjs-app
  template:
    metadata:
      labels:
        app: nextjs-app
    spec:
      containers:
      - name: app
        image: myregistry/myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.example.com"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
```

---

## References

- [Next.js Deployment Docs](https://nextjs.org/docs/app/getting-started/deploying)
- [Next.js Output Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [pnpm Docker Guide](https://pnpm.io/docker)
- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [tini – A Tiny init for Containers](https://github.com/krallin/tini)
- [PID 1 Signal Handling](https://petermalmgren.com/signal-handling-docker/)
- [Sharp Installation Guide](https://sharp.pixelplumbing.com/install/)
- [Docker Security Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
