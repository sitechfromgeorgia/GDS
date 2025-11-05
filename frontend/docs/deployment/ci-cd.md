# CI/CD Pipeline

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05

---

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for automated testing, building, and deploying the Distribution Management System.

---

## Pipeline Architecture

```
┌─────────────────┐
│   Git Push      │
│   to GitHub     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│   Triggered     │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  Lint   │   │  Test   │   │  Build  │   │ Deploy  │
   │  Check  │   │  Suite  │   │  App    │   │ Vercel  │
   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

---

## GitHub Actions Workflows

### Workflow Files Structure

```
.github/
└── workflows/
    ├── ci.yml                # Continuous Integration
    ├── deploy-production.yml # Production deployment
    ├── deploy-preview.yml    # Preview deployments
    └── cron-cleanup.yml      # Scheduled maintenance
```

---

## Workflow 1: Continuous Integration

### File: `.github/workflows/ci.yml`

**Purpose**: Run linting, type checking, and tests on every push/PR

**Triggers**:
- Push to any branch
- Pull request to `main`

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    name: Lint, Type Check, and Test
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run ESLint
        working-directory: ./frontend
        run: npm run lint

      - name: Run Type Check
        working-directory: ./frontend
        run: npx tsc --noEmit

      - name: Run Unit Tests
        working-directory: ./frontend
        run: npm run test:unit
        env:
          CI: true

      - name: Run Integration Tests
        working-directory: ./frontend
        run: npm run test:integration
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage
          fail_ci_if_error: false

      - name: Build Application
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: http://localhost:3000

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint-and-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Install Playwright Browsers
        working-directory: ./frontend
        run: npx playwright install --with-deps

      - name: Run E2E Tests
        working-directory: ./frontend
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
```

---

## Workflow 2: Production Deployment

### File: `.github/workflows/deploy-production.yml`

**Purpose**: Deploy to production on merge to `main`

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Vercel Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://your-app.vercel.app

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run Tests
        working-directory: ./frontend
        run: npm run test:ci
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}

      - name: Build Application
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://your-app.vercel.app

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend

      - name: Run Smoke Tests
        run: |
          sleep 30 # Wait for deployment to be live
          curl -f https://your-app.vercel.app/api/health || exit 1

      - name: Notify Deployment Success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              text: '🚀 Production deployment successful!',
              attachments: [{
                color: 'good',
                text: `Deployment: https://your-app.vercel.app\nCommit: ${{ github.sha }}`
              }]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

      - name: Notify Deployment Failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              text: '❌ Production deployment failed!',
              attachments: [{
                color: 'danger',
                text: `Check logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`
              }]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Workflow 3: Preview Deployments

### File: `.github/workflows/deploy-preview.yml`

**Purpose**: Create preview deployments for pull requests

**Triggers**:
- Pull request opened/synchronized

```yaml
name: Deploy Preview

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

jobs:
  deploy-preview:
    name: Deploy to Vercel Preview
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build Application
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://preview-${{ github.event.pull_request.number }}.vercel.app

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        id: vercel-deploy
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env NEXT_PUBLIC_SUPABASE_URL=${{ secrets.STAGING_SUPABASE_URL }}'
          working-directory: ./frontend

      - name: Comment Preview URL on PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `✅ Preview deployment ready!\n\n🔗 Preview URL: ${{ steps.vercel-deploy.outputs.preview-url }}\n\n📊 [View deployment logs](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})`
            })

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            ${{ steps.vercel-deploy.outputs.preview-url }}
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

## Workflow 4: Scheduled Maintenance

### File: `.github/workflows/cron-cleanup.yml`

**Purpose**: Scheduled tasks and maintenance

**Triggers**:
- Cron schedule (daily at 2 AM UTC)
- Manual workflow dispatch

```yaml
name: Scheduled Maintenance

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  cleanup-old-previews:
    name: Cleanup Old Preview Deployments
    runs-on: ubuntu-latest

    steps:
      - name: Delete old Vercel deployments
        uses: actions/github-script@v6
        with:
          script: |
            const { Vercel } = require('@vercel/client');
            const vercel = new Vercel(process.env.VERCEL_TOKEN);

            const deployments = await vercel.getDeployments({
              projectId: process.env.VERCEL_PROJECT_ID,
              target: 'preview'
            });

            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

            for (const deployment of deployments) {
              if (deployment.created < thirtyDaysAgo) {
                await vercel.deleteDeployment(deployment.uid);
                console.log(`Deleted old deployment: ${deployment.uid}`);
              }
            }
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  database-backup:
    name: Backup Database
    runs-on: ubuntu-latest

    steps:
      - name: Backup Supabase Database
        run: |
          # This is a placeholder - actual backup is handled by Supabase
          # For manual backups, use pg_dump
          echo "Database backup handled by Supabase automated backups"
          echo "Backup retention: 7 days (Pro plan)"

  dependency-updates:
    name: Check for Dependency Updates
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Check for outdated dependencies
        working-directory: ./frontend
        run: |
          npm outdated || true

      - name: Create issue if critical updates available
        uses: actions/github-script@v6
        with:
          script: |
            // Check for critical security updates
            const { execSync } = require('child_process');
            const output = execSync('npm audit --json', { cwd: './frontend' }).toString();
            const audit = JSON.parse(output);

            if (audit.metadata.vulnerabilities.critical > 0) {
              github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title: '🚨 Critical Security Updates Available',
                body: `Found ${audit.metadata.vulnerabilities.critical} critical vulnerabilities.\n\nRun \`npm audit fix\` to update.`,
                labels: ['security', 'dependencies']
              });
            }
