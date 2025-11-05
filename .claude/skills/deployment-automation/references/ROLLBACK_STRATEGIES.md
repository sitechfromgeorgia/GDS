# Rollback Strategies and Disaster Recovery

## Table of Contents
1. Emergency Rollback Procedures
2. Platform-Specific Rollback Commands
3. Database Rollback Strategies
4. Incident Response Playbook
5. Post-Mortem Templates
6. Prevention Strategies

---

## 1. Emergency Rollback Procedures

### When to Rollback Immediately

**Critical Triggers**:
- Error rate > 5% for 5+ minutes
- Complete service outage
- Data corruption detected
- Security vulnerability exploited
- Payment processing failures
- Legal compliance breach

### Emergency Rollback Checklist

```
□ 1. Declare incident and alert team
□ 2. Stop any ongoing deployments
□ 3. Identify last stable version
□ 4. Execute rollback commands
□ 5. Verify rollback successful
□ 6. Monitor for 15 minutes post-rollback
□ 7. Communicate status to stakeholders
□ 8. Schedule post-mortem
```

---

## 2. Platform-Specific Rollback Commands

### Vercel Rollback


**Quick Rollback** (Promote Previous Deployment):
```bash
# 1. List recent deployments
vercel ls

# Output example:
# Age  Deployment                    Status   Duration
# 2m   example-abc123.vercel.app     Ready    30s
# 1h   example-xyz789.vercel.app     Ready    28s  ← Previous stable

# 2. Promote previous deployment to production
vercel promote example-xyz789.vercel.app --prod

# 3. Verify
curl -I https://example.com
```

**Git-Based Rollback**:
```bash
# 1. Revert to previous commit
git revert HEAD
git push origin main

# 2. Vercel will auto-deploy the reverted version

# Alternative: Hard reset (dangerous)
git reset --hard HEAD~1
git push --force origin main
```

**Automated Rollback Workflow**:
```yaml
# .github/workflows/emergency-rollback.yml
name: Emergency Rollback


on:
  workflow_dispatch:
    inputs:
      target_deployment:
        description: 'Deployment URL to promote'
        required: true
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Promote Previous Deployment
        run: |
          vercel promote ${{ inputs.target_deployment }} --prod \
                --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Verify Rollback
        run: |
          sleep 10
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://example.com)
          
          if [ "$HTTP_CODE" -eq 200 ]; then
            echo "✅ Rollback successful"
          else
            echo "❌ Rollback verification failed"
            exit 1
          fi
      
      - name: Notify Team
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
               -d '{"text":"🚨 Emergency rollback completed for production"}'
```

### Railway Rollback


**CLI Rollback**:
```bash
# 1. View deployment history
railway status

# 2. Rollback to previous deployment
railway rollback

# 3. Rollback to specific deployment
railway rollback --deployment=dep_abc123

# 4. Verify rollback
railway logs --follow
```

**Manual Rollback via Dashboard**:
1. Go to Railway Dashboard → Service → Deployments
2. Find the last stable deployment
3. Click "Redeploy" on that deployment
4. Monitor logs for successful startup

**Git-Based Rollback**:
```bash
# Revert and redeploy
git revert HEAD
git push origin main
# Railway auto-deploys the revert
```

---

## 3. Database Rollback Strategies

### Migration Rollback (Prisma)

**Forward-Only Migrations** (Recommended):
```bash
# Create compensating migration instead of rollback
npx prisma migrate dev --name revert_user_email_change

# In the new migration:
# ALTER TABLE users ADD COLUMN old_email VARCHAR(255);
# UPDATE users SET old_email = email;
# -- Then deploy fix
```

**Emergency Rollback**:
```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back [migration-name]

# Restore from backup (PostgreSQL)
railway run psql < backup-before-migration.sql

# Verify data integrity
npx prisma studio  # Visual inspection
```

### Database Backup Strategy

**Pre-Deployment Backup**:
```yaml
# .github/workflows/deploy-with-backup.yml
- name: Backup Database Before Migration
  run: |
    timestamp=$(date +%Y%m%d_%H%M%S)
    railway run pg_dump > "backup_${timestamp}.sql"
    
    # Upload to S3 or artifact storage
    aws s3 cp "backup_${timestamp}.sql" s3://backups/
```

**Point-in-Time Recovery**:
```bash
# Railway automated backups (Pro plan)
# Restore from specific time
railway backup restore --time="2025-01-15T10:30:00Z"
```

### Data Validation After Rollback

```sql
-- Check record counts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;

-- Verify critical data
SELECT * FROM users WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check for orphaned records
SELECT * FROM orders WHERE user_id NOT IN (SELECT id FROM users);
```

---

## 4. Incident Response Playbook

### Severity Levels

**P0 - Critical** (Rollback Immediately):
- Complete service outage
- Data loss or corruption
- Payment processing down
- Security breach

