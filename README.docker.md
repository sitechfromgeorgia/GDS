# 🐳 Docker Deployment Guide

ამ პროექტს აქვს ორი Docker კონფიგურაცია:

## 📋 ფაილები

- **`docker-compose.yml`** - Production deployment (Dockploy-სთვის)
- **`docker-compose.dev.yml`** - Local development
- **`frontend/Dockerfile`** - Production build
- **`frontend/Dockerfile.dev`** - Development build

---

## 🚀 Production Deployment (Dockploy)

### გამოყენება Dockploy-ზე:

1. **Repository:** `github.com/sitechfromgeorgia/georgian-distribution-system.git`
2. **Branch:** `main`
3. **Compose File:** `./docker-compose.yml`
4. **Environment ცვლადები:**

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYxNzMzODk2LCJleHAiOjE4OTM0NTYwMDB9.8_RBpPhjnSsvDY4GMDddZW9K53yIdWGsiUHp6jM-vA8

NEXT_PUBLIC_APP_URL=https://greenland77.ge
```

### Deploy:
```bash
# Dockploy automatically runs:
docker compose -f docker-compose.yml up -d --build
```

---

## 💻 Local Development

### გაშვება:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Or with build
docker-compose -f docker-compose.dev.yml up --build

# Stop
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

### მახასიათებლები:

✅ Hot reload - კოდის ცვლილებები ავტომატურად ჩაიტვირთება
✅ Source code volumes - არ სჭირდება rebuild
✅ Development Dockerfile - უფრო სწრაფი build
✅ Environment ცვლადები უკვე კონფიგურირებული

### წვდომა:
- **Frontend:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

---

## 🔧 Dockerfile-ები

### Production (`Dockerfile`):
- ✅ Multi-stage build - optimized size
- ✅ Production dependencies only
- ✅ Build artifacts only
- ✅ Non-root user (nextjs)
- ✅ Security hardened

### Development (`Dockerfile.dev`):
- ✅ Single stage - faster rebuild
- ✅ All dependencies
- ✅ Hot reload support
- ✅ Source code mounted

---

## 📊 Resource Limits

### CPU:
- **Limit:** 2.0 cores
- **Reservation:** 0.5 cores

### Memory:
- **Limit:** 2GB
- **Reservation:** 512MB

---

## 🏥 Health Checks

- **Endpoint:** `/api/health`
- **Interval:** 30s
- **Timeout:** 10s
- **Retries:** 3
- **Start Period:** 60s (production) / 40s (development)

---

## 🔐 Environment ცვლადები

### Production:
```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://greenland77.ge
```

### Development:
```env
NODE_ENV=development
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### Build fails:
```bash
# Clear Docker cache
docker system prune -a --volumes

# Rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Port already in use:
```bash
# Change port in docker-compose.dev.yml
ports:
  - "3001:3000"  # Use different external port
```

### Volume issues on Windows:
```bash
# Remove and recreate volumes
docker-compose -f docker-compose.dev.yml down -v
docker volume prune
docker-compose -f docker-compose.dev.yml up --build
```

---

## 📚 სასარგებლო ბრძანებები

```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart service
docker-compose -f docker-compose.dev.yml restart

# Execute command in container
docker-compose -f docker-compose.dev.yml exec frontend sh

# Check container status
docker-compose -f docker-compose.dev.yml ps

# View resource usage
docker stats
```

---

## 🎯 Production vs Development

| Feature | Production | Development |
|---------|-----------|-------------|
| **Dockerfile** | `Dockerfile` | `Dockerfile.dev` |
| **Compose File** | `docker-compose.yml` | `docker-compose.dev.yml` |
| **Build** | Multi-stage optimized | Single stage fast |
| **Hot Reload** | ❌ No | ✅ Yes |
| **Volumes** | ❌ No source mounts | ✅ Source mounted |
| **Size** | ~200MB | ~800MB |
| **Start Time** | 60s | 40s |
| **Environment** | From Dockploy | Hardcoded |

---

## ✨ Best Practices

### Development:
1. ✅ Use `docker-compose.dev.yml` ლოკალურად
2. ✅ Don't commit `.env.local` files
3. ✅ Use volumes for hot reload
4. ✅ Test changes before pushing

### Production:
1. ✅ Use `docker-compose.yml` Dockploy-ზე
2. ✅ Set environment variables in Dockploy
3. ✅ Monitor health checks
4. ✅ Check logs for errors

---

## 🚀 Quick Start

### Local Development:
```bash
git clone https://github.com/sitechfromgeorgia/georgian-distribution-system.git
cd georgian-distribution-system
docker-compose -f docker-compose.dev.yml up
```

Open: http://localhost:3000

### Production (Dockploy):
1. Configure repository in Dockploy
2. Set environment variables
3. Click "Deploy"
4. Access: https://greenland77.ge

---

💡 **Note:** `docker-compose.yml` გამოიყენება მხოლოდ Dockploy-ზე production deployment-სთვის. ლოკალურად ყოველთვის გამოიყენე `docker-compose.dev.yml`.
