---
name: designing-multi-tenant-saas-next-js-supabase
description: Designs and implements multi-tenant SaaS architectures with Next.js 15 and Supabase, covering database isolation strategies (RLS, schemas, separate DBs), tenant resolution (subdomains, custom domains, headers), security patterns, and cross-tenant leak prevention. Use when building B2B platforms, designing tenant isolation, implementing RLS policies, handling subdomain/custom domain routing, or architecting scalable multi-tenant systems.
---

# Designing Multi-Tenant SaaS: Next.js 15 & Supabase Architecture

## Quick Start

This is a multi-layer architecture decision framework:

```
TENANT RESOLUTION (Next.js 15 Middleware)
         ↓
TENANT CONTEXT (Headers/JWT Claims)
         ↓
DATABASE ISOLATION (PostgreSQL RLS)
         ↓
APPLICATION FILTERING (Always-on Tenant Checks)
         ↓
STORAGE ISOLATION (Supabase Storage Buckets)
```

**The rule: Never trust tenant context from a single source. Use multiple layers.**

---

## When to Use This Skill

- **Designing multi-tenant architecture** from scratch or migrating to it
- **Implementing Row-Level Security (RLS)** in Supabase
- **Handling subdomain/custom domain routing** in Next.js 15
- **Preventing cross-tenant data leaks** (THE #1 multi-tenant risk)
- **Building invite systems** where users belong to multiple tenants
- **Scaling to many tenants** with proper connection pooling strategies
- **Making isolation level decisions** (Shared DB vs Separate Schemas vs Separate DBs)

---

## Part 1: Database Isolation Strategies

### Decision Framework: Cost vs Security vs Complexity

| Approach | Data Isolation | Cost | Query Performance | Migrations | Use Case |
|----------|---|---|---|---|---|
| **Shared DB, Shared Schema + RLS** | Row-level (Medium) | $$ (Lowest) | Fast | Simple | Startups, SaaS with 100s of tenants |
| **Shared DB, Separate Schemas** | Schema-level (Strong) | $$ | Medium | Complex | Medium scale, 10-100 tenants, customization needed |
| **Separate Database per Tenant** | Database-level (Strongest) | $$$$$ (Highest) | Fastest per tenant | Very complex | Enterprise, compliance-heavy, 5-50 tenants |

**Recommendation for Next.js + Supabase startups:** Start with **Shared DB + RLS**. It's battle-tested, scales to thousands of tenants, and costs pennies per tenant.

---

### Strategy 1: Shared Database + Shared Schema + Row-Level Security (RLS)

**Pattern: "Single-schema, multi-tenant isolation at row level"**

Every table has a `tenant_id` column. PostgreSQL RLS policies enforce that a user can only see rows matching their tenant.

#### Schema Design

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Core tables with tenant_id
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,  -- Each org is its own tenant
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES organizations(tenant_id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',  -- 'owner', 'admin', 'member'
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(tenant_id),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- CRITICAL: Always include tenant_id on INSERT/UPDATE/DELETE operations
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(tenant_id),
  project_id UUID NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### RLS Policies: Using Custom Claims (Recommended)

**Why custom claims?** Faster than joins, doesn't require querying the users table on every query.

```sql
-- Step 1: Create helper function to get tenant_id from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  SELECT COALESCE(
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
      ->'app_metadata'->>'tenant_id'),
    NULL
  )::UUID INTO tenant_id;
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 2: RLS Policy for SELECT (Read)
CREATE POLICY "Tenants can read their own data"
ON documents
FOR SELECT
TO authenticated
USING (tenant_id = auth.tenant_id());

-- Step 3: RLS Policy for INSERT (Create)
CREATE POLICY "Tenants can insert their own data"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = auth.tenant_id()
  AND project_id IN (
    SELECT id FROM projects 
    WHERE tenant_id = auth.tenant_id()
  )
);

-- Step 4: RLS Policy for UPDATE (Modify)
CREATE POLICY "Tenants can update their own data"
ON documents
FOR UPDATE
TO authenticated
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- Step 5: RLS Policy for DELETE (Remove)
CREATE POLICY "Tenants can delete their own data"
ON documents
FOR DELETE
TO authenticated
USING (tenant_id = auth.tenant_id());
```

#### Setting Tenant Context in JWT (Supabase Access Token Hook)

You must inject `tenant_id` into every user's JWT so RLS policies can access it:

```sql
-- Enable Auth Hook in Supabase Dashboard:
-- Dashboard → Authentication → Hooks → Access Token (enable)

CREATE OR REPLACE FUNCTION public.access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  user_id UUID;
  tenant_id UUID;
  claims jsonb;
BEGIN
  claims := event->'claims';
  user_id := (claims->>'sub')::UUID;

  -- Fetch the user's tenant_id from your users table
  SELECT u.tenant_id INTO tenant_id
  FROM public.users u
  WHERE u.id = user_id
  LIMIT 1;

  -- If user not found, deny access
  IF tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not found or tenant unassigned';
  END IF;

  -- Inject tenant_id into app_metadata
  claims := jsonb_set(
    claims,
    '{app_metadata,tenant_id}',
    to_jsonb(tenant_id)
  );

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Anti-Pattern: DON'T use auth.uid() alone for tenant isolation

❌ **Wrong:**
```sql
-- This only checks if the user exists, NOT which tenant they belong to
CREATE POLICY "bad_isolation"
ON documents
USING (owner_id = auth.uid());
```

✅ **Right:**
```sql
-- Checks both tenant membership AND ownership
CREATE POLICY "good_isolation"
ON documents
USING (
  tenant_id = auth.tenant_id()
  AND owner_id = auth.uid()
);
```

---

### Strategy 2: Separate Schemas per Tenant

**Pattern: "Schema-per-tenant isolation"**

Each tenant gets its own PostgreSQL schema within the same database.

**Use case:** 10-100 enterprise customers who want customizable schemas.

#### Setup

```sql
-- Create tenant schema dynamically
CREATE SCHEMA tenant_<tenant_uuid>;

-- Grant permissions to tenant-specific role
CREATE ROLE tenant_<tenant_uuid> WITH LOGIN ENCRYPTED PASSWORD '<secure_password>';
GRANT USAGE ON SCHEMA tenant_<tenant_uuid> TO tenant_<tenant_uuid>;
GRANT CREATE ON SCHEMA tenant_<tenant_uuid> TO tenant_<tenant_uuid>;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_<tenant_uuid> TO tenant_<tenant_uuid>;

-- Create tables in tenant schema
CREATE TABLE tenant_<tenant_uuid>.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT now()
  -- NOTE: No tenant_id needed—schema IS the tenant boundary
);

-- On application connection, set search_path
SET search_path TO tenant_<tenant_uuid>;
SELECT * FROM documents;  -- Only sees tenant_<tenant_uuid>.documents
```

**Pros:** Complete schema isolation, supports customization per tenant
**Cons:** Complex migrations (must loop over all schemas), higher DB overhead

**Migration best practice:**
```sql
-- Migration script for all tenants
DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN 
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    EXECUTE format('ALTER TABLE %I.documents ADD COLUMN archived BOOLEAN DEFAULT false', tenant_schema.schema_name);
  END LOOP;
END $$;
```

---

### Strategy 3: Separate Database per Tenant

**Pattern: "One database per enterprise customer"**

Enterprise SaaS with extreme security/compliance requirements (SOC 2 Type II, HIPAA).

**Setup:** Single master connection string + tenant database registry

```typescript
// Registry stores tenant → database mapping
interface TenantRegistry {
  tenant_id: string;
  db_host: string;
  db_port: number;
  db_name: string;
  db_user: string;
}

// On request, look up tenant's dedicated DB
async function getTenantDB(tenantId: string) {
  const registry = await supabase
    .from('tenant_databases')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  return new Pool({
    host: registry.db_host,
    port: registry.db_port,
    database: registry.db_name,
    user: registry.db_user,
    password: process.env[`DB_PASSWORD_${tenantId}`],
  });
}
```

**Pros:** Strongest isolation, easiest GDPR right-to-be-forgotten (delete whole DB)
**Cons:** Operational nightmare, 10-100x cost per tenant, requires dedicated infrastructure

---

## Part 2: Tenant Resolution in Next.js 15

### Pattern 1: Subdomain Resolution (`tenant.app.com`)

**Best for:** B2B SaaS (Slack uses subdomains, Notion uses subdomains)

#### Next.js Middleware Implementation

```typescript
// middleware.ts - Place in root of app/ or pages/ directory
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = new URL(request.url);

  // Parse subdomain
  const parts = hostname.split('.');
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  let subdomain: string | null = null;
  let tenantId: string | null = null;

  if (isLocalhost) {
    // localhost:3000 → skip subdomain parsing
    subdomain = null;
  } else if (parts.length > 2) {
    // acme.app.com → acme
    subdomain = parts[0];
  }

  // Skip processing for root domain (www.app.com) and API routes
  if (!subdomain || subdomain === 'www' || subdomain === 'api') {
    return NextResponse.next();
  }

  // Look up tenant by subdomain slug
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tenants/by-slug/${subdomain}`,
      { cache: 'no-store' }  // Fresh lookup each time
    );

    if (!response.ok) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const tenant = await response.json();
    tenantId = tenant.id;
  } catch (error) {
    console.error('Tenant lookup failed:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rewrite URL to app route while preserving subdomain context
  const pathname = url.pathname;
  const newUrl = url.clone();
  newUrl.pathname = `/app${pathname}`;

  const response = NextResponse.rewrite(newUrl);
  
  // Pass tenant context to Server Components via headers
  response.headers.set('x-tenant-id', tenantId);
  response.headers.set('x-tenant-slug', subdomain);
  
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, API, etc.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### Accessing Tenant in Server Components

```typescript
// app/dashboard/page.tsx
import { headers } from 'next/headers';

export default async function Dashboard() {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');

  // All DB queries automatically scoped by tenantId via RLS
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('tenant_id', tenantId);

  return (
    <div>
      <h1>{tenantSlug}'s Projects</h1>
      {projects?.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

---

### Pattern 2: Custom Domain Resolution

**Best for:** Enterprise customers bring their own domain (e.g., `projects.acme.com`)

```typescript
// middleware.ts - Enhanced with custom domain support
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = new URL(request.url);

  // Try subdomain resolution first
  let tenantId: string | null = null;
  const parts = hostname.split('.');
  const isLocalhost = hostname.includes('localhost');

  if (!isLocalhost && parts.length > 2) {
    // acme.app.com → check subdomain
    const subdomain = parts[0];
    if (subdomain !== 'www' && subdomain !== 'api') {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenants/by-slug/${subdomain}`
        );
        if (res.ok) {
          const tenant = await res.json();
          tenantId = tenant.id;
        }
      } catch (e) {
        console.error('Subdomain lookup failed:', e);
      }
    }
  }

  // Fall back to custom domain lookup
  if (!tenantId) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tenants/by-custom-domain/${hostname}`
      );
      if (res.ok) {
        const tenant = await res.json();
        tenantId = tenant.id;
      }
    } catch (e) {
      console.error('Custom domain lookup failed:', e);
    }
  }

  if (!tenantId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rewrite and pass tenant context
  const newUrl = url.clone();
  newUrl.pathname = `/app${url.pathname}`;

  const response = NextResponse.rewrite(newUrl);
  response.headers.set('x-tenant-id', tenantId);
  response.headers.set('x-hostname', hostname);

  return response;
}
```

