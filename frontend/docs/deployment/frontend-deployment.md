# Frontend Deployment

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05

---

## Overview

This document provides step-by-step instructions for deploying the Next.js frontend application to Vercel and other hosting platforms.

---

## Deployment Options

### Recommended: Vercel

**Why Vercel?**
- ✅ Built by Next.js creators
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments
- ✅ Generous free tier

### Alternative Platforms

- **Netlify**: Similar to Vercel, good Next.js support
- **Railway**: Full-stack platform with database hosting
- **AWS Amplify**: AWS-integrated deployment
- **Self-hosted**: Docker + Nginx + PM2

This guide focuses on **Vercel** deployment.

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Supabase project configured
- [ ] Application builds successfully locally
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Verify Local Build

```bash
cd frontend

# Install dependencies
npm install

# Run type check
npm run type-check
# or if not configured:
npx tsc --noEmit

# Run linter
npm run lint

# Build application
npm run build

# Test production build
npm run start

# Open http://localhost:3000 and verify
```

---

## Vercel Deployment

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your repositories

---

#### Step 2: Import Project

1. Click **Add New** > **Project**
2. Import your GitHub repository:
   ```
   Repository: your-username/distribution-management
   ```
3. Click **Import**

---

#### Step 3: Configure Project

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `frontend`

**Build Settings**:
```yaml
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

**Environment Variables**:
Click **Add** for each variable:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=Distribution Management System

# Optional
NEXT_PUBLIC_STORAGE_BUCKET=uploads
SESSION_DURATION=18000
```

**Important**: Add variables for ALL environments:
- ✅ Production
- ✅ Preview
- ✅ Development

---

#### Step 4: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build and deployment
3. Vercel will display deployment URL:
   ```
   https://your-app.vercel.app
   ```
4. Click URL to verify deployment

---

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel

# Login
vercel login

# Follow prompts to authenticate
```

---

#### Step 2: Configure Project

```bash
cd frontend

# Initialize Vercel project
vercel

# Answer prompts:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name? distribution-management
# Directory? ./
# Override settings? No
```

---

#### Step 3: Add Environment Variables

```bash
# Add production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter value when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Enter value when prompted

vercel env add NEXT_PUBLIC_APP_URL production
# Enter value when prompted

# Repeat for preview and development environments
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_URL development
```

---

#### Step 4: Deploy

```bash
# Deploy to production
vercel --prod

# Deploy will run:
# 1. Install dependencies
# 2. Build application
# 3. Upload to Vercel
# 4. Return deployment URL
```

---

## Post-Deployment Configuration

### 1. Add Custom Domain (Optional)

#### Via Vercel Dashboard

1. Go to **Project Settings** > **Domains**
2. Click **Add Domain**
3. Enter your domain: `your-domain.com`
4. Follow DNS configuration instructions:

```
Type: A Record
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Wait for DNS propagation (5-60 minutes)
6. Vercel will automatically provision SSL certificate

---

### 2. Update Supabase Redirect URLs

Add production URL to Supabase:

1. Go to Supabase Dashboard
2. **Authentication** > **URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://your-domain.com/**
   ```
4. Update **Site URL**:
   ```
   https://your-app.vercel.app
   ```

---

### 3. Configure Vercel Project Settings

#### General Settings

**Location**: **Project Settings** > **General**

```yaml
Node.js Version: 18.x (or latest LTS)
Framework: Next.js
Root Directory: frontend
```

---

#### Build & Development Settings

**Location**: **Project Settings** > **Build & Development Settings**

```yaml
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev

Auto-assign Custom Production Domains: Yes
Include source files: No
Automatically expose System Environment Variables: Yes
```

---

#### Environment Variables

**Location**: **Project Settings** > **Environment Variables**

Verify all variables are set for all environments:

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | ✅ | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | ✅ | ✅ |
| NEXT_PUBLIC_APP_URL | ✅ | ✅ | ✅ |

---

#### Git Integration

**Location**: **Project Settings** > **Git**

```yaml
Production Branch: main
Branch Deployments: Yes
Preview Deployments: Yes
Automatic Preview Deployments: Yes
```

---

### 4. Enable Analytics (Optional)

**Location**: **Analytics** tab

Enable Vercel Analytics:
1. Go to **Analytics**
2. Click **Enable Analytics**
3. Free tier includes:
   - Page views
   - Top pages
   - Top referrers
   - Countries
   - Devices

---

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

**Production Deployment**:
```bash
# Push to main branch
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production URL
```

**Preview Deployment**:
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and push
git push origin feature/new-feature

# Vercel creates preview deployment:
# https://your-app-git-feature-new-feature-your-username.vercel.app
```

---

### Deployment Status

Check deployment status:

**Via Dashboard**:
1. Go to **Deployments** tab
2. View status: Building → Ready
3. Click deployment to view logs

