---
name: github-actions-nextjs-docker-cicd
description: Configures production-grade CI/CD pipelines using GitHub Actions for Next.js 15 (App Router), Playwright E2E tests, and Docker deployment to Dokploy/VPS. Includes pnpm caching, parallel job optimization, GHCR registry integration, and SSH zero-downtime deployments. Use when setting up automated testing and deployment workflows, integrating GitHub Actions with Next.js and Docker, configuring multi-stage CI workflows, deploying to self-hosted VPS, or optimizing GitHub Actions billable minutes.
---

# GitHub Actions CI/CD for Next.js 15 & Docker (2025)

## Quick Start

**1. Create workflow files:**

```bash
mkdir -p .github/workflows
# Two files needed: ci.yml (PR testing) and deploy.yml (production deployment)
```

**2. Add secrets to GitHub repository** (Settings → Secrets and variables):
```
DOKPLOY_HOST: your.vps.ip
DOKPLOY_USER: root
DOKPLOY_SSH_KEY: (private SSH key with newlines as \n)
GHCR_TOKEN: (GitHub token with write:packages scope)
SUPABASE_PREVIEW_KEY: (preview branch API key from Supabase)
NEXT_PUBLIC_SUPABASE_URL: https://...supabase.co
DATABASE_URL: postgresql://user:pass@host/db
```

**3. Deploy the workflows:**
- Push `.github/workflows/ci.yml` and `deploy.yml` to repository
- GitHub automatically triggers workflows on push/PR

---

## When to Use This Skill

- Setting up CI pipelines for Next.js 15 projects
- Configuring parallel lint, test, and build validation on PRs
- Running end-to-end tests with Playwright in Docker
- Deploying Docker images to self-hosted VPS (Dokploy)
- Pushing images to GitHub Container Registry (GHCR)
- Managing environment variables during build and deployment phases
- Implementing zero-downtime rolling deployments
- Optimizing GitHub Actions billable minutes (cost reduction)
- Integrating Supabase preview branches with CI/CD

---

## Core Concepts

### Pipeline Architecture (2025 Patterns)

```
GitHub Event (push/PR)
    ↓
├─ CI Workflow (ci.yml)
│  ├─ Lint (ESLint, Prettier)
│  ├─ Test (Vitest, unit tests)
│  ├─ Build (Next.js)
│  └─ E2E (Playwright) [optional, only on PR]
│
└─ CD Workflow (deploy.yml) [main branch only]
   ├─ Build Docker image
   ├─ Push to GHCR
   └─ SSH → VPS → Docker pull & restart
```

### Key Technical Decisions (2025)

| Decision | Rationale |
|----------|-----------|
| **pnpm + actions/setup-node caching** | 3-5x faster than npm, built-in GitHub Actions support |
| **Parallel jobs (Lint/Test/Build)** | Reduces total workflow time by 40-60% |
| **Docker build in CI, push to GHCR** | Atomic builds, reusable images, no VPS compilation overhead |
| **SSH deployment (appleboy/ssh-action)** | Lightweight, no extra runners needed, full shell access |
| **Supabase preview branches** | Isolated E2E environments, auto-cleanup after PR |
| **Artifact upload on failure only** | Saves storage, faster workflow on success |

---

## CI Workflow: `ci.yml` (Pull Requests)

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io

