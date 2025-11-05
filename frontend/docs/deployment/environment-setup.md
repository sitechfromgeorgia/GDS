# Environment Setup

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05

---

## Overview

This document provides step-by-step instructions for configuring environment variables for the Distribution Management System.

---

## Environment Files

### File Structure

```
frontend/
├── .env.local          # Local development (ignored by Git)
├── .env.example        # Template with placeholder values
├── .env.production     # Production variables (optional)
└── .env.test           # Test environment (optional)
```

### File Priority

Next.js loads environment variables in this order:
1. `.env.local` (highest priority, local overrides)
2. `.env.[NODE_ENV]` (`.env.development`, `.env.production`, `.env.test`)
3. `.env` (default values)

---

## Step 1: Create .env.local

Copy the example file:

```bash
# From frontend directory
cd frontend

# Copy example to .env.local
cp .env.example .env.local

# Open in editor
code .env.local  # VS Code
# or
nano .env.local  # Terminal editor
```

---

## Step 2: Configure Supabase Variables

### NEXT_PUBLIC_SUPABASE_URL

**Description**: Your Supabase project URL

**How to get**:
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Copy **Project URL**

**Format**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
```

**Example**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
```

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Description**: Your Supabase anonymous key (public-safe)

**How to get**:
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Copy **anon public** key

**Format**:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example**:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreG1hY2ZzbHR6aGJudW5vZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzNjM2MTMsImV4cCI6MjAzMDkzOTYxM30.JjABqZY7A-0wOuTWkFhAzbFJQF8dJ9oSWzjCzR5nQXA
```

**Security Note**: This key is safe to expose in client-side code. Row Level Security (RLS) policies protect your data.

---

### SUPABASE_SERVICE_ROLE_KEY (Optional)

**Description**: Service role key for admin operations (NEVER expose to client)

**How to get**:
1. Go to **Settings** > **API**
2. Copy **service_role secret** key

**Format**:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage**: Server-side only (API routes, server actions)

**Security Warning**:
- ⚠️ NEVER use in client-side code
- ⚠️ NEVER commit to Git
- ⚠️ Bypasses Row Level Security
- ✅ Use only in server components/actions

---

## Step 3: Configure Application Variables

### NODE_ENV

**Description**: Application environment

**Values**:
```bash
NODE_ENV=development  # Local development
NODE_ENV=production   # Production deployment
NODE_ENV=test         # Testing environment
```

**Default**: Automatically set by Next.js

---

### NEXT_PUBLIC_APP_URL

**Description**: Your application's base URL

**Development**:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production**:
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Usage**: Constructing absolute URLs, redirects, API callbacks

---

### NEXT_PUBLIC_APP_NAME

**Description**: Application name for UI display

```bash
NEXT_PUBLIC_APP_NAME="Distribution Management System"
```

---

## Step 4: Configure Authentication

### JWT_SECRET

**Description**: Secret key for JWT signing (optional, Supabase handles this)

**Generation**:
```bash
# Generate random secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Format**:
```bash
JWT_SECRET=your-random-secret-key-here
```

**Note**: Only needed if implementing custom JWT logic

---

### SESSION_DURATION

**Description**: Session duration in seconds

```bash
SESSION_DURATION=18000  # 5 hours (default)
SESSION_DURATION=2592000  # 30 days (remember me)
```

---

## Step 5: Configure Email (Optional)

If using custom email provider instead of Supabase Auth:

### SMTP_HOST

```bash
SMTP_HOST=smtp.gmail.com
```

### SMTP_PORT

```bash
SMTP_PORT=587
```

### SMTP_USER

```bash
SMTP_USER=your-email@gmail.com
```

### SMTP_PASSWORD

```bash
SMTP_PASSWORD=your-app-specific-password
```

**Note**: For Gmail, generate App Password in Google Account settings

---

## Step 6: Configure Storage (Optional)

### NEXT_PUBLIC_STORAGE_BUCKET

**Description**: Supabase storage bucket name

```bash
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**How to create bucket**:
1. Go to Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Name it `uploads` and set privacy settings

---

## Complete .env.local Example

```bash
# =================================================================
# Distribution Management System - Environment Configuration
# =================================================================
# IMPORTANT: Never commit this file to version control
# Copy from .env.example and fill in your actual values
# =================================================================

# -----------------------------
# Supabase Configuration
# -----------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (NEVER expose to client - server-side only)
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# -----------------------------
# Application Configuration
# -----------------------------
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Distribution Management System"

# -----------------------------
# Authentication
# -----------------------------
SESSION_DURATION=18000  # 5 hours in seconds

# -----------------------------
# Storage (Optional)
# -----------------------------
NEXT_PUBLIC_STORAGE_BUCKET=uploads

