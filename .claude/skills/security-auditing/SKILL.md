---
name: auditing-nextjs-security
description: Implements comprehensive security auditing for Next.js 15 applications covering dependency scanning, OWASP Top 10 compliance, CSP headers, Server Actions security, and SSRF prevention. Use when building production Next.js apps, implementing security controls, performing security audits, or when user mentions vulnerabilities, OWASP, security headers, or compliance.
---

# Security Auditing for Next.js 15

## Quick Start

Enable core security protections immediately:

```bash
# Install security dependencies
npm install next-secure-headers zod edge-csrf

# Run dependency audit
npm audit

# Install security scanning tools
npm install -D snyk @snyk/cli-sentinel
```

Create middleware for security headers:

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // CSP headers with nonce
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
  
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set(
    'Content-Security-Policy',
    cspHeader.replace(/\s{2,}/g, ' ').trim()
  )
  
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  })
  
  // Add security headers
  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim())
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Block vulnerable middleware header (CVE-2025-29927)
  response.headers.delete('x-middleware-subrequest')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
```

Configure Server Actions security in `next.config.js`:

```javascript
// next.config.js
module.exports = {
  serverActions: {
    allowedOrigins: ['localhost:3000', 'yourdomain.com'],
    bodySizeLimit: '2mb'
  }
}
```

## When to Use This Skill

- Auditing Next.js 15 applications for OWASP Top 10 compliance
- Setting up CI/CD security scanning pipelines
- Implementing CSP (Content Security Policy) headers
- Securing Server Actions against CSRF attacks
- Protecting APIs with authentication and authorization
- Implementing Supabase Row Level Security (RLS)
- Scanning for vulnerable dependencies (npm audit, Snyk)
- Preventing injection attacks (XSS, SQL injection)
- Configuring secure environment variables
- Responding to security vulnerabilities and CVEs

## OWASP Top 10 (2021) Compliance Checklist

| # | Risk | Next.js Protection | Implementation |
|---|------|--------------------|-----------------|
| A01 | Broken Access Control | Middleware + RLS | Implement authentication checks, Supabase RLS policies |
| A02 | Cryptographic Failures | HTTPS + .env | Use HTTPS only, never expose secrets, encrypt data at rest |
| A03 | Injection | Input validation + Zod | Validate all inputs, sanitize outputs, use parameterized queries |
| A04 | Insecure Design | Threat modeling + CSP | Plan security upfront, implement nonce-based CSP |
| A05 | Security Misconfiguration | Headers + Audits | Set all required headers, audit configurations regularly |
| A06 | Vulnerable Components | npm audit + Snyk | Scan dependencies, automate patching with Dependabot |
| A07 | Auth Failures | NextAuth.js + JWT | Implement secure session management, use strong auth libraries |
| A08 | Data Integrity Failures | Environment checks | Verify package integrity, sign releases, check origins |
| A09 | Logging Failures | Structured logging | Log security events, monitor for anomalies |
| A10 | SSRF | URL validation + CSP | Validate URLs before fetching, restrict fetch targets |

## Dependency Security

### npm audit (Built-in)

```bash
# Check for vulnerabilities
npm audit

# View JSON report
npm audit --json > audit-report.json

# Fix automatically (review changes first)
npm audit fix

# Fix only high/critical
npm audit fix --audit-level=moderate
```

### Snyk Integration

```bash
# Install and authenticate
npm install -g snyk
snyk auth

# Scan for vulnerabilities
snyk test

# Monitor continuously
snyk monitor

# Generate report
snyk test --json > snyk-report.json
```

### Dependabot (GitHub)

Enable in `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    security-updates-only: true
    pull-request-branch-name:
      separator: "/"
    reviewers:
      - "your-team"
```

### Package.json Lock Files

Always commit `package-lock.json`:

```bash
# Ensure consistent installs
npm ci  # Instead of npm install in production
```

## Server Actions Security

### CSRF Protection (Built-in + Manual)

```typescript
// src/app/actions/safe-action.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// 1. Next.js built-in CSRF protection:
//    - POST-only requests
//    - SameSite cookies by default
//    - Origin header validation

// 2. Additional validation:
const FormSchema = z.object({
  email: z.string().email(),
  message: z.string().min(1).max(500)
})

