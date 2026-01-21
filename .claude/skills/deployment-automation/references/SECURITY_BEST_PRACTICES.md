# Security Best Practices for CI/CD Pipelines

## Table of Contents
1. Secrets Management
2. Dependency Security
3. Container Security
4. Network Security
5. Access Control
6. Audit Logging
7. Compliance Considerations

---

## 1. Secrets Management

### GitHub Secrets Configuration

**Organization vs Repository Secrets**:
- **Repository Secrets**: For project-specific credentials (Vercel/Railway tokens)
- **Organization Secrets**: For shared credentials (Slack webhooks, Sentry DSN)
- **Environment Secrets**: For environment-specific values (production vs staging)

**Best Practices**:
```yaml
# ✅ GOOD: Use secrets for sensitive data
env:
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  API_KEY: ${{ secrets.API_KEY }}

# ❌ BAD: Never hardcode secrets
env:
  VERCEL_TOKEN: "abc123xyz"  # NEVER DO THIS
```

**Secret Rotation Schedule**:
- API tokens: Every 90 days
- Service accounts: Every 180 days
- Database passwords: Every 90 days
- Webhook secrets: Annually or after suspected compromise

### Environment Variable Security

**Separation by Environment**:
```bash
# Development (.env.development)
DATABASE_URL=postgresql://localhost:5432/dev_db
API_KEY=dev_key_not_secret

# Production (.env.production)
DATABASE_URL=${{ secrets.PROD_DATABASE_URL }}
API_KEY=${{ secrets.PROD_API_KEY }}
```

**Never Commit Secrets**:
```gitignore
# .gitignore
.env
.env.local
.env*.local
.vercel
.railway
secrets/
*.pem
*.key
```

**Use git-secrets or similar tools**:
```bash
# Install git-secrets
brew install git-secrets

# Initialize for repo
git secrets --install
git secrets --register-aws

# Scan for secrets
git secrets --scan
```

---

## 2. Dependency Security

### Automated Dependency Scanning

**Dependabot Configuration**:
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    
    # Auto-merge minor and patch updates
    reviewers:
      - "security-team"
    
    # Ignore specific dependencies
    ignore:
      - dependency-name: "webpack"
        versions: ["5.x"]
```

**GitHub Advanced Security**:
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Upload Snyk results to GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: snyk.sarif
```

### Package Lock Files

**ALWAYS commit lock files**:
```bash
# ✅ GOOD: Commit these files
git add package-lock.json  # npm
git add yarn.lock          # yarn
git add pnpm-lock.yaml     # pnpm

# Use deterministic installs
npm ci           # Uses package-lock.json exactly
yarn install --frozen-lockfile
pnpm install --frozen-lockfile
```

### Supply Chain Security

**Verify Package Integrity**:
```bash
# Check for suspicious packages
npm audit
npm audit fix

# View dependency tree
npm ls

# Check for outdated packages
npm outdated
```

**SBOM (Software Bill of Materials)**:
```bash
# Generate SBOM
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# Scan SBOM for vulnerabilities
grype sbom:./sbom.json
```

---

## 3. Container Security

### Dockerfile Best Practices

**Multi-stage Builds**:
```dockerfile
# ✅ GOOD: Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Security Hardening**:
```dockerfile
# Use minimal base images
FROM node:20-alpine  # ✅ 180MB
# FROM node:20        # ❌ 900MB

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Remove unnecessary packages
RUN apk del apk-tools

# Use read-only filesystem
VOLUME ["/app/data"]
```

### Image Scanning

**Scan for Vulnerabilities**:
```yaml
# .github/workflows/container-security.yml
name: Container Security Scan

on:
  push:
    branches: [ main ]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## 4. Network Security

### API Security

