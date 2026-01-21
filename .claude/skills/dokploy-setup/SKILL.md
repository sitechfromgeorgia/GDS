---
name: deploying-with-dokploy
description: Deploys Next.js 15 applications to VPS using Dokploy (self-hosted PaaS), configures Traefik networking with wildcard SSL, PostgreSQL/Redis databases, automated S3 backups, and zero-downtime deployments. Use when deploying full-stack apps to VPS, managing Docker Compose stacks, configuring custom domains with Traefik, or automating database backups.
---

# Deploying with Dokploy: Self-Hosted PaaS for Next.js & Supabase

## Quick Start

### 1. Provision Ubuntu 24.04 VPS & Install Dokploy

```bash
# SSH into fresh VPS
ssh root@your-vps-ip

# Install Dokploy (runs curl install script)
curl https://install.dokploy.com | sh

# Access dashboard
# Dokploy runs on port 3000 initially
# Visit http://your-vps-ip:3000
```

### 2. Configure First Domain for Dashboard

```bash
# In Dokploy UI:
# 1. Go to Settings → Domains
# 2. Add your admin domain (e.g., dokploy.example.com)
# 3. Create DNS A record → your-vps-ip
# 4. Wait 5-10 minutes for Traefik cert generation
# 5. Access dashboard via https://dokploy.example.com
```

### 3. Connect GitHub & Deploy Next.js App

```yaml
# In Dokploy UI, create new Application:
Provider: GitHub
Repository: your-org/your-nextjs-app
Branch: main
Build Command: npm run build
Start Command: npm start
Environment Variables:
  NEXT_PUBLIC_API_URL: https://api.example.com
  DATABASE_URL: postgresql://user:pass@postgres:5432/mydb
```

---

## When to Use This Skill

- **Deploying Next.js 15 apps** to personal/company VPS without Vercel lock-in
- **Managing PostgreSQL & Redis** within Dokploy's native database provisioning
- **Custom domain routing** with automatic SSL via Let's Encrypt
- **Automated database backups** to S3 (AWS, Cloudflare R2, Wasabi)
- **Zero-downtime deployments** with rolling updates or blue-green strategies
- **Docker Compose applications** (multi-container stacks)
- **Multi-server scaling** with Docker Swarm mode

---

## VPS Setup & Hardening (Pre-Dokploy)

### Recommended Spec
- **OS**: Ubuntu 24.04 LTS (superior systemd, newer kernel vs 22.04)
- **CPU**: 2+ cores (1 core minimum for small apps)
- **RAM**: 4+ GB (2 GB minimum, but tight)
- **Storage**: 40+ GB SSD

### Security Hardening Script

Run **before** Dokploy installation (firewall rules conflict with Docker if reversed):

```bash
#!/bin/bash
set -e

# System updates
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop unzip

# Install UFW (before Docker)
sudo apt install -y ufw

# UFW base rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable -y

# Fix UFW + Docker iptables conflict
# Modify /etc/ufw/after.rules (append at end, before COMMIT)
sudo sed -i '$i\
*filter\
-A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT\
-A FORWARD -i docker0 -j ACCEPT\
-A FORWARD -i br-+ -j ACCEPT\
COMMIT' /etc/ufw/after.rules

sudo systemctl restart ufw

# Install Docker (Dokploy depends on it)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Fail2Ban (brute-force SSH protection)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Create Fail2Ban SSH jail
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
EOF

sudo systemctl restart fail2ban

# SSH hardening
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

echo "✅ VPS hardening complete. Safe to install Dokploy now."
```

**Key Points:**
- UFW runs **before** Docker (conflicts if reversed)
- `after.rules` modification allows Docker container networking through UFW
- Fail2Ban protects SSH with 7200s (2-hour) ban after 3 failed attempts
- Public key SSH auth is mandatory (no passwords)

---

## Next.js 15 Deployment Configuration

### Optimal next.config.mjs

```javascript
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone mode = smaller Docker image, self-contained server
  output: 'standalone',
  
  // Reduce build time (important for Dokploy's build timeout)
  swcMinify: true,
  
  // Enable static page generation for dashboards
  staticPageGenerationTimeout: 60,
  
  // Image optimization for production
  images: {
    remotePatterns: [
      { hostname: 'cdn.example.com' }
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

// Optional: Sentry error tracking
const withSentry = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, { silent: true })
  : nextConfig;

export default withSentry;
```

### Dokploy Deployment Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Build Command** | `npm run build` | Default Next.js build |
| **Start Command** | `npm start` | Runs standalone server on port 3000 |
| **Port** | `3000` | Traefik proxies externally |
| **Memory Limit** | `1GB` (2GB apps) | Prevents OOM crashes |
| **Builder** | Nixpacks (auto-detected) | vs Dockerfile: smaller image, auto Node detection |
| **Auto Deploy** | On push to main | Webhook auto-triggers builds |

### Environment Variables Best Practices

