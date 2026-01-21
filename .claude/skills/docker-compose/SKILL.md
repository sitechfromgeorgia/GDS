---
name: orchestrating-fullstack-docker-compose
description: Orchestrates multi-service development environments (Next.js, PostgreSQL, Redis) using Docker Compose with modern patterns, health checks, hot-reload workflows, and production-ready configurations. Use when building full-stack applications, setting up local development stacks, implementing service networking, managing volumes and secrets, or deploying containerized multi-service applications.
---

# Orchestrating Full-Stack Development with Docker Compose

## Quick Start

**Essential Commands (Docker Compose v2):**

```bash
# Start all services
docker compose up -d

# Start with file watching and hot-reload
docker compose up --watch

# View logs for specific service
docker compose logs -f app

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down --volumes

# Rebuild specific service
docker compose build --no-cache app

# Execute command in running container
docker exec -it app sh

# View container stats
docker stats
```

**Minimal docker-compose.yml structure:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  db_data:
```

---

## When to Use This Skill

- **Building full-stack applications** - Frontend + Backend + Database + Cache
- **Multi-service development environments** - Any project with 3+ interconnected services
- **Local development that mirrors production** - PostgreSQL, Redis, worker processes
- **Hot-reload development workflows** - Real-time code synchronization
- **Managing container networking** - Service-to-service communication
- **Persistent data management** - Volumes for databases and caches
- **Environment-specific configurations** - Development, staging, production
- **Debugging container issues** - Health checks, logging, dependencies

---

## Core Concepts

### Services
Each service is a container running a specific component (app, database, cache, worker).

```yaml
services:
  app:        # Service name - used for networking
    image: node:20-alpine  # Pre-built image
    # OR
    build:    # Build from Dockerfile
      context: .
      dockerfile: Dockerfile
```

**Service-to-service communication**: Services connect using service names as hostnames. `app` can reach `db` via `db:5432` (no `localhost`).

### Networks
Docker Compose creates a default bridge network where all services can communicate.

```yaml
services:
  app:
    networks:
      - backend
  db:
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

**Network isolation**: Separate services that shouldn't communicate.

```yaml
networks:
  frontend:  # Frontend + web server only
  backend:   # Backend + database only

services:
  web:
    networks: [frontend]
  api:
    networks: [backend]
  db:
    networks: [backend]
```

### Volumes
Three types for different use cases:

**1. Named volumes** - Managed by Docker, persistent across restarts:
```yaml
volumes:
  db_data:
    driver: local

services:
  db:
    volumes:
      - db_data:/var/lib/postgresql/data
```

**2. Bind mounts** - Link host directory to container:
```yaml
services:
  app:
    volumes:
      - .:/app           # Mount current directory
      - /app/node_modules  # Exclude node_modules override
```

**3. Read-only mounts** - Prevent container from modifying:
```yaml
volumes:
  - ./config:/app/config:ro
```

### Environment Variables
Three ways to manage them:

**1. Inline in compose file (development only):**
```yaml
environment:
  NODE_ENV: development
  DATABASE_URL: postgresql://user:pass@db:5432/mydb
```

**2. From .env file (recommended for development):**
```yaml
env_file:
  - .env
```

**.env file:**
```
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@db:5432/mydb
REDIS_URL=redis://redis:6379
```

**.env.example (commit this):**
```
NODE_ENV=development
DATABASE_URL=postgresql://user:password@db:5432/dbname
REDIS_URL=redis://redis:6379
```

**3. Secrets for sensitive data (production):**
```yaml
services:
  app:
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### Health Checks
Verify service readiness before dependent services start.

**Health check syntax:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s        # Check every 10 seconds
  timeout: 5s          # Wait 5 seconds for response
  retries: 3           # Mark unhealthy after 3 failures
  start_period: 15s    # Grace period before counting failures
```

**Dependency with health check:**
```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy  # Wait for db health check
  db:
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### Resource Limits
Prevent services from consuming all system resources.

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Implementation Guide: Next.js + PostgreSQL + Redis Stack

### Project Structure

```
project/
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── .env (gitignored)
├── Dockerfile
├── Dockerfile.prod
├── next.config.js
├── src/
│   └── app/
│       └── api/
│           └── health/
│               └── route.ts
└── scripts/
    └── wait-for-it.sh
```

### Step 1: Create Next.js Dockerfile (Development)

```dockerfile
# Development Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Run Next.js in development mode
CMD ["npm", "run", "dev"]
```

### Step 2: Production Dockerfile (Multi-stage)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1000 nextjs && adduser -D -u 1000 -G nextjs nextjs

# Copy built application from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]
```

### Step 3: Create Health Check Endpoint (Next.js)

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    // const db = await getDatabase();
    // await db.query('SELECT 1');

    // Check Redis connection
    // const redis = await getRedis();
    // await redis.ping();

    return Response.json(
      { status: 'healthy', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: String(error) },
      { status: 503 }
    );
  }
}
```

### Step 4: Create docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nextjs-app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@db:5432/nextjs_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    networks:
      - fullstack
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    restart: unless-stopped
    user: node

  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: postgres-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nextjs_dev
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - fullstack
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    user: postgres

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - fullstack
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    command: redis-server --appendonly yes
    user: redis

  # PgAdmin (Optional - Database GUI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - db
    networks:
      - fullstack
    restart: unless-stopped
    user: root

networks:
  fullstack:
    driver: bridge

volumes:
  db_data:
    driver: local
  redis_data:
    driver: local
```