export async function submitForm(formData: FormData) {
  // Validate input
  const result = FormSchema.safeParse({
    email: formData.get('email'),
    message: formData.get('message')
  })
  
  if (!result.success) {
    return { error: 'Invalid input' }
  }
  
  // Process safely
  const { email, message } = result.data
  
  // Your business logic here
  revalidatePath('/submissions')
  return { success: true }
}
```

### Form Security Pattern

```typescript
// src/components/secure-form.tsx
'use client'

import { submitForm } from '@/app/actions/safe-action'
import { useFormStatus } from 'react-dom'

export function SecureForm() {
  const { pending } = useFormStatus()
  
  return (
    <form action={submitForm} method="POST">
      <input
        type="email"
        name="email"
        required
        disabled={pending}
      />
      <textarea
        name="message"
        required
        disabled={pending}
      />
      <button type="submit" disabled={pending}>
        {pending ? 'Sending...' : 'Submit'}
      </button>
    </form>
  )
}
```

### Multi-Origin Server Actions

For complex setups with reverse proxies:

```javascript
// next.config.js
module.exports = {
  serverActions: {
    // Allow requests from these origins
    allowedOrigins: [
      'localhost:3000',
      'example.com',
      '*.example.com'  // subdomains
    ]
  }
}
```

## API Route Security

### Authentication Middleware

```typescript
// src/app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtDecode } from 'jwt-decode'

export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate JWT
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.slice(7)
    const decoded = jwtDecode(token)
    
    // 2. Verify origin (prevent CORS misuse)
    const origin = request.headers.get('origin')
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    // 3. Rate limiting (implement with Upstash or similar)
    const clientId = decoded.sub
    const isRateLimited = await checkRateLimit(clientId)
    if (isRateLimited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
    
    // 4. Fetch data
    return NextResponse.json({ data: 'protected' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function isAllowedOrigin(origin: string | null): boolean {
  const allowed = ['https://example.com', 'https://api.example.com']
  return allowed.includes(origin || '')
}

async function checkRateLimit(clientId: string): Promise<boolean> {
  // Implement with Upstash Redis
  return false
}
```

## Input Validation & Sanitization

### Zod Validation (Recommended)

```typescript
// src/lib/schemas.ts
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(12).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%]/),
  bio: z.string().max(500).optional()
})

export const CommentSchema = z.object({
  content: z.string().min(1).max(1000),
  postId: z.string().uuid()
})

export type User = z.infer<typeof UserSchema>
export type Comment = z.infer<typeof CommentSchema>
```

### Server Action with Validation

```typescript
// src/app/actions/create-comment.ts
'use server'

import { CommentSchema } from '@/lib/schemas'
import { createClient } from '@supabase/supabase-js'

export async function createComment(formData: FormData) {
  // 1. Parse and validate
  const result = CommentSchema.safeParse({
    content: formData.get('content'),
    postId: formData.get('postId')
  })
  
  if (!result.success) {
    return { error: result.error.flatten() }
  }
  
  // 2. Check authorization
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }
  
  // 3. Execute with validated data
  const { data, error } = await supabase
    .from('comments')
    .insert({
      content: result.data.content,
      post_id: result.data.postId,
      user_id: user.id
    })
    .select()
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true, comment: data[0] }
}
```

## Supabase Row Level Security (RLS)

### Enable RLS

```sql
-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS for posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS for comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
```

### Auth Policies (Users Can Only See Their Own Data)

```sql
-- SELECT policy: Users see only their data
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- INSERT policy: Users create own profile
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE policy: Users update only their data
CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE policy
CREATE POLICY "Users can delete their own profile"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
```

### Posts With Author Authorization

```sql
-- SELECT: Anyone can read published posts
CREATE POLICY "Anyone can read published posts"
  ON posts
  FOR SELECT
  TO anon
  USING (is_published = true);

-- SELECT authenticated: Users see all posts (published + own drafts)
CREATE POLICY "Authenticated users see all posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (is_published = true OR author_id = auth.uid());

-- INSERT: Only authenticated users can create
CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- UPDATE: Only author can update
CREATE POLICY "Authors can update their posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- DELETE: Only author can delete
CREATE POLICY "Authors can delete their posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());
```

### Comments With Cascading Authorization

```sql
-- Comments: User can comment on published posts, see own comments
CREATE POLICY "Users can read public comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND (posts.is_published = true OR posts.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.is_published = true
    )
  );

