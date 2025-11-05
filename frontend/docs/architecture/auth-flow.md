# Authentication Flow Documentation

**System**: Distribution Management System
**Auth Provider**: Supabase Auth
**Last Updated**: 2025-11-05

---

## Table of Contents
1. [Overview](#overview)
2. [Authentication Methods](#authentication-methods)
3. [Login Flow](#login-flow)
4. [Session Management](#session-management)
5. [Role-Based Access Control](#role-based-access-control)
6. [Security Features](#security-features)
7. [Implementation Examples](#implementation-examples)

---

## Overview

The system uses Supabase Auth for authentication, providing secure JWT-based sessions with role-based access control. All authentication flows are server-side rendered for security.

### Key Features
- ✅ Email/password authentication
- ✅ JWT-based sessions (5-hour expiry)
- ✅ Optional "Remember Me" (30-day sessions)
- ✅ Automatic session refresh
- ✅ Role-based access control (Admin, Restaurant, Driver)
- ✅ Server-side session validation
- ✅ HttpOnly cookies for XSS protection

---

## Authentication Methods

### 1. Email/Password Login

The primary authentication method for all user types.

**Flow Diagram**:
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Next.js  │     │ Supabase │     │   Auth   │
│ Browser  │     │  Server  │     │   Auth   │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │                 │
     │ 1. POST /login │                 │                 │
     │  (email, pwd)  │                 │                 │
     ├───────────────>│                 │                 │
     │                │                 │                 │
     │                │ 2. signInWith   │                 │
     │                │    Password()   │                 │
     │                ├────────────────>│                 │
     │                │                 │                 │
     │                │                 │ 3. Verify       │
     │                │                 │    Credentials  │
     │                │                 ├────────────────>│
     │                │                 │                 │
     │                │                 │ 4. User + Hash  │
     │                │                 │<────────────────┤
     │                │                 │                 │
     │                │                 │ 5. Compare Hash │
     │                │                 │────────┐        │
     │                │                 │        │        │
     │                │                 │<───────┘        │
     │                │                 │                 │
     │                │                 │ 6. Generate JWT │
     │                │                 │────────┐        │
     │                │                 │        │        │
     │                │                 │<───────┘        │
     │                │                 │                 │
     │                │ 7. Session +    │                 │
     │                │    JWT Token    │                 │
     │                │<────────────────┤                 │
     │                │                 │                 │
     │                │ 8. Get Profile  │                 │
     │                │    (with role)  │                 │
     │                ├────────────────>│                 │
     │                │                 │                 │
     │                │ 9. Profile Data │                 │
     │                │<────────────────┤                 │
     │                │                 │                 │
     │                │ 10. Set Cookies │                 │
     │                │     (HttpOnly)  │                 │
     │                │────────┐        │                 │
     │                │        │        │                 │
     │                │<───────┘        │                 │
     │                │                 │                 │
     │ 11. Redirect   │                 │                 │
     │     to Dashboard                 │                 │
     │<───────────────┤                 │                 │
     │                │                 │                 │
```

**Code Implementation**:
```typescript
// app/login/actions.ts
'use server'

export async function loginAction(formData: FormData) {
  const supabase = await createServerClient()

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  // Step 1: Sign in with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword(credentials)

  if (authError) {
    return { error: 'Invalid email or password' }
  }

  // Step 2: Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profile not found' }
  }

  // Step 3: Redirect based on role
  const dashboards = {
    admin: '/dashboard/admin',
    restaurant: '/dashboard/restaurant',
    driver: '/dashboard/driver'
  }

  redirect(dashboards[profile.role])
}
```

---

## Login Flow

### Complete Authentication Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

User                Browser              Next.js              Supabase
  │                    │                    │                    │
  │ 1. Navigate to     │                    │                    │
  │    /login          │                    │                    │
  ├───────────────────>│                    │                    │
  │                    │                    │                    │
  │                    │ 2. GET /login      │                    │
  │                    ├───────────────────>│                    │
  │                    │                    │                    │
  │                    │ 3. Check Session   │                    │
  │                    │<───────────────────┤                    │
  │                    │                    │                    │
  │                    │ 4. Login Form      │                    │
  │                    │<───────────────────┤                    │
  │                    │                    │                    │
  │ 5. Enter email &   │                    │                    │
  │    password        │                    │                    │
  ├───────────────────>│                    │                    │
  │                    │                    │                    │
  │ 6. Click Submit    │                    │                    │
  ├───────────────────>│                    │                    │
  │                    │                    │                    │
  │                    │ 7. POST /login     │                    │
  │                    ├───────────────────>│                    │
  │                    │                    │                    │
  │                    │                    │ 8. Authenticate    │
  │                    │                    ├───────────────────>│
  │                    │                    │                    │
  │                    │                    │ 9. JWT + Session   │
  │                    │                    │<───────────────────┤
  │                    │                    │                    │
  │                    │                    │ 10. Fetch Profile  │
  │                    │                    ├───────────────────>│
  │                    │                    │                    │
  │                    │                    │ 11. Profile Data   │
  │                    │                    │<───────────────────┤
  │                    │                    │                    │
  │                    │ 12. Set Cookies    │                    │
  │                    │<───────────────────┤                    │
  │                    │                    │                    │
  │                    │ 13. 302 Redirect   │                    │
  │                    │     to Dashboard   │                    │
  │                    │<───────────────────┤                    │
  │                    │                    │                    │
  │ 14. Dashboard Page │                    │                    │
  │<───────────────────┤                    │                    │
  │                    │                    │                    │
```

---

## Session Management

### Session Configuration

```typescript
// lib/supabase/server.ts
const cookieOptions = {
  name: 'sb-auth-token',
  domain: process.env.NEXT_PUBLIC_DOMAIN,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: rememberMe ? 30 * 24 * 60 * 60 : 5 * 60 * 60 // 30 days or 5 hours
}
```

### Session Lifetime

| Type | Duration | Use Case |
|------|----------|----------|
| **Standard Session** | 5 hours | Default login |
| **Remember Me** | 30 days | Persistent login |
| **Refresh Token** | 30 days | Auto-renewal |

### Session Refresh Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Next.js  │     │ Supabase │
│          │     │ Middleware│    │   Auth   │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │
     │ 1. API Request │                 │
     ├───────────────>│                 │
     │                │                 │
     │                │ 2. Check Token  │
     │                │────────┐        │
     │                │        │        │
     │                │<───────┘        │
     │                │                 │
     │                │ 3. Token Expired│
     │                │────────┐        │
     │                │        │        │
     │                │<───────┘        │
     │                │                 │
     │                │ 4. Refresh      │
     │                │    Session      │
     │                ├────────────────>│
     │                │                 │
     │                │ 5. New JWT      │
     │                │<────────────────┤
     │                │                 │
     │                │ 6. Update Cookie│
     │                │────────┐        │
     │                │        │        │
     │                │<───────┘        │
     │                │                 │
     │ 7. Response    │                 │
     │<───────────────┤                 │
     │                │                 │
```

**Implementation**:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request)

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // Check if session is expiring soon (within 10 minutes)
  if (session) {
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60)

    if (minutesUntilExpiry < 10) {
      // Refresh session
      await supabase.auth.refreshSession()
    }
  }

  return response
}
```

---

## Role-Based Access Control (RBAC)

### User Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                               │
└─────────────────────────────────────────────────────────────────────┘

                           ┌───────┐
                           │ ADMIN │
                           └───┬───┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
               ┌────▼────┐          ┌────▼────┐
               │RESTAURANT│          │ DRIVER  │
               └─────────┘          └─────────┘

ADMIN:
  ✅ Full system access
  ✅ User management
  ✅ View all orders
  ✅ Assign drivers
  ✅ System configuration

RESTAURANT:
  ✅ Create orders
  ✅ View own orders
  ✅ Manage products
  ✅ View analytics
  ❌ Cannot access other restaurants' data

DRIVER:
  ✅ View assigned orders
  ✅ Update delivery status
  ✅ View earnings
  ✅ Manage availability
  ❌ Cannot create orders
```

### Permission Matrix

| Action | Admin | Restaurant | Driver |
|--------|-------|------------|--------|
| **Users** |
| View all users | ✅ | ❌ | ❌ |
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Change user roles | ✅ | ❌ | ❌ |
| **Orders** |
| Create order | ❌ | ✅ | ❌ |
| View all orders | ✅ | ❌ | ❌ |
| View own orders | ✅ | ✅ | ❌ |
| View assigned orders | ✅ | ❌ | ✅ |
| Assign driver | ✅ | ❌ | ❌ |
| Update delivery status | ✅ | ❌ | ✅ |
| **Products** |
| Create product | ✅ | ❌ | ❌ |
| Update product | ✅ | ❌ | ❌ |
| View products | ✅ | ✅ | ✅ |

### Implementation

**Protected Route**:
```typescript
// components/auth/ProtectedRoute.tsx
export function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode
  allowedRoles: UserRole[]
}) {
  const { user, profile, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user || !profile) {
    redirect('/login')
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
```

**Usage**:
```typescript
// app/dashboard/admin/page.tsx
export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
```

---

## Security Features

### 1. Password Security

**Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Hashing**:
- bcrypt with salt rounds = 10
- Handled automatically by Supabase Auth

---

### 2. JWT Token Security

**Token Structure**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "restaurant",
  "iat": 1699564800,
  "exp": 1699582800,
  "aud": "authenticated"
}
```

**Security Measures**:
- ✅ Signed with secret key (HS256)
- ✅ Short expiry time (5 hours)
- ✅ HttpOnly cookies (XSS protection)
- ✅ SameSite=Lax (CSRF protection)
- ✅ Secure flag in production (HTTPS only)

---

### 3. Session Security

**Cookies Configuration**:
```typescript
const cookieOptions = {
  httpOnly: true,           // Prevent JavaScript access
  secure: isProd,           // HTTPS only in production
  sameSite: 'lax',          // CSRF protection
  path: '/',                // Cookie scope
  maxAge: sessionDuration   // Auto-expire
}
```

---

### 4. Rate Limiting

**Login Attempts**:
- Maximum 5 failed attempts per 15 minutes
- Temporary lockout after limit reached
- Exponential backoff for repeated failures

**Implementation**:
```typescript
// lib/rate-limiter.ts
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(email)

  if (!attempts || now > attempts.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }

  if (attempts.count >= 5) {
    return false
  }

  attempts.count++
  return true
}
```

---

### 5. CSRF Protection

**Token-based Protection**:
- SameSite cookies
- CSRF tokens for state-changing operations
- Origin validation

---

## Logout Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Next.js  │     │ Supabase │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                 │
     │ 1. Click Logout│                 │
     ├───────────────>│                 │
     │                │                 │
     │                │ 2. signOut()    │
     │                ├────────────────>│
     │                │                 │
     │                │ 3. Invalidate   │
     │                │    Session      │
     │                │<────────────────┤
     │                │                 │
     │                │ 4. Clear Cookies│
     │                │────────┐        │
     │                │        │        │
     │                │<───────┘        │
     │                │                 │
     │ 5. Redirect    │                 │
     │    to /login   │                 │
     │<───────────────┤                 │
     │                │                 │
```

**Implementation**:
```typescript
// components/auth/LogoutButton.tsx
export function LogoutButton() {
  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <Button onClick={handleLogout} variant="ghost">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  )
}
```

---

## Related Documentation

- [System Overview](./system-overview.md)
- [Database Schema](./database-schema.md)
- [API Documentation](../api/authentication.md)

---

**End of Authentication Flow Documentation**
