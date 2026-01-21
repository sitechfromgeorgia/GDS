---
name: implementing-feature-flags-nextjs-15
description: Implements feature flags in Next.js 15 applications with server components, client components, and middleware using Vercel Flags SDK, environment variables, or database-driven approaches. Use when building gradual rollouts, A/B tests, ops toggles, or permission-based features in Next.js 15 projects, or when the user mentions feature flags, feature toggles, gradual deployment, or canary releases.
---

# Feature Flags for Next.js 15

## Quick Start

### Option 1: Environment Variables (Simplest)

```typescript
// lib/flags.ts
export const FLAGS = {
  SHOW_BETA_UI: process.env.NEXT_PUBLIC_SHOW_BETA_UI === 'true',
  ENABLE_NEW_CHECKOUT: process.env.ENABLE_NEW_CHECKOUT === 'true',
} as const;
```

```tsx
// app/components/checkout.tsx
import { FLAGS } from '@/lib/flags';

export default function Checkout() {
  const route = FLAGS.ENABLE_NEW_CHECKOUT ? '/checkout/v2' : '/checkout/v1';
  return <CheckoutFlow route={route} />;
}
```

### Option 2: Vercel Flags SDK (Recommended for Vercel)

```bash
npm install @vercel/flags
```

```typescript
// flags.ts
import { flag } from '@vercel/flags/next';

export const newCheckout = flag({
  key: 'new-checkout',
  description: 'New checkout experience',
  decide: ({ entities }) => {
    if (entities.userId === 'test-user') return true;
    return Math.random() < 0.1; // 10% rollout
  },
});
```

```tsx
// app/page.tsx
import { newCheckout } from '@/flags';

export default async function Page() {
  const showNew = await newCheckout();
  return showNew ? <CheckoutV2 /> : <CheckoutV1 />;
}
```

### Option 3: Database-Driven (Advanced)

```sql
-- Schema
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY,
  key text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

## When to Use This Skill

- **Gradual rollouts**: Release features to increasing percentages of users
- **A/B testing**: Test variations on specific user segments
- **Ops toggles**: Kill switches for quick rollbacks in production
- **Permission gates**: Show features based on user plan or role
- **Environment-specific behavior**: Different features per deployment stage
- **Canary releases**: Test with internal users before broad deployment
- **Reducing deployment risk**: Decouple code deployment from feature release

## Core Concepts

### Flag Types

| Type | Use Case | Lifespan |
|------|----------|----------|
| **Release** | Gradual feature rollout | Days to weeks |
| **Experiment** | A/B test with variants | Hours to days |
| **Ops** | Emergency kill switch | Minutes (incident response) |
| **Permission** | Feature gating by plan | Weeks to months |

### Core Principle: Evaluate at Request Level

In Next.js 15, evaluate flags **as early as possible**:
1. Middleware (fastest, edge runtime)
2. Server components (stable, can query DB)
3. Client components (only if necessary, causes hydration risks)

**Why**: Prevents layout shift, ensures consistent experience, avoids multiple evaluations.

### Targeting Context

```typescript
// Standard user context for targeting
interface FlagContext {
  userId?: string;
  userEmail?: string;
  userPlan?: 'free' | 'pro' | 'enterprise';
  country?: string;
  isInternal?: boolean;
  customAttributes?: Record<string, unknown>;
}
```

## Implementation Guide

### 1. Simple Environment Variable Setup

**Best for**: Static flags that don't change without redeploy (e.g., feature in beta).

```typescript
// .env.local
NEXT_PUBLIC_BETA_FEATURES=false
NEW_DASHBOARD=true

// lib/flags.ts
export const flags = {
  betaFeatures: process.env.NEXT_PUBLIC_BETA_FEATURES === 'true',
  newDashboard: process.env.NEW_DASHBOARD === 'true',
} as const;

// Verify at build time
if (!process.env.NEW_DASHBOARD) {
  throw new Error('NEW_DASHBOARD env var must be set');
}
```

**Pros**: Zero dependencies, type-safe, works in middleware
**Cons**: Requires redeploy to change, no runtime updates

### 2. Vercel Flags SDK Setup

**Best for**: Hosted on Vercel with runtime control and targeting logic.

```typescript
// flags.ts (root)
import { flag, type Flag } from '@vercel/flags/next';