# -----------------------------
# Email Configuration (Optional)
# -----------------------------
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# -----------------------------
# Feature Flags (Optional)
# -----------------------------
# NEXT_PUBLIC_ENABLE_ANALYTICS=true
# NEXT_PUBLIC_ENABLE_REALTIME=true
# NEXT_PUBLIC_DEBUG_MODE=false

# -----------------------------
# API Configuration (Optional)
# -----------------------------
# API_RATE_LIMIT=100  # Requests per minute
# API_TIMEOUT=30000   # 30 seconds
```

---

## Environment Variable Naming Conventions

### NEXT_PUBLIC_ Prefix

Variables with `NEXT_PUBLIC_` prefix are:
- ✅ Exposed to the browser
- ✅ Accessible in client components
- ✅ Bundled in production build
- ⚠️ Should NOT contain secrets

**Example**:
```typescript
// Client component can access
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### No Prefix

Variables without prefix are:
- ✅ Server-side only
- ✅ Accessible in API routes and server components
- ✅ NOT exposed to browser
- ✅ Safe for secrets

**Example**:
```typescript
// Server action can access
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
```

---

## Validation

### Create Validation Script

Create `scripts/validate-env.js`:

```javascript
#!/usr/bin/env node

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL'
]

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_STORAGE_BUCKET',
  'SESSION_DURATION'
]

console.log('🔍 Validating environment variables...\n')

let hasErrors = false

// Check required variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required variable: ${varName}`)
    hasErrors = true
  } else {
    console.log(`✅ ${varName}`)
  }
})

// Check optional variables
console.log('\nOptional variables:')
optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}`)
  } else {
    console.log(`⚠️  ${varName} (not set)`)
  }
})

if (hasErrors) {
  console.error('\n❌ Environment validation failed!')
  console.error('Please check your .env.local file\n')
  process.exit(1)
}

console.log('\n✅ Environment validation passed!\n')
```

### Run Validation

```bash
# Add to package.json scripts
{
  "scripts": {
    "validate:env": "node scripts/validate-env.js"
  }
}

# Run validation
npm run validate:env
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore should contain:
.env.local
.env.*.local
.env.production
.env.development
```

Verify:
```bash
# Check if .env.local is ignored
git status
# Should NOT show .env.local

# If accidentally added:
git rm --cached .env.local
```

---

### 2. Rotate Keys Regularly

Rotate Supabase keys every 3-6 months:

1. Generate new keys in Supabase Dashboard
2. Update production environment variables
3. Deploy new version
4. Revoke old keys after verification

---

### 3. Use Different Keys per Environment

```bash
# Development
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co

# Production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
```

**Never use production keys in development!**

---

### 4. Secure Storage in CI/CD

For GitHub Actions, Vercel, or other CI/CD:

**GitHub Secrets**:
1. Go to Repository **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Add each environment variable

**Vercel Environment Variables**:
1. Go to Project **Settings** > **Environment Variables**
2. Add variables per environment (Development, Preview, Production)

---

## Environment-Specific Configurations

### Development (.env.local)

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev_anon_key...
NEXT_PUBLIC_DEBUG_MODE=true
```

---

### Production (.env.production)

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key...
NEXT_PUBLIC_DEBUG_MODE=false
```

---

### Testing (.env.test)

```bash
NODE_ENV=test
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key...
```

---

## Troubleshooting

### Issue: Environment variables not loading

**Symptoms**:
```
Error: NEXT_PUBLIC_SUPABASE_URL is undefined
```

**Solutions**:

1. **Restart dev server**:
```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
```

2. **Check file name**:
```bash
# Must be exactly .env.local (not .env.local.txt)
ls -la .env.local
```

3. **Check syntax**:
```bash
# No spaces around =
NEXT_PUBLIC_SUPABASE_URL=https://...  # ✅ Correct
NEXT_PUBLIC_SUPABASE_URL = https://...  # ❌ Wrong
```

4. **Check prefix**:
```bash
# Client-side variables need NEXT_PUBLIC_ prefix
NEXT_PUBLIC_APP_URL=...  # ✅ Accessible in browser
APP_URL=...              # ❌ Server-side only
```

---

### Issue: Values not updating

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### Issue: Production env vars not working

**For Vercel**:
1. Check **Project Settings** > **Environment Variables**
2. Ensure variables are set for **Production** environment
3. Redeploy after changing variables

**For other platforms**:
- Check platform-specific environment configuration
- Restart application after changes

---

## Next Steps

After configuring environment variables:

1. ✅ Verify configuration with validation script
2. ✅ Proceed to [Database Setup](./database-setup.md)
3. Run database migrations
4. Seed initial data
5. Start development server

---

## Related Documentation

- [Prerequisites](./prerequisites.md) - Required software and accounts
- [Database Setup](./database-setup.md) - Initialize database
- [Supabase Configuration](./supabase-config.md) - Configure Supabase project
- [Frontend Deployment](./frontend-deployment.md) - Deploy to Vercel

---

**End of Environment Setup Documentation**