CREATE POLICY "Users can delete their comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

## CSP (Content Security Policy) Headers

### Nonce-Based CSP (Recommended for Next.js 15)

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Generate nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // Strict CSP with nonce
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self';
    connect-src 'self' https://api.example.com;
    object-src 'none';
    frame-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
  
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  })
  
  response.headers.set(
    'Content-Security-Policy',
    cspHeader.replace(/\s{2,}/g, ' ').trim()
  )
  
  return response
}
```

### Use Nonce in Components

```typescript
// src/components/script.tsx
'use client'

import Script from 'next/script'
import { useNonce } from '@/lib/nonce-context'

export function AnalyticsScript() {
  const nonce = useNonce()
  
  return (
    <Script
      src="https://analytics.example.com/script.js"
      nonce={nonce}
      strategy="afterInteractive"
    />
  )
}
```

## Environment Variables Security

### .env.local Configuration

```bash
# .env.local
# Never commit this file to git

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-only secrets (NEVER expose to client)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://user:password@localhost/dbname

# API Keys
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...

# Custom secrets
JWT_SECRET=your-random-secret-key-min-32-chars
ENCRYPTION_KEY=your-encryption-key-min-32-chars

# Environment-specific
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

### Validate Environment Variables

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_KEY: z.string().min(20),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test'])
})

export const env = envSchema.parse(process.env)
```

## Security Scanning in CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 2 * * 0'  # Weekly at 2am Sunday

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: false
      
      - name: Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: SAST with Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/typescript
      
      - name: Dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'nextjs-app'
          path: '.'
          format: 'JSON'
      
      - name: Upload results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: reports/dependency-check-report.sarif
```

## CVE-2025-29927: Middleware Header Bypass

### Vulnerable Pattern

```javascript
// VULNERABLE - Allow x-middleware-subrequest header through
app.get('/admin', (req, res) => {
  if (req.headers['x-middleware-subrequest']) {
    // Attacker bypasses middleware!
    return res.json({ data: 'admin data' })
  }
})
```

### Fix: Remove Header in Middleware

```typescript
// src/middleware.ts - SECURE
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Remove vulnerable header immediately
  const response = NextResponse.next()
  response.headers.delete('x-middleware-subrequest')
  
  return response
}
```

### WAF Protection (Alternative)

```yaml
# Nginx configuration
location / {
  # Block requests with vulnerable header
  if ($http_x_middleware_subrequest) {
    return 403;
  }
  
  proxy_pass http://nextjs:3000;
}
```

## SSRF (Server-Side Request Forgery) Prevention

### Validate URLs Before Fetch

```typescript
// src/lib/safe-fetch.ts
const ALLOWED_HOSTS = [
  'api.example.com',
  'cdn.example.com',
  'secure-service.com'
]

const BLOCKED_RANGES = [
  /^127\./,           // localhost
  /^192\.168\./,      // private
  /^10\./,            // private
  /^172\.(1[6-9]|2[0-9]|3[01])\./,  // private
  /^::1$/,            // IPv6 loopback
  /^fc00:/,           // IPv6 private
]

function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    
    // Check hostname
    const hostname = url.hostname
    
    // Block private IP ranges
    for (const pattern of BLOCKED_RANGES) {
      if (pattern.test(hostname)) {
        return false
      }
    }
    
    // Whitelist allowed hosts
    if (!ALLOWED_HOSTS.includes(hostname)) {
      return false
    }
    
    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      return false
    }
    
    // Block URLs longer than 2048 chars (prevent resource exhaustion)
    if (urlString.length > 2048) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

export async function safeFetch(url: string, options?: RequestInit) {
  if (!isSafeUrl(url)) {
    throw new Error('Invalid URL: not in whitelist')
  }
  
  return fetch(url, {
    ...options,
    timeout: 5000  // 5 second timeout
  })
}
```

### Usage in Server Actions

