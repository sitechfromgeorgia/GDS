# Canary Deployments - Complete Guide

## Table of Contents
1. Overview and Strategy
2. Implementation Patterns
3. Traffic Management
4. Metrics and Monitoring
5. Rollout Schedules
6. A/B Testing Integration
7. Feature Flags
8. Troubleshooting

---

## 1. Overview and Strategy

### What is Canary Deployment?

Canary deployment is a progressive delivery technique where new versions are released to a small subset of users before full production rollout. Named after "canary in a coal mine," this approach minimizes risk by detecting issues early with limited user impact.

**Key Benefits**:
- **Risk Reduction**: Limit blast radius of failures
- **Early Detection**: Catch bugs with real user traffic
- **Quick Rollback**: Easy revert if issues detected
- **Confidence Building**: Validate changes incrementally
- **Zero Downtime**: Seamless user experience

### When to Use Canary Deployments

✅ **Ideal For**:
- High-traffic production applications
- Critical user-facing features
- Changes with uncertain performance impact
- Database migrations
- API updates affecting multiple clients
- Infrastructure changes
- Peak traffic periods (gradual rollout reduces load)

❌ **Not Recommended For**:
- Hotfixes (deploy immediately to all)
- Non-production environments (staging can test normally)
- Very low traffic applications (insufficient data)
- Simple configuration changes

### Canary vs Other Strategies

| Strategy | Traffic Split | Rollback Speed | Complexity | Best For |
|----------|---------------|----------------|------------|----------|
| **Canary** | Gradual (10% → 100%) | Fast | Medium | Production releases |
| **Blue-Green** | Instant (0% → 100%) | Instant | Low | Major versions |
| **Rolling** | Sequential servers | Slow | Low | Stateless apps |
| **A/B Testing** | 50/50 split | N/A | High | Feature comparison |

---

## 2. Implementation Patterns

### Pattern 1: Infrastructure-Based Canary (Vercel)

**Vercel Deployment Aliases**:

```yaml
# .github/workflows/canary-vercel.yml
name: Canary Deployment (Vercel)

on:
  push:
    branches:
      - main

jobs:
  deploy-canary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Canary
        id: deploy
        run: |
          npm i -g vercel
          DEPLOYMENT_URL=$(vercel deploy --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT
      
      - name: Route 10% Traffic to Canary
        run: |
          # Assign canary alias with traffic percentage
          vercel alias set ${{ steps.deploy.outputs.url }} canary.example.com \
                --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Monitor Canary (15 minutes)
        run: |
          sleep 900
          ./scripts/health-check.sh https://canary.example.com/health
      
      - name: Check Canary Metrics
        id: metrics
        run: |
          # Fetch metrics from monitoring system
          ERROR_RATE=$(curl -s "https://api.datadog.com/api/v1/query?query=sum:requests.error_rate{env:canary}" \
                        -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" | jq '.series[0].pointlist[-1][1]')
          
          LATENCY_P95=$(curl -s "https://api.datadog.com/api/v1/query?query=avg:request.latency.p95{env:canary}" \
                        -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" | jq '.series[0].pointlist[-1][1]')
          
          echo "error_rate=$ERROR_RATE" >> $GITHUB_OUTPUT
          echo "latency_p95=$LATENCY_P95" >> $GITHUB_OUTPUT
      
      - name: Promote or Rollback
        run: |
          if (( $(echo "${{ steps.metrics.outputs.error_rate }} < 0.01" | bc -l) )); then
            # Promote to production
            vercel alias set ${{ steps.deploy.outputs.url }} production.example.com \
                  --token=${{ secrets.VERCEL_TOKEN }}
            echo "✅ Canary promoted to production"
          else
            echo "❌ Canary failed - rolling back"
            # Rollback by routing all traffic to stable version
            vercel alias set [stable-deployment-url] production.example.com \
                  --token=${{ secrets.VERCEL_TOKEN }}
            exit 1
          fi
```

### Pattern 2: Service-Based Canary (Railway)

**Deploy Canary as Separate Service**:

```yaml
# .github/workflows/canary-railway.yml
name: Canary Deployment (Railway)

on:
  push:
    branches:
      - main

jobs:
  deploy-canary:
    runs-on: ubuntu-latest
    container: ghcr.io/railwayapp/cli:latest
    env:
      RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Canary Service
        run: |
          railway up --service=${{ secrets.CANARY_SERVICE_ID }}
      
      - name: Monitor Canary Health
        run: |
          sleep 900  # 15 minutes
          # Check health endpoint
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api-canary.railway.app/health)
          
          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "❌ Canary health check failed"
            railway rollback --service=${{ secrets.CANARY_SERVICE_ID }}
            exit 1
          fi
      
      - name: Promote Canary to Production
        run: |
          # Deploy same code to production service
          railway up --service=${{ secrets.PRODUCTION_SERVICE_ID }}
          echo "✅ Promoted to production"
```

**Load Balancer Configuration**:

For advanced traffic splitting, use a load balancer (e.g., Cloudflare Load Balancer, AWS ALB):

```yaml
# Cloudflare Load Balancer configuration
pools:
  - name: production
    origins:
      - url: https://api-production.example.com
        weight: 0.9  # 90% traffic
  - name: canary
    origins:
      - url: https://api-canary.example.com
        weight: 0.1  # 10% traffic

# Gradually shift weights:
# Stage 1: 90/10 → Monitor 15 min
# Stage 2: 75/25 → Monitor 15 min
# Stage 3: 50/50 → Monitor 30 min
# Stage 4: 0/100 → Full rollout
```

---