jobs:
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Lint & Format Check (fast track)
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  lint:
    runs-on: ubuntu-latest
    name: Lint & Format
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Check formatting
        run: pnpm format:check

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Unit Tests (Vitest)
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test:
    runs-on: ubuntu-latest
    name: Unit Tests
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Vitest
        run: pnpm test:unit
        env:
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Build & Type Check
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  build:
    runs-on: ubuntu-latest
    name: Build & Type Check
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      # CRITICAL: NEXT_PUBLIC_* vars must be set during build phase
      - name: Build Next.js
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_ENV: staging
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # E2E Tests with Playwright (Docker)
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  e2e:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    name: E2E Tests (Playwright)
    
    # Use Supabase preview branch for isolated database
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Build Next.js
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_PREVIEW_KEY }}
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run database migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Start dev server (background)
        run: |
          pnpm dev > /tmp/server.log 2>&1 &
          echo $! > /tmp/server.pid
          
          # Wait for server to be ready (30 second timeout)
          timeout 30 bash -c 'until curl -f http://localhost:3000; do sleep 1; done'
          echo "✅ Dev server started successfully"
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_PREVIEW_KEY }}
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run Playwright tests
        run: pnpm test:e2e
        env:
          BASE_URL: http://localhost:3000

      - name: Stop dev server
        if: always()
        run: kill $(cat /tmp/server.pid) 2>/dev/null || true

      - name: Upload Playwright traces (on failure only)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces
          path: playwright-report/
          retention-days: 7

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Status check (gating mechanism)
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ci-passed:
    runs-on: ubuntu-latest
    needs: [lint, test, build, e2e]
    if: always()
    name: CI Status
    steps:
      - name: Check CI Status
        run: |
          if [[ "${{ needs.lint.result }}" == "failure" || 
                "${{ needs.test.result }}" == "failure" || 
                "${{ needs.build.result }}" == "failure" || 
                ("${{ github.event_name }}" == "pull_request" && "${{ needs.e2e.result }}" == "failure") ]]; then
            echo "❌ CI pipeline failed"
            exit 1
          fi
          echo "✅ All CI checks passed"
```

### CI Workflow Optimization Tips

**Reduce Billable Minutes:**
- `concurrency`: Cancel previous runs when new commit pushed (saves 30-50% minutes on active repos)
- `if: github.event_name == 'pull_request'`: Skip expensive E2E tests on push to main
- `actions/upload-artifact`: Only on failure (saves 10+ minutes per build)
- `pnpm` + GitHub Actions cache: 3x faster than npm (saves 2-3 min per job)

**pnpm Cache Configuration (Correct):**
```yaml
# ✅ CORRECT - use actions/setup-node with cache: 'pnpm'
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'  # Automatically caches ~/.pnpm-store

# ❌ WRONG - manual cache doesn't work well with pnpm store
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store  # Path mismatch, pnpm won't recognize it
```

---

## CD Workflow: `deploy.yml` (Production Deployment)

```yaml
name: Deploy to Dokploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  DOCKER_BUILD_CACHE: /tmp/.buildx-cache

jobs:
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Build Docker image & push to GHCR
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  build:
    runs-on: ubuntu-latest
    name: Build & Push Docker Image
    permissions:
      contents: read
      packages: write
    outputs:
      image-digest: ${{ steps.image.outputs.digest }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx (BuildKit)
        uses: docker/setup-buildx-action@v3
        with:
          platforms: linux/amd64,linux/arm64

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix={{branch}}-
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        id: image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
            NEXT_PUBLIC_APP_ENV=production

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Deploy to VPS via SSH
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deploy:
    needs: build
    runs-on: ubuntu-latest
    name: Deploy to VPS (Dokploy)
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Dokploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DOKPLOY_HOST }}
          username: ${{ secrets.DOKPLOY_USER }}
          key: ${{ secrets.DOKPLOY_SSH_KEY }}
          port: 22
          timeout: 60s
          command_timeout: 10m
          
          script: |
            set -e
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # 1. Prepare environment
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            echo "🚀 Starting deployment..."
            APP_DIR="/opt/dokploy/apps/my-app"
            COMPOSE_FILE="$APP_DIR/docker-compose.yml"
            
            mkdir -p $APP_DIR
            cd $APP_DIR
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # 2. Authenticate with GHCR
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            echo "📦 Logging in to GHCR..."
            echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io \
              -u ${{ github.actor }} \
              --password-stdin
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # 3. Pull latest code
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            echo "📥 Pulling latest code..."
            if [ -d .git ]; then
              git pull origin main
            else
              git clone https://github.com/${{ github.repository }}.git .
              git checkout main
            fi
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # 4. Update environment variables
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            echo "🔐 Updating environment..."
            cat > .env.production << EOF
            NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
            DATABASE_URL=${{ secrets.DATABASE_URL }}
            NEXT_PUBLIC_APP_ENV=production
            NODE_ENV=production
            EOF
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # 5. Zero-downtime rolling deployment
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            echo "🔄 Performing zero-downtime deployment..."
            
            # Pull new image (may take 1-2 min)
            docker pull ghcr.io/${{ github.repository }}:main
            
            # Create new container but don't start it yet
            TIMESTAMP=$(date +%s)
            docker-compose -f $COMPOSE_FILE config > docker-compose.tmp
            
            # Stop old container gracefully (drain connections)
            echo "⏸️  Draining connections from old container..."
            docker-compose -f $COMPOSE_FILE stop --timeout 30
            
            # Start new container
            echo "✅ Starting new container..."
            docker-compose -f $COMPOSE_FILE up -d
            
            # Health check (wait up to 30s for app to be ready)
            echo "🏥 Waiting for health check..."
            for i in {1..30}; do
              if curl -f http://localhost:3000 > /dev/null 2>&1; then
                echo "✅ Application is healthy!"
                break
              fi
              echo "  Attempt $i/30..."
              sleep 1
            done
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            # 6. Cleanup & verify
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            echo "🧹 Cleanup..."
            docker system prune -f
            docker logout ghcr.io
            
            # Verify running containers
            echo "📊 Running containers:"
            docker ps --format "table {{.Names}}\t{{.Status}}"
            
            echo "✨ Deployment completed successfully!"

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # Notify deployment status
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  notify:
    needs: [build, deploy]
    runs-on: ubuntu-latest
    if: always()
    name: Notify Deployment Status

    steps:
      - name: Determine status
        id: status
        run: |
          if [[ "${{ needs.deploy.result }}" == "success" ]]; then
            echo "status=✅ Deployment successful" >> $GITHUB_OUTPUT
            echo "color=28a745" >> $GITHUB_OUTPUT
          else
            echo "status=❌ Deployment failed" >> $GITHUB_OUTPUT
            echo "color=cb2431" >> $GITHUB_OUTPUT
          fi

      - name: Slack notification (optional)
        uses: slackapi/slack-github-action@v1
        if: ${{ secrets.SLACK_WEBHOOK }} != ''
        with:
          payload: |
            {
              "text": "${{ steps.status.outputs.status }} - ${{ github.repository }}",
              "attachments": [{
                "color": "${{ steps.status.outputs.color }}",
                "fields": [{
                  "title": "Commit",
                  "value": "${{ github.sha }}",
                  "short": true
                }, {
                  "title": "Author",
                  "value": "${{ github.actor }}",
                  "short": true
                }]
              }]
            }