#### Database Schema for Custom Domains

```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(tenant_id),
  domain TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  ssl_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_tenant_id ON custom_domains(tenant_id);
```

**Important for custom domains on Vercel:** You must register the domain in Vercel's project settings via API or manually. You cannot dynamically serve arbitrary customer domains without pre-registration.

---

### Pattern 3: Path-Based Routing (`/app/tenant-slug/*`)

**Best for:** Free SaaS, social platforms with user profiles

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // /app/acme/dashboard → extract "acme"
  const match = pathname.match(/^\/app\/([^/]+)(\/.*)?$/);
  
  if (!match) {
    return NextResponse.next();
  }

  const [, tenantSlug, restPath] = match;

  try {
    const tenant = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (!tenant?.data) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenant.data.id);
    response.headers.set('x-tenant-slug', tenantSlug);

    return response;
  } catch (e) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/app/:path*'],
};
```

---

## Part 3: Supabase RLS Policies - Complete Examples

### Example: Role-Based Access with Multi-Tenant Isolation

```sql
-- Roles: 'owner', 'admin', 'member'
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(tenant_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE(tenant_id, user_id)
);

-- Helper function: Check if user is in tenant
CREATE OR REPLACE FUNCTION has_tenant_membership(
  check_tenant_id UUID,
  check_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM memberships
    WHERE tenant_id = check_tenant_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Members can only READ their tenant's documents
CREATE POLICY "Members read own tenant documents"
ON documents
FOR SELECT
TO authenticated
USING (
  tenant_id = auth.tenant_id()
  AND has_tenant_membership(tenant_id, auth.uid())
);

-- RLS: Only admins and owners can CREATE documents
CREATE POLICY "Only admins create documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = auth.tenant_id()
  AND EXISTS(
    SELECT 1 FROM memberships m
    WHERE m.tenant_id = auth.tenant_id()
    AND m.user_id = auth.uid()
    AND m.role IN ('owner', 'admin')
  )
);

