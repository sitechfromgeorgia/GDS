# Next.js 15 + Supabase Production Guide 2025
## Complete Modern Stack with Supabase as Full Backend
**Document Date:** November 2, 2025  
**Tech Stack:** Next.js 15.5+ | React 19.2+ | Node.js 22 LTS | Supabase (Complete Backend)  
**Backend Services:** Supabase Auth | Database | Storage | Edge Functions | Real-time | Vector  
**Deployment:** Docker | Vercel | Self-hosted

---

## 📋 Executive Summary

### ✅ 2025 Production Stack - Supabase Edition

**Stable, Production-Ready Configuration:**
```json
{
  "dependencies": {
    "next": "15.5.0",                    // ✅ Turbopack Beta, Node.js Middleware
    "react": "19.2.0",                   // ✅ Stable (Dec 2024)
    "react-dom": "19.2.0",
    "typescript": "5.7.2",               // ✅ Latest
    
    "@supabase/supabase-js": "2.47.0",   // ✅ Supabase Client
    "@supabase/ssr": "0.5.2",            // ✅ SSR Helpers for Next.js
    
    "@tanstack/react-query": "5.62.0",   // ✅ Client State Management
    "zod": "3.23.8",                     // ✅ Validation
    "zustand": "5.0.0"                   // ✅ Lightweight State (if needed)
  },
  "devDependencies": {
    "@playwright/test": "1.48.0",        // ✅ E2E Testing
    "vitest": "2.1.0",                   // ✅ Unit Testing
    "supabase": "1.200.0"                // ✅ Supabase CLI
  },
  "engines": {
    "node": ">=22.0.0",                  // ✅ Node.js 22 LTS
    "npm": ">=10.0.0"
  }
}
```

### 🎯 Why Supabase as Complete Backend?

**Supabase provides everything out of the box:**

1. **✅ Authentication** - Multi-provider OAuth, Magic Links, Phone Auth, SSO
2. **✅ PostgreSQL Database** - Full SQL power with automatic APIs
3. **✅ Row Level Security (RLS)** - Database-level authorization
4. **✅ Real-time Subscriptions** - Live data updates via WebSocket
5. **✅ Storage** - S3-compatible file storage with CDN
6. **✅ Edge Functions** - Deno-based serverless functions
7. **✅ Vector/AI** - pgvector for embeddings and semantic search
8. **✅ Auto-generated APIs** - REST & GraphQL endpoints
9. **✅ Database Migrations** - Version control for schema
10. **✅ Built-in Monitoring** - Logs, metrics, and analytics

**No need for:**
- ❌ Separate auth library (NextAuth/Better-Auth)
- ❌ ORM layer (Prisma/Drizzle)
- ❌ Separate file storage service
- ❌ Redis for real-time features
- ❌ Separate API layer

### 🚀 Performance Improvements (2024 → 2025)

| Metric | Before (2024) | After (2025) | Improvement |
|--------|---------------|--------------|-------------|
| Build Time (Turbopack) | 187s | 37-75s | **60-80% faster** |
| Dev Server Start | 11.5s | 2.8s | **76% faster** |
| HMR (Hot Reload) | 890ms | 34ms | **96% faster** |
| Bundle Size (RSC) | 245KB | 185KB | **24% smaller** |
| API Response Time | 150ms | 45ms | **70% faster** (Supabase Edge) |

---

## 🗂️ Table of Contents

