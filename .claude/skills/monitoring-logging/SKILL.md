---
name: nextjs-application-monitoring-logging
description: Implements production-grade error tracking, performance monitoring, and structured logging for Next.js 15 App Router applications. Use when building observability systems, setting up error tracking with Sentry, implementing structured logging with Pino/Winston, tracking Core Web Vitals, or ensuring GDPR compliance in monitoring.
---

# Next.js Application Monitoring & Logging

## Quick Start

### Sentry Integration (Error Tracking)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Pino Logger (Structured Logging)

```bash
npm install pino pino-pretty
npm install pino-pretty --save-dev
```

### Setup Files

**`lib/logger.ts`** - Centralized logging configuration:

```typescript
import pino, { Logger } from 'pino';

export const logger: Logger =
  process.env.NODE_ENV === 'production'
    ? pino({ level: 'warn' })
    : pino({
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
        level: 'debug',
      });

// Child logger with module context
export const createLogger = (module: string) =>
  logger.child({ module, timestamp: new Date().toISOString() });
```

**`sentry.server.config.ts`** - Server-side Sentry setup:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enableLogs: true,
  debug: process.env.NODE_ENV === 'development',
  integrations: [
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});
```

## When to Use This Skill

- Setting up error tracking and alerting for production Next.js apps
- Implementing structured JSON logging for log aggregation (Datadog, BetterStack)
- Tracking Core Web Vitals and performance regressions
- Debugging production issues with source maps and replay data
- Ensuring GDPR/PII compliance in monitoring
- Building full-stack observability across server and client components

## Core Concepts

### Observability Layers

**Error Tracking**: Captures and groups production exceptions with full context.
- Server-side errors from API routes and Server Components
- Client-side errors from Client Components
- Source maps for readable stack traces
- Error grouping by fingerprint

**Performance Monitoring**: Measures user-facing and backend performance.
- Core Web Vitals (LCP, INP, CLS)
- Server-side metrics (API response times, database queries)
- Distributed tracing across services

**Structured Logging**: Machine-readable logs with rich context.
- JSON format for easy parsing and searching
- Log levels (debug, info, warn, error)
- Correlation IDs for tracing requests through systems
- Context fields (userId, requestId, module)

### Tool Comparison Table

| Tool | Purpose | Best For | Cost |
|------|---------|----------|------|
| **Sentry** | Error tracking + Performance | Complete observability, teams <500 | $29/month+ |
| **Pino** | Structured logging library | High-performance server logging | Free |
| **Winston** | Structured logging library | Highly configurable, transports | Free |
| **Datadog** | Full-stack APM + RUM | Enterprise, correlation across stack | $15/host/month+ |
| **LogRocket** | Session replay + logging | Frontend-focused, UX debugging | $99/month+ |
| **BetterStack** | Log aggregation | Affordable, simple setup | $5-50/month |
| **Vercel Analytics** | Core Web Vitals | Vercel-hosted Next.js apps | Included |

## Implementation Guide

### Step 1: Set Up Error Tracking (Sentry)

**Initialize Sentry in your Next.js project:**

```bash
npx @sentry/wizard@latest -i nextjs
```

This automatically:
- Installs `@sentry/nextjs`
- Creates config files: `sentry.*.config.ts`
- Updates `next.config.ts` with Sentry wrapper
- Generates `.env.local` with `SENTRY_AUTH_TOKEN`

**Configure for Next.js 15 App Router (`sentry.client.config.ts`):**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // Sample 10% in production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Capture all error sessions
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**Update `next.config.ts` to enable source maps:**

```typescript
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Your config options
};

export default withSentryConfig(nextConfig, {
  org: 'your-org-name',
  project: 'your-project-name',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  sourceMapsUploadOptions: {
    sourcemaps: {
      paths: [['.next/static/chunks/app', '.next/server']],
    },
  },
});
```

### Step 2: Implement Error Boundaries

**Global error handler (`app/global-error.tsx`):**

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: error.stack,
      },
    },
    level: 'fatal',
  });

  return (
    <html>
      <body>
        <div style={{ padding: '2rem' }}>
          <h1>Something went wrong</h1>
          <p>Our team has been notified. Try refreshing the page.</p>
          <button onClick={() => reset()} style={{ padding: '0.5rem 1rem' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
```

**Route-level error boundary (`app/dashboard/error.tsx`):**