-- RLS: Only document owner or admins can UPDATE
CREATE POLICY "Owner or admin can update documents"
ON documents
FOR UPDATE
TO authenticated
USING (
  tenant_id = auth.tenant_id()
  AND (
    owner_id = auth.uid()
    OR EXISTS(
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = auth.tenant_id()
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  )
)
WITH CHECK (tenant_id = auth.tenant_id());
```

### Bypassing RLS Safely for Admin Tools

**Problem:** Support staff need to see all tenant data to debug issues, but you can't use the superuser role.

**Solution:** Create an admin user role that has carefully scoped cross-tenant permissions:

```sql
-- Create special admin role (NOT superuser)
CREATE ROLE admin_support WITH LOGIN ENCRYPTED PASSWORD '<strong_password>';

-- Admin policies: Explicit cross-tenant access
CREATE POLICY "Admin can read all documents"
ON documents
FOR SELECT
TO admin_support
USING (true);  -- No tenant filter for admins

CREATE POLICY "Admin can read all memberships"
ON memberships
FOR SELECT
TO admin_support
USING (true);

-- CRITICAL: Log all admin queries
CREATE TABLE admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID,
  action TEXT,
  table_name TEXT,
  tenant_id UUID,
  row_count INT,
  executed_at TIMESTAMP DEFAULT now()
);

