---
name: setting-up-production-supabase-projects
description: Sets up production-ready Supabase projects using local-first CLI workflow, migrations, environment variables, and @supabase/ssr with Next.js 15. Use when initializing Supabase locally, configuring environment variables, generating TypeScript types, managing migrations, or implementing server-side authentication with proper security practices.
---

# Setting Up Production Supabase Projects

## Quick Start

```bash
# Install Supabase CLI (v1.x+)
npm install -g supabase

# Initialize local project
supabase init

# Start local Supabase stack (requires Docker)
supabase start

# View local credentials
supabase status
```

After `supabase start`, you'll see output like:
```
API URL: http://localhost:54321
Anon Key: eyJhbGc...
Service Role Key: eyJhbGc...
```

## When to Use This Skill

- Setting up new Supabase projects with local development
- Configuring environment variables for Next.js (distinguishing public vs private keys)
- Managing database migrations from local to production
- Implementing authentication with `@supabase/ssr` (NOT deprecated auth-helpers)
- Generating TypeScript types from database schema
- Seeding local development databases
- Preparing security checklist before production deployment
- Troubleshooting common auth and connection issues

---

## Local-First Workflow

### Project Structure

```
your-project/
├── supabase/
│   ├── config.toml          # Local configuration (auth, ports, emails)
│   ├── migrations/          # SQL migration files (auto-generated)
│   ├── seed.sql             # Development seed data
│   └── templates/           # Email templates for auth
├── src/
│   ├── utils/supabase/
│   │   ├── server.ts        # Server-side client (@supabase/ssr)
│   │   ├── client.ts        # Client-side client (singleton pattern)
│   │   └── middleware.ts    # Next.js middleware for session refresh
│   ├── types/
│   │   └── database.types.ts # Generated types (from CLI)
│   └── app/                 # Next.js app directory
├── .env.local               # Local environment (never commit)
├── .env.example             # Template for team
└── package.json
```

### Initialize and Start

```bash
# 1. Create project directory
mkdir my-app && cd my-app
git init

# 2. Initialize Supabase (creates supabase/ folder)
supabase init

# 3. Start services (first run downloads ~2GB Docker images)
supabase start

# 4. Get credentials for .env setup
supabase status
```

---

## Environment Variables

### Next.js Environment Strategy

