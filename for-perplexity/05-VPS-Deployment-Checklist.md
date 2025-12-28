# VPS Production Deployment & Monitoring Checklist

## Table of Contents

- [Executive Summary](#executive-summary)
- [Pre-Deployment Infrastructure Setup](#pre-deployment-infrastructure-setup)
  - [Step 1: VPS Server Provisioning](#step-1-vps-server-provisioning)
  - [Step 2: Docker Production Setup](#step-2-docker-production-setup)
  - [Step 3: Nginx Reverse Proxy Configuration](#step-3-nginx-reverse-proxy-configuration)
- [Zero-Downtime Deployment Strategy](#zero-downtime-deployment-strategy)
  - [Blue-Green Deployment Implementation](#blue-green-deployment-implementation)
  - [GitHub Actions CI/CD Pipeline](#github-actions-cicd-pipeline)
- [Comprehensive Monitoring Setup](#comprehensive-monitoring-setup)
  - [Option 1: Lightweight Stack (Recommended for Single VPS)](#option-1-lightweight-stack-recommended-for-single-vps)
  - [Prometheus Configuration](#prometheus-configuration)
  - [Alert Rules](#alert-rules)
- [Backup & Disaster Recovery](#backup--disaster-recovery)
  - [Automated Backup Script](#automated-backup-script)
  - [Disaster Recovery Runbook](#disaster-recovery-runbook)
- [Actionable Checklist](#actionable-checklist)
  - [Pre-Launch Checklist](#pre-launch-checklist)
- [Further Resources](#further-resources)

---

## Executive Summary

Deploying production applications on VPS infrastructure requires meticulous planning, automation, and comprehensive monitoring. Unlike managed platforms (Vercel, AWS Elastic Beanstalk), VPS deployments demand hands-on infrastructure management—but offer unmatched control, cost predictability, and data sovereignty.

### Key Takeaways:

- ✅ **Zero-downtime deployments** achievable with Docker blue-green strategy
- ✅ **Comprehensive monitoring** prevents 95% of production outages through early warning
- ✅ **Automated backups** with tested restore procedures are non-negotiable
- ✅ **Security hardening** (firewall, SSH keys, fail2ban) prevents 99% of unauthorized access
- ✅ **Load balancing** and auto-restart policies ensure 99.9%+ uptime

### Critical Success Factors:

1. **Infrastructure as Code** (Docker Compose, scripts)
2. **Automated deployment pipelines** (GitHub Actions, GitLab CI)
3. **Multi-layered monitoring** (application, system, network)
4. **Disaster recovery runbooks** (tested quarterly)
5. **Progressive rollout strategies** (canary, blue-green)

---

## Pre-Deployment Infrastructure Setup

### Step 1: VPS Server Provisioning

#### Recommended Specifications for Your System:

**Production Grade (50-500 concurrent users):**
```
- Provider: Contabo VPS M / Hetzner CX41
- vCPU: 4-6 cores
- RAM: 16GB
- Storage: 200GB NVMe SSD
- Network: 1Gbps (unmetered)
- Location: Germany (GDPR compliant, close to Georgia)
- Cost: €15-25/month
```

**High Availability (500-2000 users):**
```
- 2x VPS servers (load balanced)
- Provider: Hetzner Cloud / DigitalOcean
- Total Cost: €50-80/month
```

#### Initial Server Hardening:

**server-setup.sh** - Run on fresh Ubuntu 22.04 LTS server

```bash
#!/bin/bash
# server-setup.sh - Run on fresh Ubuntu 22.04 LTS server

set -e

echo "📦 Step 1: Update system packages"
apt update && apt upgrade -y

echo "👤 Step 2: Create non-root user"
adduser deploy --gecos "" --disabled-password
usermod -aG sudo deploy
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

echo "🔑 Step 3: Configure SSH key authentication"
mkdir -p /home/deploy/.ssh
# Copy your public key here
cat > /home/deploy/.ssh/authorized_keys << 'EOF'
ssh-rsa AAAAB3... your-public-key-here
EOF
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

echo "🔒 Step 4: Disable password authentication"
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

echo "🔥 Step 5: Configure firewall (UFW)"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp # SSH
ufw allow 80/tcp # HTTP
ufw allow 443/tcp # HTTPS
ufw --force enable

echo "🛡️ Step 6: Install fail2ban (brute force protection)"
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban

echo "🔄 Step 7: Configure automatic security updates"
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades

echo "✅ Server hardening complete!"
```

---

### Step 2: Docker Production Setup

#### Install Docker Engine:

**install-docker.sh**

```bash
#!/bin/bash
# install-docker.sh

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add deploy user to docker group
usermod -aG docker deploy

# Configure Docker daemon for production
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  }
}
EOF

# Restart Docker
systemctl restart docker
systemctl enable docker

# Install Docker Compose V2
apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

#### Production docker-compose.yml:

**docker-compose.production.yml**

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
    container_name: distribution-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: distribution-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

### Step 3: Nginx Reverse Proxy Configuration

#### Production Nginx Config:

**/opt/app/nginx/nginx.conf**

```nginx
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;

error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" $request_time';

    access_log /var/log/nginx/access.log main buffer=32k flush=5s;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Upstream
    upstream frontend_backend {
        server frontend:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name greenland77.ge www.greenland77.ge;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name greenland77.ge www.greenland77.ge;

        # SSL certificates (Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Client body size
        client_max_body_size 50M;

        # Proxy to Next.js
        location / {
            proxy_pass http://frontend_backend;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_buffering off;
            proxy_request_buffering off;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Rate limit API routes
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://frontend_backend;
        }

        # Stricter rate limit for auth
        location /api/auth/ {
            limit_req zone=auth_limit burst=5;
            proxy_pass http://frontend_backend;
        }

        # Health check (no rate limit)
        location /api/health {
            proxy_pass http://frontend_backend;
            access_log off;
        }
    }
}
```

---

## Zero-Downtime Deployment Strategy

### Blue-Green Deployment Implementation

#### Deployment Script:

**deploy.sh** - Zero-downtime deployment

```bash
#!/bin/bash
# deploy.sh - Zero-downtime deployment

set -e

BLUE_PORT=3000
GREEN_PORT=3001
NGINX_CONFIG="/opt/app/nginx/nginx.conf"

echo "🚀 Starting blue-green deployment..."

# Step 1: Build new version (green)
echo "🏗️ Building new version..."
docker build -t distribution-frontend:green ./frontend

# Step 2: Start green container
echo "▶️ Starting green container..."
docker run -d \
  --name frontend-green \
  --network app-network \
  -p ${GREEN_PORT}:3000 \
  -e NODE_ENV=production \
  distribution-frontend:green

# Step 3: Health check green
echo "🏥 Health checking green container..."
for i in {1..30}; do
  if curl -f http://localhost:${GREEN_PORT}/api/health > /dev/null 2>&1; then
    echo "✅ Green container healthy"
    break
  fi

  if [ $i -eq 30 ]; then
    echo "❌ Green container failed health check"
    docker stop frontend-green
    docker rm frontend-green
    exit 1
  fi

  echo "⏳ Waiting for green container... ($i/30)"
  sleep 2
done

# Step 4: Switch Nginx to green
echo "🔄 Switching traffic to green..."
sed -i "s/:${BLUE_PORT}/:${GREEN_PORT}/" ${NGINX_CONFIG}
nginx -s reload

# Step 5: Wait for connections to drain (30 seconds)
echo "⏳ Draining blue container connections..."
sleep 30

# Step 6: Stop blue container
echo "🛑 Stopping blue container..."
docker stop frontend-blue || true
docker rm frontend-blue || true

# Step 7: Rename green to blue
echo "♻️ Promoting green to blue..."
docker rename frontend-green frontend-blue
docker tag distribution-frontend:green distribution-frontend:blue

# Step 8: Update Nginx config back to standard port
sed -i "s/:${GREEN_PORT}/:${BLUE_PORT}/" ${NGINX_CONFIG}
nginx -s reload

echo "✅ Deployment complete!"
```

---

### GitHub Actions CI/CD Pipeline:

**.github/workflows/deploy.yml**

```yaml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add server to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SERVER_IP }} >> ~/.ssh/known_hosts

      - name: Deploy to production
        run: |
          ssh deploy@${{ secrets.SERVER_IP }} "cd /opt/app && \
            git pull origin main && \
            ./deploy.sh"

      - name: Notify Sentry of deployment
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: your-org
          SENTRY_PROJECT: distribution-system
        with:
          environment: production
```

---

## Comprehensive Monitoring Setup

### Option 1: Lightweight Stack (Recommended for Single VPS)

**Netdata + Loki + Prometheus:**

**docker-compose.monitoring.yml**

```yaml
version: '3.8'

services:
  netdata:
    image: netdata/netdata:v1.47
    container_name: netdata
    restart: unless-stopped
    hostname: distribution-monitor
    cap_add:
      - SYS_PTRACE
    security_opt:
      - apparmor:unconfined
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "19999:19999"
    environment:
      - NETDATA_CLAIM_TOKEN=${NETDATA_CLAIM_TOKEN}
      - NETDATA_CLAIM_ROOMS=${NETDATA_CLAIM_ROOMS}

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'

  loki:
    image: grafana/loki:latest
    container_name: loki
    restart: unless-stopped
    volumes:
      - ./loki/loki-config.yaml:/etc/loki/local-config.yaml:ro
      - loki-data:/loki
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    restart: unless-stopped
    volumes:
      - ./loki/promtail-config.yaml:/etc/promtail/config.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-clock-panel

volumes:
  prometheus-data:
  loki-data:
  grafana-data:
```

---

### Prometheus Configuration:

**prometheus/prometheus.yml**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Node Exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['netdata:19999']

  # Docker metrics
  - job_name: 'docker'
    static_configs:
      - targets: ['host.docker.internal:9323']

  # Application metrics (if you add /metrics endpoint)
  - job_name: 'app'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/api/metrics'
```

---

### Alert Rules:

**prometheus/alerts.yml**

```yaml
groups:
  - name: system_alerts
    interval: 30s
    rules:
      # CPU usage alert
      - alert: HighCPUUsage
        expr: node_cpu_usage > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes"

      # Memory usage alert
      - alert: HighMemoryUsage
        expr: node_memory_usage > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"

      # Disk space alert
      - alert: LowDiskSpace
        expr: node_disk_free < 10
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Less than 10GB free disk space"

      # Container down alert
      - alert: ContainerDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Container is down"
```

---

## Backup & Disaster Recovery

### Automated Backup Script:

**/opt/app/scripts/backup.sh**

```bash
#!/bin/bash
# /opt/app/scripts/backup.sh

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "💾 Starting backup at $(date)"

# 1. Backup database
echo "📦 Backing up PostgreSQL..."
docker exec supabase-db pg_dumpall -U postgres | \
  gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz

# 2. Backup application files
echo "📁 Backing up application files..."
tar -czf ${BACKUP_DIR}/app_${DATE}.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  /opt/app

# 3. Backup Docker volumes
echo "🐳 Backing up Docker volumes..."
docker run --rm \
  -v supabase_db-data:/volume \
  -v ${BACKUP_DIR}:/backup \
  alpine tar -czf /backup/volumes_${DATE}.tar.gz -C /volume ./

# 4. Upload to remote storage (optional)
echo "☁️ Uploading to remote storage..."
rclone copy ${BACKUP_DIR}/db_${DATE}.sql.gz remote:backups/db/
rclone copy ${BACKUP_DIR}/app_${DATE}.tar.gz remote:backups/app/
rclone copy ${BACKUP_DIR}/volumes_${DATE}.tar.gz remote:backups/volumes/

# 5. Clean old backups
echo "🧹 Cleaning old backups..."
find ${BACKUP_DIR} -name "*.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ Backup completed at $(date)"
```

---

### Disaster Recovery Runbook:

#### Disaster Recovery Procedure

**Scenario 1: Complete Server Failure**

1. **Provision new VPS** (Contabo/Hetzner)
2. **Run server-setup.sh** (harden server)
3. **Install Docker** (install-docker.sh)
4. **Restore from backup:**

```bash
# Download latest backups
rclone copy remote:backups/db/ /tmp/restore/
rclone copy remote:backups/app/ /tmp/restore/

# Restore application
cd /opt && tar -xzf /tmp/restore/app_latest.tar.gz

# Start containers
cd /opt/app && docker compose up -d

# Restore database
gunzip < /tmp/restore/db_latest.sql.gz | \
  docker exec -i supabase-db psql -U postgres
```

5. **Update DNS** to point to new server IP
6. **Verify health** checks pass
7. **Test critical user flows**

**RTO (Recovery Time Objective):** 2 hours
**RPO (Recovery Point Objective):** 24 hours (daily backups)

---

## Actionable Checklist

### Pre-Launch Checklist

#### Infrastructure:
- [ ] Server hardened (SSH keys, firewall, fail2ban)
- [ ] Docker configured for production
- [ ] Nginx reverse proxy configured
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] Monitoring stack deployed (Netdata + Prometheus)
- [ ] Automated backups configured (daily)
- [ ] Backup restoration tested successfully

#### Deployment:
- [ ] Zero-downtime deployment script tested
- [ ] CI/CD pipeline configured (GitHub Actions)
- [ ] Rollback procedure documented
- [ ] Health check endpoints implemented
- [ ] Blue-green deployment validated

#### Monitoring:
- [ ] Alert thresholds configured
- [ ] PagerDuty/Slack notifications set up
- [ ] Grafana dashboards created
- [ ] Log aggregation working (Loki)
- [ ] Application metrics exported

#### Security:
- [ ] Firewall rules configured (UFW)
- [ ] DDoS protection enabled (CloudFlare)
- [ ] Rate limiting configured (Nginx)
- [ ] Secrets stored securely (environment variables)
- [ ] Regular security updates automated

---

## Further Resources

- **Docker Production Best Practices:** https://docs.docker.com/develop/dev-best-practices/
- **Nginx Optimization Guide:** https://www.nginx.com/blog/tuning-nginx/
- **Prometheus Monitoring:** https://prometheus.io/docs/introduction/overview/
- **Let's Encrypt Certbot:** https://certbot.eff.org/
