# Vercel Advanced Patterns

## Table of Contents
1. Build Optimization and Caching
2. Monorepo Deployments with Turborepo
3. Edge Functions and Middleware
4. Custom Domains and DNS
5. Advanced Environment Management
6. Framework-Specific Optimizations
7. Troubleshooting and Debugging

---

## 1. Build Optimization and Caching

### Dependency Caching

**Package Manager Cache**:
```yaml
# .github/workflows/vercel-optimized.yml
- name: Setup Node.js with cache
  uses: actions/setup-node@v3
  with:
    node-version: '20'
    cache: 'npm'  # or 'yarn', 'pnpm'

- name: Install dependencies
  run: npm ci  # Uses lockfile for faster, deterministic installs
```

**Build Output Caching**:
```yaml
- name: Cache Next.js build
  uses: actions/cache@v3
  with:
    path: |
      .next/cache
      node_modules/.cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-
```

### Build Time Reduction

**Parallel Builds**:
```yaml
strategy:
  matrix:
    node-version: [18, 20]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build with Node ${{ matrix.node-version }}
        run: npm run build
```

**Incremental Static Regeneration (ISR)**:
```javascript
// Next.js: pages/blog/[slug].js
export async function getStaticProps({ params }) {
  return {
    props: { post },
    revalidate: 60  // Regenerate every 60 seconds
  }
}
```

---

## 2. Monorepo Deployments with Turborepo

### Project Structure
```
my-monorepo/
├── apps/
│   ├── web/          # Frontend app
│   ├── docs/         # Documentation site
│   └── admin/        # Admin dashboard
├── packages/
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared configs
│   └── utils/        # Shared utilities
└── turbo.json        # Turborepo configuration
```

### Turborepo Configuration

**turbo.json**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### Deploy Specific Apps

**Workflow for Affected Apps Only**:
```yaml
# .github/workflows/deploy-monorepo.yml
name: Deploy Monorepo Apps

on:
  push:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.filter.outputs.web }}
      docs: ${{ steps.filter.outputs.docs }}
      admin: ${{ steps.filter.outputs.admin }}
    steps:
      - uses: actions/checkout@v3
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/**'
            docs:
              - 'apps/docs/**'
            admin:
              - 'apps/admin/**'
              - 'packages/**'

  deploy-web:
    needs: changes
    if: needs.changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Web App
        run: |
          cd apps/web
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-docs:
    needs: changes
    if: needs.changes.outputs.docs == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Docs
        run: |
          cd apps/docs
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Vercel Configuration for Monorepo** (`vercel.json`):
```json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=web",
  "outputDirectory": ".next",
  "installCommand": "npm install --prefix=../../",
  "framework": "nextjs"
}
```

---

## 3. Edge Functions and Middleware

### Edge Middleware for Authentication

**middleware.ts**:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  
  // Protect routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

### Edge Functions for Dynamic Content

**api/edge/[slug].ts**:
```typescript
export const config = {
  runtime: 'edge'
}

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const slug = url.pathname.split('/').pop()
  
  // Fetch from external API at edge
  const data = await fetch(`https://api.example.com/posts/${slug}`)
  const post = await data.json()
  
  return new Response(JSON.stringify(post), {
    headers: { 'content-type': 'application/json' }
  })
}
```

---

## 4. Custom Domains and DNS

### Adding Custom Domain via CLI

```bash
# Add domain
vercel domains add example.com

# Add subdomain
vercel domains add api.example.com

# Verify domain ownership
vercel domains verify example.com

# List domains
vercel domains ls

# Remove domain
vercel domains rm example.com
```

### DNS Configuration

**For Root Domain**:
```
Type: A
Name: @
Value: 76.76.21.21

Type: AAAA
Name: @
Value: 2606:4700:d0::a29f:c001
```

**For Subdomain**:
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

### SSL/TLS Configuration

Vercel automatically provisions SSL certificates via Let's Encrypt. No manual configuration needed.

**Force HTTPS**:
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

---

## 5. Advanced Environment Management

### Environment Variable Precedence

1. Deployment-specific environment variables
2. Branch-specific environment variables  
3. Project-wide environment variables
4. System environment variables

### Per-Branch Configuration

**Development Branch**:
```bash
vercel env add API_URL development
# Set value: https://dev-api.example.com
```

**Preview Branches**:
```bash
vercel env add API_URL preview
# Set value: https://staging-api.example.com
```

**Production**:
```bash
vercel env add API_URL production
# Set value: https://api.example.com
```

### Encrypted Environment Variables

Vercel automatically encrypts all environment variables at rest and in transit.

**Sensitive Variables Pattern**:
```bash
# Set via CLI (more secure)
vercel env add DATABASE_URL production