**Key Principle**: The Supabase **anon key is safe to expose** (it's rate-limited and uses RLS). Service role keys must NEVER be public.

#### `.env.local` (Never commit)

```bash
# ✅ PUBLIC - Frontend can access (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ PRIVATE - Backend only (NO prefix)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: For local database connections (edge functions)
SUPABASE_DB_PASSWORD=postgres
```

#### `.env.example` (Commit this)

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

#### Getting Values Locally

```bash
# From terminal output of supabase start
supabase status

# From remote project (linked)
supabase link --project-ref YOUR_PROJECT_ID
```

### Connection String Modes

**Session Mode** (persistent connections):
```
postgres://postgres.xxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```
Use for: Long-lived connections, prepared statements, Next.js Server Components

**Transaction Mode** (serverless-friendly):
```
postgres://postgres.xxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```
Use for: Edge Functions, serverless environments, high concurrency
⚠️ Does NOT support prepared statements

---

## Database Migrations

### Workflow: Local → Remote

#### 1. Create Tables Locally (Two Options)

**Option A: Use Dashboard Editor** (recommended for prototyping)
```bash
# In Supabase dashboard, create table with columns via UI
# Then diff to generate migration
supabase db diff -f create_users_table
```

**Option B: Write SQL directly**
```bash
# Create migration file
supabase migration new create_users_table

# Edit supabase/migrations/<timestamp>_create_users_table.sql
```

Sample migration file:
```sql
-- supabase/migrations/20250120120000_create_users_table.sql
CREATE TABLE public.users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (Row-Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

#### 2. Test Locally

```bash
# Apply migrations to local database
supabase db reset

# Verifies: migrations apply, seed.sql runs
# Clears existing data (safe in development)
```

#### 3. Push to Remote

```bash
# Link to remote project
supabase link --project-ref YOUR_PROJECT_ID

# Capture current remote schema (creates _remote_commit.sql)
supabase db remote commit

# Deploy migrations
supabase db push

# With seed data (not recommended for production)
supabase db push --include-seed
```

### Seeding Development Database

#### `supabase/seed.sql`

```sql
-- Development seed data (ONLY for local dev)
INSERT INTO public.users (id, email, full_name) VALUES
  (1, 'dev@example.com', 'Dev User'),
  (2, 'test@example.com', 'Test User');

INSERT INTO public.posts (id, user_id, title, content) VALUES
  (1, 1, 'First Post', 'Hello World'),
  (2, 1, 'Second Post', 'Supabase is awesome');
```

```bash
# Automatically runs during supabase db reset
supabase db reset

# Or explicitly
supabase db push --include-seed
```

---

## Architecture Diagram: Local-to-Remote Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOCAL DEVELOPMENT                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Docker Compose │  │   supabase/      │  │    Next.js Dev   │  │
│  │                  │  │                  │  │                  │  │
│  │ • Postgres DB    │  │ • migrations/    │  │ • Server Comps   │  │
│  │ • Auth (GoTrue)  │  │ • config.toml    │  │ • Client Comps   │  │
│  │ • REST API       │  │ • seed.sql       │  │ • middleware.ts  │  │
│  │ • Real-time      │  │ • templates/     │  │ • .env.local     │  │
│  │                  │  │                  │  │                  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                      │                      │             │
└───────────┼──────────────────────┼──────────────────────┼─────────────┘
            │                      │                      │
            └──────────────────────┼──────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   VERSION CONTROL (Git)     │
                    │   git commit & git push     │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
   ┌────────┐            ┌─────────────────┐         ┌───────────┐
   │ CI/CD  │────────────│ supabase link   │────────▶│ Production│
   │ Pipeline           │ supabase db push│         │ Remote    │
   └────────┘            └─────────────────┘         └───────────┘
                                                           │
                    ┌──────────────────────────────────────┤
                    │                                      │
        ┌───────────▼───────────┐          ┌──────────────▼──────────┐
        │   SUPABASE CLOUD      │          │  SECURITY LAYERS        │
        │                       │          │                         │
        │ • Postgres Database   │          │ • RLS Policies          │
        │ • Auth Service        │          │ • PITR Backups          │
        │ • Storage (S3)        │          │ • MFA Dashboard         │
        │ • Edge Functions      │          │ • SSL Enforcement       │
        │ • Real-time DB        │          │ • Network Restrictions  │
        └───────────────────────┘          └─────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                    CLIENT ARCHITECTURE                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  BROWSER (Client Components)                                       │
│  └─ getSupabaseClient() (singleton)                               │
│     └─ createBrowserClient() [PUBLIC keys only]                   │
│        └─ Real-time subscriptions, INSERT/UPDATE/DELETE           │
│                                                                    │
│  NEXT.JS SERVER (Server Components + Server Actions)              │
│  └─ createClient() [ASYNC cookies]                                │
│     └─ Uses service role key or anon key (both safe on server)    │
│        └─ Session data, auth state, protected queries             │
│                                                                    │
│  MIDDLEWARE (middleware.ts)                                        │
│  └─ Runs on EVERY route (with matcher exclusions)                 │
│     └─ Refreshes session automatically                            │
│     └─ Updates JWT tokens                                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Client Architecture (Next.js 15 with @supabase/ssr)

### Installation

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Why @supabase/ssr?** 
- Handles cookies properly in Next.js 15+ (cookies are async)
- Manages session refresh automatically
- Supports Server Components, Server Actions, Route Handlers, and Middleware
- Replaces deprecated `auth-helpers` package

### Server Client (Cookies, Read-Write)

```typescript
// src/utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle async cookie setting in Server Actions
          }
        },
      },
    }
  )
}
```

**Usage in Server Components:**
```typescript
// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)

  return <div>{/* Render posts */}</div>
}
```

**Usage in Server Actions:**
```typescript
// app/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'

export async function updatePost(id: string, title: string) {
  const supabase = await createClient()
  
  return supabase
    .from('posts')
    .update({ title })
    .eq('id', id)
}
```

### Client Component Client (Singleton Pattern)

```typescript
// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

let supabaseClient: ReturnType<typeof createBrowserClient<Database>>

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return supabaseClient
}
```

**Usage in Client Components:**
```typescript
// app/components/PostForm.tsx
'use client'

import { getSupabaseClient } from '@/utils/supabase/client'
import { useState } from 'react'