## 3. Traffic Management

### Client-Side Traffic Splitting

**Using Headers for Routing**:

```javascript
// middleware.ts (Next.js Edge)
export function middleware(request) {
  const canaryHeader = request.headers.get('x-canary-user')
  const isCanaryUser = canaryHeader === 'true' || 
                       Math.random() < 0.1  // 10% random
  
  if (isCanaryUser) {
    return NextResponse.rewrite(new URL('/api-canary', request.url))
  }
  
  return NextResponse.next()
}
```

### Cookie-Based Canary Routing

```javascript
// Set canary cookie for testing
app.get('/enable-canary', (req, res) => {
  res.cookie('canary_user', 'true', { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true 
  })
  res.send('Canary mode enabled')
})

// Check cookie in routing
if (req.cookies.canary_user === 'true') {
  // Route to canary
}
```

---

## 4. Metrics and Monitoring

### Key Metrics to Track

**Golden Signals**:
1. **Latency**: Response time (P50, P95, P99)
2. **Traffic**: Requests per second
3. **Errors**: Error rate (4xx, 5xx responses)
4. **Saturation**: Resource utilization (CPU, memory)

**Acceptance Criteria**:

| Metric | Threshold | Action if Exceeded |
|--------|-----------|-------------------|
| Error Rate | < 1% | Rollback immediately |
| P95 Latency | < +20% vs baseline | Investigate, may rollback |
| Success Rate | > 99% | Continue monitoring |
| CPU Usage | < 80% | Scale or optimize |
| Memory Usage | < 85% | Scale or optimize |

### Automated Metrics Collection

```bash
# health-check-with-metrics.sh
#!/bin/bash
CANARY_URL=$1
BASELINE_URL=$2

# Collect metrics
CANARY_LATENCY=$(curl -w "%{time_total}" -s -o /dev/null $CANARY_URL)
BASELINE_LATENCY=$(curl -w "%{time_total}" -s -o /dev/null $BASELINE_URL)

# Calculate percentage difference
LATENCY_DIFF=$(echo "scale=2; (($CANARY_LATENCY - $BASELINE_LATENCY) / $BASELINE_LATENCY) * 100" | bc)

if (( $(echo "$LATENCY_DIFF > 20" | bc -l) )); then
  echo "❌ Canary latency increased by ${LATENCY_DIFF}%"
  exit 1
fi

echo "✅ Canary latency within acceptable range (${LATENCY_DIFF}% difference)"
```

---

## 5. Progressive Rollout Schedule

### Recommended Rollout Timeline

**Conservative Approach** (High-Risk Changes):

```
Stage 1: 5% traffic  → Monitor 30 minutes
Stage 2: 10% traffic → Monitor 30 minutes
Stage 3: 25% traffic → Monitor 1 hour
Stage 4: 50% traffic → Monitor 2 hours
Stage 5: 100% traffic → Full production
Total: ~4 hours
```

**Aggressive Approach** (Low-Risk Changes):
```
Stage 1: 10% traffic  → Monitor 15 minutes
Stage 2: 50% traffic  → Monitor 30 minutes
Stage 3: 100% traffic → Full production
Total: ~45 minutes
```

**Enterprise Approach** (Mission-Critical):
```
Stage 1: 1% traffic    → Monitor 1 hour
Stage 2: 5% traffic    → Monitor 2 hours
Stage 3: 10% traffic   → Monitor 4 hours
Stage 4: 25% traffic   → Monitor 8 hours
Stage 5: 50% traffic   → Monitor 12 hours
Stage 6: 100% traffic  → Full production
Total: ~27 hours
```

---

## 6. Feature Flags Integration

Combine canary deployments with feature flags for granular control:

```javascript
// Using LaunchDarkly or similar
import { useLDClient } from 'launchdarkly-react-client-sdk'

function NewFeature() {
  const ldClient = useLDClient()
  const newFeatureEnabled = ldClient.variation('new-feature', false)
  
  return newFeatureEnabled ? <NewComponent /> : <OldComponent />
}
```

**Canary + Feature Flags Strategy**:
1. Deploy code with feature flag disabled (0% users)
2. Enable flag for canary users only (10%)
3. Gradually increase flag percentage
4. Monitor both deployment and feature metrics
5. Full rollout or instant disable via flag

---

## 7. Best Practices

✅ **DO**:
- Always monitor canary for minimum 15 minutes
- Set clear acceptance criteria before deployment
- Automate rollback decisions based on metrics
- Keep canary and baseline environments identical
- Log all canary traffic for debugging
- Test rollback procedure before deploying
- Use meaningful user segments (e.g., internal users first)

❌ **DON'T**:
- Skip monitoring windows to "save time"
- Deploy canaries during off-peak hours only
- Route production traffic to untested canaries
- Ignore error rate spikes
- Promote canary without health checks
- Forget to document rollback procedure

---

## 8. Troubleshooting

**Issue: Canary metrics differ significantly from production**

*Cause*: Different user segments or sampling bias

*Solution*:
- Ensure random user selection
- Verify similar traffic patterns
- Check for bot traffic or outliers

**Issue: Slow rollback during incident**

*Cause*: Manual rollback procedures

*Solution*:
- Implement automated rollback triggers
- Pre-configure rollback commands
- Practice rollback drills regularly

**Issue: Insufficient canary traffic for metrics**

*Cause*: Too small percentage or low overall traffic

*Solution*:
- Increase canary percentage (but monitor carefully)
- Extend monitoring window
- Use synthetic traffic for testing

---

**This guide provides production-ready canary deployment strategies. Always test in staging before applying to production.**