**Rate Limiting**:
```javascript
// Express.js example
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

**CORS Configuration**:
```javascript
// ✅ GOOD: Restrictive CORS
app.use(cors({
  origin: [
    'https://app.example.com',
    'https://admin.example.com'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

// ❌ BAD: Permissive CORS
app.use(cors({
  origin: '*'  // Allows all origins
}));
```

### HTTPS Enforcement

**Railway/Vercel** (automatic):
- Both platforms automatically provide SSL certificates
- Enforce HTTPS redirects by default

**Custom Servers**:
```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

**Security Headers**:
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 5. Access Control

### GitHub Branch Protection

**Required Settings**:
```yaml
# Via GitHub UI: Settings → Branches → Branch protection rules

✅ Require pull request reviews before merging
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Include administrators
✅ Restrict who can push to matching branches
✅ Allow force pushes: Disabled
✅ Allow deletions: Disabled
```

### Deployment Approvals

**Production Deployment Approval**:
```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.com
    
    steps:
      # Deployment requires approval from team lead
      - name: Deploy to production
        run: |
          # Deployment commands
```

**Configure Environment Protection Rules**:
- Settings → Environments → production → Configure environment
- Add required reviewers (team leads, security team)
- Set deployment branch rules (only main)

### Service Account Management

**Principle of Least Privilege**:
```bash
# ✅ GOOD: Separate tokens for different services
VERCEL_TOKEN=vercel_deploy_only_token
RAILWAY_TOKEN=railway_deploy_only_token

# ❌ BAD: Admin tokens for everything
ADMIN_TOKEN=admin_all_access_token
```

**Token Scoping**:
- Vercel: Create tokens with deploy-only permissions
- Railway: Use service-specific tokens
- GitHub: Use fine-grained personal access tokens

---

## 6. Audit Logging

### Deployment Logging

**Structured Logging**:
```yaml
- name: Log deployment
  run: |
    echo "Deployment Details:" | tee deployment.log
    echo "Commit: ${{ github.sha }}" | tee -a deployment.log
    echo "Actor: ${{ github.actor }}" | tee -a deployment.log
    echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" | tee -a deployment.log
    echo "Environment: production" | tee -a deployment.log

- name: Upload deployment logs
  uses: actions/upload-artifact@v3
  with:
    name: deployment-logs
    path: deployment.log
```

### Security Event Monitoring

**GitHub Actions Monitoring**:
```yaml
# Monitor for suspicious activity
- Failed deployments
- Unauthorized access attempts
- Secret access patterns
- Deployment frequency anomalies
```

**Setup Alerts**:
```bash
# Use GitHub Webhooks to send security events to SIEM
# Example: Send to Datadog, Splunk, or custom logging service
```

---

## 7. Compliance Considerations

### GDPR Compliance

**Data Handling**:
- Log retention: 90 days maximum
- Personally Identifiable Information (PII): Never log
- Audit trail: Maintain deployment records
- Right to erasure: Implement data deletion workflows

### SOC 2 Requirements

**Change Management**:
- All production changes go through PR review
- Automated testing before deployment
- Rollback procedures documented
- Incident response plan in place

**Access Control**:
- MFA required for GitHub/Vercel/Railway
- Regular access reviews (quarterly)
- Service account audits (monthly)
- Principle of least privilege

### PCI DSS (if handling payments)

**Security Requirements**:
- Encrypt secrets in transit and at rest
- Regular security scans (weekly)
- Penetration testing (annually)
- Security patch management (monthly)

---

## Security Checklist

### Pre-Deployment
- [ ] All secrets stored in GitHub Secrets or environment variables
- [ ] No hardcoded credentials in code
- [ ] Dependencies scanned for vulnerabilities
- [ ] Container images scanned (if using Docker)
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Rate limiting implemented
- [ ] CORS properly configured

### Deployment Pipeline
- [ ] Tests pass before deployment
- [ ] Branch protection rules enforced
- [ ] Required reviewers configured for production
- [ ] Deployment logs captured
- [ ] Health checks implemented
- [ ] Rollback procedure tested
- [ ] Monitoring and alerts configured

### Post-Deployment
- [ ] Smoke tests executed
- [ ] Security scan passed
- [ ] Performance metrics within acceptable range
- [ ] No secrets exposed in logs
- [ ] Access logs reviewed
- [ ] Incident response plan updated

### Regular Maintenance
- [ ] Secrets rotated (90 days)
- [ ] Dependencies updated (weekly)
- [ ] Security patches applied (within 48 hours of release)
- [ ] Access reviews conducted (quarterly)
- [ ] Audit logs reviewed (monthly)
- [ ] Disaster recovery tested (quarterly)

---

## Security Incident Response

### Immediate Actions

1. **Identify the Issue**
   - Scope of compromise
   - Affected systems
   - Timeline of events

2. **Contain the Breach**
   - Revoke compromised secrets immediately
   - Disable affected services
   - Block suspicious IP addresses

3. **Notify Stakeholders**
   - Security team
   - Engineering leadership
   - Affected customers (if applicable)

### Recovery Steps

1. **Rotate All Secrets**
   ```bash
   # Rotate all affected credentials
   vercel env rm COMPROMISED_VAR production
   vercel env add NEW_VAR production

   railway variables set NEW_VAR=new_value
   ```

2. **Audit Access Logs**
   - Review GitHub audit log
   - Check Vercel deployment logs
   - Analyze Railway access patterns

3. **Restore from Known-Good State**
   ```bash
   # Rollback to last known secure deployment
   vercel promote <safe-deployment-url> --prod
   railway rollback --deployment <safe-deployment-id>
   ```

4. **Post-Incident Review**
   - Document what happened
   - Identify root cause
   - Implement preventive measures
   - Update security procedures

---

## Security Resources

**Tools**:
- [Snyk](https://snyk.io) - Dependency scanning
- [Trivy](https://trivy.dev) - Container scanning
- [git-secrets](https://github.com/awslabs/git-secrets) - Secret detection
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) - Vulnerability scanning

**Standards**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

**Compliance**:
- [SOC 2 Requirements](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/socforserviceorganizations.html)
- [GDPR Guidelines](https://gdpr.eu/)
- [PCI DSS Standards](https://www.pcisecuritystandards.org/)

---

**Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential.**