export function PostForm() {
  const [title, setTitle] = useState('')
  const supabase = getSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { error } = await supabase
      .from('posts')
      .insert({ title })
    
    if (error) console.error(error)
    else setTitle('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
      />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Middleware (Session Refresh)

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

```typescript
// src/utils/supabase/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session (automatically handles token expiry)
  await supabase.auth.getUser()

  return response
}
```

---

## Configuration (config.toml)

### Sample Local Development Config

```toml
# supabase/config.toml

[auth]
# Email confirmation behavior
enable_signup = true
enable_confirmations = false  # Auto-confirm in development
double_confirm_changes = true

# Password requirements
password_min_length = 6

# JWT settings
jwt_expiry = 3600  # 1 hour
refresh_token_rotation_enabled = true

[auth.email]
enable_signup = true
enable_confirmations = false
max_frequency = "1m"  # Rate limiting

# Email templates (local development)
[auth.email.template.confirmation]
subject = "Confirm your email"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.magic_link]
subject = "Your magic link"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.invite]
subject = "You're invited"
content_path = "./supabase/templates/invite.html"

# Ports (local development)
[api]
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = "public"
max_rows = 1000

[db]
port = 5432
major_version = 15

[studio]
port = 54323

[inbucket]
port = 54324  # Email testing UI

[auth.external.google]
enabled = false

[auth.external.github]
enabled = false
```

### Remote Production Config

Set via Supabase Dashboard > Settings > Auth:
- ✅ Enable email confirmations
- ✅ Enable double confirmation for email changes
- ✅ Configure strong password requirements
- ✅ Set CORS URLs (whitelist domains)
- ✅ Enable MFA for dashboard access

---

## TypeScript Type Generation

### Generate Types from Local Database

```bash
# From local database
npx supabase gen types typescript --local > src/types/database.types.ts

# From remote project (after linking)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

### Use Types in Client

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Now fully typed:
const { data } = await supabase
  .from('users')  // TypeScript knows this table
  .select('id, email, full_name')  // TypeScript validates columns

// Type hints in editor:
// data?.map(user => user.email)  ✅ Works
// data?.map(user => user.invalid_column)  ❌ Error
```

### Generate Types in CI/CD

```json
// package.json
{
  "scripts": {
    "gen-types": "supabase gen types typescript --local > src/types/database.types.ts",
    "precommit": "npm run gen-types"
  }
}
```

Or with Husky:
```bash
# Add pre-commit hook
npx husky add .husky/pre-commit "npm run gen-types && git add src/types/database.types.ts"
```

---

## Production Security Checklist

### Database Security

- [ ] **Row-Level Security (RLS)** enabled on ALL tables
  ```sql
  SELECT tablename FROM pg_tables 
  WHERE schemaname='public' AND rowsecurity=false;
  -- Should return zero rows
  ```

- [ ] **RLS policies** created for every table operation (SELECT, INSERT, UPDATE, DELETE)
  ```sql
  CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);
  ```

- [ ] **Service role key** NEVER exposed to frontend
- [ ] **Connection pooling** configured (Session mode for persistent, Transaction for serverless)

### Authentication Security

- [ ] Email confirmation **enabled** in production
- [ ] **Password requirements** enforced (min 8 characters, special chars recommended)
- [ ] **MFA enabled** for Supabase dashboard team members
- [ ] **OAuth providers** configured correctly (GitHub, Google, etc.)
- [ ] **Redirect URLs** whitelisted (prevent open redirects)
- [ ] **CORS origins** restricted (not `*` in production)

### Backup & Recovery

- [ ] **PITR (Point-In-Time Recovery)** enabled
- [ ] **Automated backups** verified (daily + retention)
- [ ] Backup restoration tested in staging

### Environment & Secrets

- [ ] Service role key in `.env.local` (never committed)
- [ ] `.gitignore` includes `.env.local`, `.env*.local`
- [ ] Secrets stored in platform (Vercel, GitHub Secrets, etc.)
- [ ] **No secrets in code** (grep for hardcoded keys)

### Monitoring & Audit

- [ ] **Audit logging** enabled for sensitive tables
- [ ] **Error tracking** set up (Sentry, LogRocket, etc.)
- [ ] **Rate limiting** configured on auth endpoints
- [ ] **Database logs** reviewed monthly

---

## Common Errors & Solutions

### Error: `"Auth request failed: Cookie store not available"`

**Cause**: Using Server Component syntax in Client Component

**Solution**:
```typescript
// ❌ Wrong (Server Component only)
'use client'
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient()

// ✅ Correct (Client Component)
'use client'
import { getSupabaseClient } from '@/utils/supabase/client'
const supabase = getSupabaseClient()
```

### Error: `"localhost:3000 is not a valid redirect URL"`

**Cause**: Missing callback URL configuration in Supabase

**Solution**:
1. Go to Supabase Dashboard > Settings > Auth > Redirect URLs
2. Add: `http://localhost:3000/auth/callback`
3. For production: `https://yourdomain.com/auth/callback`

### Error: `"NEXT_PUBLIC_SUPABASE_URL is undefined"`

**Cause**: Environment variables not loaded

**Solution**:
```bash
# 1. Verify .env.local exists
ls -la .env.local

# 2. Restart dev server
npm run dev

# 3. Verify values load
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Migrations Not Applying Locally

**Cause**: Supabase services not running or stale

**Solution**:
```bash
# Stop and restart
supabase stop
supabase start

# Or reset to fresh state
supabase db reset
```

### `supabase db push` Says "No changes to push"

**Cause**: Local and remote schemas already in sync

**Solution**:
```bash
# View pending migrations
supabase db remote commit

# Shows migration needed to sync
supabase db push
```

### Token Refresh Loop in Middleware

**Cause**: Middleware calling `getUser()` on every request

**Solution**: The current `updateSession` pattern correctly refreshes only when needed. If experiencing infinite loops:
```typescript
// ✅ Correct: Let @supabase/ssr handle refresh automatically
await supabase.auth.getUser()  // Refreshes if expired

// ❌ Wrong: Don't manually refresh in a loop
setInterval(() => supabase.auth.refreshSession(), 1000)
```

### Email Confirmation Link Invalid Locally

**Cause**: Default Supabase SMTP not authorized for non-team emails

**Solution**: Use Inbucket (built-in) during development:
```bash
# After supabase start
# Access: http://localhost:54324
# Emails appear here automatically

# Set in config.toml
[auth.email]
enable_confirmations = false  # Skip in dev
```

### Error: `"jwt malformed"` or Token Errors

**Cause**: Token expired, CORS issue, or key mismatch

**Solution**:
```typescript
// Verify middleware runs before routes that need auth
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.png|.*\.jpg).*)',
  ],
}

