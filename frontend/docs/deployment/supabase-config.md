# Supabase Configuration

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05

---

## Overview

This document provides detailed configuration instructions for Supabase services including Authentication, Database, Real-time, Storage, and Edge Functions.

---

## Project Setup

### Create New Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Configure project:
   ```
   Name: distribution-management
   Database Password: [Generate strong password - SAVE THIS!]
   Region: Select closest to your users
   Pricing Plan: Free (for development)
   ```
4. Click **Create new project**
5. Wait 2-3 minutes for provisioning

### Save Project Details

Copy and save these values:

```bash
# From Settings > API
Project URL: https://your-project-id.supabase.co
API Keys:
  - anon key: eyJhbGc...
  - service_role key: eyJhbGc... (KEEP SECRET!)

# From Settings > Database
Connection string: postgresql://postgres:[PASSWORD]@...
```

---

## Authentication Configuration

### 1. Email Authentication

**Location**: **Authentication** > **Providers**

#### Enable Email Provider

1. Go to **Authentication** > **Providers** > **Email**
2. Enable **Email** provider
3. Configure settings:

```yaml
Enable Email Signups: Yes
Enable Email Confirmations: Yes (recommended for production)
Minimum Password Length: 8 characters
Password Requirements:
  - Lowercase: Optional
  - Uppercase: Optional
  - Numbers: Optional
  - Special Characters: Optional
```

#### Email Templates

**Location**: **Authentication** > **Email Templates**

**Confirmation Email**:
```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

**Reset Password Email**:
```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .TokenHash }}&type=recovery">Reset Password</a></p>
```

---

### 2. Session Configuration

**Location**: **Authentication** > **Settings**

```yaml
JWT Expiry: 3600 seconds (1 hour)
Refresh Token Rotation: Enabled
Refresh Token Reuse Interval: 10 seconds

Site URL: http://localhost:3000 (development)
         https://your-app.vercel.app (production)

Redirect URLs:
  - http://localhost:3000/**
  - https://your-app.vercel.app/**
```

---

### 3. Security Settings

**Location**: **Authentication** > **Policies**

```yaml
Rate Limits:
  - Anonymous requests: 30 per hour
  - Authenticated requests: 100 per hour

Security:
  - Enable Captcha: No (for development)
  - Enable Email Rate Limiting: Yes
  - Max emails per hour: 5
```

---

## Database Configuration

### 1. Connection Pooling

**Location**: **Settings** > **Database**

```yaml
Connection Mode: Transaction
Connection String Format: URI

Pool Settings:
  - Max Connections: 15 (Free tier)
  - Pool Timeout: 30 seconds
  - Statement Timeout: 8 seconds
```

### 2. Enable Extensions

**Location**: **Database** > **Extensions**

Enable these extensions:

```sql
-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Geospatial queries (for driver locations)
CREATE EXTENSION IF NOT EXISTS "postgis";
```

Via SQL Editor:
1. Go to **SQL Editor**
2. Click **New query**
3. Run the SQL above
4. Click **Run**

---

### 3. Database Settings

**Location**: **Settings** > **Database** > **Settings**

```yaml
Statement Timeout: 8000ms
Lock Timeout: 5000ms

Timezone: UTC
DateStyle: ISO, MDY
```

---

## Real-time Configuration

### 1. Enable Realtime

**Location**: **Database** > **Replication**

Enable realtime for tables:

```
Tables to replicate:
✅ public.orders
✅ public.order_items
✅ public.cart_items
✅ public.profiles (for driver availability)
```

Steps:
1. Go to **Database** > **Replication**
2. Find each table
3. Click toggle to enable replication
4. Select replication events:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE

---

### 2. Realtime Settings

**Location**: **Settings** > **API** > **Realtime**

```yaml
Enable Realtime: Yes
Max Connections: 200 (Free tier)
Max Messages per Second: 100

Rate Limiting:
  - Connections per IP: 10
  - Broadcasts per Second: 10
```

---

### 3. Configure Broadcast Channels

Create channels for different features:

```typescript
// In your application code
const channel = supabase.channel('orders', {
  config: {
    broadcast: { self: true },
    presence: { key: '' }
  }
})

// Subscribe to database changes
channel
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${userId}`
  }, (payload) => {
    console.log('Order changed:', payload)
  })
  .subscribe()
```

---

## Storage Configuration

### 1. Create Storage Buckets

**Location**: **Storage**

#### Create Uploads Bucket

1. Go to **Storage**
2. Click **New bucket**
3. Configure:
   ```
   Name: uploads
   Public bucket: No (private)
   File size limit: 50 MB
   Allowed MIME types: image/*, application/pdf
   ```
4. Click **Create bucket**

---

### 2. Storage Policies

**Location**: **Storage** > **uploads** > **Policies**

**Allow authenticated uploads**:
```sql
CREATE POLICY "authenticated_users_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Allow users to view own uploads**:
```sql
CREATE POLICY "users_view_own_uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Allow users to delete own uploads**:
```sql
CREATE POLICY "users_delete_own_uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 3. Storage Settings

**Location**: **Settings** > **Storage**

```yaml
File Size Limit: 50 MB
Upload Timeout: 60 seconds

Image Transformation:
  - Enable: Yes
  - Max Width: 2000px
  - Max Height: 2000px
  - Quality: 80
```

---

## API Configuration

### 1. API Settings

**Location**: **Settings** > **API**

```yaml
Project URL: https://your-project-id.supabase.co
API URL: https://your-project-id.supabase.co/rest/v1

