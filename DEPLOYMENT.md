# Georgian Distribution System - Production Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Blue-Green Deployment](#blue-green-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Database Backups](#database-backups)
9. [CDN Configuration](#cdn-configuration)
10. [Monitoring & Logging](#monitoring--logging)
11. [Health Checks](#health-checks)
12. [Rollback Procedures](#rollback-procedures)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the complete production deployment process for the Georgian Distribution System, including Docker containerization, Kubernetes orchestration, blue-green deployments, automated CI/CD, and monitoring.

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   GitHub    │─────▶│ GitHub       │─────▶│ Container   │
│   Actions   │      │ Container    │      │ Registry    │
└─────────────┘      │ Registry     │      │ (GHCR)      │
                     └──────────────┘      └─────────────┘
                                                  │
                                                  ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Cloudflare  │◀─────│  Kubernetes  │◀─────│   Docker    │
│    CDN      │      │   Cluster    │      │   Images    │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Supabase   │
                     │   Database   │
                     └──────────────┘
```

---

## Prerequisites

### Required Tools

- **Docker**: v24.0+
- **Kubernetes**: v1.28+
- **kubectl**: v1.28+
- **Node.js**: v22.0+
- **npm**: v10.0+
- **Git**: v2.40+

### Required Access

- GitHub repository access with Actions enabled
- Container registry credentials (GitHub Container Registry)
- Kubernetes cluster access (kubeconfig)
- Supabase project credentials
- Sentry account (for error tracking)
- CDN provider account (Cloudflare or CloudFront)

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://greenland77.ge

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=georgian-distribution

# Logging
LOG_LEVEL=info
LOGS_DIR=/var/log/app

# Security
SESSION_SECRET=your-secure-session-secret-min-32-chars

# CDN (Optional)
CDN_PROVIDER=cloudflare
CDN_URL=https://cdn.greenland77.ge
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_API_TOKEN=your-api-token

# Backup (Optional)
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7
S3_BUCKET=georgian-distribution-backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/sitechfromgeorgia/georgian-distribution-system.git
cd georgian-distribution-system
```

### 2. Install Dependencies

```bash
cd frontend
npm ci
```

### 3. Validate Environment

```bash
# Run environment validation
npm run validate:env

# Check for security vulnerabilities
npm audit

# Run tests
npm test
```

---

## Docker Deployment

### Build Production Image

```bash
cd frontend

# Build the Docker image
docker build -f Dockerfile.production -t georgian-distribution:latest \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg NEXT_PUBLIC_APP_URL=https://greenland77.ge \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
  .
```

### Run Container Locally

```bash
# Run the container
docker run -d \
  --name georgian-distribution \
  -p 3000:3000 \
  --env-file .env.production \
  georgian-distribution:latest

# Check logs
docker logs -f georgian-distribution

# Health check
curl http://localhost:3000/api/health
```

### Docker Compose (Production)

```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down
```

---

## Kubernetes Deployment

### 1. Configure kubectl

```bash
# Set your kubeconfig
export KUBECONFIG=/path/to/your/kubeconfig

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 2. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 3. Create Secrets

```bash
# Create secrets from environment file
kubectl create secret generic app-secrets \
  --from-env-file=.env.production \
  --namespace=georgian-distribution

# Or create manually
kubectl create secret generic app-secrets \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --from-literal=NEXT_PUBLIC_APP_URL="https://greenland77.ge" \
  --from-literal=SESSION_SECRET="$SESSION_SECRET" \
  --namespace=georgian-distribution
```

### 4. Apply Kubernetes Manifests

```bash
# Apply all manifests
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment-blue.yaml
kubectl apply -f k8s/deployment-green.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
```

### 5. Verify Deployment

```bash
# Check deployments
kubectl get deployments -n georgian-distribution

# Check pods
kubectl get pods -n georgian-distribution

# Check services
kubectl get services -n georgian-distribution

# Check ingress
kubectl get ingress -n georgian-distribution

# View logs
kubectl logs -f deployment/georgian-distribution-blue -n georgian-distribution
```

---

## Blue-Green Deployment

The application uses a blue-green deployment strategy for zero-downtime deployments.

### Deployment Process

1. **Deploy to inactive environment** (green if blue is active)
2. **Run health checks** on new environment
3. **Switch traffic** to new environment
4. **Verify** new environment is working
5. **Scale down** old environment

### Manual Blue-Green Deployment

```bash
# Set environment variables
export NAMESPACE=georgian-distribution
export IMAGE_TAG=latest

# Run deployment script
./scripts/deployment/blue-green-deploy.sh
```

### Switch Traffic Manually

```bash
# Get current active deployment
ACTIVE=$(kubectl get service georgian-distribution-service -n georgian-distribution \
  -o jsonpath='{.spec.selector.version}')

echo "Current active: $ACTIVE"

# Switch to blue
kubectl patch service georgian-distribution-service -n georgian-distribution \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Or switch to green
kubectl patch service georgian-distribution-service -n georgian-distribution \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes three main workflows:

1. **CI (ci.yml)**: Runs on pull requests and pushes to develop
   - Linting & type checking
   - Unit tests
   - Security scanning
   - Build verification

2. **CD Production (cd-production.yml)**: Runs on pushes to main
   - Build Docker image
   - Push to GitHub Container Registry
   - Deploy to Kubernetes (blue-green)
   - Create Sentry release

3. **Rollback (rollback.yml)**: Manual trigger for rollbacks

### Setup GitHub Secrets

Configure the following secrets in your GitHub repository:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SESSION_SECRET
SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
KUBE_CONFIG (base64 encoded kubeconfig)
SLACK_WEBHOOK_URL (optional)
SNYK_TOKEN (optional)
```

### Trigger Deployment

```bash
# Push to main branch triggers automatic deployment
git push origin main

# Or trigger manually via GitHub UI:
# Actions → CD - Production Deployment → Run workflow
```

---

## Database Backups

### Automated Backups

Backups run automatically daily at 2 AM via Kubernetes CronJob:

```bash
# Deploy backup CronJob
kubectl apply -f k8s/backup-cronjob.yaml

# Check backup jobs
kubectl get cronjobs -n georgian-distribution
kubectl get jobs -n georgian-distribution
```

### Manual Backup

```bash
# Set environment variables
export SUPABASE_PROJECT_REF=your-project-ref
export SUPABASE_DB_PASSWORD=your-db-password
export BACKUP_DIR=/var/backups/georgian-distribution

# Run backup script
./scripts/deployment/backup-database.sh
```

### Restore from Backup

```bash
# List available backups
ls -lh /var/backups/georgian-distribution/

# Restore specific backup
./scripts/deployment/restore-database.sh backup_20240101_020000.sql.gz
```

### S3 Backup Configuration

```bash
# Configure S3 for automatic backup uploads
export S3_BUCKET=georgian-distribution-backups
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1

# Backups will automatically upload to S3
```

---

## CDN Configuration

### Cloudflare Setup

1. **Add DNS Records**:
   ```
   A     greenland77.ge          → Your server IP
   CNAME www.greenland77.ge      → greenland77.ge
   CNAME cdn.greenland77.ge      → greenland77.ge
   ```

2. **Configure Cache Rules**:
   - Static assets: Cache everything, Edge TTL: 1 year
   - HTML: Cache everything, Edge TTL: 1 hour
   - API: Bypass cache

3. **Enable Features**:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - HTTP/3 (QUIC)
   - WebSockets

### CloudFront Setup

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name greenland77.ge \
  --default-root-object index.html

# Update environment variables
export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

### Invalidate CDN Cache

```bash
# After deployment, invalidate CDN cache
export CDN_PROVIDER=cloudflare
export CLOUDFLARE_ZONE_ID=your-zone-id
export CLOUDFLARE_API_TOKEN=your-api-token

./scripts/deployment/invalidate-cdn.sh
```

---

## Monitoring & Logging

### Sentry Setup

1. **Install Sentry packages** (already in package.json):
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure environment variables**:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=your-org
   SENTRY_PROJECT=georgian-distribution
   ```

3. **Sentry features configured**:
   - Error tracking
   - Performance monitoring
   - Session replay
   - Release tracking

### Winston Logging

Logs are written to:
- Console (all environments)
- `/var/log/app/combined.log` (production)
- `/var/log/app/error.log` (production, errors only)
- `/var/log/app/access.log` (production, access logs)

View logs in Kubernetes:
```bash
# Application logs
kubectl logs -f deployment/georgian-distribution-blue -n georgian-distribution

# All pods
kubectl logs -f -l app=georgian-distribution -n georgian-distribution

# Previous container
kubectl logs --previous deployment/georgian-distribution-blue -n georgian-distribution
```

### Log Aggregation

Configure external log aggregation (optional):
```bash
LOG_AGGREGATION_URL=https://logs.example.com
LOG_AGGREGATION_HOST=logs.example.com
LOG_AGGREGATION_PORT=3000
LOG_AGGREGATION_PATH=/logs
LOG_AGGREGATION_SSL=true
LOG_AGGREGATION_USERNAME=your-username
LOG_AGGREGATION_PASSWORD=your-password
```

---

## Health Checks

The application provides three health check endpoints:

### 1. Liveness Probe
```bash
curl http://localhost:3000/api/health/liveness
```

Response:
```json
{
  "status": "alive",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 2. Readiness Probe
```bash
curl http://localhost:3000/api/health/readiness
```

Response:
```json
{
  "status": "ready",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3. Detailed Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 12345,
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "up",
      "latency": 45,
      "message": "Connected - 10 profiles"
    },
    "auth": {
      "status": "up",
      "latency": 23,
      "message": "Service available"
    },
    "storage": {
      "status": "up",
      "latency": 67,
      "message": "3 buckets available"
    },
    "api": {
      "status": "up",
      "latency": 5
    }
  },
  "checks": {
    "memory": {
      "used": 256,
      "total": 512,
      "percentage": 50
    },
    "environment": {
      "nodeEnv": "production",
      "configured": true
    }
  }
}
```

---

## Rollback Procedures

### Automatic Rollback (via GitHub Actions)

```bash
# Go to GitHub Actions
# Select "Rollback Production Deployment"
# Click "Run workflow"
# Enter "rollback" to confirm
```

### Manual Rollback

```bash
# Run rollback script
./scripts/deployment/rollback.sh

# Or manually switch traffic
ACTIVE=$(kubectl get service georgian-distribution-service -n georgian-distribution \
  -o jsonpath='{.spec.selector.version}')

if [ "$ACTIVE" == "blue" ]; then
  TARGET="green"
else
  TARGET="blue"
fi

# Scale up target deployment
kubectl scale deployment georgian-distribution-$TARGET -n georgian-distribution --replicas=3

# Wait for pods to be ready
kubectl wait --for=condition=ready pod \
  -l app=georgian-distribution,version=$TARGET \
  -n georgian-distribution --timeout=300s

# Switch traffic
kubectl patch service georgian-distribution-service -n georgian-distribution \
  -p "{\"spec\":{\"selector\":{\"version\":\"$TARGET\"}}}"

# Scale down old deployment
kubectl scale deployment georgian-distribution-$ACTIVE -n georgian-distribution --replicas=0
```

### Rollback Database

```bash
# Restore from specific backup
./scripts/deployment/restore-database.sh backup_20240101_020000.sql.gz
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n georgian-distribution

# Describe pod for details
kubectl describe pod <pod-name> -n georgian-distribution

# Check logs
kubectl logs <pod-name> -n georgian-distribution

# Common fixes:
# - Check image pull secrets
# - Verify environment variables
# - Check resource limits
```

#### 2. Health Check Failing

```bash
# Test health endpoint directly
kubectl exec -it <pod-name> -n georgian-distribution -- \
  wget -qO- http://localhost:3000/api/health

# Check database connectivity
kubectl exec -it <pod-name> -n georgian-distribution -- \
  wget -qO- http://localhost:3000/api/health/readiness

# Common fixes:
# - Verify Supabase credentials
# - Check network policies
# - Verify service role key
```

#### 3. Image Pull Errors

```bash
# Check image pull secret
kubectl get secrets -n georgian-distribution

# Create image pull secret for GHCR
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token> \
  --namespace=georgian-distribution

# Add to deployment
kubectl patch serviceaccount default -n georgian-distribution \
  -p '{"imagePullSecrets": [{"name": "ghcr-secret"}]}'
```

#### 4. Database Connection Issues

```bash
# Test database connectivity
export PGPASSWORD=your-password
psql -h your-project.supabase.co -U postgres -d postgres -c "SELECT 1"

# Check firewall rules
# Check Supabase dashboard for connection limits
# Verify service role key is correct
```

#### 5. CDN Not Serving Assets

```bash
# Check CDN configuration
curl -I https://cdn.greenland77.ge/_next/static/css/app.css

# Purge CDN cache
./scripts/deployment/invalidate-cdn.sh

# Check origin server
curl -I https://greenland77.ge/_next/static/css/app.css
```

### Monitoring Commands

```bash
# Watch pod status
watch kubectl get pods -n georgian-distribution

# View resource usage
kubectl top pods -n georgian-distribution
kubectl top nodes

# Check HPA status
kubectl get hpa -n georgian-distribution

# View events
kubectl get events -n georgian-distribution --sort-by='.lastTimestamp'

# Check ingress
kubectl describe ingress georgian-distribution-ingress -n georgian-distribution
```

### Emergency Procedures

#### Complete System Failure

```bash
# 1. Check cluster health
kubectl get nodes
kubectl get pods --all-namespaces

# 2. Rollback to last known good deployment
./scripts/deployment/rollback.sh

# 3. Scale up manually if needed
kubectl scale deployment georgian-distribution-blue -n georgian-distribution --replicas=5

# 4. Check external dependencies
# - Verify Supabase status
# - Check CDN status
# - Verify DNS resolution
```

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong session secrets** (minimum 32 characters)
3. **Rotate credentials regularly**
4. **Enable HTTPS only** in production
5. **Use image pull secrets** for private registries
6. **Implement network policies** in Kubernetes
7. **Regular security audits** with `npm audit`
8. **Keep dependencies updated**
9. **Monitor for vulnerabilities** with Snyk or similar
10. **Use RBAC** in Kubernetes

---

## Performance Optimization

1. **Enable CDN** for static assets
2. **Use HTTP/2** and HTTP/3
3. **Enable compression** (Brotli/Gzip)
4. **Optimize images** with Next.js Image component
5. **Configure caching headers** properly
6. **Use database connection pooling**
7. **Monitor performance** with Sentry
8. **Set appropriate HPA thresholds**
9. **Use PodDisruptionBudgets** for availability
10. **Regular load testing**

---

## Support

For issues and questions:

- **GitHub Issues**: https://github.com/sitechfromgeorgia/georgian-distribution-system/issues
- **Documentation**: Check `/docs` directory
- **Health Status**: https://greenland77.ge/api/health

---

## Changelog

### Version 1.0.0 (2024-01-01)

- Initial production deployment setup
- Docker containerization
- Kubernetes deployment with blue-green strategy
- GitHub Actions CI/CD pipeline
- Automated database backups
- CDN configuration
- Comprehensive monitoring and logging
- Health check endpoints
- Rollback mechanisms

---

**Last Updated**: January 2024
**Maintained By**: Georgian Distribution System Team