export const checkoutV2: Flag<boolean> = flag({
  key: 'checkout-v2',
  description: 'New checkout experience',
  origin: 'https://vercel.com/docs/flags',
  decide: async ({ entities }) => {
    // Entities come from identify() calls
    if (entities.userId === 'internal-tester') return true;
    if (entities.userPlan === 'enterprise') return true;
    
    // Gradual rollout: 20% of users
    const hash = await hashUserId(entities.userId);
    return hash % 100 < 20;
  },
});

// Hash function for consistent bucketing
async function hashUserId(userId: string): Promise<number> {
  const msgUint8 = new TextEncoder().encode(userId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray[0]; // 0-255
}
```

```typescript
// middleware.ts
import { precompute } from '@vercel/flags/next';
import { checkoutV2 } from '@/flags';
import type { NextRequest } from 'next/server';

export const config = { matcher: ['/checkout'] };

export async function middleware(request: NextRequest) {
  // Precompute flags once per request
  const flagCode = await precompute({ checkoutV2 });
  
  // Rewrite URL to include flag evaluation
  const nextUrl = new URL(
    `/${flagCode}${request.nextUrl.pathname}`,
    request.url
  );
  return NextResponse.rewrite(nextUrl, { request });
}
```

```tsx
// app/checkout/[flags]/page.tsx
import { checkoutV2 } from '@/flags';

export default async function CheckoutPage({ 
  params 
}: { 
  params: { flags: string } 
}) {
  const showV2 = await checkoutV2({ flags: params.flags });
  
  return (
    <main>
      {showV2 ? <CheckoutV2 /> : <CheckoutV1 />}
    </main>
  );
}
```

### 3. Server Component with `identify()`

```typescript
// lib/flag-context.ts
import { identify } from '@vercel/flags/next';

export async function identifyUser(userId: string, context: FlagContext) {
  return identify({
    entities: {
      userId,
      userPlan: context.userPlan,
      isInternal: context.isInternal,
    },
  });
}
```

```tsx
// app/dashboard/page.tsx
import { useFlag } from '@vercel/flags/next';
import { identifyUser } from '@/lib/flag-context';

export default async function Dashboard() {
  const userId = await getCurrentUserId();
  const userPlan = await getUserPlan(userId);
  
  await identifyUser(userId, { 
    userPlan: userPlan as 'free' | 'pro' | 'enterprise' 
  });
  
  const enableAdvancedAnalytics = await useFlag('advanced-analytics');
  
  return enableAdvancedAnalytics ? <AdvancedDash /> : <BasicDash />;
}
```

### 4. Database-Driven Flags (Supabase)

```typescript
// lib/flags-db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FlagConfig {
  key: string;
  enabled: boolean;
  rollout_percentage?: number;
}

export async function getFlag(key: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('enabled, rollout_percentage')
    .eq('key', key)
    .single();
  
  if (error) return false;
  if (!data.enabled) return false;
  
  // Apply rollout percentage
  if (data.rollout_percentage && data.rollout_percentage < 100) {
    const bucket = Math.random() * 100;
    return bucket < data.rollout_percentage;
  }
  
  return true;
}

// For user-specific targeting
export async function getUserFlag(
  userId: string,
  flagKey: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_flag_overrides')
    .select('enabled')
    .match({ user_id: userId, flag_key: flagKey })
    .single();
  
  return data?.enabled ?? (await getFlag(flagKey));
}
```

```tsx
// app/api/flags/[key]/route.ts
import { getFlag } from '@/lib/flags-db';

export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  const enabled = await getFlag(params.key);
  return Response.json({ enabled });
}
```

### 5. Client Component with Client-Side Fetching

```tsx
// app/components/beta-feature.tsx
'use client';

import { useEffect, useState } from 'react';

export function BetaFeature() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/flags/beta-ui')
      .then(r => r.json())
      .then(d => setEnabled(d.enabled))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return null;
  return enabled ? <NewUI /> : null;
}
```

**⚠️ Anti-pattern**: Avoid client-side flag evaluation when possible—causes hydration mismatches and CLS.

## Code Examples

### A/B Test with Analytics

```typescript
// flags.ts
export const checkoutButtonColor = flag({
  key: 'checkout-button-color',
  decide: ({ entities }) => {
    // Consistent bucketing by user
    const hash = hashUserId(entities.userId || 'anon');
    return hash % 2 === 0; // 50/50 split
  },
});
```

```tsx
// app/components/checkout-button.tsx
import { checkoutButtonColor } from '@/flags';

