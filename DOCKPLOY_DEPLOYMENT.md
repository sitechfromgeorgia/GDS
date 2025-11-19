# 🚀 Dockploy Deployment Guide
## Georgian Distribution Management System

This guide provides step-by-step instructions for deploying the Georgian Distribution Management System to Dockploy.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Dockploy Account** - Access to a Dockploy instance
2. **GitHub Repository** - Code pushed to GitHub (main branch)
3. **Supabase Backend** - Production Supabase instance running at `https://data.greenland77.ge`
4. **Environment Variables** - Supabase credentials ready

---

## 🔧 Step 1: Configure Environment Variables in Dockploy

### Required Variables

In your Dockploy project, go to **Settings → Environment Variables** and add:

| Variable Name | Example Value | Description |
|--------------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://data.greenland77.ge` | Your Supabase instance URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase anonymous/public key |
| `NEXT_PUBLIC_APP_URL` | `https://greenland77.ge` | Your app's public URL |

### How to Find Your Supabase Keys

1. Go to your Supabase Dashboard: `https://data.greenland77.ge`
2. Navigate to **Project Settings → API**
3. Copy the **anon/public** key (not the service_role key!)

### Optional Variables

| Variable Name | Description |
|--------------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking (optional) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps (optional) |

---

## 🐳 Step 2: Configure Docker Settings in Dockploy

### Repository Settings

- **Repository URL**: Your GitHub repository URL
- **Branch**: `main`
- **Build Context**: `.` (root directory)

### Build Settings

Dockploy will automatically use the `docker-compose.yml` file in the root directory.

**Important**: The configuration uses `Dockerfile.production` which:
- ✅ Optimizes image size using Next.js standalone mode
- ✅ Excludes test files and dev dependencies
- ✅ Runs as non-root user for security
- ✅ Includes proper health checks

---

## 📦 Step 3: Deploy

### Initial Deployment

1. **Create New Project** in Dockploy
2. **Connect GitHub Repository**
3. **Add Environment Variables** (from Step 1)
4. **Click Deploy**

### Expected Build Time

- First build: **10-15 minutes** (downloads dependencies)
- Subsequent builds: **5-10 minutes** (uses cache)

### Build Resources

The configuration reserves:
- **Memory**: 1GB minimum, 6GB maximum
- **CPU**: 1 core minimum, 3 cores maximum

---

## ✅ Step 4: Verify Deployment

### Health Check

After deployment completes, verify the app is healthy:

```bash
curl https://your-domain.com/api/health/liveness
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

### Application Access

1. Navigate to your deployed URL
2. You should see the login page
3. Try logging in with test credentials

### Common Issues

#### Issue: "Cannot connect to Supabase"
**Solution**: 
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct in Dockploy
- Verify Supabase instance is running at `https://data.greenland77.ge`

#### Issue: "Build fails with memory error"
**Solution**: 
- Increase memory limits in Dockploy settings
- Current config already sets `NODE_OPTIONS="--max-old-space-size=4096"`

#### Issue: "Health check failing"
**Solution**:
- Wait 60 seconds (start_period in config)
- Check container logs in Dockploy
- Verify port 3000 is accessible

---

## 🔄 Step 5: Continuous Deployment

### Automatic Deployments

Dockploy can automatically redeploy when you push to the `main` branch:

1. Go to **Settings → Git Integration**
2. Enable **Auto Deploy on Push**
3. Select branch: `main`

### Manual Deployments

To manually trigger a deployment:
1. Go to your project in Dockploy
2. Click **Redeploy**
3. Select **Pull Latest Changes** (optional)

---

## 📊 Monitoring

### Container Logs

View real-time logs in Dockploy:
1. Go to your project
2. Click **Logs** tab
3. Filter by service: `frontend`

### Health Status

The container includes health checks that run every 30 seconds:
- **Endpoint**: `/api/health/liveness`
- **Timeout**: 10 seconds
- **Retries**: 3 failures before marking unhealthy
- **Start Period**: 60 seconds (grace period)

### Resource Usage

Monitor in Dockploy dashboard:
- CPU usage
- Memory usage
- Network traffic

---

## 🔒 Security Considerations

### Environment Variables

✅ **Safe to expose** (public keys):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

❌ **NEVER expose** (keep in backend only):
- `SUPABASE_SERVICE_ROLE_KEY`
- Database passwords
- Private API keys

### Container Security

The Dockerfile includes:
- ✅ Runs as non-root user (`nextjs:nodejs`)
- ✅ Minimal image size (only production dependencies)
- ✅ No development tools in production
- ✅ Security headers configured in Next.js

---

## 🧪 Local Testing Before Deployment

### Test Docker Build Locally

Use the provided test script:

**Windows:**
```cmd
scripts\test-docker-build.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/test-docker-build.sh
./scripts/test-docker-build.sh
```

This will:
1. Build the Docker image locally
2. Start the container
3. Run health checks
4. Display logs

### Manual Local Testing

```bash
# Set environment variables
set NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
set NEXT_PUBLIC_APP_URL=http://localhost:3000

# Build and run
docker-compose up --build

# In another terminal, test health endpoint
curl http://localhost:3000/api/health/liveness
```

---

## 📝 Troubleshooting

### Build Fails

1. **Check Logs**: Review build logs in Dockploy
2. **Verify Environment Variables**: Ensure all required vars are set
3. **Test Locally**: Run local Docker build to reproduce issue
4. **Check Dependencies**: Verify package.json has no broken dependencies

### Container Starts but Crashes

1. **View Container Logs**: Check for error messages
2. **Memory Issues**: Increase memory limits if OOM errors
3. **Health Check**: Verify `/api/health/liveness` endpoint works
4. **Environment**: Double-check Supabase URL is reachable

### Slow Performance

1. **Resource Limits**: Increase CPU/memory in Dockploy
2. **Database**: Check Supabase instance performance
3. **Network**: Verify low latency to Supabase backend
4. **Caching**: Ensure Next.js caching is working

---

## 🔗 Useful Links

- **Project Repository**: [Your GitHub Repo]
- **Supabase Dashboard**: https://data.greenland77.ge
- **Dockploy Documentation**: https://dockploy.com/docs
- **Next.js Docker Docs**: https://nextjs.org/docs/app/building-your-application/deploying#docker-image

---

## 📞 Support

If you encounter issues:

1. Check container logs in Dockploy
2. Review this guide's troubleshooting section
3. Test locally using provided scripts
4. Check Supabase service status

---

## 🎯 Quick Checklist

Before deploying, verify:

- [ ] All environment variables set in Dockploy
- [ ] Supabase instance is running and accessible
- [ ] GitHub repository has latest code on `main` branch
- [ ] `.env.example.production` reviewed for completeness
- [ ] Local Docker build tested successfully
- [ ] Health check endpoint `/api/health/liveness` works

After deployment:

- [ ] Health check passes
- [ ] Application loads in browser
- [ ] Login functionality works
- [ ] No errors in container logs
- [ ] Resource usage is within limits

---

**Last Updated**: 2025-11-18  
**Docker Compose Version**: Production v1.0  
**Dockerfile**: Dockerfile.production (optimized standalone build)