```typescript
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { createLogger } from '@/lib/logger';

const log = createLogger('dashboard');

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error with context
    log.error(
      {
        errorMessage: error.message,
        errorDigest: error.digest,
        stack: error.stack?.split('\n').slice(0, 5),
      },
      'Dashboard component error'
    );

    // Capture in Sentry with breadcrumbs
    Sentry.captureException(error, {
      tags: {
        boundary: 'dashboard',
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div style={{ padding: '2rem', border: '1px solid #f5222d' }}>
      <h2>Dashboard Error</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Recover</button>
    </div>
  );
}
```

### Step 3: Set Up Structured Logging

**Logger utility with correlation ID (`lib/logger.ts`):**

```typescript
import pino, { Logger } from 'pino';
import { headers } from 'next/headers';

export const createLogger = (module: string): Logger => {
  const log = pino().child({ 
    module,
    environment: process.env.NODE_ENV,
  });
  
  return log;
};

// For Server Components/Actions with request context
export async function getContextLogger(module: string) {
  try {
    const headersList = await headers();
    const requestId = headersList.get('x-request-id') || crypto.randomUUID();
    
    return pino().child({
      module,
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return createLogger(module);
  }
}
```

**Using logger in Server Component (`app/api/users/route.ts`):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getContextLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const log = await getContextLogger('api/users');
  
  try {
    const userId = request.nextUrl.searchParams.get('id');
    
    log.info({ userId }, 'Fetching user');
    
    // Your database call
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }, // Never log email/sensitive fields
    });
    
    log.info({ userId, found: !!user }, 'User fetch completed');
    
    return NextResponse.json(user);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'User fetch failed'
    );
    
    Sentry.captureException(error, {
      tags: { route: 'api/users', method: 'GET' },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 4: Track Core Web Vitals

**Client-side performance monitoring (`lib/web-vitals.ts`):**

```typescript
import { getCLS, getFID, getFCP, getLCP, getINP, getNavigationTiming } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

export function setupWebVitals() {
  // Cumulative Layout Shift
  getCLS((metric) => {
    Sentry.captureMessage('Core Web Vitals', 'info', {
      tags: { metric: 'CLS' },
      contexts: {
        trace: {
          op: 'web-vital',
          description: `CLS: ${metric.value.toFixed(3)}`,
          data: { value: metric.value, rating: metric.rating },
        },
      },
    });
  });

  // Largest Contentful Paint
  getLCP((metric) => {
    Sentry.captureMessage('Core Web Vitals', 'info', {
      tags: { metric: 'LCP' },
      contexts: {
        trace: {
          op: 'web-vital',
          description: `LCP: ${metric.value.toFixed(0)}ms`,
          data: { value: metric.value, rating: metric.rating },
        },
      },
    });
  });

  // Interaction to Next Paint
  getINP((metric) => {
    Sentry.captureMessage('Core Web Vitals', 'info', {
      tags: { metric: 'INP' },
      contexts: {
        trace: {
          op: 'web-vital',
          description: `INP: ${metric.value.toFixed(0)}ms`,
          data: { value: metric.value, rating: metric.rating },
        },
      },
    });
  });
}
```

**Register in Root Layout (`app/layout.tsx`):**

```typescript
'use client';

import { useEffect } from 'react';
import { setupWebVitals } from '@/lib/web-vitals';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupWebVitals();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Step 5: Instrument Server Actions

**Wrap Server Actions with Sentry instrumentation:**

```typescript
'use server';

import * as Sentry from '@sentry/nextjs';
import { createLogger } from '@/lib/logger';

const log = createLogger('actions/auth');

export const loginUser = Sentry.withServerActionInstrumentation(
  'loginUser',
  {
    recordResponse: false, // Don't log sensitive auth data
  },
  async (formData: FormData) => {
    const email = formData.get('email') as string;
    
    log.info(
      { emailDomain: email.split('@')[1] }, // Log domain only, not full email
      'Login attempt'
    );
    
    try {
      // Authentication logic
      const session = await authenticateUser(email, formData.get('password') as string);
      
      log.info({ userId: session.userId }, 'Login successful');
      return { success: true, sessionId: session.id };
    } catch (error) {
      log.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Login failed'
      );
      
      Sentry.captureException(error, {
        tags: { action: 'loginUser' },
      });
      
      throw error;
    }
  }
);
```

## Code Examples

### Example: Custom Error with Context

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getContextLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  const log = await getContextLogger('api/checkout');
  
  const transactionId = crypto.randomUUID();
  
  try {
    const body = await request.json();
    const { amount, currency } = body;
    
    // Create Sentry transaction for performance tracking
    const transaction = Sentry.startTransaction({
      op: 'checkout',
      name: 'Process Payment',
      data: { amount, currency },
    });
    
    log.info(
      { transactionId, amount, currency },
      'Checkout initiated'
    );
    
    // Process payment
    const result = await processPayment({
      transactionId,
      amount,
      currency,
    });
    
    transaction.setStatus('ok');
    transaction.finish();
    
    log.info(
      { transactionId, result: result.status },
      'Checkout completed'
    );
    
    return NextResponse.json(result);
  } catch (error) {
    log.error(
      {
        transactionId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Checkout failed'
    );
    
    Sentry.captureException(error, {
      tags: { transactionId },
      contexts: {
        payment: { transactionId },
      },
    });
    
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
```

### Example: PII Redaction in Logs

```typescript
// lib/pii-redactor.ts
export function redactPII(obj: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['email', 'password', 'ssn', 'creditCard', 'apiKey'];
  const redacted = { ...obj };
  
  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = '[REDACTED]';
    }
  }
  
  // Mask email if logged
  if (redacted.userEmail && typeof redacted.userEmail === 'string') {
    const [local, domain] = redacted.userEmail.split('@');
    redacted.userEmail = `${local.charAt(0)}***@${domain}`;
  }
  
  return redacted;
}

// Usage in logger
import { createLogger } from '@/lib/logger';

const log = createLogger('auth');

log.info(
  redactPII({
    email: 'user@example.com',
    userId: '123',
    action: 'login',
  }),
  'User logged in'
);
// Output: { email: 'u***@example.com', userId: '123', action: 'login' }
```

### Example: Distributed Tracing

```typescript
// middleware.ts - Inject correlation ID
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || uuidv4();
  
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-request-start-time', new Date().toISOString());
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Best Practices

### Error Tracking

✅ **Do**: Group errors by fingerprint to reduce noise
- Sentry automatically groups similar errors
- Use custom fingerprinting for business logic errors

✅ **Do**: Set sample rate appropriately
- Production: 10-20% for performance
- Development: 100% to catch all issues
- Use `tracesSampler` for granular control

✅ **Do**: Add context before capturing
- Use Sentry scope for user/request context
- Attach breadcrumbs for user actions
- Include tags for filtering in dashboard

❌ **Don't**: Log sensitive data in errors
- Sentry automatically redacts common fields
- Use before-send hook for custom redaction
- Configure `sensitive_data_scrubber` in dashboard

### Structured Logging

✅ **Do**: Use JSON format in production
- Makes parsing and searching trivial
- Enables filtering by fields
- Works with all log aggregators

✅ **Do**: Include correlation IDs
- Trace requests across services
- Use `x-request-id` header standard
- Generate with `crypto.randomUUID()`

✅ **Do**: Log at appropriate levels
- `debug`: Development, detailed information
- `info`: Significant events (logins, transactions)
- `warn`: Potential issues, recovery possible
- `error`: Actionable errors, attention needed

❌ **Don't**: Log PII directly
- Email, phone, SSN, credit cards are PII
- Log domain instead of full email
- Use truncated/masked versions
- Redact in logs before sending to aggregators

### Performance Monitoring

✅ **Do**: Monitor Core Web Vitals
- LCP: Perceived load speed
- INP: Responsiveness to user input
- CLS: Visual stability

✅ **Do**: Set up alerts
- LCP > 2.5s: Investigate
- INP > 200ms: Review interactions
- CLS > 0.1: Check for layout shifts

✅ **Do**: Use sampling in production
- 10-20% sample rate for high-traffic apps
- 100% for low-traffic or critical paths

❌ **Don't**: Send all traces to Sentry
- Causes quota overruns and costs
- Use `tracesSampleRate` to limit
- Increase sample rate for errors only

### GDPR Compliance

✅ **Do**: Implement data retention policies
- Delete logs after 30-90 days
- Archive for legal holds if needed
- Document retention in privacy policy

✅ **Do**: Document data processing
- Who accesses logs (team)
- Where data is stored (region)
- How long it's retained (30 days)
- What's collected (request path, status code)

✅ **Do**: Obtain user consent
- Notify users about session replay
- Allow opt-out if possible
- Include in Terms of Service

❌ **Don't**: Store full IP addresses
- Truncate last octet: `192.168.1.0`
- Use Sentry's IP anonymization

❌ **Don't**: Log user actions without consent
- Session replay requires explicit opt-in
- Heatmaps need clear disclosure

## Project Structure

```
your-app/
├── app/
│   ├── layout.tsx          # Root layout (setup Web Vitals)
│   ├── error.tsx           # Route-level error boundary
│   ├── global-error.tsx    # Global error boundary
│   ├── api/
│   │   └── users/
│   │       └── route.ts    # API with logging
│   └── dashboard/
│       ├── page.tsx        # Component
│       └── error.tsx       # Dashboard error boundary
├── lib/
│   ├── logger.ts           # Pino configuration & utilities
│   ├── web-vitals.ts       # Core Web Vitals tracking
│   └── pii-redactor.ts     # PII masking utilities
├── sentry.client.config.ts # Client-side Sentry setup
├── sentry.server.config.ts # Server-side Sentry setup
├── sentry.edge.config.ts   # Edge Runtime setup
├── instrumentation.ts      # Next.js instrumentation hooks
├── middleware.ts           # Correlation ID injection
├── next.config.ts          # Sentry wrapper & source maps
└── .env.local              # SENTRY_AUTH_TOKEN, DSN
```

## Common Errors & Solutions

### Error: "Source maps not uploaded"

**Cause**: `SENTRY_AUTH_TOKEN` missing or build not running in CI.

**Solution**:
```bash
# Generate token in Sentry dashboard
export SENTRY_AUTH_TOKEN="your-token"
npm run build  # Manually upload
```

**Or** use Vercel integration: Dashboard → Integrations → Sentry.

---

### Error: "Cannot find module 'pino-pretty'"

**Cause**: `pino-pretty` not in correct dependency list.

**Solution**:
```typescript
// next.config.ts
experimental: {
  serverComponentsExternalPackages: ['pino', 'pino-pretty'],
}
```

---

### Error: "Error digest mismatch between error.tsx and Sentry"

**Cause**: Error boundaries strip custom properties before sending to client.

**Solution**: Encode error data in message:
```typescript
// Server Component
throw new Error(JSON.stringify({ code: 'AUTH_REQUIRED', userId: 123 }));

// error.tsx
const errorData = JSON.parse(error.message);
console.log(errorData.code); // 'AUTH_REQUIRED'
```

---

### Error: "Over-logging in production, quota exceeded"

**Cause**: `tracesSampleRate: 1.0` or logging too much.

**Solution**:
```typescript
// Only trace errors and slow transactions
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
tracesSampler: (context) => {
  if (context.op === 'http.server') {
    return context.transaction_name?.includes('error') ? 1.0 : 0.1;
  }
  return 0.1;
},
```

---

### Error: "PII leaked in logs (emails, IPs)"

**Cause**: Not filtering before logging.

**Solution**:
```typescript
// Always redact in logger
log.info(redactPII({ email, userId }), 'Action');

// Or configure in Sentry before-send
beforeSend(event) {
  if (event.request) {
    delete event.request.cookies;
    event.request.url = event.request.url?.replace(/email=[^&]+/, 'email=***');
  }
  return event;
}
```

---

### Error: "Client error boundary not catching server component errors"

**Cause**: Server Component errors need `error.tsx` in same segment.

**Solution**: Add error boundaries at each level:
```
app/
├── error.tsx                 # Catches global errors
└── dashboard/
    ├── page.tsx             # Server Component
    ├── error.tsx            # Catches dashboard errors
    └── details/
        ├── page.tsx         # Nested component
        └── error.tsx        # Catches details errors
```

## References

- **Sentry Documentation**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Sentry Source Maps**: https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/
- **Sentry Error Handling**: https://docs.sentry.io/platforms/javascript/guides/nextjs/enriching-events/
- **Pino Logger**: https://getpino.io/
- **Pino + Next.js**: https://blog.arcjet.com/structured-logging-in-json-for-next-js/
- **Web Vitals**: https://web.dev/articles/core-web-vitals/
- **Next.js Error Handling**: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- **Next.js Instrumentation**: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
- **GDPR Logging Best Practices**: https://last9.io/blog/gdpr-log-management/
- **Datadog RUM**: https://docs.datadoghq.com/real_user_monitoring/guide/monitor-your-nextjs-app-with-rum/
- **BetterStack Logging**: https://betterstack.com/logs/