export default async function CheckoutButton() {
  const isBlue = await checkoutButtonColor();
  
  return (
    <button
      className={`btn ${isBlue ? 'bg-blue-600' : 'bg-green-600'}`}
      onClick={() => {
        // Track which variant was shown
        analytics.track('checkout_button_clicked', {
          variant: isBlue ? 'blue' : 'green',
        });
      }}
    >
      Checkout
    </button>
  );
}
```

### Gradual Rollout with Percentage

```typescript
// flags.ts
export const newPaymentProcessor = flag({
  key: 'new-payment-processor',
  decide: ({ entities }) => {
    const rollout = 15; // 15% of users
    const hash = hashUserId(entities.userId) % 100;
    return hash < rollout;
  },
});
```

### Permission-Based Feature Gate

```typescript
// flags.ts
export const advancedReports = flag({
  key: 'advanced-reports',
  decide: ({ entities }) => {
    const allowedPlans = ['pro', 'enterprise'];
    return allowedPlans.includes(entities.userPlan as string);
  },
});
```

### Ops Toggle (Middleware Kill Switch)

```typescript
// middleware.ts
import { dedupeFlag } from '@vercel/flags/next';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Dedupe prevents evaluating the same flag multiple times
  const paymentDown = await dedupeFlag('payment-service-down');
  
  if (paymentDown && request.nextUrl.pathname.startsWith('/checkout')) {
    return new Response('Checkout temporarily unavailable', { 
      status: 503 
    });
  }
  
  return NextResponse.next();
}
```

### TypeScript Type Safety

```typescript
// types/flags.ts
export interface FlagConfig {
  [key: string]: {
    type: 'boolean' | 'string' | 'number';
    default: unknown;
  };
}

export const AVAILABLE_FLAGS = {
  newCheckout: { type: 'boolean', default: false },
  premiumBadge: { type: 'boolean', default: false },
} as const;

type FlagKey = keyof typeof AVAILABLE_FLAGS;

// Generic flag evaluator
export async function evaluateFlag<T extends FlagKey>(
  key: T,
  context?: FlagContext
): Promise<boolean> {
  // Implementation
  return false;
}

// Usage: TypeScript ensures key exists
const result = await evaluateFlag('newCheckout'); // ✓ OK
const invalid = await evaluateFlag('doesNotExist'); // ✗ Error
```

## Best Practices

### 1. Keep Flags Short-Lived

**Rationale**: Old flags become technical debt and increase cognitive load.

```typescript
// ✓ GOOD: Set expiration date
export const newCheckout = flag({
  key: 'new-checkout-2025-q1',
  decision: 'Remove when all users on new version',
  expiresAt: new Date('2025-03-31'),
});

// ✗ BAD: No end date, no clear owner
export const betterUI = flag({
  key: 'better-ui',
  decide: () => Math.random() > 0.5,
});
```

**Action**: Archive flags after rollout completes. Set calendar reminders for monthly flag reviews.

### 2. Evaluate Once Per Request

**Rationale**: Prevents inconsistent behavior and multiple evaluations.

```typescript
// ✓ GOOD: Evaluate in middleware, pass via context
export async function middleware(request: NextRequest) {
  const showNewUI = await getFlag('new-ui');
  request.headers.set('x-flag-new-ui', String(showNewUI));
  return NextResponse.next();
}

// ✗ BAD: Multiple evaluations per page
export default async function Page() {
  const v1 = await getFlag('new-ui'); // Evaluation 1
  const v2 = await getFlag('new-ui'); // Evaluation 2 (might differ)
  return v1 ? <V1 /> : v2 ? <V2 /> : <V3 />;
}
```

### 3. Use Consistent User Bucketing

**Rationale**: Same user must see same variant across requests/devices.

```typescript
// ✓ GOOD: Deterministic hash
async function hashUserId(userId: string): Promise<number> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(userId));
  const bytes = new Uint8Array(buffer);
  return bytes[0] % 100; // 0-99
}