### Step 5: Create docker-compose.override.yml (Development Overrides)

```yaml
# Extends docker-compose.yml with development-specific settings
# Automatically loaded when running docker compose up

version: '3.8'

services:
  app:
    develop:
      watch:
        # Sync source code in real-time
        - action: sync
          path: ./src
          target: /app/src
        
        # Sync environment configs and restart
        - action: sync+restart
          path: ./.env
          target: /app/.env
        
        # Rebuild when dependencies change
        - action: rebuild
          path: ./package.json
    
    # Use nodemon for auto-restart on file changes
    # Add to Dockerfile: RUN npm install -g nodemon
    # Change CMD: CMD ["nodemon", "npm", "run", "dev"]
```

### Step 6: Environment Files

**.env (never commit - add to .gitignore):**
```
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@db:5432/nextjs_dev
REDIS_URL=redis://redis:6379
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nextjs_dev
```

**.env.example (commit this):**
```
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@db:5432/DB_NAME
REDIS_URL=redis://redis:6379
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=nextjs_dev
```

---

## Development Workflows

### Hot-Reload with Docker Compose Watch

**Docker Compose v2.22+:**

```bash
# Start services with file watching
docker compose up --watch
```

The `watch` attribute in `docker-compose.override.yml` handles:
- **sync**: Copy files to container, frameworks handle reload
- **sync+restart**: Copy + restart container process (not full rebuild)
- **rebuild**: Full rebuild on dependency changes

**Before watch (old way):**
```bash
docker compose up -d
# Manual edit src/
docker compose build --no-cache  # Full rebuild
docker compose up -d
```

**After watch (modern way):**
```bash
docker compose up --watch
# Edit src/ → automatic sync → framework hot-reloads
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 db

# With timestamps
docker compose logs -f --timestamps app
```

### Database Operations

**Connect to PostgreSQL:**
```bash
docker exec -it postgres-db psql -U postgres -d nextjs_dev
```

**Run migrations:**
```bash
docker exec -it nextjs-app npm run migrate
```

**Seed database:**
```bash
docker exec -it nextjs-app npm run seed
```

### Debugging

**Inspect container:**
```bash
docker compose exec app sh
# Inside container:
ls -la /app
cat .env
curl http://localhost:3000/api/health
```

**Check health status:**
```bash
docker compose ps  # Shows health status
docker inspect nextjs-app | jq .[0].State.Health
```

**View detailed logs:**
```bash
docker compose logs --verbose app
```

---

## Code Examples

### Next.js + PostgreSQL Connection Example

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function closePool() {
  await pool.end();
}
```

### Redis Caching Example

```typescript
// lib/cache.ts
import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: 'redis',  // Service name from docker-compose
    port: 6379,
  },
});

redis.on('error', (err) => {
  console.log('Redis Client Error', err);
});

export async function initRedis() {
  await redis.connect();
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error', { key, error });
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttl = 3600) {
  try {
    await redis.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error', { key, error });
  }
}