Schema: public
Max Rows: 1000 (default limit for SELECT queries)
```

---

### 2. API Keys

**Location**: **Settings** > **API** > **Project API Keys**

#### anon (public) Key
- ✅ Safe to use in client-side code
- ✅ Respects Row Level Security
- ✅ Can be exposed in frontend

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

#### service_role (secret) Key
- ⚠️ Bypasses Row Level Security
- ⚠️ NEVER expose to client
- ⚠️ Use only in server-side code

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Server-side only!
```

---

### 3. CORS Configuration

**Location**: **Settings** > **API** > **CORS**

```yaml
Allowed Origins:
  - http://localhost:3000 (development)
  - https://your-app.vercel.app (production)
  - https://*.vercel.app (preview deployments)

Allowed Methods:
  - GET
  - POST
  - PUT
  - PATCH
  - DELETE
  - OPTIONS

Allowed Headers:
  - Content-Type
  - Authorization
  - apikey
  - x-client-info

Expose Headers:
  - Content-Range
  - X-Supabase-Api-Version

Max Age: 3600 seconds
```

---

## Edge Functions (Optional)

### 1. Create Edge Function

**Via CLI**:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-id

# Create function
supabase functions new hello-world

# Deploy function
supabase functions deploy hello-world
```

**Example Function** (`supabase/functions/hello-world/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')!

    // Get user from JWT
    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (error) throw error

    return new Response(
      JSON.stringify({ message: `Hello ${user.email}!` }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### 2. Function Environment Variables

**Location**: **Edge Functions** > **[Function Name]** > **Settings**

```yaml
Variables:
  SUPABASE_URL: https://your-project-id.supabase.co
  SUPABASE_ANON_KEY: eyJhbGc...
  SUPABASE_SERVICE_ROLE_KEY: eyJhbGc... (auto-provided)
```

---

## Monitoring and Logging

### 1. Enable Logs

**Location**: **Logs**

Monitor:
- **API Logs**: HTTP requests
- **Database Logs**: Query performance
- **Auth Logs**: Login attempts
- **Realtime Logs**: WebSocket connections
- **Storage Logs**: File operations

---

### 2. Set Up Alerts (Pro Plan)

**Location**: **Settings** > **Alerts**

Configure alerts for:
```yaml
Database CPU: > 80%
Database Memory: > 80%
API Error Rate: > 5%
Auth Failure Rate: > 10%
```

---

## Backup Configuration

### 1. Enable Daily Backups (Pro Plan)

**Location**: **Settings** > **Database** > **Backups**

```yaml
Backup Schedule: Daily at 2:00 AM UTC
Retention: 7 days (Pro) / 30 days (Team)
Point-in-Time Recovery: 7 days
```

---

### 2. Manual Backup

```bash
# Using pg_dump
pg_dump "postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  > backup_$(date +%Y%m%d).sql
```

---

## Security Best Practices

### 1. Enable SSL

**Required**: All connections use SSL by default

Verify:
```bash
# Connection string includes sslmode=require
postgresql://postgres:[PASSWORD]@db.project.supabase.co:5432/postgres?sslmode=require
```

---

### 2. Rotate API Keys

Rotate keys every 3-6 months:

1. Go to **Settings** > **API**
2. Click **Reset API key**
3. Update environment variables
4. Deploy new version
5. Verify functionality
6. Old keys expire after grace period

---

### 3. Review Access Logs

Regularly check logs for:
- ❌ Failed login attempts
- ❌ Unauthorized access attempts
- ❌ Unusual query patterns
- ❌ High error rates

---

## Performance Optimization

### 1. Enable Query Caching

**Location**: **Database** > **Query Performance**

```sql
-- Create materialized views for expensive queries
CREATE MATERIALIZED VIEW order_stats AS
SELECT
  DATE(created_at) as date,
  status,
  COUNT(*) as count,
  SUM(total_amount) as total
FROM orders
GROUP BY DATE(created_at), status;

-- Refresh periodically
REFRESH MATERIALIZED VIEW order_stats;
```

---

### 2. Monitor Slow Queries

**Location**: **Database** > **Query Performance**

Enable `pg_stat_statements`:
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Testing Configuration

### Create Test Project

For integration tests, create separate Supabase project:

```bash
# Test project environment variables
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key...
```

Benefits:
- ✅ Isolated test data
- ✅ Safe to reset/wipe
- ✅ No impact on production

---

## Troubleshooting

### Issue: "JWT expired" errors

**Cause**: Session expired (5-hour default)

**Solution**:
```typescript
// Implement session refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Session refreshed')
  }
})

// Manual refresh
const { data, error } = await supabase.auth.refreshSession()
```

---

### Issue: "Row Level Security policy violation"

**Cause**: RLS policy blocking operation

**Solution**:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy
SELECT *
FROM your_table
WHERE (your_policy_condition);

-- Debug with service_role key (bypasses RLS)
-- ONLY for debugging, never in production!
```

---

### Issue: Realtime not working

**Symptoms**: No real-time updates received

**Solutions**:

1. **Check replication**:
   - Go to **Database** > **Replication**
   - Verify table has replication enabled

2. **Check channel subscription**:
```typescript
const channel = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => console.log(payload))
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })
```

3. **Check RLS policies**:
   - Realtime respects RLS
   - User must have SELECT permission

---

## Next Steps

After Supabase configuration:

1. ✅ Test database connection
2. ✅ Test authentication flow
3. ✅ Test real-time subscriptions
4. ✅ Proceed to [Frontend Deployment](./frontend-deployment.md)

---

## Related Documentation

- [Database Setup](./database-setup.md) - Run migrations
- [Environment Setup](./environment-setup.md) - Configure .env files
- [Architecture: System Overview](../architecture/system-overview.md) - System architecture

---

**End of Supabase Configuration Documentation**
