---
name: web-analytics-integration-nextjs
description: Implements privacy-first analytics in Next.js 15 with GDPR/CCPA compliance, server-side event tracking, consent management, and type-safe event schemas. Use when building modern SaaS, e-commerce, or product analytics that balances user privacy with business insights while maintaining ethical tracking practices.
---

# Web Analytics Integration for Next.js 15 & Privacy

## Quick Start

### 1. Install Dependencies

```bash
npm install zod next-auth
# Choose ONE analytics platform:
npm install posthog  # OR
npm install ga-4-measurement-protocol  # OR
npm install posthog  # For feature flags + product analytics
```

### 2. Create Type-Safe Event Schema (Zod)

```typescript
// lib/analytics/events.ts
import { z } from 'zod';

export const pageViewEvent = z.object({
  pathname: z.string(),
  referrer: z.string().optional(),
  sessionId: z.string(),
});

export const customEvent = z.object({
  name: z.string().min(1),
  properties: z.record(z.any()).optional(),
  userId: z.string().optional(),
  timestamp: z.date(),
});

export const conversionEvent = z.object({
  type: z.enum(['signup', 'purchase', 'trial_start']),
  value: z.number().optional(),
  currency: z.string().optional(),
  userId: z.string(),
});

// Type inference for compile-time safety
export type PageViewEvent = z.infer<typeof pageViewEvent>;
export type CustomEvent = z.infer<typeof customEvent>;
export type ConversionEvent = z.infer<typeof conversionEvent>;
```

### 3. Consent Management (GDPR/CCPA Compliant)

```typescript
// lib/analytics/consent.ts
export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  version: number;
  timestamp: number;
};

const CONSENT_COOKIE = 'analytics_consent';
const CONSENT_VERSION = 2;

export async function getConsentState(): Promise<ConsentState | null> {
  const cookies = await import('next/headers').then(m => m.cookies());
  const cookie = cookies.get(CONSENT_COOKIE);
  
  if (!cookie) return null;
  
  try {
    const consent = JSON.parse(cookie.value) as ConsentState;
    // Invalidate old consent versions
    if (consent.version < CONSENT_VERSION) return null;
    return consent;
  } catch {
    return null;
  }
}

export async function saveConsentState(consent: ConsentState) {
  const cookies = await import('next/headers').then(m => m.cookies());
  cookies.set(CONSENT_COOKIE, JSON.stringify({
    ...consent,
    version: CONSENT_VERSION,
    timestamp: Date.now(),
  }), {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}
```

### 4. Server-Side Event Tracking (Bypasses Ad-Blockers)

```typescript
// lib/analytics/server.ts
import { customEvent, ConversionEvent } from './events';
import { z } from 'zod';

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.posthog.com';

export async function captureServerEvent(
  eventName: string,
  properties: Record<string, any>,
  distinctId: string
) {
  if (!POSTHOG_API_KEY) {
    console.warn('PostHog API key not configured');
    return;
  }

  try {
    // Validate event structure
    const validated = customEvent.parse({
      name: eventName,
      properties,
      timestamp: new Date(),
    });

    const response = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event: validated.name,
        properties: validated.properties,
        distinct_id: distinctId,
        timestamp: validated.timestamp.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`Event tracking failed: ${response.statusText}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Event validation failed:', error.issues);
    }
  }
}

// Conversion tracking for revenue events
export async function trackConversion(
  event: ConversionEvent,
  distinctId: string
) {
  const validated = conversionEvent.parse(event);
  
  await captureServerEvent(
    `conversion_${validated.type}`,
    {
      value: validated.value,
      currency: validated.currency,
      conversion_type: validated.type,
    },
    distinctId
  );
}
```

### 5. Client-Side Page View Tracking (Next.js 15 App Router)

```typescript
// components/analytics/PageViewTracker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user has given consent
    const consent = localStorage.getItem('analytics_consent');
    if (!consent) return;

    const consentState = JSON.parse(consent);
    if (!consentState.analytics) return;

    // Track page view
    posthog.capture('$pageview', {
      pathname,
      search: searchParams.toString(),
    });
  }, [pathname, searchParams]);

  return null;
}
```

### 6. Consent Banner (Accessible & Honest)

```typescript
// components/analytics/ConsentBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './ConsentBanner.module.css';