-- Trigger to log all admin queries
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, table_name, tenant_id)
  VALUES (
    current_user_id(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.tenant_id, OLD.tenant_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_admin_audit
AFTER SELECT ON documents
FOR EACH ROW
EXECUTE FUNCTION log_admin_action();
```

**Usage in Next.js:**

```typescript
// Only use admin connection string when absolutely necessary
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ADMIN_API_KEY,  // Service role key
  {
    auth: { persistSession: false }
  }
);

// Support endpoint: Audit trail required
async function getSupportViewOfTenant(tenantId: string) {
  const { data } = await adminSupabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId);

  // Log this action
  await supabase
    .from('admin_audit_log')
    .insert({
      admin_id: currentUserId,
      action: 'SUPPORT_VIEW',
      table_name: 'documents',
      tenant_id: tenantId,
      row_count: data?.length || 0
    });

  return data;
}
```

---

## Part 4: Multi-Tenant Invite System (Users in Multiple Organizations)

### Pattern: Membership-Based Access

Users can belong to multiple tenants (organizations) with different roles in each.

#### Schema Design

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(tenant_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP DEFAULT now(),
  accepted_at TIMESTAMP,
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(tenant_id),
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  accepted_at TIMESTAMP
);
```

#### Invitation Flow

```typescript
// app/api/invitations/send.ts
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: Request) {
  const { tenantId, email, role } = await request.json();
  const userId = request.headers.get('x-user-id');

  // Step 1: Verify requester has permission to invite
  const { data: requester } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (!requester || !['owner', 'admin'].includes(requester.role)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Step 2: Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

  // Step 3: Create invitation
  const { error } = await supabase
    .from('invitations')
    .insert({
      tenant_id: tenantId,
      email,
      role,
      token,
      expires_at: expiresAt,
      created_by: userId
    });

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Step 4: Send email with invite link
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
  await sendInviteEmail(email, inviteUrl);

  return Response.json({ success: true });
}
```

```typescript
// app/invite/[token]/page.tsx
import { acceptInvitation } from '@/lib/invitations';

export default async function AcceptInvitePage({
  params
}: {
  params: { token: string }
}) {
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', params.token)
    .single();

  if (!invitation || new Date(invitation.expires_at) < new Date()) {
    return <div>Invitation expired or invalid</div>;
  }

  const onAccept = async () => {
    'use server';
    await acceptInvitation(invitation.token);
  };

  return (
    <form action={onAccept}>
      <p>Accept invitation to join {invitation.tenant_id}?</p>
      <button type="submit">Accept</button>
    </form>
  );
}
```