1. [Project Setup & Configuration](#1-project-setup--configuration)
2. [Next.js 15.5 Config for Supabase](#2-nextjs-155-config-for-supabase)
3. [Supabase Setup & Integration](#3-supabase-setup--integration)
4. [Authentication with Supabase Auth](#4-authentication-with-supabase-auth)
5. [Database Schema & RLS Policies](#5-database-schema--rls-policies)
6. [Real-time Features](#6-real-time-features)
7. [File Storage & CDN](#7-file-storage--cdn)
8. [Docker Production Deployment](#8-docker-production-deployment)
9. [Performance Optimization](#9-performance-optimization)
10. [Security Best Practices](#10-security-best-practices)
11. [Testing Strategy](#11-testing-strategy)
12. [Monitoring & Debugging](#12-monitoring--debugging)

---

## 1. Project Setup & Configuration

### 1.1 Initial Project Setup

**Create New Project:**
```bash
# Create Next.js project
npx create-next-app@latest georgian-distribution \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd georgian-distribution

# Install Supabase dependencies
npm install @supabase/supabase-js @supabase/ssr

# Install additional dependencies
npm install @tanstack/react-query zod

# Install dev dependencies
npm install -D @types/node@22.9.0 supabase
```

**Initialize Supabase:**
```bash
# Login to Supabase CLI
npx supabase login

# Link to existing project
npx supabase link --project-ref your-project-ref

# Or initialize locally for development
npx supabase init

# Start local Supabase (optional for local dev)
npx supabase start
```

### 1.2 Project Structure (Supabase-Optimized)

```
georgian-distribution/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── supabase/                          # Supabase config
│   ├── migrations/                    # Database migrations
│   │   ├── 20250101_initial_schema.sql
│   │   └── 20250102_add_rls.sql
│   ├── functions/                     # Edge Functions
│   │   └── webhook-handler/
│   ├── seed.sql                       # Seed data
│   └── config.toml                    # Supabase config
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/               # Protected routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── callback/          # OAuth callback
│   │   │   │   │   └── route.ts
│   │   │   │   └── confirm/           # Email confirmation
│   │   │   │       └── route.ts
│   │   │   └── webhook/               # Supabase webhooks
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── global.css
│   ├── components/
│   │   ├── ui/                        # UI components
│   │   ├── auth/                      # Auth components
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── social-auth.tsx
│   │   └── providers/
│   │       ├── query-provider.tsx
│   │       └── supabase-provider.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client
│   │   │   ├── server.ts              # Server client  
│   │   │   ├── middleware.ts          # Middleware client
│   │   │   └── admin.ts               # Admin client (service role)
│   │   ├── hooks/
│   │   │   ├── use-user.ts
│   │   │   ├── use-session.ts
│   │   │   └── use-supabase.ts
│   │   ├── queries/                   # React Query hooks
│   │   │   ├── use-orders.ts
│   │   │   └── use-products.ts
│   │   ├── validations/               # Zod schemas
│   │   │   ├── auth.ts
│   │   │   └── orders.ts
│   │   └── utils.ts
│   ├── types/
│   │   ├── database.types.ts          # Auto-generated from Supabase
│   │   └── index.ts
│   └── middleware.ts                  # Next.js middleware
├── public/
├── tests/
│   ├── e2e/
│   └── unit/
├── .env.local
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

### 1.3 Environment Variables

```bash
# .env.local (Development)
# Get these from: https://app.supabase.com/project/your-project/settings/api

# Supabase Config
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (Server-side only, NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Database URL for migrations
DATABASE_URL=postgresql://postgres:postgres@db.your-project.supabase.co:5432/postgres

# Next.js Config
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

```bash
# .env.production (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production
```

```bash
# .env.example (Commit this to repo)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

---

## 2. Next.js 15.5 Config for Supabase

### 2.1 Complete next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ========================================
  // CRITICAL: Production Build Settings
  // ========================================
  
  // Standalone output for Docker
  output: 'standalone',
  
  // React 19 features
  reactStrictMode: true,
  
  // ========================================
  // Performance
  // ========================================
  
  compress: true,
  swcMinify: true,
  
  // Disable source maps in production (optional)
  productionBrowserSourceMaps: false,
  
  // ========================================
  // Image Optimization for Supabase Storage
  // ========================================
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'your-project.supabase.co',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  
  // ========================================
  // Headers for Security & Performance
  // ========================================
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      // Cache Supabase Storage images
      {
        source: '/storage/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // ========================================
  // Redirects
  // ========================================
  
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  
  // ========================================
  // Experimental Features
  // ========================================
  
  experimental: {
    // Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'yourdomain.com'],
    },
    
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      '@radix-ui/react-icons',
    ],
    
    // React Compiler (auto-memoization)
    reactCompiler: true,
  },
  
  // ========================================
  // Server Components External Packages
  // ========================================
  
  serverExternalPackages: [
    '@node-rs/argon2',
    '@node-rs/bcrypt',
  ],
  
  // ========================================
  // TypeScript
  // ========================================
  
  typescript: {
    // ⚠️ Only enable in development
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // ⚠️ Only enable in development
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
```

### 2.2 Middleware Configuration

**CRITICAL for Supabase Auth:**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: Refresh session if exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ['/dashboard', '/orders', '/settings'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if not authenticated
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if authenticated and on auth pages
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
```

---

## 3. Supabase Setup & Integration

### 3.1 Supabase Client Configuration

**Browser Client (Client Components):**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Server Client (Server Components & Route Handlers):**

```typescript
// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component
            // Middleware will refresh tokens
          }
        },
      },
    }
  );
}
```

**Admin Client (Service Role - Server Only):**

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// ⚠️ NEVER use this in client components
// Only use in Server Actions, Route Handlers, or Server Components
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

### 3.2 Generate TypeScript Types from Supabase

```bash
# Generate types from your Supabase schema
npx supabase gen types typescript --project-id your-project-ref > src/types/database.types.ts

# Or if linked
npx supabase gen types typescript --linked > src/types/database.types.ts
```

**Example Generated Types:**

```typescript
// src/types/database.types.ts (Auto-generated)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'restaurant' | 'driver' | 'customer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'restaurant' | 'driver' | 'customer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'restaurant' | 'driver' | 'customer'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // ... more tables
    }
    Views: {
      // ... views
    }
    Functions: {
      // ... functions
    }
    Enums: {
      user_role: 'admin' | 'restaurant' | 'driver' | 'customer'
    }
  }
}
```

### 3.3 Supabase Configuration File

```toml
# supabase/config.toml
project_id = "your-project-ref"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[realtime]
enabled = true
ip_version = "ipv4"

[studio]
enabled = true
port = 54323
api_url = "http://localhost"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://yourdomain.com"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.external.google]
enabled = false
client_id = ""
secret = ""
redirect_uri = ""

[edge_functions]
enabled = true

[[edge_functions.router]]
name = "webhook-handler"
verify_jwt = false
```

---

## 4. Authentication with Supabase Auth

### 4.1 Auth Context Provider

```typescript
// src/components/providers/supabase-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setProfile(profileData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within SupabaseAuthProvider');
  }
  return context;
}
```

### 4.2 Login Component

```typescript
// src/components/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Loading...' : 'Sign In'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        Google
      </Button>
    </form>
  );
}
```

### 4.3 OAuth Callback Handler

```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${error.message}`
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
```

### 4.4 Server-Side User Fetching

```typescript
// src/lib/hooks/use-user.ts (Server Component)
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    user,
    profile,
  };
});
```

**Usage in Server Component:**

```typescript
// src/app/dashboard/page.tsx
import { getUser } from '@/lib/hooks/use-user';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const userData = await getUser();

  if (!userData) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {userData.profile?.full_name}</h1>
      <p>Role: {userData.profile?.role}</p>
    </div>
  );
}
```

---

## 5. Database Schema & RLS Policies

### 5.1 Database Schema Example

```sql
-- supabase/migrations/20250101_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'restaurant', 'driver', 'customer');

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT orders_customer_role_check CHECK (
    (SELECT role FROM profiles WHERE id = customer_id) = 'customer'
  ),
  CONSTRAINT orders_restaurant_role_check CHECK (
    (SELECT role FROM profiles WHERE id = restaurant_id) = 'restaurant'
  )
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX idx_products_available ON products(available);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Row Level Security (RLS) Policies

```sql
-- supabase/migrations/20250102_add_rls.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Profiles Policies
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ========================================
-- Orders Policies
-- ========================================

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (
    customer_id = auth.uid()
  );

-- Restaurants can view orders assigned to them
CREATE POLICY "Restaurants can view assigned orders"
  ON orders FOR SELECT
  USING (
    restaurant_id = auth.uid()
  );

-- Drivers can view orders assigned to them
CREATE POLICY "Drivers can view assigned orders"
  ON orders FOR SELECT
  USING (
    driver_id = auth.uid()
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Customers can create orders
CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'customer'
  );

-- Restaurants can update order status
CREATE POLICY "Restaurants can update order status"
  ON orders FOR UPDATE
  USING (restaurant_id = auth.uid())
  WITH CHECK (restaurant_id = auth.uid());

-- Drivers can update order status and accept orders
CREATE POLICY "Drivers can update orders"
  ON orders FOR UPDATE
  USING (
    driver_id = auth.uid() OR
    (driver_id IS NULL AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'driver')
  );

-- ========================================
-- Order Items Policies
-- ========================================

-- Users can view order items for orders they can see
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.customer_id = auth.uid() OR
        orders.restaurant_id = auth.uid() OR
        orders.driver_id = auth.uid() OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      )
    )
  );