export function ConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if consent already given
    const stored = localStorage.getItem('analytics_consent');
    if (!stored) {
      setIsOpen(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    localStorage.setItem('analytics_consent', JSON.stringify({
      analytics: true,
      marketing: true,
      version: 2,
    }));
    
    // Save to server for GDPR audit trail
    await fetch('/api/analytics/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics: true, marketing: true }),
    });
    
    setIsOpen(false);
    window.location.reload();
  };

  const handleRejectAll = async () => {
    localStorage.setItem('analytics_consent', JSON.stringify({
      analytics: false,
      marketing: false,
      version: 2,
    }));
    
    await fetch('/api/analytics/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics: false, marketing: false }),
    });
    
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.banner} role="dialog" aria-labelledby="consent-title">
      <div className={styles.content}>
        <h2 id="consent-title">Privacy & Analytics</h2>
        
        {!showSettings ? (
          <>
            <p>
              We use analytics to understand how you use our site and improve your experience.
              We never sell your data and respect your privacy choices.
            </p>
            <div className={styles.actions}>
              <button onClick={handleAcceptAll} className={styles.primary}>
                Accept Analytics
              </button>
              <button onClick={handleRejectAll} className={styles.secondary}>
                Reject
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className={styles.tertiary}
              >
                Customize
              </button>
            </div>
          </>
        ) : (
          <>
            <label>
              <input type="checkbox" defaultChecked />
              Essential (required for site function)
            </label>
            <label>
              <input type="checkbox" defaultChecked onChange={(e) => {}} />
              Analytics (helps us improve)
            </label>
            <label>
              <input type="checkbox" onChange={(e) => {}} />
              Marketing (personalized ads)
            </label>
            <button onClick={handleAcceptAll}>Save Settings</button>
          </>
        )}
        
        <a href="/privacy" style={{ fontSize: '0.85rem' }}>
          Read our privacy policy
        </a>
      </div>
    </div>
  );
}
```

### 7. Google Consent Mode v2 (EU/UK Requirement)

```typescript
// lib/analytics/consent-mode-v2.ts
export function initializeConsentModeV2() {
  if (typeof window === 'undefined') return;

  // Initialize Google Consent Mode before loading Google scripts
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    (window.dataLayer as any).push(arguments);
  }
  window.gtag = gtag;
  
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_personalization': 'denied',
    'ad_user_data': 'denied',
  });

  // Update consent based on user choice
  const consentData = localStorage.getItem('analytics_consent');
  if (consentData) {
    const { analytics, marketing } = JSON.parse(consentData);
    
    gtag('consent', 'update', {
      'analytics_storage': analytics ? 'granted' : 'denied',
      'ad_storage': marketing ? 'granted' : 'denied',
      'ad_personalization': marketing ? 'granted' : 'denied',
      'ad_user_data': marketing ? 'granted' : 'denied',
    });
  }
}
```

---

## When to Use This Skill

- **Building SaaS/product analytics**: Need event tracking without compromising privacy
- **GDPR/CCPA compliance required**: Operating in EU/UK or handling sensitive data
- **Server-side tracking needed**: Bypassing ad-blockers or tracking backend events
- **Type-safe events**: Want compile-time safety for analytics events
- **Feature flag integration**: A/B testing with PostHog or similar
- **Privacy-first positioning**: Marketing advantage of ethical tracking

---

## Core Concepts

### Privacy-First vs Traditional Analytics

| Aspect | Privacy-First | Traditional (GA Universal) |
|--------|---------------|----------------------------|
| Cookies | No/First-party only | Third-party cookies |
| Compliance | GDPR/CCPA built-in | Requires Consent Mode |
| Ad-blockers | Bypass with proxy | Blocked by default |
| IP anonymization | Automatic | Requires config |
| User consent | Mandatory | After-the-fact |

**Platforms by use case:**

- **Umami**: Self-hosted, lightweight, full control (2kb JS)
- **Fathom**: EU-based, reliable, premium support
- **Plausible**: Simplicity first, GDPR by default
- **PostHog**: Event-based + feature flags + experiments
- **GA4 + Consent Mode v2**: Enterprise, conversion modeling

### Next.js 15 App Router Patterns

#### Page View Tracking (usePathname Hook)

```typescript
// App Router returns actual pathname, not route template
// /products/[id] → returns "/products/123", not "/products/[id]"

'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Send pageview event
    track('pageview', { path: pathname });
  }, [pathname, searchParams]);

  return null;
}
```

#### Server-Side Event Capture (Server Actions)

```typescript
// app/actions/analytics.ts
'use server';

