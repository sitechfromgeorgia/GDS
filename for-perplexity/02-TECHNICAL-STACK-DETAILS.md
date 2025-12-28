# Technical Stack Details - Complete Dependency List

## Frontend Package.json (Key Dependencies)

### Core Framework (Versions as of 2025-11-25)

```json
{
  "dependencies": {
    "next": "15.5.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "typescript": "^5.7.2"
  }
}
```

### Supabase & Database

```json
{
  "@supabase/ssr": "^0.7.0",
  "@supabase/supabase-js": "^2.77.0",
  "pg": "^8.16.3"
}
```

**Configuration:**
- SSR support via `@supabase/ssr` for server components
- Client-side SDK for browser operations
- PostgreSQL driver for direct database operations (when needed)

### State Management

```json
{
  "@tanstack/react-query": "^5.90.5",
  "@tanstack/react-query-devtools": "^5.90.5",
  "zustand": "^5.0.8"
}
```

**Usage:**
- **TanStack Query** - Server state (API calls, caching, refetching, background updates)
- **Zustand** - Client state (UI state, temporary form data, global modals)

### UI Framework - shadcn/ui + Radix

```json
{
  "@radix-ui/react-accordion": "^1.2.3",
  "@radix-ui/react-alert-dialog": "^1.1.4",
  "@radix-ui/react-avatar": "^1.1.2",
  "@radix-ui/react-checkbox": "^1.1.3",
  "@radix-ui/react-dialog": "^1.1.4",
  "@radix-ui/react-dropdown-menu": "^2.1.4",
  "@radix-ui/react-label": "^2.1.1",
  "@radix-ui/react-popover": "^1.1.4",
  "@radix-ui/react-progress": "^1.1.1",
  "@radix-ui/react-scroll-area": "^1.2.2",
  "@radix-ui/react-select": "^2.1.4",
  "@radix-ui/react-separator": "^1.1.1",
  "@radix-ui/react-slider": "^1.2.1",
  "@radix-ui/react-slot": "^1.1.1",
  "@radix-ui/react-switch": "^1.1.2",
  "@radix-ui/react-tabs": "^1.1.2",
  "@radix-ui/react-toast": "^1.2.4",
  "@radix-ui/react-tooltip": "^1.1.6"
}
```

**shadcn/ui Status:** 99.3% compatibility verified

### Styling

```json
{
  "tailwindcss": "^4.1.6",
  "tailwindcss-animate": "^1.0.7",
  "@tailwindcss/typography": "^0.5.16",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0"
}
```

**Tailwind v4 Features:**
- Performance improvements
- Enhanced JIT compiler
- Better CSS output
- Oxide engine

### Forms & Validation

```json
{
  "react-hook-form": "^7.65.0",
  "zod": "^4.1.12",
  "@hookform/resolvers": "^3.10.0"
}
```

**Pattern:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

### Data Visualization

```json
{
  "recharts": "^2.16.2"
}
```

**Charts Used:**
- LineChart (daily trends)
- BarChart (status, restaurant, driver breakdowns)
- PieChart (distribution analysis)
- AreaChart (cumulative metrics)

### Icons & Assets

```json
{
  "lucide-react": "^0.469.0"
}
```

**Icon Library:**
- 1000+ consistent icons
- Tree-shakeable
- React components

### Date & Time

```json
{
  "date-fns": "^4.1.0"
}
```

**Usage:**
- Date formatting
- Relative time (2 hours ago)
- Date range calculations
- Timezone handling

### Error Tracking

```json
{
  "@sentry/nextjs": "^8.50.0"
}
```

**Configuration:**
- Source maps uploaded
- User context attached
- Performance monitoring
- Release tracking
- Session replay capability

### Testing

```json
{
  "vitest": "^4.0.10",
  "@vitest/ui": "^4.0.10",
  "@testing-library/react": "^16.1.0",
  "@testing-library/user-event": "^14.5.2",
  "@testing-library/jest-dom": "^6.6.3",
  "happy-dom": "^20.0.10",
  "playwright": "^1.56.1",
  "@playwright/test": "^1.56.1"
}
```

**Test Commands:**
```bash
npm test              # Vitest unit tests
npm run test:ui       # Vitest UI
npm run test:e2e      # Playwright E2E
npm run test:coverage # Coverage report
```

### Development Tools

```json
{
  "eslint": "^9.20.0",
  "eslint-config-next": "15.5.0",
  "prettier": "^3.5.1",
  "prettier-plugin-tailwindcss": "^0.6.10",
  "turbo": "^2.4.0",
  "@types/node": "^22.10.5",
  "@types/react": "^19.0.12",
  "@types/react-dom": "^19.0.2"
}
```

### Additional Utilities

```json
{
  "sonner": "^1.9.0",           // Toast notifications
  "vaul": "^1.4.0",              // Drawer component
  "next-themes": "^0.4.7",      // Dark mode
  "react-day-picker": "^9.4.8"  // Calendar/datepicker
}
```

---

## Next.js Configuration Deep Dive

### next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Experimental features
  experimental: {
    // Turbo mode for faster builds
    turbo: {
      resolveAlias: {
        // Custom module resolution
      }
    }
  },

  // Webpack customization
  webpack: (config, { isServer }) => {
    // Code splitting optimization
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            priority: 20
          },
          ui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'ui',
            priority: 15
          }
        }
      }
    }
    return config
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'akxmacfsltzhbnunoepb.supabase.co'
      },
      {
        protocol: 'https',
        hostname: 'data.greenland77.ge'
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com'
      }
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://akxmacfsltzhbnunoepb.supabase.co wss://akxmacfsltzhbnunoepb.supabase.co https://data.greenland77.ge wss://data.greenland77.ge",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=()'
          }
        ]
      }
    ]
  },

  // Redirects (production only)
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/',
          destination: '/dashboard/admin',
          permanent: false
        }
      ]
    }
    return []
  }
}

export default nextConfig
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key Settings:**
- `strict: true` - Enforces strict type checking
- `skipLibCheck: true` - Faster builds
- `moduleResolution: bundler` - Modern module resolution
- `paths: @/*` - Absolute imports from src/

---

## Tailwind CSS Configuration

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography')
  ]
}

export default config
```

---

## Vitest Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

---

## Environment Variables

### Required Variables

```bash
# Supabase (Development)
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-key]

# Sentry
NEXT_PUBLIC_SENTRY_DSN=[your-dsn]
SENTRY_AUTH_TOKEN=[your-token]
SENTRY_ORG=[your-org]
SENTRY_PROJECT=[your-project]

# Application
NODE_ENV=development|production
NEXT_PUBLIC_APP_URL=https://greenland77.ge
```

---

## Build & Deployment Scripts

### package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\""
  }
}
```

---

## Performance Optimizations

### Code Splitting Strategy

1. **Vendor Chunks** - All node_modules
2. **Supabase Chunk** - Dedicated @supabase packages
3. **UI Chunk** - Radix UI components
4. **Route-based** - Automatic by Next.js

### Caching Strategy

**Build-time:**
- Static pages cached indefinitely
- Dynamic pages revalidated on demand
- API routes no caching by default

**Runtime:**
- TanStack Query manages API caching
- Supabase client caches auth state
- Service Worker caches assets (PWA)

---

**This document provides complete technical stack details, configurations, and dependency versions for the Georgian Distribution Management System.**
