# Comprehensive Testing Strategy for Next.js SaaS Applications

## Table of Contents

- [Executive Summary](#executive-summary)
- [Test Pyramid Architecture](#test-pyramid-architecture)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
  - [Setup Configuration](#setup-configuration)
  - [Component Testing Examples](#component-testing-examples)
- [Integration Testing (API Routes)](#integration-testing-api-routes)
  - [API Route Test Setup](#api-route-test-setup)
  - [Database Integration Tests (RLS)](#database-integration-tests-rls)
- [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
  - [Critical User Flow Tests](#critical-user-flow-tests)
- [Testing Best Practices](#testing-best-practices)
  - [1. Test Naming Convention](#1-test-naming-convention)
  - [2. Arrange-Act-Assert Pattern](#2-arrange-act-assert-pattern)
  - [3. Test Isolation](#3-test-isolation)
- [CI/CD Integration](#cicd-integration)
- [Testing Checklist](#testing-checklist)
- [Further Resources](#further-resources)

---

## Executive Summary

A robust testing strategy is the safety net that enables rapid development without sacrificing reliability. For production SaaS applications handling real business transactions, comprehensive testing prevents costly bugs, ensures data integrity, and builds customer trust. This guide provides a practical, test-pyramid-based approach optimized for Next.js 15, React 19, and Supabase environments.

### Key Takeaways:

- ✅ Target **80% code coverage** with pyramid distribution: 70% unit, 20% integration, 10% E2E
- ✅ **Vitest** provides 10X faster unit tests than Jest (with React 19 support)
- ✅ **Playwright** enables reliable E2E testing across browsers
- ✅ Test **RLS policies** at database level to prevent data leaks
- ✅ **CI/CD integration** catches regressions before production

### Testing ROI:

- **Prevent 95%** of production bugs with proper coverage
- **Reduce debugging time by 60%** with early detection
- Enable **confident refactoring** and feature additions
- **Decrease mean time to resolution (MTTR)** from hours to minutes

---

## Test Pyramid Architecture

```
        /\
       /  \     E2E Tests (10%)
      /────\    - 5-10 critical user flows
     /      \   - Playwright
    /────────\
   /          \ Integration Tests (20%)
  /────────────\- API route testing
 /              \- Database interactions
/────────────────\
|                | Unit Tests (70%)
──────────────────- Components, utilities, hooks
```

### Why This Distribution?

- **Unit Tests (70%):** Fast (<1ms), isolated, easy to maintain
- **Integration Tests (20%):** Moderate speed (~100ms), test interactions
- **E2E Tests (10%):** Slow (~10s), brittle, but validate complete flows

---

## Unit Testing with Vitest

### Setup Configuration

#### Install Dependencies:

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### vitest.config.ts:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom', // Faster than jsdom
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    // Parallelize tests for speed
    threads: true,
    maxThreads: 4,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
})
```

#### tests/setup.ts:

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }),
}))
```

---

### Component Testing Examples

#### Simple Component Test:

```typescript
// components/StatusBadge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders pending status correctly', () => {
    render(<StatusBadge status="pending" />)

    const badge = screen.getByText('Pending')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100')
  })

  it('renders delivered status with checkmark', () => {
    render(<StatusBadge status="delivered" />)

    expect(screen.getByText('Delivered')).toBeInTheDocument()
    expect(screen.getByTestId('checkmark-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<StatusBadge status="pending" className="custom-class" />)

    const badge = screen.getByText('Pending')
    expect(badge).toHaveClass('custom-class')
  })
})
```

#### Interactive Component Test:

```typescript
// components/OrderFilters.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderFilters } from './OrderFilters'

describe('OrderFilters', () => {
  it('calls onChange when status filter changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<OrderFilters onChange={onChange} />)

    const select = screen.getByRole('combobox', { name: /status/i })
    await user.selectOptions(select, 'delivered')

    expect(onChange).toHaveBeenCalledWith({ status: 'delivered' })
  })

  it('resets filters when clear button clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<OrderFilters defaultStatus="pending" onChange={onChange} />)

    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)

    expect(onChange).toHaveBeenCalledWith({ status: 'all' })
  })
})
```

#### Custom Hook Testing:

```typescript
// hooks/useOrders.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOrders } from './useOrders'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client')

describe('useOrders', () => {
  it('fetches orders on mount', async () => {
    const mockOrders = [
      { id: '1', status: 'pending', total_amount: 100 },
      { id: '2', status: 'delivered', total_amount: 200 },
    ]

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useOrders('restaurant-id'))

    await waitFor(() => {
      expect(result.current.orders).toEqual(mockOrders)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('handles fetch errors', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' }
      }),
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useOrders('restaurant-id'))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
      expect(result.current.orders).toEqual([])
    })
  })
})
```

---

## Integration Testing (API Routes)

### API Route Test Setup:

```typescript
// tests/api/orders.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/orders/route'
import { createClient } from '@/lib/supabase/server'

describe('/api/orders', () => {
  beforeEach(async () => {
    // Seed test database
    const supabase = createClient()
    await supabase.from('orders').insert([
      { id: 'test-1', restaurant_id: 'rest-1', status: 'pending' },
      { id: 'test-2', restaurant_id: 'rest-2', status: 'delivered' },
    ])
  })

  afterEach(async () => {
    // Clean up test data
    const supabase = createClient()
    await supabase.from('orders').delete().in('id', ['test-1', 'test-2'])
  })

  it('GET /api/orders returns filtered orders', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { restaurant_id: 'rest-1' },
      headers: {
        authorization: 'Bearer test-token',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.orders).toHaveLength(1)
    expect(data.orders[0].restaurant_id).toBe('rest-1')
  })

  it('POST /api/orders creates new order', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        restaurant_id: 'rest-1',
        items: [{ product_id: 'prod-1', quantity: 5 }],
        total_amount: 500,
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.order.id).toBeDefined()
    expect(data.order.status).toBe('pending')
  })

  it('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Missing restaurant_id
        items: [],
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('restaurant_id')
  })
})
```

---

### Database Integration Tests (RLS):

```typescript
// tests/rls/orders.test.ts
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Orders RLS Policies', () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_ANON_KEY!

  it('restaurant can only view own orders', async () => {
    const restaurantA = createClient(supabaseUrl, supabaseKey)

    // Sign in as Restaurant A
    await restaurantA.auth.signInWithPassword({
      email: 'restaurant-a@test.com',
      password: 'testpassword',
    })

    // Try to fetch all orders
    const { data, error } = await restaurantA
      .from('orders')
      .select('*')

    expect(error).toBeNull()

    // Should only see orders where restaurant_id = auth.uid()
    data!.forEach(order => {
      expect(order.restaurant_id).toBe(restaurantA.auth.user()?.id)
    })
  })

  it('driver cannot modify unassigned orders', async () => {
    const driver = createClient(supabaseUrl, supabaseKey)

    await driver.auth.signInWithPassword({
      email: 'driver@test.com',
      password: 'testpassword',
    })

    // Try to update order not assigned to this driver
    const { error } = await driver
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', 'unassigned-order-id')

    // Should fail (RLS policy blocks)
    expect(error).toBeTruthy()
    expect(error?.code).toBe('PGRST116') // Insufficient privileges
  })

  it('admin has full access', async () => {
    const admin = createClient(supabaseUrl, supabaseKey)

    await admin.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'adminpassword',
    })

    // Admin should see all orders
    const { data, error } = await admin
      .from('orders')
      .select('*')

    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0) // Multiple restaurants
  })
})
```

---

## End-to-End Testing with Playwright

### Installation:

```bash
npm install -D @playwright/test
npx playwright install chromium firefox webkit
```

### playwright.config.ts:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

---

### Critical User Flow Tests:

```typescript
// tests/e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Order Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as restaurant user
    await page.goto('/login')
    await page.fill('[name="email"]', 'restaurant@test.com')
    await page.fill('[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('restaurant can create new order', async ({ page }) => {
    // Navigate to new order page
    await page.click('text=New Order')
    await expect(page).toHaveURL('/orders/new')

    // Select products
    await page.click('text=Add Product')
    await page.selectOption('select[name="product"]', 'product-123')
    await page.fill('input[name="quantity"]', '5')
    await page.click('text=Add to Order')

    // Verify product added
    await expect(page.locator('.order-item')).toHaveCount(1)
    await expect(page.locator('.order-total')).toContainText('500')

    // Submit order
    await page.click('button:has-text("Submit Order")')

    // Verify success
    await expect(page).toHaveURL(/\/orders\/[a-z0-9-]+/)
    await expect(page.locator('.status-badge')).toContainText('Pending')
  })

  test('real-time order status updates', async ({ page, context }) => {
    // Open order page in first tab
    await page.goto('/orders/test-order-id')
    await expect(page.locator('.status-badge')).toContainText('Pending')

    // Open admin page in second tab
    const adminPage = await context.newPage()
    await adminPage.goto('/admin/orders')

    // Admin updates order status
    await adminPage.click(`[data-order-id="test-order-id"] button:has-text("Confirm")`)

    // Verify real-time update in first tab (WebSocket)
    await expect(page.locator('.status-badge')).toContainText('Confirmed', {
      timeout: 5000, // Wait for WebSocket update
    })
  })

  test('handles network offline gracefully', async ({ page, context }) => {
    await page.goto('/orders')

    // Simulate offline
    await context.setOffline(true)

    // Try to create order (should queue)
    await page.click('text=New Order')
    await page.fill('input[name="quantity"]', '3')
    await page.click('text=Submit Order')

    // Verify queued message
    await expect(page.locator('.offline-banner')).toBeVisible()

    // Go back online
    await context.setOffline(false)

    // Verify order syncs
    await expect(page.locator('.success-message')).toBeVisible({
      timeout: 10000,
    })
  })
})
```

---

## Testing Best Practices

### 1. Test Naming Convention

```typescript
// ✅ GOOD: Descriptive test names
describe('OrderCard component', () => {
  it('displays order status badge with correct color', () => {})
  it('shows formatted total amount in GEL currency', () => {})
  it('calls onCancel callback when cancel button clicked', () => {})
})

// ❌ BAD: Vague test names
describe('OrderCard', () => {
  it('works', () => {})
  it('test 1', () => {})
  it('should do something', () => {})
})
```

---

### 2. Arrange-Act-Assert Pattern

```typescript
it('calculates order total correctly', () => {
  // Arrange: Set up test data
  const items = [
    { product_id: '1', quantity: 2, price: 100 },
    { product_id: '2', quantity: 3, price: 50 },
  ]

  // Act: Execute the function
  const total = calculateOrderTotal(items)

  // Assert: Verify the result
  expect(total).toBe(350) // (2 × 100) + (3 × 50)
})
```

---

### 3. Test Isolation

```typescript
// ✅ GOOD: Each test is independent
describe('OrderService', () => {
  beforeEach(() => {
    // Fresh setup for each test
    database.reset()
  })

  it('creates order', async () => {
    const order = await OrderService.create({...})
    expect(order.id).toBeDefined()
  })

  it('cancels order', async () => {
    // Creates own order, doesn't depend on previous test
    const order = await OrderService.create({...})
    await OrderService.cancel(order.id)
    expect(order.status).toBe('cancelled')
  })
})
```

---

## CI/CD Integration

### GitHub Actions Workflow:

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
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

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Testing Checklist

### Pre-Commit

- [ ] All unit tests pass locally
- [ ] New features have tests
- [ ] Test coverage >80%

### Pre-Deployment

- [ ] Unit tests pass in CI
- [ ] Integration tests pass in CI
- [ ] E2E tests pass for critical flows
- [ ] RLS policies tested
- [ ] Performance regression tests pass

---

## Further Resources

- **Vitest Documentation:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/
- **Playwright:** https://playwright.dev/
- **Kent C. Dodds Testing Guide:** https://kentcdodds.com/blog/write-tests
