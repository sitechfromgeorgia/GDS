# GitHub Actions CI/CD Workflows

This directory contains the CI/CD pipeline workflows for the Georgian Distribution Management System frontend.

## Workflows Overview

### 1. CI Workflow (`ci.yml`)

**Trigger:** Pull requests and pushes to `main` and `develop` branches

**Purpose:** Continuous Integration - runs code quality checks, tests, and builds

**Jobs:**
- **Install Dependencies**: Caches and installs npm packages
- **Lint**: Runs ESLint and Prettier checks
- **Type Check**: Verifies TypeScript types
- **Test**: Runs unit and integration tests with coverage
- **E2E Test**: Runs Playwright end-to-end tests
- **Build**: Builds the Next.js application
- **Security**: Runs npm audit and security checks

**Artifacts:**
- Coverage reports (uploaded to Codecov)
- Playwright test reports
- Test videos (on failure)
- Next.js build artifacts

**Concurrency:** Cancels previous runs when new commits are pushed

---

### 2. Production Deployment (`deploy-production.yml`)

**Trigger:** Pushes to `main` branch, manual workflow dispatch

**Purpose:** Deploy application to Vercel production environment

**Jobs:**
- **Pre-deployment Checks**: Runs linting, type checking, tests, and build
- **Deploy Production**: Deploys to Vercel production
- **Post-deployment Checks**: Health checks and Lighthouse audit
- **Notify Deployment**: Sends Slack notifications
- **Rollback on Failure**: Automatically rolls back if deployment fails

**Environment:** `production`

**Concurrency:** Prevents concurrent production deployments

**Features:**
- Skip tests option via manual trigger
- Automatic rollback on failure
- Lighthouse performance audit
- Deployment summary in GitHub Actions

---

### 3. Preview Deployment (`deploy-preview.yml`)

**Trigger:** Pull requests to `main` and `develop` branches

**Purpose:** Deploy preview environments for pull requests

**Jobs:**
- **Quick Validation**: Runs lint and type check
- **Deploy Preview**: Deploys preview to Vercel
- **Visual Regression**: Runs E2E tests on preview
- **Lighthouse Audit**: Performance audit on preview
- **Bundle Analysis**: Analyzes bundle size
- **Cleanup Old Previews**: Removes old preview deployments

**Environment:** `preview-pr-{number}`

**Concurrency:** Cancels previous preview deployments for same PR

**Features:**
- Automatic PR comments with preview URL and quick links
- Visual regression testing
- Bundle size analysis
- Lighthouse performance scores
- Cleanup of old preview deployments (keeps last 3)

---

### 4. Scheduled Cleanup (`cron-cleanup.yml`)

**Trigger:** Daily at 2:00 AM UTC, manual workflow dispatch

**Purpose:** Cleanup expired data and stale resources

**Jobs:**
- **Cleanup Expired Carts**: Removes cart items older than 7 days
- **Cleanup Expired Sessions**: Signs out inactive users (30+ days)
- **Cleanup Test Data**: Removes test users and old cancelled orders
- **Cleanup Stale Deployments**: Removes Vercel preview deployments older than 7 days
- **Cleanup Old Workflow Runs**: Removes workflow runs older than 30 days
- **Cleanup Old Artifacts**: Removes artifacts older than 7 days
- **Cleanup Summary**: Creates summary and sends notifications

**Manual Trigger Options:**
- `all`: Run all cleanup jobs
- `expired-sessions`: Cleanup only expired sessions
- `old-carts`: Cleanup only old cart items
- `stale-deployments`: Cleanup only preview deployments
- `test-data`: Cleanup only test data

**Notifications:** Sends Slack notifications with cleanup summary

---

## Required GitHub Secrets

### Vercel Deployment
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for cleanup jobs)

### Optional Services
- `TURBO_TOKEN`: Turborepo remote cache token
- `TURBO_TEAM`: Turborepo team name
- `CODECOV_TOKEN`: Codecov upload token
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

---

## Workflow Features

### Caching Strategy
- **npm packages**: Cached using `actions/cache` with package-lock.json hash
- **Next.js build**: Cached to speed up subsequent builds
- **Playwright browsers**: Installed only when needed for E2E tests

### Parallelization
- Jobs run in parallel where dependencies allow
- Lint, type-check, and test jobs run concurrently
- CI checks complete faster with parallel execution

### Artifact Management
- Test reports retained for 7 days
- Build artifacts retained for 1 day
- Automatic cleanup of old artifacts