// ✗ BAD: Random bucketing
const bucket = Math.random() * 100; // Different every request!
```

### 4. Default to Secure/Conservative

**Rationale**: Flag should safely disable if service is down.

```typescript
// ✓ GOOD: Defaults to current behavior
export async function getFlag(key: string): Promise<boolean> {
  try {
    const result = await queryFlagService(key);
    return result;
  } catch {
    return false; // Conservative default
  }
}

// ✗ BAD: Defaults to new behavior
export async function getFlag(key: string): Promise<boolean> {
  try {
    const result = await queryFlagService(key);
    return result;
  } catch {
    return true; // Risky if service down!
  }
}
```

### 5. Name Flags Semantically

**Rationale**: Flag names should describe what they do, not why.

```typescript
// ✓ GOOD: Describes behavior
- checkout-v2
- payment-processor-stripe-v3
- analytics-ga4

// ✗ BAD: Vague or implementation-focused
- feature123
- temp-thing
- john-experiment
```

### 6. Avoid Flag Sprawl

**Rationale**: Each flag adds complexity; limit concurrent flags.

```typescript
// ✓ GOOD: One flag per logical feature
export const newCheckout = flag({ key: 'new-checkout' });

// ✗ BAD: Flags within flags
export const newCheckoutEnabled = flag({ key: 'new-checkout-enabled' });
export const newCheckoutStyle = flag({ key: 'new-checkout-style' });
export const newCheckoutPayment = flag({ key: 'new-checkout-payment' });
```

### 7. Avoid Server-Side PII in Flag Logic

**Rationale**: Edge Runtime limits; prevents data exposure.

```typescript
// ✓ GOOD: Only user ID/plan
export const premiumFeature = flag({
  decide: ({ entities }) => {
    return entities.userPlan === 'enterprise';
  },
});

// ✗ BAD: Sending sensitive data
export const feature = flag({
  decide: ({ entities }) => {
    console.log(entities.userEmail, entities.paymentMethod);
    return true;
  },
});
```

## Common Errors & Solutions

### Error: "Flag evaluation returned different value on server vs client"

**Cause**: Flag evaluated differently on server and client, causing hydration mismatch.

```typescript
// ✗ WRONG
export default async function Page() {
  const flag = await getFlag('ui-mode');
  
  return (
    <ClientComponent flag={flag}>
      {/* Hydration mismatch if flag differs */}
    </ClientComponent>
  );
}

// ✓ CORRECT: Pass flag via props or context
export default async function Page() {
  const flag = await getFlag('ui-mode');
  
  return (
    <Suspense fallback={null}>
      <ClientComponent initialFlag={flag} />
    </Suspense>
  );
}
```

### Error: "Cannot read localStorage in middleware"

**Cause**: Middleware runs in Edge Runtime without localStorage.

```typescript
// ✗ WRONG: Edge Runtime can't access localStorage
export async function middleware(request: NextRequest) {
  const flagOverride = localStorage.getItem('debug-flag'); // ✗ Error
}

// ✓ CORRECT: Use headers or query params
export async function middleware(request: NextRequest) {
  const flagOverride = request.headers.get('x-flag-override');
  // Or: const flagOverride = request.nextUrl.searchParams.get('flag');
}
```

### Error: "Flag definition must be await-able"

**Cause**: Vercel Flags require `async` component or use `use()` hook.

```typescript
// ✗ WRONG: Not awaited
export default function Page() {
  const flag = newCheckout(); // ✗ Error: not awaited
  return flag ? <New /> : <Old />;
}

// ✓ CORRECT: Use async component
export default async function Page() {
  const flag = await newCheckout();
  return flag ? <New /> : <Old />;
}

// ✓ CORRECT: Use 'use()' in client component
'use client';
import { use } from 'react';

export function MyComponent() {
  const flag = use(newCheckout());
  return flag ? <New /> : <Old />;
}
```

### Error: "Flag not updating in production"

**Cause**: Flag value cached; not being re-evaluated.

```typescript
// ✗ WRONG: Cached at build time
const flag = process.env.ENABLE_FEATURE === 'true';

export default function Page() {
  return flag ? <New /> : <Old />; // Always same value
}