// Ensure middleware calls updateSession
export async function middleware(request: NextRequest) {
  return await updateSession(request)  // Refreshes expired tokens
}
```

### Error: `"Relation does not exist"` After Migration

**Cause**: Migration applied locally but not on remote, or table name mismatch

**Solution**:
```bash
# Verify local and remote are in sync
supabase db remote commit  # Shows diff

# Check table exists
supabase sql
\dt public.*

# Push migration again
supabase db push
```

### Slow Queries / Too Many Database Connections

**Cause**: Using direct connection (port 5432) instead of pooler for serverless

**Solution**: Use transaction mode for serverless:
```typescript
// Environment variables
DATABASE_URL_DIRECT=postgres://...@db.xxxxx.supabase.co:5432/postgres
DATABASE_URL_TRANSACTION=postgres://...@db.xxxxx.supabase.co:6543/postgres

// In Edge Function or serverless:
// Use TRANSACTION mode (port 6543)
// Disable prepared statements if using transaction mode
```

### `createClient is not a function` in Server Component

**Cause**: Not awaiting the async `createClient` call

**Solution**:
```typescript
// ✅ Correct
export default async function Page() {
  const supabase = await createClient()  // await!
  const { data } = await supabase.from('posts').select()
}

// ❌ Wrong
export default function Page() {
  const supabase = createClient()  // Missing await
}
```

### Migrations Conflict After Team Pull

**Cause**: Two developers created migrations with same timestamp

**Solution**:
```bash
# 1. Pull latest migrations
git pull

# 2. Reset local database with merged migrations
supabase db reset

# 3. If conflicts exist, rename one:
# mv supabase/migrations/20250120_123456_table_a.sql \
#    supabase/migrations/20250120_123500_table_a.sql
```

### Supabase CLI Hangs During `supabase start`

**Cause**: Docker not running or insufficient resources

**Solution**:
```bash
# 1. Start Docker
# On macOS: open -a Docker

# 2. Wait for Docker to be ready
# Check: docker ps should work

# 3. Stop and restart with verbose output
supabase stop
supabase start --debug

# 4. If still failing, clean Docker
docker system prune -a
supabase start
```

---

## Best Practices

### 1. Environment Variable Strategy

```typescript
// ✅ Always use!
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ❌ Never expose service key to frontend
// const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

### 2. Use Parameterized Queries

```typescript
// ✅ Prevents SQL injection (automatic with supabase-js)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)  // Parameterized

// ❌ Vulnerable (never do this)
// const { data } = await supabase.rpc('query_users', {
//   query: `SELECT * FROM users WHERE id = ${userId}`
// })
```

### 3. Always Enable RLS

```sql
-- ✅ Good practice
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- ❌ Bad practice (no RLS)
-- Table accessible to everyone via anon key
```

### 4. Handle Auth State Changes

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/utils/supabase/client'

export function UserMenu() {
  const [user, setUser] = useState(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription?.unsubscribe()
  }, [supabase])

  return <>{user ? `Hi ${user.email}` : 'Sign in'}</>
}
```

### 5. Validate RLS Policies in Development

```bash
# Test RLS by querying as different users
supabase sql

-- As authenticated user
SELECT * FROM posts;

-- As anon user (if RLS allows)
SELECT * FROM public_posts;
```

---

## References

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [@supabase/ssr Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Auth Setup](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [TypeScript Types Generation](https://supabase.com/docs/guides/api/rest/generating-types)
- [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Connection Pooling (Supavisor)](https://supabase.com/docs/guides/database/connecting-to-postgres)