**P1 - High** (Rollback within 15 min):
- Partial outage affecting > 50% users
- Major feature broken
- High error rates (> 5%)

**P2 - Medium** (Evaluate, may not rollback):
- Minor feature broken
- Performance degradation (< 2x slower)
- Cosmetic issues

### Incident Response Flow

```
1. DETECT (Monitoring alerts or user reports)
   ↓
2. ASSESS (Check metrics, logs, user impact)
   ↓
3. DECIDE (Rollback? Fix forward? Investigate?)
   ↓
4. EXECUTE (Run rollback commands)
   ↓
5. VERIFY (Check metrics recovered)
   ↓
6. COMMUNICATE (Update stakeholders)
   ↓
7. POST-MORTEM (Root cause analysis)
```

### Communication Template


**Incident Start**:
```
🚨 INCIDENT ALERT - P0
Time: 2025-01-15 10:30 UTC
Impact: Payment processing down
Status: Investigating
ETA: 15 minutes
```

**Rollback Initiated**:
```
🔄 ROLLBACK IN PROGRESS
Action: Rolling back to version v2.3.4
ETA: 5 minutes
Current Status: Deploying previous version
```

**Incident Resolved**:
```
✅ INCIDENT RESOLVED
Time Resolved: 2025-01-15 10:45 UTC
Total Duration: 15 minutes
Action Taken: Rolled back to v2.3.4
Next Steps: Post-mortem scheduled for tomorrow 10am
```

---

## 5. Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date**: 2025-01-15
**Severity**: P0
**Duration**: 15 minutes
**Impact**: 10,000 users affected

## Timeline

- 10:30 UTC: Deployment v2.4.0 started
- 10:32 UTC: Error rate spike detected (15%)
- 10:33 UTC: Incident declared, rollback initiated
- 10:38 UTC: Rollback completed
- 10:45 UTC: System fully recovered

## Root Cause

Database migration introduced a foreign key constraint that broke
existing API endpoints. Migration was not tested with production data.

## What Went Wrong

1. Migration not tested with production-like dataset
2. No canary deployment for backend changes
3. Health checks did not catch constraint violations
4. Rollback procedure took 12 minutes (target: < 5min)

## What Went Right

1. Monitoring detected issue within 2 minutes
2. Team responded immediately
3. Rollback completed successfully
4. No data loss occurred

## Action Items

□ Add production data volume tests to CI/CD
□ Implement canary deployments for backend
□ Update health checks to test database constraints
□ Pre-stage rollback commands for faster execution
□ Schedule database migration training

## Lessons Learned

Always test migrations with production-scale data before deploying.
```

---

## 6. Prevention Strategies

### Pre-Deployment Checklist

**Before Every Production Deployment**:

```
□ All tests passing in CI/CD
□ Staging environment tested
□ Database backup created (if migrations)
□ Rollback procedure documented
□ Monitoring alerts configured
□ Team notified of deployment
□ Rollback commands ready
□ Off-hours deployment scheduled (if high-risk)
```

### Deployment Safety Practices

✅ **DO**:
- Use canary deployments for high-risk changes
- Always create database backups before migrations
- Test rollback procedure in staging
- Deploy during business hours (for quick response)
- Monitor actively for 30 minutes post-deployment
- Document every deployment decision

❌ **DON'T**:
- Deploy on Fridays unless emergency
- Skip testing in staging
- Deploy multiple changes at once
- Ignore warning signs (elevated errors, slow responses)
- Deploy without rollback plan
- Assume "it worked in dev"

### Automated Safety Checks

```yaml
# .github/workflows/safety-checks.yml
name: Pre-Deployment Safety Checks

on:
  pull_request:
    branches: [main]

jobs:
  safety-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check for Database Migrations
        run: |
          if git diff origin/main --name-only | grep -q "prisma/migrations"; then
            echo "⚠️ Database migration detected"
            echo "Ensure backup is created before deployment"
          fi
      
      - name: Check Deployment Day
        run: |
          DAY=$(date +%u)
          if [ $DAY -eq 5 ]; then
            echo "⚠️ WARNING: Deploying on Friday"
            echo "Ensure team is available for monitoring"
          fi
      
      - name: Verify Rollback Documentation
        run: |
          if ! grep -q "Rollback" README.md; then
            echo "❌ No rollback procedure documented"
            exit 1
          fi
```

---

## Quick Reference: Rollback Commands

### Vercel
```bash
vercel ls                                    # List deployments
vercel promote [deployment-url] --prod      # Rollback
```

### Railway
```bash
railway rollback                             # Rollback to previous
railway rollback --deployment=dep_abc123    # Rollback to specific
```

### Database
```bash
railway run psql < backup.sql                # Restore PostgreSQL
npx prisma migrate resolve --rolled-back     # Mark migration rolled back
```

---

**Always prioritize user safety over shipping features. A good rollback is better than a bad fix-forward.**