import { captureServerEvent } from '@/lib/analytics/server';
import { headers } from 'next/headers';

export async function trackSignup(userId: string, source: string) {
  const h = await headers();
  const ip = h.get('x-forwarded-for') || 'unknown';
  
  await captureServerEvent('user_signup', {
    source,
    ip_anonymized: ip.split('.').slice(0, 3).join('.') + '.0',
  }, userId);
}
```

### Consent State Management

**Server-side consent reading** (prevents flash of analytics):

```typescript
// lib/middleware.ts
import { getConsentState } from './analytics/consent';

export async function middleware(request: Request) {
  const consent = await getConsentState();
  
  // Inject consent into response headers
  const response = NextResponse.next();
  response.headers.set('x-analytics-consent', JSON.stringify(consent));
  
  return response;
}
```

---

## Implementation Patterns

### Pattern 1: PostHog (Full-Stack Product Analytics)

```typescript
// app/providers.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const consent = localStorage.getItem('analytics_consent');
    if (!consent) {
      posthog.opt_out_capturing();
      return;
    }

    const { analytics } = JSON.parse(consent);
    if (!analytics) {
      posthog.opt_out_capturing();
      return;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/ingest', // Use reverse proxy to bypass ad-blockers
      capture_pageview: false,
      capture_pageleave: true,
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { ConsentBanner } from '@/components/analytics/ConsentBanner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Providers>
          <PageViewTracker />
          {children}
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
```

### Pattern 2: GA4 Server-Side + Consent Mode v2

```typescript
// lib/analytics/ga4-server.ts
import { headers } from 'next/headers';

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

export async function sendGA4Event(
  clientId: string,
  sessionId: string,
  eventName: string,
  eventParams: Record<string, string | number>
) {
  const h = await headers();
  const userAgent = h.get('user-agent') || '';

  const payload = {
    client_id: clientId,
    session_id: sessionId,
    user_agent: userAgent,
    events: [
      {
        name: eventName,
        params: {
          ...eventParams,
          timestamp_micros: Date.now() * 1000,
        },
      },
    ],
  };

  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return response.ok;
}

// Usage in API route
// app/api/events/route.ts
import { sendGA4Event } from '@/lib/analytics/ga4-server';

export async function POST(request: Request) {
  const { clientId, sessionId, eventName, params } = await request.json();

  await sendGA4Event(clientId, sessionId, eventName, params);

  return Response.json({ success: true });
}
```

### Pattern 3: OpenTelemetry for Performance Analytics

```typescript
// instrumentation.ts (root of project)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    );
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-http'
    );

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    console.log('✅ OpenTelemetry instrumentation initialized');
  }
}
```

### Pattern 4: Type-Safe Event Tracking with Validation

```typescript
// lib/analytics/typed-tracker.ts
import { z } from 'zod';
import posthog from 'posthog-js';

const EventSchemas = {
  button_click: z.object({
    button_id: z.string(),
    section: z.string(),
  }),
  form_submit: z.object({
    form_name: z.string(),
    field_count: z.number(),
    success: z.boolean(),
  }),
  checkout_step: z.object({
    step: z.enum(['cart', 'shipping', 'payment', 'confirmation']),
    cart_value: z.number(),
  }),
} as const;

type EventName = keyof typeof EventSchemas;