```typescript
// src/app/actions/fetch-data.ts
'use server'

import { safeFetch } from '@/lib/safe-fetch'

export async function fetchExternalData(endpoint: string) {
  try {
    // Build URL with validation
    const url = `https://api.example.com/${endpoint}`
    
    const response = await safeFetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'User-Agent': 'NextJS-App/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    throw new Error('Failed to fetch data')
  }
}
```

## XSS Prevention

### Never Use dangerouslySetInnerHTML

```typescript
// ❌ VULNERABLE
export function UnsafeComment({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />
}

// ✅ SAFE - Use React's text rendering
export function SafeComment({ content }: { content: string }) {
  return <div>{content}</div>
}

// ✅ SAFE - Sanitize with DOMPurify if HTML needed
import DOMPurify from 'isomorphic-dompurify'

export function SanitizedComment({ content }: { content: string }) {
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
  return <div>{clean}</div>
}
```

## Common Errors & Solutions

### Error: "Server Actions can only be invoked on the same host"

**Cause:** Origin header mismatch (reverse proxy, subdomain, etc.)

**Solution:**
```javascript
// next.config.js
module.exports = {
  serverActions: {
    allowedOrigins: ['api.example.com', 'example.com'],
    allowedForwardedHosts: ['example.com', 'www.example.com']
  }
}
```

### Error: "CSP policy violation: script from 'https://analytics.js' blocked"

**Cause:** External script not in CSP directive

**Solution:**
```typescript
// src/middleware.ts
const cspHeader = `
  script-src 'self' https://analytics.js;
  connect-src 'self' https://analytics.com;
`
```

### Error: "npm audit fix does not resolve all vulnerabilities"

**Cause:** Dependency conflicts or vulnerable code patterns

**Solution:**
```bash
# Check transitive dependencies
npm ls vulnerable-package

# Check if package has updates
npm outdated

# Manual fix with compatible versions
npm install package@latest --save

# If stuck, use overrides (use carefully)
echo '"overrides": { "vulnerable-package": "patched-version" }' >> package.json
npm install
```

### Error: "RLS policy prevents user from accessing own data"

**Cause:** Policy uses wrong auth function or column name

**Solution:**
```sql
-- ✅ Correct
CREATE POLICY "Users can read their data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ❌ Wrong auth functions
-- USING (auth.user_id() = id);  -- auth.user_id() doesn't exist
-- USING (get_current_user_id() = id);  -- custom function not exposed

-- ❌ Wrong column name
-- USING (auth.uid() = user_id);  -- if column is 'id' not 'user_id'
```

### Error: "CSRF token verification failed" with Server Actions

**Note:** Next.js Server Actions handle CSRF automatically. If errors occur:

**Solution:**
```typescript
// Ensure form uses method="POST"
<form action={serverAction} method="POST">
  
// Verify SameSite cookies enabled
// In middleware: response.cookies.set('auth', token, {
//   sameSite: 'strict',
//   httpOnly: true
// })

// For custom route handlers, implement manually
if (request.method === 'POST') {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  if (origin !== `https://${host}`) {
    return new Response('Forbidden', { status: 403 })
  }
}
```

## Best Practices

1. **Always use HTTPS in production** - Never trust unencrypted connections
2. **Enable RLS on all exposed tables** - Supabase data is public by default without RLS
3. **Validate all inputs** - Use Zod or similar type-safe validators
4. **Rotate secrets regularly** - Use CI/CD secret rotation tools
5. **Log security events** - Track auth failures, permission denials, suspicious activity
6. **Run weekly audits** - Schedule `npm audit` in GitHub Actions
7. **Keep dependencies updated** - Use Dependabot for automated PRs
8. **Test CSRF protection** - Verify Server Actions reject cross-origin requests
9. **Use strong CSP** - Start strict, relax only when necessary
10. **Never expose service keys to client** - Use `SUPABASE_SERVICE_KEY` server-only
11. **Monitor for CVEs** - Subscribe to security advisories (Snyk, GitHub)
12. **Implement rate limiting** - Prevent brute force attacks on auth endpoints

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Next.js Security Best Practices](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [CVE-2025-29927 Middleware Bypass](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/)
- [npm audit Security Advisories](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Snyk Documentation](https://docs.snyk.io/)
- [OWASP: SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Zod Type-Safe Validation](https://zod.dev/)
- [Dependabot GitHub Documentation](https://docs.github.com/en/code-security/dependabot)
