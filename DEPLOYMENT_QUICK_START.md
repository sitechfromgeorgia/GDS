# Georgian Distribution System - Quick Start Deployment

## 🚀 Quick Deployment (5 minutes)

### Prerequisites Checklist

- [ ] Docker installed
- [ ] kubectl configured
- [ ] Environment variables set
- [ ] GitHub secrets configured

---

## Local Docker Deployment

```bash
# 1. Build image
cd frontend
docker build -f Dockerfile.production -t georgian-distribution:latest .

# 2. Run container
docker run -d -p 3000:3000 --env-file .env.production georgian-distribution:latest

# 3. Test
curl http://localhost:3000/api/health
```

---

## Kubernetes Deployment

```bash
# 1. Create namespace and secrets
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic app-secrets --from-env-file=.env.production -n georgian-distribution

# 2. Deploy application
kubectl apply -f k8s/

# 3. Verify
kubectl get pods -n georgian-distribution
kubectl get ingress -n georgian-distribution

# 4. Access application
curl https://greenland77.ge/api/health
```

---

## Blue-Green Deployment

```bash
# Deploy with zero downtime
export IMAGE_TAG=v1.0.0
./scripts/deployment/blue-green-deploy.sh
```

---

## Rollback

```bash
# Quick rollback to previous version
./scripts/deployment/rollback.sh
```

---

## Common Commands

```bash
# View logs
kubectl logs -f -l app=georgian-distribution -n georgian-distribution

# Check status
kubectl get all -n georgian-distribution

# Scale deployment
kubectl scale deployment georgian-distribution-blue --replicas=5 -n georgian-distribution

# Port forward for local testing
kubectl port-forward svc/georgian-distribution-service 3000:80 -n georgian-distribution

# Backup database
./scripts/deployment/backup-database.sh

# Invalidate CDN
./scripts/deployment/invalidate-cdn.sh
```

---

## Troubleshooting Quick Fixes

### Pods not starting?
```bash
kubectl describe pod <pod-name> -n georgian-distribution
kubectl logs <pod-name> -n georgian-distribution
```

### Health check failing?
```bash
kubectl exec -it <pod-name> -n georgian-distribution -- wget -qO- http://localhost:3000/api/health
```

### Need to update secrets?
```bash
kubectl delete secret app-secrets -n georgian-distribution
kubectl create secret generic app-secrets --from-env-file=.env.production -n georgian-distribution
kubectl rollout restart deployment/georgian-distribution-blue -n georgian-distribution
```

---

## CI/CD Quick Setup

1. **Add GitHub Secrets**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add all required secrets (see DEPLOYMENT.md for full list)

2. **Trigger Deployment**:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

3. **Monitor**:
   - GitHub Actions tab → Watch deployment progress
   - Slack notifications (if configured)

---

## Emergency Procedures

### Complete Rollback
```bash
# 1. Quick rollback
./scripts/deployment/rollback.sh

# 2. If that fails, scale up previous deployment
kubectl scale deployment georgian-distribution-green --replicas=3 -n georgian-distribution
kubectl patch service georgian-distribution-service -n georgian-distribution \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

### Database Restore
```bash
# List backups
ls -lh /var/backups/georgian-distribution/

# Restore
./scripts/deployment/restore-database.sh backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## Health Check Endpoints

- **Liveness**: `GET /api/health/liveness` (Is app running?)
- **Readiness**: `GET /api/health/readiness` (Is app ready for traffic?)
- **Detailed**: `GET /api/health` (Full system status)

---

## Support

📚 **Full Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

🐛 **Issues**: https://github.com/sitechfromgeorgia/georgian-distribution-system/issues

✅ **Status**: https://greenland77.ge/api/health