**Via CLI**:
```bash
# List deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

---

## Deployment Verification

### 1. Smoke Tests

After deployment, verify:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Expected: {"status": "ok"}
```

**Manual verification**:
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard accessible
- [ ] API calls successful
- [ ] Real-time updates working
- [ ] Images loading
- [ ] No console errors

---

### 2. Performance Check

Use Lighthouse or PageSpeed Insights:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-app.vercel.app --view

# Target metrics:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
# SEO: > 90
```

---

### 3. Error Monitoring

Check Vercel logs for errors:

1. Go to **Project** > **Logs**
2. Filter by:
   - Status: 4xx, 5xx
   - Time range: Last 24 hours
3. Investigate any errors

---

## Rollback Strategy

### Rollback to Previous Deployment

**Via Dashboard**:
1. Go to **Deployments**
2. Find previous working deployment
3. Click **︙** (three dots)
4. Click **Promote to Production**

**Via CLI**:
```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote [deployment-url]
```

---

### Rollback via Git

```bash
# Find commit hash
git log --oneline

# Revert to previous commit
git revert [commit-hash]

# Push to trigger deployment
git push origin main
```

---

## Optimization Tips

### 1. Enable Image Optimization

Next.js Image component uses Vercel's image optimization:

```typescript
// Already configured in next.config.js
module.exports = {
  images: {
    domains: ['your-project-id.supabase.co'],
    formats: ['image/avif', 'image/webp']
  }
}
```

---

### 2. Enable Edge Functions

For better performance, use Edge Runtime:

```typescript
// app/api/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  return Response.json({ message: 'Hello from Edge' })
}
```

---

### 3. Enable Caching

Configure cache headers:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate'
          }
        ]
      }
    ]
  }
}
```

---

### 4. Reduce Bundle Size

```bash
# Analyze bundle
npm install -g @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // ... existing config
})

# Run analysis
ANALYZE=true npm run build
```

---

## Alternative Platforms

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
cd frontend
netlify init

# Deploy
netlify deploy --prod
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Self-Hosted with Docker

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

**Build and run**:
```bash
# Build image
docker build -t distribution-app .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  distribution-app
```

---

## Troubleshooting

### Issue: Build fails with "Module not found"

**Cause**: Missing dependency or incorrect import path

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify build locally
npm run build
```

---

### Issue: Environment variables not working

**Symptoms**: `process.env.NEXT_PUBLIC_SUPABASE_URL` is undefined

**Solutions**:

1. **Check variable prefix**:
```bash
# ✅ Correct (accessible in browser)
NEXT_PUBLIC_SUPABASE_URL=...

# ❌ Wrong (server-only)
SUPABASE_URL=...
```

2. **Redeploy after adding variables**:
```bash
# Variables require new deployment
vercel --prod
```

3. **Check environment scope**:
   - Verify variable is set for **Production** environment

---

### Issue: 404 on dynamic routes

**Cause**: Static export configured incorrectly

**Solution**:
```javascript
// next.config.js
module.exports = {
  // Ensure output is NOT set to 'export'
  // output: 'export', // ❌ Remove this
}
```

---

### Issue: Deployment succeeds but shows blank page

**Symptoms**: White screen, no errors in console

**Solutions**:

1. **Check browser console**: Look for errors
2. **Check Vercel logs**: Look for runtime errors
3. **Verify Supabase URL**: Ensure URL is correct
4. **Check CORS**: Verify Vercel domain added to Supabase

---

## Security Checklist

Before going to production:

- [ ] All secrets use server-side only variables (no NEXT_PUBLIC_ prefix)
- [ ] SUPABASE_SERVICE_ROLE_KEY not exposed to client
- [ ] CORS configured correctly in Supabase
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Content Security Policy configured
- [ ] Authentication working correctly
- [ ] Row Level Security policies tested

---

## Monitoring Setup

### 1. Vercel Monitoring

**Built-in features**:
- Request logs
- Error tracking
- Performance metrics
- Bandwidth usage

---

### 2. External Monitoring (Optional)

**Sentry** (Error tracking):
```bash
npm install @sentry/nextjs

# Configure in next.config.js
```

**LogRocket** (Session replay):
```bash
npm install logrocket

# Initialize in _app.tsx
```

---

## Next Steps

After deployment:

1. ✅ Verify application functionality
2. ✅ Run performance tests
3. ✅ Set up monitoring and alerts
4. ✅ Configure CI/CD pipeline
5. ✅ Proceed to [CI/CD Pipeline](./ci-cd.md)

---

## Related Documentation

- [Prerequisites](./prerequisites.md) - Required software and accounts
- [Environment Setup](./environment-setup.md) - Configure environment variables
- [Database Setup](./database-setup.md) - Initialize database
- [CI/CD Pipeline](./ci-cd.md) - Automated deployment

---

**End of Frontend Deployment Documentation**