### Error Handling
- Graceful degradation for optional checks
- Automatic rollback on production deployment failure
- Retry logic for flaky tests (2 retries in CI)

### Performance Optimization
- Concurrency controls prevent redundant runs
- Incremental builds with Turbo cache
- Selective path filters to skip unnecessary runs

---

## Usage Examples

### Running CI Manually

```bash
# Trigger CI workflow manually
gh workflow run ci.yml
```

### Deploying to Production

```bash
# Deploy without running tests (use with caution!)
gh workflow run deploy-production.yml -f skip-tests=true
```

### Triggering Cleanup

```bash
# Run all cleanup jobs
gh workflow run cron-cleanup.yml -f cleanup-type=all

# Run only cart cleanup
gh workflow run cron-cleanup.yml -f cleanup-type=old-carts
```

### Viewing Workflow Status

```bash
# List recent workflow runs
gh run list

# View specific workflow run
gh run view <run-id>

# Watch workflow run in real-time
gh run watch <run-id>
```

---

## Monitoring and Notifications

### GitHub Actions
- View all workflow runs in the Actions tab
- Check job summaries for quick status overview
- Download artifacts for detailed analysis

### Slack Notifications
Configure `SLACK_WEBHOOK_URL` secret to receive:
- Production deployment notifications
- Deployment failure alerts
- Scheduled cleanup summaries

### Codecov Integration
Configure `CODECOV_TOKEN` secret to track:
- Test coverage trends
- Coverage changes per PR
- Uncovered lines

---

## Best Practices

### Before Merging PRs
1. Ensure all CI checks pass
2. Review preview deployment
3. Check Lighthouse scores
4. Verify bundle size changes

### Production Deployments
1. Merge to `main` only after thorough testing
2. Monitor post-deployment health checks
3. Verify Lighthouse performance audit
4. Check deployment notifications

### Maintenance
1. Review cleanup job results weekly
2. Monitor artifact storage usage
3. Update workflow configurations as needed
4. Keep secrets up to date

---

## Troubleshooting

### CI Failures

**Lint Errors:**
```bash
cd frontend
npm run lint:fix
npm run format
```

**Type Errors:**
```bash
cd frontend
npm run type-check
```

**Test Failures:**
```bash
cd frontend
npm run test:run
npm run test:e2e
```

### Deployment Failures

**Vercel Issues:**
1. Check Vercel token validity
2. Verify environment variables
3. Review build logs in workflow run

**Rollback Required:**
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Cleanup Issues

**Database Cleanup Failures:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Check Supabase connection
3. Review cleanup job logs

---

## CI/CD Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Pull Request                             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │     Lint     │ │  Type Check  │ │     Test     │
        └──────────────┘ └──────────────┘ └──────────────┘
                │                │                │
                └────────────────┼────────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │    Build     │
                        └──────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │  E2E Tests   │
                        └──────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │    Deploy    │ │  Lighthouse  │ │    Bundle    │
        │   Preview    │ │    Audit     │ │   Analysis   │
        └──────────────┘ └──────────────┘ └──────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │ PR Comment   │
                        │ with Preview │
                        └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Merge to Main                               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │ Pre-deploy   │
                        │    Checks    │
                        └──────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │    Deploy    │
                        │  Production  │
                        └──────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Health     │ │  Lighthouse  │ │    Notify    │
        │    Check     │ │    Audit     │ │    Slack     │
        └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Daily at 2:00 AM UTC                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Cleanup    │ │   Cleanup    │ │   Cleanup    │
        │    Carts     │ │   Sessions   │ │  Test Data   │
        └──────────────┘ └──────────────┘ └──────────────┘
                │                │                │
                └────────────────┼────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Cleanup    │ │   Cleanup    │ │   Cleanup    │
        │ Deployments  │ │  Workflows   │ │  Artifacts   │
        └──────────────┘ └──────────────┘ └──────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │   Summary    │
                        │   & Notify   │
                        └──────────────┘
```

---

## Contributing

When adding or modifying workflows:

1. **Test locally first** using `act` (GitHub Actions local runner)
2. **Document changes** in this README
3. **Add comments** in YAML files for complex logic
4. **Use secrets** for sensitive data (never hardcode)
5. **Follow naming conventions** for jobs and steps
6. **Add error handling** for critical operations
7. **Update caching strategies** if dependencies change

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Playwright Documentation](https://playwright.dev)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated:** 2025-01-05
**Maintainer:** Development Team