```bash
# In Dokploy UI → Application → Environment Variables

# Database (internal Docker hostname = service name)
DATABASE_URL=postgresql://postgres:secret123@postgres:5432/mydb
REDIS_URL=redis://redis:6379

# Public (safe to expose)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ENVIRONMENT=production

# Secrets (never commit to git)
AUTH_SECRET=generate-with: openssl rand -hex 32
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG...

# Dokploy auto-injects at build time (no restart needed for static redeploy)
```

**Trigger redeploy after env var changes:** Application → Deploy button.

---

## PostgreSQL & Redis Provisioning

### Native Database Setup

```bash
# In Dokploy UI:
# 1. Go to Databases tab
# 2. Create PostgreSQL instance:
#    - Name: postgres
#    - Version: 16 (latest stable)
#    - Password: generate-strong-password
#    - Port: 5432 (internal only)
# 3. Create Redis instance:
#    - Name: redis
#    - Version: 7
#    - Port: 6379 (internal)
# 4. Click Create
```

### Access from DBeaver (External SQL Client)

**Default: Postgres port 5432 is NOT publicly exposed (secure).**

To expose for DBeaver connections:

```bash
# In Application Services → Advanced:
# Add port exposure for PostgreSQL
# ⚠️ ONLY for admin/staging, NOT production

# Or via SSH tunnel (safer):
ssh -L 5432:postgres:5432 root@your-vps-ip

# Then connect DBeaver to localhost:5432
```

### Docker Compose Connection Pattern

```yaml
version: '3.9'
services:
  nextjs-app:
    image: node:20-alpine
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/mydb
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - dokploy-network

  # Services auto-created by Dokploy (don't redefine)
  # postgres:
  # redis:

networks:
  dokploy-network:
    external: true
```

---

## Automated Backups (S3 Strategy)

### Configure S3 Destination

1. **Dokploy UI → Settings → Destinations**
2. Add S3 bucket:

```yaml
Provider: AWS S3 (or Cloudflare R2, Wasabi, MinIO)
Bucket Name: dokploy-backups-prod
Region: us-east-1
Access Key ID: AKIA...
Secret Access Key: wJ8...
Endpoint: (blank for AWS; https://bucket-name.s3.example.com for R2)
```

### Schedule Database Backups

1. **Application → Database → Backup Tab**
2. Create schedule:

```yaml
S3 Destination: dokploy-backups-prod
Database Name: mydb
Cron Schedule: 0 2 * * * (2 AM daily)
Prefix: prod/postgres/
Enabled: true
```

3. **Test connection:** Click "Test" button → verifies S3 access

### Backup Strategy (YAML Reference)

```yaml
# backup-config.yml
backups:
  postgres:
    schedule: "0 2 * * *"  # 2 AM daily
    destination: s3://dokploy-backups-prod/postgres/
    retention_days: 30
  
  redis:
    schedule: "0 3 * * *"  # 3 AM daily (after postgres)
    destination: s3://dokploy-backups-prod/redis/
    retention_days: 7
    
  dokploy_config:
    schedule: "0 4 * * 0"  # Weekly (Sunday 4 AM)
    destination: s3://dokploy-backups-prod/config/
    retention_days: 90
```

**Retention Policy:** Delete backups >30 days old in S3 (set via S3 lifecycle rules, not Dokploy).

---

## Traefik Networking & Wildcard Certificates

### Method 1: Dokploy UI Domains (Recommended)

Simplest approach—no manual labels needed:

```bash
# In Application → Domains tab:
1. Click "Add Domain"
2. Enter: app.example.com
3. Select "Generate Certificate"
4. Click Save
# Dokploy auto-injects Traefik labels; Traefik generates cert in ~10s
```

### Method 2: Docker Compose with Manual Labels (Advanced)

For complex routing (IP whitelisting, rate limiting):

```yaml
version: '3.9'
services:
  api:
    image: myregistry/api:latest
    expose:
      - "3000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api-prod.rule=Host(`api.example.com`)"
      - "traefik.http.routers.api-prod.entrypoints=websecure"
      - "traefik.http.routers.api-prod.tls.certresolver=letsencrypt"
      - "traefik.http.services.api-prod.loadbalancer.server.port=3000"
      # Rate limiting middleware
      - "traefik.http.middlewares.rate-limit.ratelimit.average=100"
      - "traefik.http.middlewares.rate-limit.ratelimit.burst=50"
      - "traefik.http.routers.api-prod.middlewares=rate-limit"
    networks:
      - dokploy-network

networks:
  dokploy-network:
    external: true
```

### Wildcard SSL (*.example.com)

```bash
# DNS Challenge Setup (Cloudflare example):
# 1. Dokploy → Settings → SSL Certificates
# 2. Select "Let's Encrypt with DNS Challenge"
# 3. Choose DNS provider: Cloudflare
# 4. Add API token (with Zone:DNS:Edit permission)
# 5. Enter domain: example.com (not *.example.com)
# 6. Click "Generate Wildcard Certificate"

# Result: *.example.com + example.com both covered
# Auto-renews 30 days before expiry
```

### www → Non-www Redirect

Use Traefik middleware (via Docker Compose labels):