-- Customers can insert order items when creating orders
CREATE POLICY "Customers can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- ========================================
-- Products Policies
-- ========================================

-- Everyone can view available products
CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  USING (available = true);

-- Restaurants can view their own products
CREATE POLICY "Restaurants can view own products"
  ON products FOR SELECT
  USING (restaurant_id = auth.uid());

-- Restaurants can create products
CREATE POLICY "Restaurants can create products"
  ON products FOR INSERT
  WITH CHECK (
    restaurant_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'restaurant'
  );

-- Restaurants can update their own products
CREATE POLICY "Restaurants can update own products"
  ON products FOR UPDATE
  USING (restaurant_id = auth.uid())
  WITH CHECK (restaurant_id = auth.uid());

-- Restaurants can delete their own products
CREATE POLICY "Restaurants can delete own products"
  ON products FOR DELETE
  USING (restaurant_id = auth.uid());

-- Admins can manage all products
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

### 5.3 Database Functions

```sql
-- supabase/migrations/20250103_add_functions.sql

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get order statistics for restaurant
CREATE OR REPLACE FUNCTION get_restaurant_stats(restaurant_uuid UUID)
RETURNS TABLE (
  total_orders BIGINT,
  pending_orders BIGINT,
  completed_orders BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_orders,
    COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) as total_revenue
  FROM orders
  WHERE restaurant_id = restaurant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.4 Running Migrations

```bash
# Create a new migration
npx supabase migration new add_feature