export async function closeRedis() {
  await redis.quit();
}
```

### API Route with Database + Cache

```typescript
// src/app/api/users/route.ts
import { query } from '@/lib/db';
import { getCached, setCached } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    // Check cache first
    const cached = await getCached('users:all');
    if (cached) {
      return Response.json(cached);
    }

    // Query database
    const result = await query('SELECT id, email, name FROM users LIMIT 10');

    // Cache result
    await setCached('users:all', result.rows, 300); // 5 minute TTL

    return Response.json(result.rows);
  } catch (error) {
    console.error('API error', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### Secrets Management (Production)

```yaml
# docker-compose.prod.yml
services:
  app:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DATABASE_URL: postgresql://postgres:file-content@db:5432/nextjs_prod

secrets:
  db_password:
    external: true  # Created via: echo "password123" | docker secret create db_password -
  jwt_secret:
    file: /run/secrets/jwt_secret  # Read from file
```

```typescript
// Read secrets in Node.js
import fs from 'fs';

const dbPassword = fs.readFileSync('/run/secrets/db_password', 'utf8').trim();
const jwtSecret = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();
```

---

## Best Practices

### 1. Use Explicit Image Tags
❌ **Wrong:**
```yaml
image: postgres  # Uses latest, unpredictable
```

✅ **Right:**
```yaml
image: postgres:16.4-alpine  # Specific version, reproducible
```

### 2. Health Checks Are Mandatory
❌ **Wrong:**
```yaml
depends_on:
  - db
# Starts app before db is ready
```

✅ **Right:**
```yaml
depends_on:
  db:
    condition: service_healthy

healthcheck:
  test: ["CMD", "pg_isready", "-U", "postgres"]
```

### 3. Non-Root Users
❌ **Wrong:**
```yaml
# Runs as root (security risk)
```

✅ **Right:**
```dockerfile
RUN addgroup -g 1000 appuser && adduser -D -u 1000 -G appuser appuser
USER appuser
```

```yaml
user: "1000:1000"  # Same UID as Dockerfile
```

### 4. Volume Exclude node_modules
❌ **Wrong:**
```yaml
volumes:
  - .:/app  # Includes node_modules from host
```

✅ **Right:**
```yaml
volumes:
  - .:/app
  - /app/node_modules  # Override with empty volume
```

### 5. Resource Limits
❌ **Wrong:**
```yaml
# Single service can consume all resources
```

✅ **Right:**
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### 6. Environment Variables Strategy
- Use `.env` for development local values
- Use `env_file:` in Compose for file-based values
- Use `secrets:` for sensitive production data
- Never commit `.env`, commit `.env.example` instead

### 7. Separate Development and Production
```bash
# Development
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 8. Database Initialization
```yaml
db:
  environment:
    POSTGRES_INITDB_ARGS: "-c shared_preload_libraries=pg_stat_statements"
  volumes:
    - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
```

### 9. Log Configuration
```yaml
app:
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "3"
```

### 10. Port Mapping Strategy
- Only expose ports you need
- Use high ports (3000+) for development
- Document all ports in comments

---

## Common Errors & Solutions

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
**Problem**: Application trying to connect to `localhost` instead of service name

**Solution**:
```typescript
// ❌ Wrong (works on host, fails in container)
const db = new Client({ host: 'localhost' });

// ✅ Right (service name from docker-compose)
const db = new Client({ host: 'db' });
```

### Error: "Cannot find module 'node_modules/...'"
**Problem**: Host `node_modules` mounted over container's

**Solution**:
```yaml
volumes:
  - .:/app
  - /app/node_modules  # Add this line
```

### Error: "database 'mydb' does not exist"
**Problem**: Database not initialized when app starts

**Solution**: Use health checks with `service_healthy` condition:
```yaml
depends_on:
  db:
    condition: service_healthy
```

### Error: "Permission denied" on volumes
**Problem**: Container running as root writes files, host user can't delete

**Solution**: Specify user in docker-compose:
```yaml
user: "1000:1000"
```

And in Dockerfile:
```dockerfile
USER 1000:1000
```

### Error: "port 5432 is already allocated"
**Problem**: Port already in use or previous container not stopped

**Solution**:
```bash
# Find and stop container using port
docker ps
docker stop container_id

# Or use different port
docker compose down  # Stop all containers
docker system prune -f  # Remove unused containers
```

### Error: "service_healthy condition not met"
**Problem**: Health check command failing inside container

**Solution**: Debug health check:
```bash
# Check health status
docker compose ps

# Test command manually
docker compose exec db pg_isready -U postgres

# View health check logs
docker inspect --format='{{json .State.Health}}' container_name
```

### Error: "FATAL: password authentication failed"
**Problem**: Wrong credentials in DATABASE_URL

**Solution**:
```bash
# Check your .env file
cat .env

# Verify credentials match in docker-compose.yml
docker compose exec db psql -U postgres -c "\du"
```

### Error: "too many connections"
**Problem**: Connection pool exhausted

**Solution**:
```typescript
const pool = new Pool({
  max: 20,  // Reduce connections
  idleTimeoutMillis: 30000,
});
```

### Error: "docker-compose command not found"
**Problem**: Using old Docker Compose v1

**Solution**: Update to Docker Desktop 4.1+ (includes v2):
```bash
docker --version     # Should show build with Docker Compose v2
docker compose version
```

---

## Production Checklist

- [ ] Use multi-stage Dockerfile to reduce image size
- [ ] Run containers as non-root user
- [ ] Implement health checks for all services
- [ ] Set resource limits (CPU, memory)
- [ ] Use specific image versions (no `latest`)
- [ ] Manage secrets via secrets system (not environment variables)
- [ ] Enable container restart policies
- [ ] Configure logging drivers with limits
- [ ] Use named volumes for persistent data
- [ ] Separate production and development configs
- [ ] Document all environment variables in `.env.example`
- [ ] Monitor container health and logs
- [ ] Regular backups of database volumes
- [ ] Review and update dependencies monthly
- [ ] Test full stack locally before deployment

---

## References

- **Docker Compose Official Docs**: https://docs.docker.com/compose/
- **Docker Compose Specification**: https://github.com/compose-spec/compose-spec
- **Docker Compose Watch (Hot Reload)**: https://docs.docker.com/compose/file-watch/
- **Health Checks Guide**: https://docs.docker.com/compose/compose-file/05-services/#healthcheck
- **Secrets Management**: https://docs.docker.com/compose/use-secrets/
- **Next.js Deployment with Docker**: https://nextjs.org/docs/deployment/docker
- **PostgreSQL Docker Image**: https://hub.docker.com/_/postgres
- **Redis Docker Image**: https://hub.docker.com/_/redis
- **Docker Compose Best Practices**: https://docs.docker.com/compose/production/
- **Multi-Stage Docker Builds**: https://docs.docker.com/build/building/multi-stage/