```

### Dockerfile (Optimized for Next.js 15)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install dependencies (leverage Docker layer caching)
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build arguments (from GitHub Actions)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_ENV

# Build Next.js
RUN pnpm build

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Runtime stage (multi-stage for size reduction)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create app user (security best practice)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built app from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]
```

---

## Common Errors & Solutions

### Error: "Process exited with code 1" during `npm run build`

**Causes:**
- Missing `NEXT_PUBLIC_*` environment variables at build time
- Database migrations not run
- TypeScript compilation errors

**Solution:**
```yaml
- name: Build Next.js
  run: pnpm build
  env:
    # ALL NEXT_PUBLIC_ vars MUST be set during build (they're embedded in bundle)
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    # Non-NEXT_PUBLIC vars only available on server-side
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Error: "Cache not found for input keys"

**Causes:**
- Using `actions/cache@v4` with pnpm (wrong path)
- Lockfile changed but cache key not regenerated

**Solution:**
```yaml
# ✅ CORRECT - use setup-node with cache: 'pnpm'
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'

# Run this BEFORE pnpm install
- uses: pnpm/action-setup@v4
  with:
    version: 10  # Match your pnpm-lock.yaml version
```

### Error: "Playwright tests timeout in Docker"

**Causes:**
- Dev server not started or not responding
- Playwright browsers not installed

**Solution:**
```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps

- name: Start dev server
  run: |
    pnpm dev > /tmp/server.log 2>&1 &
    echo $! > /tmp/server.pid
    # Wait for port 3000 to be ready
    timeout 30 bash -c 'until curl -f http://localhost:3000; do sleep 1; done'

- name: Run E2E tests
  run: pnpm test:e2e
  env:
    BASE_URL: http://localhost:3000
```

### Error: "NEXT_PUBLIC vars not available in Docker runtime"

**Causes:**
- `NEXT_PUBLIC_*` vars only baked at build time, not runtime
- Docker image doesn't have env vars passed at runtime

**Solution:**
```dockerfile
# During build (GitHub Actions)
ARG NEXT_PUBLIC_SUPABASE_URL
RUN NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL pnpm build

# During deployment (SSH script), ensure docker-compose.yml has:
environment:
  NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
  NEXT_PUBLIC_APP_ENV: production