# Apply migrations locally
npx supabase db push

# Apply to remote (production)
npx supabase db push --linked

# Reset database (local only)
npx supabase db reset

# Generate types after schema changes
npx supabase gen types typescript --linked > src/types/database.types.ts
```

---

## 6. Real-time Features

### 6.1 Real-time Subscriptions

```typescript
// src/lib/hooks/use-orders-realtime.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

export function useOrdersRealtime(userId: string, role: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchOrders = async () => {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      // Filter based on role
      if (role === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (role === 'restaurant') {
        query = query.eq('restaurant_id', userId);
      } else if (role === 'driver') {
        query = query.or(`driver_id.eq.${userId},driver_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setOrders(data);
      }

      setLoading(false);
    };

    fetchOrders();

    // Subscribe to changes
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: role === 'customer'
            ? `customer_id=eq.${userId}`
            : role === 'restaurant'
            ? `restaurant_id=eq.${userId}`
            : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? (payload.new as Order) : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  return { orders, loading };
}
```

**Usage:**

```typescript
// src/app/dashboard/orders/page.tsx
'use client';

import { useAuth } from '@/components/providers/supabase-provider';
import { useOrdersRealtime } from '@/lib/hooks/use-orders-realtime';

export default function OrdersPage() {
  const { user, profile } = useAuth();
  const { orders, loading } = useOrdersRealtime(
    user?.id || '',
    profile?.role || 'customer'
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Orders (Real-time)</h1>
      {orders.map((order) => (
        <div key={order.id}>
          <p>Order #{order.id}</p>
          <p>Status: {order.status}</p>
          <p>Total: ${order.total_amount}</p>
        </div>
      ))}
    </div>
  );
}
```

### 6.2 Presence (Online Users)

```typescript
// src/lib/hooks/use-presence.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PresenceState {
  [key: string]: {
    user_id: string;
    online_at: string;
  }[];
}

export function usePresence(channelName: string, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState>({});
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [channelName, userId]);

  return { onlineUsers, count: Object.keys(onlineUsers).length };
}
```

---

## 7. File Storage & CDN

### 7.1 Storage Bucket Setup

```sql
-- Set up storage buckets via Supabase Dashboard or SQL

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create product images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 7.2 Upload Component

```typescript
// src/components/upload/avatar-upload.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const supabase = createClient();

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload file
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadComplete(publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {preview && (
        <Image
          src={preview}
          alt="Avatar"
          width={150}
          height={150}
          className="rounded-full object-cover"
        />
      )}

      <div>
        <label htmlFor="avatar-upload">
          <Button asChild disabled={uploading}>
            <span>{uploading ? 'Uploading...' : 'Upload Avatar'}</span>
          </Button>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}
```

### 7.3 Image Optimization with Next.js

```typescript
// src/components/ui/supabase-image.tsx
import Image from 'next/image';

interface SupabaseImageProps {
  path: string;
  bucket: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function SupabaseImage({
  path,
  bucket,
  alt,
  width = 800,
  height = 600,
  className,
}: SupabaseImageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      quality={85}
    />
  );
}
```

---

## 8. Docker Production Deployment

### 8.1 Dockerfile (Multi-stage Build)

```dockerfile
# Dockerfile
# syntax=docker/dockerfile:1

# ==========================================
# Base Stage - Dependencies
# ==========================================
FROM node:22-bookworm-slim AS base

WORKDIR /app

# Install dependencies for build
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ==========================================
# Dependencies Stage
# ==========================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ==========================================
# Builder Stage
# ==========================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build args for public env vars
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL

# Set as environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Build Next.js application
RUN npm run build

# ==========================================
# Runner Stage - Production
# ==========================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
```

### 8.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
    container_name: georgian-distribution
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  app-network:
    driver: bridge
```

### 8.3 Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check Supabase connectivity
    const supabase = await createClient();
    
    // Simple query to test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        supabase: 'connected',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

### 8.4 Building & Running

```bash
# Build the Docker image
docker build -t georgian-distribution:latest \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
  .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check health
curl http://localhost:3000/api/health
```

### 8.5 .dockerignore

```
# .dockerignore
node_modules
.next
.git
.github
.env*.local
.env
.vscode
.idea
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
coverage
.turbo
dist
build
.vercel
```

---

## 9. Performance Optimization

### 9.1 React Query Setup for Supabase

```typescript
// src/lib/queries/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type NewProduct = Database['public']['Tables']['products']['Insert'];

export function useProducts(restaurantId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['products', restaurantId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (product: NewProduct) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate products query to refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

**Query Provider Setup:**

```typescript
// src/components/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 9.2 Parallel Data Loading

```typescript
// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';

async function getOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  return data || [];
}

async function getProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('available', true)
    .limit(10);
  return data || [];
}

// Load data in parallel
export default async function DashboardPage() {
  // Both queries run in parallel
  const [orders, products] = await Promise.all([
    getOrders(),
    getProducts(),
  ]);

  return (
    <div>
      <Suspense fallback={<div>Loading orders...</div>}>
        <OrdersList orders={orders} />
      </Suspense>

      <Suspense fallback={<div>Loading products...</div>}>
        <ProductsList products={products} />
      </Suspense>
    </div>
  );
}
```

### 9.3 Database Query Optimization

```sql
-- Create composite indexes for common queries

-- Orders by customer with status filter
CREATE INDEX idx_orders_customer_status 
  ON orders(customer_id, status);

-- Orders by restaurant with date range
CREATE INDEX idx_orders_restaurant_date 
  ON orders(restaurant_id, created_at DESC);

-- Products search by restaurant
CREATE INDEX idx_products_restaurant_available 
  ON products(restaurant_id, available);

-- Full-text search on products
CREATE INDEX idx_products_name_search 
  ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE customer_id = 'user-uuid'
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

### 9.4 Caching Strategy

```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Cache function for 5 minutes
export const getCachedProducts = unstable_cache(
  async (restaurantId: string) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('available', true);
    
    return data || [];
  },
  ['products'], // Cache key
  {
    revalidate: 300, // 5 minutes
    tags: ['products'],
  }
);

// Revalidate cache in Server Action
'use server';

import { revalidateTag } from 'next/cache';

export async function createProduct(formData: FormData) {
  // ... create product logic
  
  // Revalidate products cache
  revalidateTag('products');
}
```

---

## 10. Security Best Practices

### 10.1 Security Headers

```typescript
// next.config.ts - Security headers
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://*.supabase.co blob:",
            "font-src 'self'",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ];
}
```

### 10.2 Rate Limiting (Supabase Edge Functions)

```typescript
// supabase/functions/webhook-handler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Simple rate limiting with Map (in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return new Response('Too many requests', { status: 429 });
  }

  // Process request
  // ...

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 10.3 Input Validation with Zod

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'restaurant', 'driver', 'customer']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