// ✓ CORRECT: Evaluated at runtime
export default async function Page() {
  const flag = await getFlag('enable-feature');
  return flag ? <New /> : <Old />; // Re-evaluated each request
}
```

### Error: "Too many database queries for flags"

**Cause**: Fetching flag on every component.

```typescript
// ✗ WRONG: N+1 query problem
export default async function Page() {
  const showA = await getFlag('feature-a');
  const showB = await getFlag('feature-b');
  const showC = await getFlag('feature-c');
  // Three separate DB calls
}

// ✓ CORRECT: Batch flag queries
export default async function Page() {
  const [showA, showB, showC] = await Promise.all([
    getFlag('feature-a'),
    getFlag('feature-b'),
    getFlag('feature-c'),
  ]);
}

// ✓ BETTER: Cache flags per request
import { cache } from 'react';

export const getFlag = cache(async (key: string) => {
  return await db.flags.get(key);
});
```

## Flag Lifecycle Management

### 1. Creation Phase (Launch)

```typescript
// Created with clear purpose and team assignment
export const newReporting = flag({
  key: 'new-reporting-2025-q1',
  description: 'Reporting redesign rollout',
  owner: 'analytics-team',
  expiresAt: new Date('2025-03-31'),
  decide: ({ entities }) => {
    // Start: 5% rollout
    return hashUserId(entities.userId) % 100 < 5;
  },
});
```

### 2. Rollout Phase (Gradual Expansion)

```typescript
// Week 2: Expand to 25%
decide: ({ entities }) => hashUserId(entities.userId) % 100 < 25;

// Week 3: Expand to 50%
decide: ({ entities }) => hashUserId(entities.userId) % 100 < 50;

// Week 4: 100%
decide: () => true;
```

### 3. Cleanup Phase (Removal)

```typescript
// After rollout complete, remove flag code
// Remove from database
// Remove from flag definitions file

// Track in issue/commit for audit:
// "Remove flag: new-reporting (completed 2025-03-15)"
```

## Project Structure

```
app/
├── flags.ts                    # Flag definitions
├── lib/
│   ├── flags-db.ts            # Database queries
│   ├── flag-context.ts        # Identify/context helpers
│   └── flag-types.ts          # TypeScript types
├── middleware.ts              # Flag evaluation + precompute
└── api/
    └── flags/
        └── [key]/
            └── route.ts       # Flag API endpoint

.env.local
├── NEXT_PUBLIC_SHOW_BETA=false
└── FLAGS_SECRET=xxx           # Vercel Flags SDK

database/
└── migrations/
    └── feature_flags.sql      # DB schema
```

## Testing Feature Flags

### Unit Test

```typescript
// __tests__/flags.test.ts
import { checkoutV2 } from '@/flags';

describe('checkoutV2 flag', () => {
  it('returns true for test users', async () => {
    const result = await checkoutV2.decide({
      entities: { userId: 'test-user' },
    });
    expect(result).toBe(true);
  });

  it('distributes users evenly', async () => {
    const rollout: number[] = [];
    for (let i = 0; i < 100; i++) {
      const result = await checkoutV2.decide({
        entities: { userId: `user-${i}` },
      });
      rollout.push(result ? 1 : 0);
    }
    const percentage = rollout.reduce((a, b) => a + b) / rollout.length;
    expect(percentage).toBeCloseTo(0.2, 0); // ~20%
  });
});
```

### E2E Test with Playwright

```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('shows new checkout for flagged users', async ({ page }) => {
  // Override flag for testing
  await page.evaluate(() => {
    localStorage.setItem('__flag_override_checkout_v2', 'true');
  });
  
  await page.goto('/checkout');
  await expect(page.locator('[data-testid="checkout-v2"]')).toBeVisible();
});
```

## References

- **Vercel Flags SDK**: https://vercel.com/docs/workflow-collaboration/feature-flags
- **Vercel Flags Pattern**: https://vercel.com/docs/workflow-collaboration/feature-flags/feature-flags-pattern
- **Next.js Middleware**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **LaunchDarkly Node.js SDK**: https://docs.launchdarkly.com/sdk/server-side/node-js
- **PostHog Feature Flags**: https://posthog.com/docs/feature-flags
- **Unleash Feature Flags**: https://docs.getunleash.io
- **Managing Technical Debt**: https://www.statsig.com/perspectives/feature-flag-debt-management