```

---

## Required GitHub Secrets

### Repository Secrets

**Location**: Repository **Settings** > **Secrets and variables** > **Actions**

```bash
# Vercel
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Supabase - Production
PROD_SUPABASE_URL=https://prod-project.supabase.co
PROD_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase - Staging
STAGING_SUPABASE_URL=https://staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase - Test
TEST_SUPABASE_URL=https://test-project.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGc...

# Test Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password-123

# Notifications (Optional)
SLACK_WEBHOOK=https://hooks.slack.com/services/...

# Codecov (Optional)
CODECOV_TOKEN=your-codecov-token
```

---

## How to Get Required Tokens

### Vercel Token

1. Go to [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name: `GitHub Actions`
4. Scope: Full Account
5. Copy token (shown once)

### Vercel Org ID and Project ID

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd frontend
vercel link

# IDs saved in .vercel/project.json
cat .vercel/project.json
```

---

## Branch Protection Rules

### Configure Protected Branches

**Location**: Repository **Settings** > **Branches** > **Add rule**

**Branch name pattern**: `main`

**Settings**:
```yaml
✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale pull request approvals

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date
  Status checks:
    - lint-and-test
    - e2e-tests
    - deploy-preview

✅ Require conversation resolution before merging

✅ Require signed commits

✅ Include administrators

✅ Restrict who can push to matching branches
  (Optional: Add teams/users who can push)
```

---

## Pull Request Template

### File: `.github/pull_request_template.md`

```markdown
## Description

<!-- Describe your changes in detail -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

<!-- Describe the tests that you ran to verify your changes -->

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## Related Issues

<!-- Link related issues: Fixes #123, Closes #456 -->
```

---

## Issue Templates

### File: `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

<!-- A clear and concise description of what the bug is -->

## Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior

<!-- What you expected to happen -->

## Actual Behavior

<!-- What actually happened -->

## Screenshots

<!-- If applicable, add screenshots to help explain your problem -->

## Environment

- OS: [e.g., Windows 11, macOS 13]
- Browser: [e.g., Chrome 120, Firefox 121]
- Version: [e.g., 1.0.0]

## Additional Context

<!-- Add any other context about the problem here -->
```

---

## Deployment Strategies

### Strategy 1: Feature Branch Workflow

```
main (production)
  ↑
  └── Pull Request (CI runs)
       ↑
       └── feature/new-feature (preview deployment)
```

**Process**:
1. Create feature branch from `main`
2. Make changes and commit
3. Push branch → Preview deployment created
4. Create PR → CI runs (lint, test, build)
5. Review and approve PR
6. Merge to `main` → Production deployment

---

### Strategy 2: GitFlow

```
main (production)
  ↑
  └── develop (staging)
       ↑
       └── feature/new-feature
```

**Process**:
1. Create feature branch from `develop`
2. Merge feature to `develop` → Staging deployment
3. Test on staging
4. Create PR from `develop` to `main`
5. Merge to `main` → Production deployment

---

## Monitoring and Alerts

### Deployment Notifications

**Slack Integration**:
```yaml
- name: Notify on Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to production'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

---

### Failed Build Alerts

**Email Notifications**:
- Enabled by default in GitHub Actions
- Configure in **Settings** > **Notifications**

---

## Performance Monitoring

### Lighthouse CI

Add to CI workflow:

```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://your-app.vercel.app
    budgetPath: ./lighthouse-budget.json
    uploadArtifacts: true
```

**lighthouse-budget.json**:
```json
{
  "budgets": [{
    "path": "/*",
    "timings": [{
      "metric": "first-contentful-paint",
      "budget": 2000
    }, {
      "metric": "largest-contentful-paint",
      "budget": 2500
    }, {
      "metric": "interactive",
      "budget": 3000
    }]
  }]
}
```

---

## Troubleshooting

### Issue: Workflow not triggering

**Cause**: Workflow file syntax error

**Solution**:
```bash
# Validate workflow syntax
npm install -g @action-validator/cli
action-validator .github/workflows/ci.yml
```

---

### Issue: Tests failing in CI but passing locally

**Cause**: Environment differences

**Solutions**:
1. Check Node.js version matches
2. Verify environment variables set
3. Check for timezone differences
4. Run tests with `CI=true` locally

---

### Issue: Deployment failing with "ELIFECYCLE" error

**Cause**: Build script failing

**Solutions**:
1. Check build logs in Actions tab
2. Reproduce build locally: `npm run build`
3. Verify all environment variables set
4. Check for missing dependencies

---

## Best Practices

### 1. Keep Workflows Fast

```yaml
# Use caching
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}

# Run jobs in parallel
jobs:
  lint:
    runs-on: ubuntu-latest
  test:
    runs-on: ubuntu-latest
  # These run simultaneously
```

---

### 2. Use Matrix Testing

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest]
```

---

### 3. Fail Fast

```yaml
strategy:
  fail-fast: true
  matrix:
    # ...
```

---

### 4. Use Concurrency Groups

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## Next Steps

After CI/CD setup:

1. ✅ Test workflows by creating pull request
2. ✅ Verify preview deployments work
3. ✅ Monitor first production deployment
4. ✅ Set up alerts and notifications
5. ✅ Review deployment logs regularly

---

## Related Documentation

- [Frontend Deployment](./frontend-deployment.md) - Manual deployment
- [Prerequisites](./prerequisites.md) - Required software
- [Database Setup](./database-setup.md) - Database configuration

---

**End of CI/CD Pipeline Documentation**