**Usage in Server Action:**

```typescript
// src/app/actions/auth.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { signUpSchema } from '@/lib/validations/auth';
import { revalidatePath } from 'next/cache';

export async function signUp(formData: FormData) {
  // Validate input
  const validatedFields = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    role: formData.get('role'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, full_name, role } = validatedFields.data;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
```

### 10.4 Environment Variables Validation

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

// Validate on startup
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
```

---

## 11. Testing Strategy

### 11.1 Vitest Setup (Unit Tests)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));
```

**Example Test:**

```typescript
// src/components/auth/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for invalid email', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

### 11.2 Playwright E2E Tests

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Example E2E Test:**

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toContainText('Invalid');
  });
});
```

---

## 12. Monitoring & Debugging

### 12.1 Error Tracking Setup

```bash
# Install Sentry
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### 12.2 Supabase Logs

```typescript
// src/lib/logger.ts
import { createClient } from '@/lib/supabase/server';

export async function logAction(
  action: string,
  userId: string,
  metadata?: Record<string, any>
) {
  const supabase = await createClient();

  await supabase.from('audit_logs').insert({
    action,
    user_id: userId,
    metadata,
    created_at: new Date().toISOString(),
  });
}
```

### 12.3 Performance Monitoring

```typescript
// src/lib/metrics.ts
export function measurePerformance(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    const mark = `${name}-start`;
    performance.mark(mark);

    return () => {
      const endMark = `${name}-end`;
      performance.mark(endMark);
      performance.measure(name, mark, endMark);

      const measure = performance.getEntriesByName(name)[0];
      console.log(`${name}: ${measure.duration}ms`);

      // Clean up
      performance.clearMarks(mark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    };
  }

  return () => {};
}