```yaml
labels:
  - "traefik.http.routers.redirect-www.rule=Host(`www.example.com`)"
  - "traefik.http.routers.redirect-www.middlewares=redirect-middleware"
  - "traefik.http.middlewares.redirect-middleware.redirectregex.regex=^https://www\\.(.*)$$"
  - "traefik.http.middlewares.redirect-middleware.redirectregex.replacement=https://$${1}"
  - "traefik.http.routers.redirect-www.service=dummy-service"
```

---

## Zero-Downtime Deployments

### Rolling Updates (Recommended for Single Server)

Dokploy default behavior—gradual replacement:

```yaml
# In Dokploy UI → Application → Advanced:
Deployment Strategy: Rolling
Max Unavailable: 1
Min Ready Seconds: 10
```

**Process:**
1. New container starts
2. Healthcheck passes (30s timeout)
3. Old container terminates
4. Traffic never interrupted

### Healthcheck in Next.js

Add to app:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

```dockerfile
# Dockerfile
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Blue-Green Deployment (Advanced)

For guaranteed zero-downtime with instant rollback:

```bash
# Manual blue-green workflow:
# 1. Deploy new version to "green" Docker tag
# 2. Verify green healthchecks pass
# 3. Switch Traefik router to green
# 4. Keep blue running for instant rollback

# In production, use version env vars:
docker tag myapp:latest myapp:green-$(date +%s)
# Deploy green tag
# Test thoroughly
# Update router label to point to green
# Keep blue as backup for 1 hour, then clean up
```

### Rollback Strategy

```bash
# If deployment fails:
# 1. In Dokploy UI → Application → Deployments
# 2. Click previous successful deployment
# 3. Click "Redeploy"
# 4. Traefik switches traffic back to old version instantly
# (No rebuild; existing image restarted)
```

---

## Troubleshooting

### Gateway Timeout (504) During Build

**Cause:** Build exceeds 15 min default timeout (Next.js on 1GB RAM).

**Solutions:**

```bash
# Option 1: Reduce build time
# → Remove unused dependencies (npm audit)
# → Enable SWC minification (default in next.config.js)
# → Use --no-cache for npm install? NO—always cache

# Option 2: Increase build timeout
# In Dokploy UI → Application → Advanced:
Build Timeout: 1800 (30 minutes, in seconds)

# Option 3: Upgrade VPS RAM (2GB → 4GB)
```

### Database Connection Refused

**Cause:** Environment variable uses `localhost` instead of Docker hostname.

```bash
❌ DATABASE_URL=postgresql://user:pass@localhost:5432/db
✅ DATABASE_URL=postgresql://user:pass@postgres:5432/db
                                         ^^^^^^^^ Docker service name
```

### Traefik Certificate Not Generating

**Cause:** DNS A record not propagated.

```bash
# Verify DNS:
nslookup app.example.com
# Should return your VPS IP

# Force cert retry (Docker Compose restart):
docker restart traefik

# Check Traefik logs:
docker logs -f dokploy-traefik
```

### Out of Memory (OOM Kill)

**Cause:** App exceeds memory limit, crashes.

```bash
# In Dokploy UI → Application → Resources:
Memory Limit: 2GB (increase from 1GB)

# Or optimize Node.js:
NODE_OPTIONS=--max-old-space-size=1024 npm start
```

### Cannot Push to Docker Registry

**Cause:** Docker credentials expired or registry token invalid.

```bash
# In Dokploy UI → Settings → Registries:
1. Re-authenticate with Docker Hub / GitHub Container Registry
2. Test connection: "Test Registry"
3. Retry deployment
```

---

## Production Checklist

- [ ] **VPS Hardening**: UFW, Fail2Ban, SSH keys-only (no passwords)
- [ ] **Dokploy Admin Domain**: HTTPS with wildcard cert
- [ ] **Environment Variables**: All secrets in Dokploy UI (not `.env` files)
- [ ] **Database Backups**: Scheduled daily, tested restore
- [ ] **S3 Credentials**: IAM role limited to backup bucket (least privilege)
- [ ] **Application Domains**: DNS A records propagated
- [ ] **Health Check**: API endpoint returns 200 OK when app is ready
- [ ] **Memory Limits**: Set appropriately (2GB for small Next.js)
- [ ] **Build Timeout**: 1800s minimum (30 min)
- [ ] **Logs Monitoring**: Check Dokploy logs for errors after deploy
- [ ] **Firewall Rules**: Only 22 (SSH), 80 (HTTP), 443 (HTTPS) exposed
- [ ] **Traefik Let's Encrypt**: Auto-renewal enabled (default)
- [ ] **Version Control**: Never commit `.env` or secrets to git

---

## References

- [Dokploy Official Docs](https://docs.dokploy.com)
- [Next.js Standalone Deployment](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Traefik Docker Labels Guide](https://doc.traefik.io/traefik/routing/providers/docker/)
- [Ubuntu 24.04 Security Hardening](https://wiki.ubuntu.com/CIS)
- [Let's Encrypt DNS Challenge (Wildcard Certs)](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)
- [AWS S3 Lifecycle Rules (Auto-delete old backups)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