```

### Error: "SSH deployment hangs / timeout"

**Causes:**
- VPS firewall blocking connection
- SSH key permissions wrong
- Command timeout too short

**Solution:**
```yaml
- uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.DOKPLOY_HOST }}
    username: ${{ secrets.DOKPLOY_USER }}
    key: ${{ secrets.DOKPLOY_SSH_KEY }}
    timeout: 60s                    # ← Increase this
    command_timeout: 10m            # ← Increase this
    # Add retries
    script_stop: true               # Stop on first error
```

Check SSH key format:
```bash
# SSH key should have \n preserved (not actual newlines)
# In GitHub Secrets, paste:
-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END OPENSSH PRIVATE KEY-----
```

---

## Best Practices

### 1. Environment Variables: Build Time vs Runtime

```yaml
# BUILD TIME (embedded in Next.js bundle)
NEXT_PUBLIC_SUPABASE_URL=...        # ✅ Available in browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # ✅ Available in browser
DATABASE_URL=...                     # ❌ NOT in bundle, only on server

# RUNTIME (passed to Docker)
NEXT_PUBLIC_APP_ENV=production       # ✅ Can be different at runtime (not recommended for NEXT_PUBLIC)
```

**Rationale:** Next.js embeds `NEXT_PUBLIC_*` vars into the static bundle at build time. Non-prefixed vars are server-only and **cannot** be changed at runtime in standalone mode.

### 2. Parallel Job Optimization

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest  # 3 jobs run simultaneously
  test:
    runs-on: ubuntu-latest
  build:
    runs-on: ubuntu-latest
  
  e2e:
    needs: [lint, test, build]  # Waits for all 3 to complete
    runs-on: ubuntu-latest
```

**Saves:** ~5-8 minutes per workflow run (40-60% reduction).

### 3. Caching Strategy

```yaml
# pnpm cache via setup-node (automatic)
- uses: pnpm/action-setup@v4
  with:
    version: 10

- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'  # Auto-caches ~/.pnpm-store

# Docker buildx cache (layer caching)
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha      # GitHub Actions cache backend
    cache-to: type=gha,mode=max  # Save all layers
```

**Expected improvement:** 
- First run: ~4 min
- Subsequent runs: ~1-1.5 min (75% faster)

### 4. Zero-Downtime Deployment Strategy

```bash
# Old: Stop → Pull → Start (2-5 sec downtime)
docker-compose down
docker pull new-image
docker-compose up -d

# Better: Graceful shutdown → Pull → Start (0 downtime)
docker-compose stop --timeout 30    # Wait 30s for connections to drain
docker pull new-image
docker-compose up -d                # New instance immediately accepts traffic
docker system prune -f              # Cleanup dangling images
```

### 5. Cost Optimization (Reduce Billable Minutes)

| Technique | Savings |
|-----------|---------|
| `concurrency: cancel-in-progress` | 30-50% on active repos |
| Skip E2E on push to main | 8-12 min per workflow |
| Use `actions/upload-artifact` only on failure | 5-10 min per build |
| Parallel jobs (lint/test/build) | 3-5 min per workflow |
| pnpm + caching | 2-3 min per install |
| **Total potential savings** | **60-80% of billable minutes** |

---

## Code Examples

### Example: Custom Test Script

```json
{
  "scripts": {
    "lint": "eslint src/ --max-warnings 0",
    "format:check": "prettier --check .",
    "format:write": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run --coverage",
    "test:e2e": "playwright test",
    "build": "next build",
    "dev": "next dev",
    "db:migrate": "node scripts/migrate.js"
  }
}
```

### Example: Playwright Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example: Docker Compose (Production)

```yaml
version: '3.9'

services:
  app:
    image: ghcr.io/your-org/your-app:main
    container_name: nextjs-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      DATABASE_URL: ${DATABASE_URL}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - app-network

  # Optional: Reverse proxy (Traefik/Nginx)
  traefik:
    image: traefik:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## References

- [GitHub Actions Caching - Next.js Official](https://nextjs.org/docs/app/guides/ci-build-caching)
- [pnpm CI Configuration](https://pnpm.io/continuous-integration)
- [Playwright CI Guide](https://playwright.dev/docs/ci)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [appleboy SSH Action](https://github.com/appleboy/ssh-action)
- [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)
- [Dokploy Documentation](https://dokploy.com)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/guides/about-continuous-integration)