# Quick Reference Guide: Docker for Next.js 15

## 🚀 One-Minute Setup

### 1. Configure Next.js
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
};
export default nextConfig;
```

### 2. Copy Dockerfile
```bash
# Copy the provided Dockerfile to your project root
cp Dockerfile ./
```

### 3. Build with BuildKit
```bash
DOCKER_BUILDKIT=1 docker build -t myapp:latest .
```

### 4. Run
```bash
docker run -p 3000:3000 myapp:latest
```

---

## 📋 File Checklist

- [ ] `Dockerfile` – Multi-stage build (provided)
- [ ] `.dockerignore` – Context optimization (provided)
- [ ] `next.config.ts` – Has `output: 'standalone'`
- [ ] `pnpm-lock.yaml` – Frozen dependencies

---

## 🔨 Common Commands

### Build
```bash
# Basic
DOCKER_BUILDKIT=1 docker build -t myapp:latest .

# With environment variable
DOCKER_BUILDKIT=1 docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.prod.com \
  -t myapp:latest .

# View image size
docker images | grep myapp
```

### Run Locally
```bash
# Basic
docker run -p 3000:3000 myapp:latest

# With environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  myapp:latest

# Interactive (bash)
docker run -it -p 3000:3000 --user root myapp:latest sh
```

### Debug
```bash
# View logs
docker logs -f <container_id>

# Inspect running container
docker exec -it <container_id> sh

# Check image size
docker inspect myapp:latest | grep Size

# Run health check manually
docker exec <container_id> node -e "require('http').get('http://localhost:3000/health')"
```

### Cleanup
```bash
# Remove image
docker rmi myapp:latest

# Remove all dangling images
docker image prune

# Remove build cache
docker builder prune
```

---

## 🛠️ Development Workflow

### Option 1: Docker Compose (Recommended)
```bash
# Start all services (app + postgres)
docker-compose up

# Build without cache
docker-compose build --no-cache

# Stop all services
docker-compose down
```

### Option 2: Manual with BuildKit Caching
```bash
# First build
DOCKER_BUILDKIT=1 docker build -t myapp:dev .

# Modify code, rebuild (uses cache)
DOCKER_BUILDKIT=1 docker build -t myapp:dev .
# → 2nd build: ~8 seconds!
```

---

## 🐳 Image Size Optimization

### Before (Bad)
```
❌ 900MB – npm install with dev deps in final image
❌ 60+ seconds rebuild every time
❌ No layer caching
```

### After (Good)
```
✅ 140MB – Multi-stage build
✅ 8 seconds rebuild (BuildKit cache)
✅ Aggressive layer caching
```

### What's Included
```
✅ Node.js runtime
✅ Production dependencies
✅ Compiled Next.js app (.next/standalone)
✅ Static assets (.next/static)
✅ Public folder
✅ tini init (1MB)

❌ Build tools (python, make, g++)
❌ Dev dependencies
❌ Node_modules duplicated
❌ Source code
```

---

## 🔒 Security Features

### Non-Root User
```dockerfile
USER nextjs  # ← Runs as UID 1001
```
**Why:** If container is compromised, attacker can't run as root

### tini Init Process
```dockerfile
ENTRYPOINT ["/sbin/tini", "--"]
```
**Why:** Handles signals properly, graceful shutdown

### No Privileges
```dockerfile
securityContext:
  runAsNonRoot: true
  allowPrivilegeEscalation: false
```

---

## 🚨 Troubleshooting

### Error: Module not found
```
Error: Can't resolve 'next/...'
```
**Fix:** Verify `next.config.ts` has `output: 'standalone'` and rebuild

### Error: Missing assets
```
Error: ENOENT: no such file or directory, open './public/favicon.ico'
```
**Fix:** Ensure `COPY --from=builder /app/public ./public` in Dockerfile

### Error: Sharp fails to build
```
gyp ERR! configure error
```
**Fix:** Add build dependencies:
```dockerfile
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev
```

### Error: Slow shutdown (10+ seconds)
```
docker stop myapp  # Takes 10+ seconds
```
**Fix:** Use tini as init:
```dockerfile
ENTRYPOINT ["/sbin/tini", "--"]
```

### Error: Permission denied
```
EACCES: permission denied, open '/app/data'
```
**Fix:** Volume mount with correct user:
```bash
docker run -v ./data:/app/data --user nodejs:nodejs myapp:latest
```

---

## 🎯 Kubernetes Deployment

### Minimal K8s Manifest
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
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.example.com"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
```

### Deploy
```bash
kubectl apply -f k8s-deployment.yaml
kubectl rollout status deployment/nextjs-app
```

---

## 📊 Performance Expectations

### Image Size
- **Expected:** 140-150MB (with Alpine + standalone)
- **Warning:** >200MB → something's included that shouldn't be
- **Check:** `docker images | grep myapp`

### Build Time
- **1st build:** 30-60 seconds
- **2nd build (with cache):** 8-15 seconds
- **3rd+ builds:** 5-8 seconds (cache fully warmed)

### Startup Time
- **With tini:** ~500ms
- **Without tini:** ~1-2s
- **With `next start`:** ~3-5s

### Memory Usage
- **Minimal:** 64MB
- **Recommended:** 128MB (requests), 512MB (limits)
- **Production:** Use HPA to auto-scale

---

## 💡 Best Practices

### ✅ Always Use
- `DOCKER_BUILDKIT=1` for faster builds
- `--frozen-lockfile` for deterministic builds
- `.dockerignore` to reduce context size
- Non-root user (`USER nextjs`)
- tini for proper signal handling
- Health checks for orchestration

### ❌ Never Use
- `npm` with Docker (use pnpm)
- `docker build` without BuildKit
- Building in production (use pre-built images)
- Running as root
- Storing secrets in ENV (use secrets management)
- Building without `.dockerignore`

---

## 📈 Monitoring

### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
```

### Logs
```bash
docker logs -f myapp:latest

# With timestamps
docker logs -f --timestamps myapp:latest

# Last 100 lines
docker logs --tail 100 myapp:latest
```

### Metrics
```bash
# Memory/CPU usage
docker stats myapp:latest

# Inspect container
docker inspect myapp:latest | jq '.[] | {Id, State, HostConfig}'
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/username/myapp:latest
    cache-from: type=registry,ref=ghcr.io/username/myapp:buildcache
    cache-to: type=registry,ref=ghcr.io/username/myapp:buildcache,mode=max
```

### Environment Variables at Build
```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=${{ env.API_URL }} \
  --build-arg NEXT_PUBLIC_VERSION=${{ github.sha }} \
  -t myapp:${{ github.sha }} .
```

---

## 📚 More Resources

- **Next.js Docs:** https://nextjs.org/docs/app/getting-started/deploying
- **Docker BuildKit:** https://docs.docker.com/build/buildkit/
- **pnpm Docker:** https://pnpm.io/docker
- **Kubernetes:** https://kubernetes.io/docs/concepts/
- **tini:** https://github.com/krallin/tini

---

**Last Updated:** January 20, 2026  
**Version:** 2025 Production Standard