```typescript
// lib/invitations.ts
export async function acceptInvitation(token: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (!invitation) throw new Error('Invitation not found');
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('Invitation expired');
  }
  if (invitation.email !== user.email) {
    throw new Error('Email mismatch');
  }

  // Create membership
  const { error } = await supabase
    .from('memberships')
    .insert({
      tenant_id: invitation.tenant_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.created_by,
      accepted_at: new Date()
    })
    .select()
    .single();

  if (error && error.code !== 'PGRST116') {  // Ignore duplicate key errors
    throw error;
  }

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date() })
    .eq('id', invitation.id);
}
```

#### Accessing User's Tenants

```typescript
// app/dashboard/page.tsx
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase';

export default async function Dashboard() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const supabase = createClient();

  // Get all tenants user belongs to
  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      tenant_id,
      role,
      organizations!inner(name, slug)
    `)
    .eq('user_id', userId);

  return (
    <div>
      <h1>My Workspaces</h1>
      <ul>
        {memberships?.map(m => (
          <li key={m.tenant_id}>
            <a href={`https://${m.organizations.slug}.app.com/dashboard`}>
              {m.organizations.name} ({m.role})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Part 5: Security Checklist - Preventing Cross-Tenant Leaks

**The #1 multi-tenant risk:** One line of buggy code exposes all tenant data.

### Defense Layers (Defense in Depth)

```
Layer 1: DATABASE (RLS policies)
         ↓ FAIL-SAFE
Layer 2: APPLICATION (Always filter by tenant_id)
         ↓ FAIL-SAFE
Layer 3: STORAGE (Bucket permissions)
         ↓ FAIL-SAFE
Layer 4: LOGGING & AUDITING (Detect anomalies)
```

### Verification Checklist

- [ ] **RLS Enabled on ALL tenant-scoped tables**
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  SELECT tablename FROM pg_class WHERE relrowsecurity = true;
  -- Should show ALL tenant tables with RLS enabled
  ```

- [ ] **Every INSERT/UPDATE/DELETE includes tenant_id**
  ```typescript
  // ❌ Wrong - Missing tenant_id
  await supabase
    .from('documents')
    .insert({ title: 'My Doc' });

  // ✅ Right - Always include tenant_id
  await supabase
    .from('documents')
    .insert({
      title: 'My Doc',
      tenant_id: tenantId,
      owner_id: userId
    });
  ```

- [ ] **JWT includes tenant_id in app_metadata**
  ```typescript
  const token = await supabase.auth.getSession();
  console.log(token.session.user.user_metadata.tenant_id);  // Must exist
  ```

- [ ] **Middleware always sets x-tenant-id header**
  ```typescript
  // In middleware.ts
  response.headers.set('x-tenant-id', tenantId);
  ```

- [ ] **All Server Components read tenant from headers**
  ```typescript
  import { headers } from 'next/headers';

  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  if (!tenantId) throw new Error('Tenant context missing');
  ```

- [ ] **Storage buckets have row-level policies**
  ```sql
  CREATE POLICY "Storage bucket isolation"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'tenant-files'
    AND (storage.foldername(name))[1] = auth.tenant_id()::text
  );
  ```

- [ ] **API routes validate tenant ownership**
  ```typescript
  // app/api/documents/[id]/route.ts
  export async function GET(request, { params }) {
    const tenantId = request.headers.get('x-tenant-id');
    
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', tenantId)  // CRITICAL: Filter by tenant
      .single();

    if (!doc) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(doc);
  }
  ```

- [ ] **Logging captures tenant context on errors**
  ```typescript
  try {
    // Operation
  } catch (error) {
    console.error({
      error: error.message,
      tenantId,
      userId,
      operation: 'document_update',
      timestamp: new Date()
    });
  }
  ```

- [ ] **Connection pooling uses Supavisor (Supabase default)**
  - Verify in Supabase dashboard: Database → Connection pooling → Enabled
  - Set pool size to 20-30 for most apps (not 120+)

---

## Part 6: Performance & Scalability

### Connection Pooling with Supavisor

Supabase includes Supavisor, a cloud-native connection pooler that handles millions of connections.

```
Application → Supavisor (Transaction Mode) → PostgreSQL
    ↓
"Use transaction mode" - Pooler recycles connections per transaction (best for Serverless)
```

**Configuration in Supabase Dashboard:**
- Mode: Transaction (for Serverless/Next.js)
- Pool Size: `(CPU cores × 2) + Spare connections`
  - 2-core plan: Pool size = 6
  - 4-core plan: Pool size = 10
  - Keep under 80% of available connections

**Monitor pool usage:**
```sql
SELECT 
  datname,
  usename,
  count(*) as connection_count
FROM pg_stat_activity
GROUP BY datname, usename
ORDER BY connection_count DESC;
```

### RLS Performance Tips

1. **Index on tenant_id** (already done if using REFERENCES)
   ```sql
   CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
   ```

2. **Use materialized views for complex tenant queries**
   ```sql
   CREATE MATERIALIZED VIEW tenant_document_stats AS
   SELECT 
     tenant_id,
     COUNT(*) as total_documents,
     SUM(COALESCE(file_size, 0)) as total_size
   FROM documents
   GROUP BY tenant_id;
   
   CREATE UNIQUE INDEX idx_tenant_doc_stats ON tenant_document_stats(tenant_id);
   
   -- Refresh monthly
   REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_document_stats;
   ```

3. **Cache RLS policies (Supabase does this automatically)**
   - RLS policies are compiled and cached per query type
   - No performance penalty after first query

---

## Part 7: Scaling Tiers (Free to Enterprise)

### Free Tier: Shared Infrastructure
- Shared DB + RLS
- Subdomain routing
- 1-10 customers on one DB
- Connection limit: 20

### Growth Tier: Optimized
- Shared DB + RLS + Supavisor
- Path-based + subdomain routing
- 10-1000 customers
- Connection limit: 120
- Recommended: Pool size = 20-30

### Enterprise Tier: Dedicated
- Option 1: Shared DB + RLS + Dedicated compute
  - 1000+ customers on one DB
  - Dedicated 16+ core server
  - Connection limit: 500+

- Option 2: Database per tenant
  - 5-50 enterprise customers
  - Complete isolation
  - Separate backups per tenant

---

## Part 8: Common Errors & Solutions

### Error: "Permission denied for schema public"

```
Error: permission denied for schema public
```

**Cause:** Supabase user role doesn't have proper permissions.

**Fix:**
```sql
-- Ensure service_role can access tables
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
```

---

### Error: "Row-level security check failed"

```
Error: new row violates row-level security policy
```

**Cause:** Trying to insert/update row without tenant_id, or tenant_id doesn't match RLS policy.

**Fix:**
```typescript
// ALWAYS include tenant_id
const { error } = await supabase
  .from('documents')
  .insert({
    title: 'Doc',
    tenant_id: tenantId,  // REQUIRED
    owner_id: userId      // REQUIRED
  });

if (error?.code === 'PGRST100') {
  console.error('RLS violation:', error.message);
  // Usually means tenant_id mismatch or missing
}
```

---

### Error: "Custom domain not routing to app"

**Cause:** Domain not registered in Vercel project settings.

**Fix:**
1. Register custom domain via Vercel API:
   ```typescript
   async function registerCustomDomain(domain: string, tenantId: string) {
     const response = await fetch('https://api.vercel.com/v10/projects/' + projectId + '/domains', {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${process.env.VERCEL_TOKEN}`
       },
       body: JSON.stringify({
         name: domain,
         gitBranch: 'main'
       })
     });
     return response.json();
   }
   ```

2. Or: Manual registration in Vercel Dashboard → Project Settings → Domains

---

## References

- [Supabase Row-Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Custom Claims](https://supabase.com/docs/guides/auth/auth-token-hooks)
- [Supavisor Connection Pooling](https://supabase.com/docs/guides/database/connection-pooling-supavisor)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Multi-Tenant Security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [AWS Multi-Tenant Data Isolation](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)

---

## Anti-Patterns to Avoid

❌ **Using auth.uid() alone for tenant isolation**
- ✅ Always combine with `auth.tenant_id()`

❌ **Storing tenant_id in client-side state**
- ✅ Derive from JWT or middleware headers only

❌ **Skipping RLS on "low-risk" tables**
- ✅ Enable RLS on ALL tables with tenant_id

❌ **Concatenating tenant_id into raw SQL**
- ✅ Always use parameterized queries

❌ **Trusting frontend to enforce tenant boundaries**
- ✅ Backend (RLS) is the source of truth

❌ **Single domain for all tenants**
- ✅ Use subdomains or custom domains for tenant isolation

❌ **Multiple options without recommendation**
- ✅ Start with Shared DB + RLS for 99% of SaaS startups
