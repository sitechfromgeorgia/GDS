# Environment Migration Guide

## Overview

This guide provides step-by-step instructions for switching between development and production environments in the Georgian Distribution System. The system uses a dual-environment architecture that supports both official Supabase (development) and VPS-hosted Supabase (production).

## Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [Environment Variables](#environment-variables)
3. [Switching from Development to Production](#switching-from-development-to-production)
4. [Switching from Production to Development](#switching-from-production-to-development)
5. [Verification Checklist](#verification-checklist)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Understanding the Architecture

### Development Environment
- **Database**: Official Supabase (https://*.supabase.co)
- **URL**: http://localhost:3000
- **Environment**: development
- **Features**: Debug mode enabled, mock data available, development tools active

### Production Environment
- **Database**: VPS-hosted Supabase (https://data.greenland77.ge)
- **URL**: https://greenland77.ge
- **Environment**: production
- **Features**: Optimized performance, error monitoring, security hardening

## Environment Variables

### Core Configuration

| Variable | Development | Production | Required |
|----------|-------------|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://data.greenland77.ge` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production service key | ✅ |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://greenland77.ge` | ✅ |
| `NEXT_PUBLIC_ENVIRONMENT` | `development` | `production` | ✅ |

### Optional Configuration

| Variable | Development Default | Production Default | Purpose |
|----------|-------------------|-------------------|---------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` | `true` | Analytics dashboard |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | `true` | `true` | Demo functionality |
| `NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING` | `true` | `true` | Performance tracking |
| `NEXT_PUBLIC_DEBUG_MODE` | `true` | `false` | Debug output |
| `NEXT_PUBLIC_MOCK_DATA` | `false` | `false` | Use mock data |
| `NEXT_PUBLIC_ENABLE_SW` | `false` | `true` | Service worker |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Production Sentry DSN | Error tracking |

## Switching from Development to Production

### Step 1: Backup Current Configuration

```bash
# Create backup of current environment
cp .env.local .env.local.backup
```

### Step 2: Update Environment Variables

1. **Copy the production template:**
   ```bash
   cp .env.production .env.local
   ```

2. **Update production credentials:**
   ```bash
   # Edit .env.local with production values
   nano .env.local
   ```

3. **Ensure these variables are set:**
   ```env
   NEXT_PUBLIC_ENVIRONMENT=production
   NEXT_PUBLIC_APP_URL=https://greenland77.ge
   NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
   ```

### Step 3: Update Next.js Configuration

1. **Verify CORS settings in `next.config.ts`:**
   - Production origins should include `https://greenland77.ge`
   - Development origins should include `http://localhost:3000`

2. **Update image domains if needed:**
   ```typescript
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: 'data.greenland77.ge',
         port: '',
         pathname: '/storage/v1/object/public/**',
       },
     ],
   }
   ```

### Step 4: Test Configuration

1. **Validate environment variables:**
   ```bash
   npm run type-check
   ```

2. **Start development server to test:**
   ```bash
   npm run dev
   ```

3. **Test critical functionality:**
   - Authentication flow
   - Database connections
   - API endpoints
   - Image loading

## Switching from Production to Development

### Step 1: Backup Current Configuration

```bash
# Create backup of current environment
cp .env.local .env.production.backup
```

### Step 2: Restore Development Configuration

1. **Restore development environment:**
   ```bash
   cp .env.local.backup .env.local
   ```

2. **Or use the example template:**
   ```bash
   cp .env.example .env.local
   # Then fill in your development credentials
   ```

### Step 3: Update Development Variables

1. **Set development environment:**
   ```env
   NEXT_PUBLIC_ENVIRONMENT=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_development_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_development_service_key
   ```

2. **Enable debug features (optional):**
   ```env
   NEXT_PUBLIC_DEBUG_MODE=true
   NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
   ```

### Step 4: Verify Development Setup

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test development features:**
   - Check browser console for debug output
   - Verify Supabase connection
   - Test development-specific features

## Verification Checklist

### Pre-Deployment Verification

- [ ] Environment variables are correctly set
- [ ] Database connections are working
- [ ] Authentication flow functions properly
- [ ] API endpoints respond correctly
- [ ] Image domains are configured
- [ ] CORS settings are appropriate
- [ ] Error tracking is configured (production)
- [ ] Performance monitoring is active

### Post-Deployment Verification

- [ ] Application loads successfully
- [ ] User authentication works
- [ ] Database queries execute properly
- [ ] File uploads/downloads function
- [ ] API endpoints are accessible
- [ ] Error monitoring captures issues
- [ ] Performance metrics are being collected

### Health Check Commands

```bash
# Check environment configuration
npm run type-check

# Test database connection
npm run test:db

# Verify build process
npm run build

# Start production preview
npm run start
```

## Rollback Procedures

### Emergency Rollback

If issues occur after deployment:

1. **Immediate rollback:**
   ```bash
   # Restore previous environment file
   cp .env.production.backup .env.local
   
   # Or restore from example
   cp .env.example .env.local
   ```

2. **Restart application:**
   ```bash
   npm run dev
   ```

3. **Verify functionality:**
   - Check browser console for errors
   - Test critical user flows
   - Monitor error logs

### Planned Rollback

For scheduled maintenance:

1. **Backup current state:**
   ```bash
   cp .env.local .env.pre-rollback.backup
   ```

2. **Perform rollback:**
   ```bash
   cp .env.production.backup .env.local
   ```

3. **Update deployment:**
   ```bash
   npm run build
   npm run start
   ```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Symptoms:** 
- Application using wrong database
- Authentication failures
- Configuration errors

**Solutions:**
1. Check file naming (`.env.local` for dev, `.env.production` for prod)
2. Verify variable names match exactly
3. Restart development server after changes
4. Clear Next.js cache: `rm -rf .next`

#### 2. Database Connection Issues

**Symptoms:**
- "Invalid API key" errors
- Authentication failures
- Database query timeouts

**Solutions:**
1. Verify Supabase URL and keys
2. Check network connectivity
3. Ensure service role key has proper permissions
4. Test connection manually

#### 3. CORS Errors

**Symptoms:**
- Cross-origin request blocked
- API calls failing in browser
- Preflight request failures

**Solutions:**
1. Check `next.config.ts` CORS configuration
2. Verify allowed origins match deployment URL
3. Ensure API routes have proper CORS headers
4. Test with different browsers

#### 4. Image Loading Issues

**Symptoms:**
- Broken images in UI
- 404 errors for image assets
- Supabase storage access denied

**Solutions:**
1. Update `next.config.ts` image domains
2. Verify Supabase storage permissions
3. Check image URLs in database
4. Test image accessibility directly

### Diagnostic Commands

```bash
# Check current environment
node -e "console.log(process.env.NEXT_PUBLIC_ENVIRONMENT)"

# Validate environment variables
npm run type-check

# Test Supabase connection
node -e "
import('./src/lib/env.js').then(env => {
  try {
    const config = env.getClientSafeEnv();
    console.log('Environment:', config.environment);
    console.log('Supabase URL:', config.supabaseUrl);
    console.log('App URL:', config.appUrl);
  } catch (error) {
    console.error('Environment error:', error.message);
  }
});
"

# Clear cache and restart
rm -rf .next && npm run dev
```

## Best Practices

### Development Environment

1. **Keep credentials secure:**
   - Never commit `.env.local` to version control
   - Use different projects/environments in Supabase
   - Regularly rotate API keys

2. **Enable useful features:**
   ```env
   NEXT_PUBLIC_DEBUG_MODE=true
   NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
   ```

3. **Test thoroughly:**
   - Use both official Supabase and production-like data
   - Test with realistic data volumes
   - Verify all user flows

### Production Environment

1. **Security hardening:**
   ```env
   NEXT_PUBLIC_DEBUG_MODE=false
   NEXT_PUBLIC_ENABLE_SW=true
   ```

2. **Performance optimization:**
   - Enable service worker
   - Configure proper caching
   - Monitor performance metrics

3. **Monitoring setup:**
   - Configure Sentry for error tracking
   - Set up performance monitoring
   - Enable analytics

### Environment Switching

1. **Always backup before switching:**
   ```bash
   cp .env.local .env.backup.$(date +%Y%m%d_%H%M%S)
   ```

2. **Use environment-specific commands:**
   ```bash
   # Development
   npm run dev
   
   # Production build and start
   npm run build && npm run start
   ```

3. **Document changes:**
   - Keep track of environment changes
   - Note any configuration differences
   - Update team documentation

### File Management

1. **Maintain file structure:**
   ```
   .env.local          # Active environment
   .env.production     # Production template
   .env.example        # Documentation template
   .env.local.backup   # Latest backup
   ```

2. **Version control:**
   - Include `.env.example` in Git
   - Exclude actual `.env.local` files
   - Document environment variables

3. **Regular maintenance:**
   - Update templates when adding variables
   - Review security settings
   - Rotate credentials periodically

## Support and Contact

For issues with environment switching:

1. Check this migration guide first
2. Review error logs and console output
3. Test with diagnostic commands
4. Contact the development team with:
   - Error messages
   - Steps taken
   - Environment details
   - Screenshots if applicable

---

**Last Updated:** November 2025  
**Version:** 1.0  
**Maintained by:** Development Team