# Pull environment for local development
vercel env pull .env.local
```

### Dynamic Environment Variables

**Using `next.config.js`**:
```javascript
module.exports = {
  env: {
    API_URL: process.env.API_URL,
    BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA,
    DEPLOYMENT_URL: process.env.VERCEL_URL
  }
}
```

---

## 6. Framework-Specific Optimizations

### Next.js Optimizations

**Image Optimization**:
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
}
```

**Bundle Analysis**:
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // your config
})
```

```bash
# Run bundle analysis
ANALYZE=true npm run build
```

### React/Vite Optimizations

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-library': ['@mui/material', '@emotion/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### SvelteKit Optimizations

**svelte.config.js**:
```javascript
import adapter from '@sveltejs/adapter-vercel'

export default {
  kit: {
    adapter: adapter({
      runtime: 'edge',
      regions: ['iad1', 'sfo1'],  // Deploy to specific regions
      split: true  // Split functions for better performance
    })
  }
}
```

---

## 7. Troubleshooting and Debugging

### Common Build Errors

**Error: Out of Memory**
```json
// vercel.json - Increase memory limit
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb",
        "memory": 3008
      }
    }
  ]
}
```

**Error: Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify lockfile is committed
git add package-lock.json
git commit -m "Update lockfile"
```

**Error: Build Timeout**
```json
// vercel.json - Increase timeout
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

### Debugging Production Issues

**Enable Source Maps**:
```javascript
// next.config.js
module.exports = {
  productionBrowserSourceMaps: true
}
```

**Verbose Logging**:
```bash
# View deployment logs
vercel logs [deployment-url]

# Follow logs in real-time
vercel logs [deployment-url] --follow
```

**Inspect Deployment**:
```bash
# Get detailed deployment info
vercel inspect [deployment-url]

# Check build logs
vercel logs [deployment-url] --type=build
```

### Performance Debugging

**Lighthouse CI Integration**:
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://example.com
      https://example.com/about
    uploadArtifacts: true
```

**Web Vitals Monitoring**:
```javascript
// pages/_app.js
export function reportWebVitals(metric) {
  // Send to analytics service
  console.log(metric)
  
  // Send to Vercel Analytics
  if (metric.label === 'web-vital') {
    analytics.track(metric.name, metric.value)
  }
}
```

---

## Advanced Deployment Patterns

### Preview Deployments with Comments

**Automatic PR Comments**:
```yaml
# .github/workflows/preview-comment.yml
- name: Deploy Preview
  id: deploy
  run: |
    DEPLOYMENT_URL=$(vercel deploy --token=${{ secrets.VERCEL_TOKEN }})
    echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT

- name: Comment PR
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `🚀 Preview deployed: ${{ steps.deploy.outputs.url }}`
      })
```

### Deployment Protection

**Production Protection**:
```json
// vercel.json
{
  "github": {
    "enabled": true,
    "autoAlias": true,
    "silent": false
  }
}
```

**Branch Protection Rules** (in GitHub):
- Require status checks before merging
- Require review from CODEOWNERS
- Require linear history
- Include administrators

---

## Best Practices Summary

✅ **Performance**:
- Enable caching for dependencies and builds
- Use ISR for frequently updated content
- Optimize images with next/image
- Split bundles for faster initial loads
- Deploy to edge regions close to users

✅ **Security**:
- Never expose secrets in client-side code
- Use environment variables for sensitive data
- Enable HTTPS-only with HSTS headers
- Implement rate limiting for APIs
- Regularly rotate API tokens

✅ **Monitoring**:
- Enable Vercel Analytics
- Set up error tracking (Sentry)
- Monitor Web Vitals
- Create alerts for failed deployments
- Track deployment frequency and success rate

✅ **Development Workflow**:
- Use preview deployments for all PRs
- Test on preview before merging
- Enable automatic deployment cancellation for new commits
- Document deployment process in README
- Keep dependencies up to date

---

This reference covers advanced Vercel usage. For Railway advanced patterns, see `RAILWAY_ADVANCED.md`.