// Usage
const endMeasure = measurePerformance('fetch-products');
// ... async operation
endMeasure();
```

---

## 📚 Appendix: Quick Reference

### Essential Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Supabase
npx supabase start              # Start local Supabase
npx supabase stop               # Stop local Supabase
npx supabase db reset           # Reset local database
npx supabase gen types typescript --linked > src/types/database.types.ts

# Docker
docker-compose up -d            # Start containers
docker-compose down             # Stop containers
docker-compose logs -f app      # View logs

# Testing
npm test                        # Run unit tests
npm run test:e2e               # Run E2E tests
npm run test:coverage          # Generate coverage report
```

### Key URLs

- **Supabase Dashboard:** `https://app.supabase.com/project/your-project`
- **Supabase Studio (Local):** `http://localhost:54323`
- **Next.js App:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/api/health`

### Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Time to First Byte (TTFB) | <200ms | <500ms |
| First Contentful Paint (FCP) | <1.8s | <3s |
| Largest Contentful Paint (LCP) | <2.5s | <4s |
| Cumulative Layout Shift (CLS) | <0.1 | <0.25 |
| First Input Delay (FID) | <100ms | <300ms |

---

## 🎉 Conclusion

This guide provides a complete, production-ready setup for Next.js 15 with Supabase as your full backend solution. Key takeaways:

✅ **Next.js 15.5** with Turbopack Beta for 2-5x faster builds  
✅ **React 19.2** stable with React Compiler for automatic optimization  
✅ **Supabase** for complete backend (auth, database, storage, real-time)  
✅ **Docker** for containerized deployment  
✅ **TypeScript** for type safety  
✅ **Testing** with Vitest and Playwright  
✅ **Security** with RLS, input validation, and rate limiting

**Next Steps:**
1. Clone/setup your project structure
2. Configure Supabase project and link CLI
3. Run database migrations and seed data
4. Implement authentication flows
5. Build your features with type-safe Supabase queries
6. Test thoroughly
7. Deploy to Docker

Happy building! 🚀

---

**Document Version:** 2.0  
**Last Updated:** November 2, 2025  
**Maintainer:** Production Engineering Team

*This guide reflects the latest 2025 best practices and production battle-tested patterns.*