export function trackEvent<T extends EventName>(
  eventName: T,
  properties: z.infer<typeof EventSchemas[T]>
) {
  try {
    // Runtime validation
    const schema = EventSchemas[eventName];
    const validated = schema.parse(properties);

    posthog.capture(eventName, validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Invalid event: ${eventName}`, error.issues);
    }
  }
}

// Usage with full type safety
trackEvent('button_click', {
  button_id: 'cta-primary',
  section: 'hero',
});

// TypeScript error: ❌ trackEvent('button_click', { wrong_field: 'value' });
// ✅ Full autocomplete for event properties
```

### Pattern 5: Feature Flags + Analytics Integration

```typescript
// lib/analytics/feature-flags.ts
import posthog from 'posthog-js';

export async function evaluateFeatureFlag(
  flagName: string,
  userId: string
): Promise<string | boolean> {
  const flagValue = await posthog.getFeatureFlag(flagName);
  
  // Track flag evaluation
  posthog.capture('feature_flag_evaluated', {
    flag_name: flagName,
    flag_value: flagValue,
    user_id: userId,
  });

  return flagValue;
}

// Usage in component
export function DashboardUpgrade() {
  const [variant, setVariant] = useState<string | boolean>(false);

  useEffect(() => {
    evaluateFeatureFlag('new_dashboard', userId).then(setVariant);
  }, []);

  if (variant === 'control') {
    return <LegacyDashboard />;
  }
  if (variant === 'test') {
    return <NewDashboardV2 />;
  }
  
  return <DefaultDashboard />;
}
```

---

## Privacy & Compliance Checklist

- [ ] **GDPR**: Explicit opt-in before any tracking (not opt-out)
- [ ] **CCPA**: "Do Not Sell" link in footer, honor DNT headers
- [ ] **DMA**: Consent Mode v2 enabled for EU/UK users
- [ ] **IP Anonymization**: Last octet stripped server-side
- [ ] **Data Deletion**: "Right to be Forgotten" API implemented
- [ ] **Cookie Notice**: Clear, honest disclosure of cookies used
- [ ] **Consent Versioning**: Invalidate old consent on policy changes
- [ ] **First-Party Only**: No third-party cookies (first-party allowed)
- [ ] **Data Retention**: Delete analytics data after 13 months
- [ ] **User Agent Tracking**: Disabled (fingerprinting prevention)
- [ ] **Server-Side Validation**: All events validated with Zod schemas
- [ ] **Ad-Blocker Bypass**: Via reverse proxy (ethical, disclosed)
- [ ] **Privacy Policy**: Linked in consent banner, updated 2025 standards

---

## Common Errors & Solutions

### Error: "PostHog not initialized on client"

**Cause**: `posthog.capture()` called before consent given  
**Solution**: Check consent state before calling

```typescript
export function track(name: string, props: any) {
  const consent = localStorage.getItem('analytics_consent');
  if (!consent || !JSON.parse(consent).analytics) return;
  
  posthog.capture(name, props);
}
```

### Error: "Missing client_id in GA4 request"

**Cause**: Server-side GA4 tracking without client ID from browser  
**Solution**: Pass client ID from client via header or cookie

```typescript
// Client captures its own GA4 client ID
const clientId = gtag.getAll()[0].get('client_id');

// Server-side tracking inherits it
await sendGA4Event(clientId, sessionId, 'event_name', {});
```

### Error: "Consent banner flashes on page load"

**Cause**: Banner rendered client-side before hydration check  
**Solution**: Check localStorage in useEffect, not render

```typescript
export function ConsentBanner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('analytics_consent');
    if (!consent) {
      setMounted(true); // Only show if not stored
    }
  }, []);

  if (!mounted) return null; // Don't render during SSR
  return <BannerUI />;
}
```

### Error: "Zod validation fails for event properties"

**Cause**: Property types don't match schema  
**Solution**: Use `.safeParse()` for detailed error info

```typescript
const result = customEvent.safeParse({
  name: 'click',
  properties: { count: 'not-a-number' }, // ❌ should be number
  timestamp: new Date(),
});

if (!result.success) {
  console.error('Validation issues:', result.error.issues);
}
```

### Error: "Analytics not sent in production (ad-blocker)"

**Cause**: Direct requests to analytics endpoints blocked  
**Solution**: Use Next.js API route as reverse proxy

```typescript
// next.config.js
const nextConfig = {
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/ingest/:path*',
        destination: 'https://us.posthog.com/:path*',
      },
    ],
  }),
};
```

---

## Best Practices

### Do's ✅

- **Use server-side tracking for revenue events** - Bypasses ad-blockers, more reliable
- **Validate all events with Zod** - Prevents invalid data pollution
- **Implement consent versioning** - Privacy policies change; versioning lets you audit changes
- **Anonymize IPs automatically** - `192.168.1.1` → `192.168.1.0`
- **Disable user-agent collection** - Fingerprinting vector
- **Use reverse proxy for analytics endpoints** - Circumvents ad-blockers ethically
- **Implement "Right to be Forgotten"** - GDPR requirement with deletion API
- **Test consent banner on all devices** - Mobile consent UX often broken
- **Audit data retention policies** - Minimum viable retention (13 months standard)
- **Track feature flag variants** - A/B test results tied to analytics

### Don'ts ❌

- **Don't track personal identifiers in analytics** - Email, phone, SSN immediately
- **Don't use third-party cookies** - GDPR violation, ad-blockers catch it anyway
- **Don't fingerprint users** - Combination of browser attributes = privacy violation
- **Don't delay consent checks** - Tracking before consent is illegal in EU
- **Don't embed consent in T&C** - Must be explicit, separate choice
- **Don't ignore ad-blocker filters** - Signals privacy concerns to users
- **Don't mix IP anonymization** - Either anonymize all or none; inconsistency auditable
- **Don't store raw IP addresses** - Even temporarily; hash immediately
- **Don't use local analytics for ad-served sites** - DMA violation in EU (March 2024)
- **Don't log sensitive API responses** - Never trace credit card numbers, tokens

---

## Real-World Metrics Dashboard

```typescript
// lib/analytics/key-metrics.ts
/**
 * KPIs for SaaS with privacy-first analytics
 * All server-side, GDPR-compliant
 */

export const SaaSMetrics = {
  acquisition: {
    signups_per_day: 'sum(event.properties.user_id)',
    signup_to_trial_conversion: 'trial_starts / signups',
    acquisition_cost_per_user: 'ad_spend / new_users',
  },
  
  activation: {
    percent_completed_onboarding: 'completed_onboarding / total_users',
    average_onboarding_time: 'avg(onboarding_duration)',
    feature_discovery_rate: 'users_clicked_feature / total_users',
  },
  
  retention: {
    day_1_retention: 'active_users(day_2) / active_users(day_1)',
    day_30_retention: 'active_users(day_31) / active_users(day_1)',
    churn_rate: '1 - retention_day_30',
  },
  
  monetization: {
    arpu: 'total_revenue / active_users',
    mrr: 'sum(recurring_revenue)',
    trial_to_paid_conversion: 'paid_subscriptions / trial_starts',
    payback_period: 'acquisition_cost_per_user / arpu / 12',
  },
  
  engagement: {
    daily_active_users: 'count(distinct_users in last_24h)',
    feature_adoption: 'users_using_feature / total_users',
    average_session_duration: 'avg(session_length)',
  },
};

/**
 * GDPR-Compliant Query Example
 * No PII exposed, IP anonymized, cohort analysis only
 */
export async function getMetricsForCohort(cohort: string) {
  return {
    cohort_size: 'count(user_id)',
    day_7_retention: `
      SELECT COUNT(DISTINCT user_id) 
      FROM events 
      WHERE signup_cohort = '${cohort}' 
      AND active_on_day_7 = true
    `,
    feature_adoption: `
      SELECT feature_name, COUNT(*) 
      FROM events 
      WHERE signup_cohort = '${cohort}' 
      GROUP BY feature_name
    `,
  };
}
```

---

## Integration Checklist

- [ ] **Zod schemas** created for all event types
- [ ] **Consent banner** implemented and tested on mobile
- [ ] **Google Consent Mode v2** initialized for GA4
- [ ] **Server-side tracking** tested (check network tab)
- [ ] **Privacy policy** updated with 2025 language
- [ ] **Data deletion API** implemented for GDPR
- [ ] **Reverse proxy** configured for ad-blocker bypass
- [ ] **IP anonymization** verified in events
- [ ] **Feature flags** wired to analytics
- [ ] **Error tracking** captures validation failures
- [ ] **Performance metrics** exported to dashboard
- [ ] **Retention reports** configured (cohort-based, no PII)
- [ ] **Compliance audit** completed (Data Processing Agreement signed)

---

## References

- [PostHog Next.js Integration](https://posthog.com/docs/libraries/next-js)
- [Google Consent Mode v2 Implementation](https://www.consentmanager.net/en/knowledge/how-to-implement-google-consent-mode-v2/)
- [Next.js usePathname Hook](https://nextjs.org/docs/app/api-reference/functions/use-pathname)
- [Zod Type-Safe Validation](https://zod.dev/api)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [OpenTelemetry for Next.js](https://last9.io/blog/how-to-implement-opentelemetry-in-next-js/)
- [GDPR Analytics Compliance 2025](https://gdprlocal.com/google-analytics-gdpr-compliance/)
- [Umami vs Plausible vs Matomo](https://aaronjbecker.com/posts/umami-vs-plausible-vs-matomo-self-hosted-analytics/)
- [Privacy-First Analytics Comparison](https://www.markpitblado.me/blog/comparing-four-privacy-focused-google-analytics-alternatives/)
- [PostHog Feature Flags Bootstrap](https://github.com/PostHog/posthog.com/blob/master/contents/tutorials/nextjs-bootstrap-flags.md)
