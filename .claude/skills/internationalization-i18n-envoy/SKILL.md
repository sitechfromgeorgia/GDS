## SKILL 8: Internationalization (i18n) Envoy

### Metadata
- **Name:** Internationalization (i18n) Envoy
- **Category:** Localization & Globalization
- **Priority:** P1 (Critical for Georgian market)
- **Domain:** next-intl, date/time/currency formatting, translations
- **Owner Role:** Frontend Engineer + Localization Manager
- **Complexity:** Medium
- **Skills Required:** i18n patterns, locale formatting, translation workflows

### Mission
Implement comprehensive internationalization for Georgian (ka-GE) market with proper date/time/currency formatting, RTL awareness (if needed), and translation key management. Support admin English + restaurant Georgian + driver Georgian UI.

### Key Directives

1. **Language & Locale Strategy**
   - Primary: Georgian (ka-GE) for restaurants and drivers
   - Secondary: English (en-US) for admin and documentation
   - Route-based locale: `/ka/orders`, `/en/admin`
   - User preference storage: `localStorage` + Zustand store
   - Fallback chain: User preference → Browser locale → default (English)

2. **Date/Time Formatting**
   - Georgian format: DD.MM.YYYY (29.01.2026)
   - Time: 24-hour format (19:30)
   - Use `Intl.DateTimeFormat` or `next-intl` formatter
   - Timezones: Store in UTC, format for user's timezone (driver location)
   - Relative time: "2 hours ago" in Georgian

3. **Currency & Number Formatting**
   - Currency: Georgian Lari (₾ or GEL), 2 decimal places
   - Thousands separator: space (1 000.00)
   - Decimal separator: period (.)
   - Prices in menus: "₾49.99"
   - Bulk order discounts: show as percentage (e.g., "10% off for 50+ units")

4. **Translation Key Management**
   - Structured keys: `order.status.pending`, `delivery.eта_arriving`, `error.network_timeout`
   - Organize by domain: order, delivery, auth, error, common
   - Use translation management tool: Crowdin or Lokalise for Georgian translator workflow
   - Validation: all keys have Georgian translation before release

5. **RTL Awareness (Georgian is LTR)**
   - Georgian script is left-to-right, but plan for potential Arabic/Persian future
   - CSS: use logical properties (`margin-inline-start` instead of `margin-left`)
   - Maps: ensure GPS coordinates don't flip
   - UI mirrors: buttons, icons should not mirror

6. **Dynamic Content Localization**
   - Product names: stored in DB with optional Georgian translation
   - Restaurant names: user-submitted, detect language automatically
   - Order addresses: accept Georgian addresses, no translation needed
   - Error messages: always translated

### Workflows

**Workflow: Setup next-intl**
```typescript
// i18n/config.ts
import { AbstractIntlMessages } from 'next-intl';

export const locales = ['ka', 'en'] as const;
export const defaultLocale = 'ka';

export type Locale = (typeof locales)[number];

export const messages = {
  ka: () => import('./ka.json').then((module) => module.default),
  en: () => import('./en.json').then((module) => module.default),
} as const satisfies Record<Locale, () => Promise<AbstractIntlMessages>>;
```

**Translation Files:**
```json
// i18n/ka.json
{
  "order": {
    "title": "შეკვეთა",
    "status": {
      "pending": "ლოდინში",
      "confirmed": "დასტურდებული",
      "preparing": "მომზადებაში",
      "ready": "მზად",
      "enroute": "გზაში",
      "delivered": "მიტანილი"
    },
    "total": "სულ"
  },
  "delivery": {
    "title": "დელივერი",
    "eta": "{minutes, number} წუთში"
  },
  "common": {
    "save": "შენახვა",
    "cancel": "გაუქმება",
    "delete": "წაშლა",
    "loading": "იტვირთება..."
  }
}
```

**App Router with i18n:**
```typescript
// app/[locale]/layout.tsx
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { locales } from '@/i18n/config';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir="ltr">
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Formatting Dates, Times, Currency:**
```typescript
// app/[locale]/orders/page.tsx
'use client';

import { useFormatter } from 'next-intl';

export function OrderList({ orders }) {
  const format = useFormatter();

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          <p>Order #{order.number}</p>
          <p>
            Created: {format.dateTime(new Date(order.createdAt), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p>
            Total: {format.number(order.total, {
              style: 'currency',
              currency: 'GEL',
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}
```

**Relative Time for Delivery ETA:**
```typescript
// lib/i18n.ts
import { useFormatter } from 'next-intl';

export function useRelativeTime() {
  const format = useFormatter();

  return {
    formatRelative: (date: Date) => {
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMins = Math.ceil(diffMs / 60000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} მინ`;
      
      const hours = Math.floor(diffMins / 60);
      return `${hours} საათი`;
    },
  };
}
```

### Tooling

**Core**
- `next-intl@^3.x.x` - i18n for Next.js
- `crowdin` or `lokalise` - Translation management SaaS
- `i18next` - Alternative, more complex but powerful

**Utilities**
- `useFormatter()` hook for date/time/currency formatting
- `useLocale()` to detect current locale in components
- Message compiler to validate all keys have translations

**Testing**
- Vitest: test message formatting with different locales
- Playwright: test language switching, date formatting
- Crowdin integration: sync translations automatically

**Monitoring**
- Track translation coverage (% of keys translated to Georgian)
- Monitor untranslated string errors in production
- Alert if new keys added without Georgian translation
