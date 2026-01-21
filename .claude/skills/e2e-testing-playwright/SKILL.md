---
name: playwright-nextjs-e2e-testing
description: Sets up and configures Playwright end-to-end testing for Next.js 15 applications with Page Object Model patterns, Supabase authentication, visual regression testing, and GitHub Actions CI/CD integration. Use when building E2E test suites, testing Next.js applications, implementing authentication testing, or setting up automated visual regression checks.
---

# Playwright E2E Testing for Next.js 15

## Quick Start

Initialize Playwright in your Next.js 15 project:

```bash
npm init playwright@latest
# Choose: TypeScript, Chromium/Firefox/WebKit, add GitHub Actions workflow
```

Create `playwright.config.ts`:

```typescript
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
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices.chromiumDesktop } },
    { name: 'firefox', use: { ...devices.firefoxDesktop } },
    { name: 'webkit', use: { ...devices.webkitDesktop } },
  ],
});
```

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

## When to Use This Skill

- Setting up E2E tests for Next.js 15 App Router applications
- Testing authentication flows (Supabase, OAuth, email/password)
- Validating multi-step user journeys and workflows
- Implementing visual regression testing for UI consistency
- Setting up automated testing in CI/CD pipelines
- Creating Page Object Model test suites for maintainability

## Core Concepts

**End-to-End Testing**: Tests verify complete user workflows across the entire application stack, from UI interactions to backend responses.

**Locator Priority** (most resilient first):
1. `getByRole()` - Based on ARIA roles (accessibility-first)
2. `getByLabel()` - Form inputs by associated labels
3. `getByPlaceholder()` - Inputs by placeholder text
4. `getByText()` - Elements by visible text
5. `getByTestId()` - Custom data-testid attributes (most explicit)

**Why this matters**: Locators based on user-facing attributes (role, text) are more resilient to CSS/class changes than brittle selectors.

## Implementation Guide

### 1. Project Structure

```
your-next-app/
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── checkout.spec.ts
│   ├── fixtures/
│   │   └── auth.fixture.ts
│   └── pages/
│       ├── login.page.ts
│       ├── dashboard.page.ts
│       └── checkout.page.ts
├── playwright.config.ts
└── .github/
    └── workflows/
        └── playwright.yml
```

### 2. Page Object Model (POM) Pattern

Create a base page class:

```typescript
// tests/pages/base.page.ts
import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForUrl(pattern: string | RegExp) {
    await this.page.waitForURL(pattern);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `./test-results/${name}.png` });
  }
}
```

Create a login page class:

```typescript
// tests/pages/login.page.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  private readonly emailInput = this.page.getByLabel('Email');
  private readonly passwordInput = this.page.getByLabel('Password');
  private readonly submitButton = this.page.getByRole('button', { name: /sign in/i });
  private readonly errorMessage = this.page.getByRole('alert');

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAsAdmin() {
    await this.login('admin@example.com', 'secure-password');
  }

  async expectErrorMessage(text: string) {
    await expect(this.errorMessage).toContainText(text);
  }
}
```

### 3. Basic Test Example

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('user can login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto('/login');
  await loginPage.login('user@example.com', 'password123');
  await loginPage.waitForUrl('/dashboard');
  
  await expect(page.getByRole('heading', { name: 'Dashboard' }))
    .toBeVisible();
});

test('login fails with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto('/login');
  await loginPage.login('user@example.com', 'wrong-password');
  
  await loginPage.expectErrorMessage('Invalid credentials');
});
```

### 4. Supabase Authentication Testing

For testing with Supabase email/password (non-OTP flow):

```typescript
// tests/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto('/login');
    await loginPage.loginAsAdmin();
    await loginPage.waitForUrl('/dashboard');
    
    // Persist auth state for faster test runs
    await page.context().storageState({ path: 'auth.json' });
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

For OTP-based Supabase flows (with database trigger approach):

```typescript
// tests/fixtures/supabase-otp.fixture.ts
import { test as base } from '@playwright/test';

// Database trigger generates predictable OTP for @example.com emails
const OTP_CODE = '123456';

export const test = base.extend({
  supabaseAuth: async ({ page }, use) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByRole('button', { name: /send otp/i }).click();
    
    // Wait for OTP to be generated by database trigger
    await page.waitForTimeout(500);
    
    await page.getByLabel('OTP Code').fill(OTP_CODE);
    await page.getByRole('button', { name: /verify/i }).click();
    await page.waitForURL('/dashboard');
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### 5. API Mocking & Interception

Mock API responses:

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard shows mocked user data', async ({ page }) => {
  // Intercept and mock the API call
  await page.route('**/api/user', (route) => {
    route.abort('blockedbyclient');
  });
  
  // Or fulfill with custom response
  await page.route('**/api/user', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
      }),
    });
  });
  
  await page.goto('/dashboard');
  await expect(page.getByText('Test User')).toBeVisible();
});
```

Partial interception (pass through + modify):

```typescript
// tests/e2e/api-override.spec.ts
import { test, expect } from '@playwright/test';

test('modify API response without blocking', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    
    // Modify response on the fly
    json.items = json.items.slice(0, 3); // Limit to 3 items
    
    await route.fulfill({ response, json });
  });
  
  await page.goto('/products');
  const items = page.locator('[data-testid="product-item"]');
  await expect(items).toHaveCount(3);
});
```

### 6. Multi-Page Flows (Checkout Example)

```typescript
// tests/pages/checkout.page.ts
import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  async proceedToShipping() {
    await this.page.getByRole('button', { name: /continue/i }).click();
    await this.page.waitForURL('**/checkout/shipping');
  }

  async fillShippingAddress(
    street: string,
    city: string,
    zipCode: string
  ) {
    await this.page.getByLabel('Street').fill(street);
    await this.page.getByLabel('City').fill(city);
    await this.page.getByLabel('Zip Code').fill(zipCode);
    await this.proceedToShipping();
  }

  async selectShippingMethod(method: 'standard' | 'express') {
    await this.page
      .getByLabel(method === 'standard' ? 'Standard (5-7 days)' : 'Express (1-2 days)')
      .check();
    await this.page.getByRole('button', { name: /continue/i }).click();
  }

  async completePayment() {
    await this.page.getByRole('button', { name: /place order/i }).click();
    await this.page.waitForURL('**/checkout/confirmation');
  }
}
```

Test multi-page checkout:

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect, authenticatedPage } from '../fixtures/auth.fixture';
import { CheckoutPage } from '../pages/checkout.page';

test('user completes checkout flow', async ({ authenticatedPage }) => {
  const checkout = new CheckoutPage(authenticatedPage);
  
  await checkout.goto('/cart');
  await authenticatedPage.getByRole('button', { name: /checkout/i }).click();
  
  await checkout.fillShippingAddress('123 Main St', 'Portland', '97214');
  await checkout.selectShippingMethod('express');
  await checkout.completePayment();
  
  await expect(authenticatedPage.getByText('Order Confirmed')).toBeVisible();
});
```

### 7. Visual Regression Testing

Basic visual snapshots:

```typescript
// tests/e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test('homepage snapshot matches baseline', async ({ page }) => {
  await page.goto('/');
  
  // First run: creates baseline
  // Subsequent runs: compares against baseline
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100, // Allow 100 pixel differences
  });
});

test('button states visual consistency', async ({ page }) => {
  await page.goto('/components/buttons');
  
  // Individual component screenshot
  const button = page.getByRole('button', { name: 'Submit' });
  await expect(button).toHaveScreenshot('button-default.png');
  
  // Hover state
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
});
```

Update baselines after intentional changes:

```bash
npx playwright test --update-snapshots
```

### 8. Accessibility Testing

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  // Inject axe-core into page
  await injectAxe(page);
  
  // Run accessibility checks
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  });
});

test('form is keyboard navigable', async ({ page }) => {
  await page.goto('/contact');
  
  // Tab through form fields
  await page.keyboard.press('Tab'); // Focus first input
  await expect(page.locator(':focus')).toHaveAttribute('name', 'email');
  
  await page.keyboard.press('Tab'); // Focus message
  await expect(page.locator(':focus')).toHaveAttribute('name', 'message');
  
  // Skip to submit button
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter'); // Submit form
  
  await page.waitForURL('/contact/thank-you');
});
```

## Best Practices

**Locator Priority Strategy**
- ✅ Use `getByRole()` for buttons, links, form controls (accessible & resilient)
- ✅ Use `getByLabel()` for form inputs (explicit association)
- ✅ Use `getByTestId()` only when semantic locators unavailable
- ❌ Avoid XPath and CSS selectors unless absolutely necessary
- ❌ Don't use element text for buttons—use role instead

**Test Isolation & Setup**
- ✅ Clear browser state between tests for clean environment
- ✅ Use fixtures for shared setup (authentication, database state)
- ✅ Keep global setup minimal—use fixtures for test-specific setup
- ✅ Run tests in parallel by default for speed

**Debugging & Troubleshooting**
- Run tests with `--debug` flag to step through interactively
- Use `page.pause()` to pause execution during test runs
- Check `--trace` output: `npx playwright show-trace trace.zip`
- Use Playwright Inspector (`Ctrl+Shift+P` in debug mode)

**CI/CD Integration**
- ✅ Use `webServer` to auto-start dev server in playwright.config.ts
- ✅ Keep retries low (2-3) and workers at 1 in CI
- ✅ Save HTML reports as CI artifacts for post-failure analysis
- ✅ Use trace/screenshots for investigating flaky tests

**Avoiding Flaky Tests**
- ❌ Never use `waitForTimeout()` (arbitrary waits cause flakiness)
- ✅ Use automatic waits: `waitForURL()`, `waitForSelector()`, `isVisible()`
- ✅ Use `expect()` which retries automatically
- ✅ Set reasonable timeouts (default 30s is usually fine)

## Code Examples

### Complete Auth + Protected Route Test

```typescript
// tests/e2e/complete-flow.spec.ts
import { test, expect, authenticatedPage } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test('authenticated user accesses protected dashboard', async ({ 
  authenticatedPage 
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  
  // Already logged in via fixture
  await dashboard.goto('/dashboard');
  
  // Verify protected content visible
  await expect(authenticatedPage.getByRole('heading', { 
    name: 'Welcome' 
  })).toBeVisible();
  
  // Verify user info displayed
  await expect(authenticatedPage.getByText(/admin@example.com/))
    .toBeVisible();
});

test('unauthenticated user redirected to login', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Should redirect to login
  await page.waitForURL('/login');
  await expect(page.getByRole('heading', { name: 'Sign In' }))
    .toBeVisible();
});
```

### Conditional API Mocking

```typescript
// tests/e2e/feature-flags.spec.ts
import { test, expect } from '@playwright/test';

test('feature flag enables new UI', async ({ page }) => {
  // Mock feature flag API
  await page.route('**/api/feature-flags', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        newCheckout: true,
        betaFeatures: false,
      }),
    });
  });
  
  await page.goto('/checkout');
  
  // New UI should be visible
  await expect(page.getByTestId('new-checkout-flow'))
    .toBeVisible();
});
```

## Common Errors & Solutions

**"Timeout waiting for locator"**
- Locator doesn't exist or hasn't appeared yet
- Check locator specificity: try `getByRole()` instead of CSS
- Increase timeout: `expect(element, { timeout: 5000 })`
- Verify element is in viewport for mobile tests

**"Test passed but UI shows different content in CI"**
- Database state differs between local/CI
- Use fixtures to reset database state before tests
- Mock external APIs to control responses
- Check timezone and locale settings

**"Tests pass locally but fail in CI"**
- Different viewport sizes (set in config)
- Flaky network conditions (increase waits)
- Different Node.js versions (pin in CI workflow)
- Use `trace: 'on-first-retry'` to capture failure details

**"getByRole() finds wrong element"**
- Multiple elements with same role exist
- Add name filter: `getByRole('button', { name: /submit/i })`
- Use `exact: false` for case-insensitive matching
- Chain with other locators: `page.locator('form').getByRole('button')`

**"Storage state not persisting between tests"**
- Ensure `storageState` path exists in config
- Call `page.context().storageState()` explicitly after login
- Use authenticated fixture instead of storing manually

## GitHub Actions CI/CD Setup

Basic workflow:

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

With deployment preview support (Vercel/Netlify):

```yaml
name: Playwright Tests on Deploy Preview

on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  test:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Get deploy preview URL
        run: |
          PREVIEW_URL=${{ github.event.workflow_run.head_commit.message }}
          echo "PLAYWRIGHT_TEST_BASE_URL=$PREVIEW_URL" >> $GITHUB_ENV
      
      - run: npx playwright test
        env:
          PLAYWRIGHT_TEST_BASE_URL: ${{ env.PLAYWRIGHT_TEST_BASE_URL }}
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Testing with Playwright

Basic performance metrics:

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test('page load performance is acceptable', async ({ page }) => {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    };
  });
  
  // Assert performance thresholds
  expect(metrics.domContentLoaded).toBeLessThan(1000); // < 1s
  expect(metrics.loadComplete).toBeLessThan(2000); // < 2s
  expect(metrics.firstContentfulPaint).toBeLessThan(1500); // < 1.5s
});
```

## References

- [Playwright Documentation](https://playwright.dev)
- [Next.js Testing with Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright API Mocking](https://playwright.dev/docs/mock)
- [Playwright CI/CD](https://playwright.dev/docs/ci)
- [Supabase Auth Testing](https://www.bekapod.dev/articles/supabase-magic-login-testing-with-playwright/)
- [Playwright Visual Testing](https://mmazzarolo.com/blog/2022-09-09-visual-regression-testing-with-playwright-and-github-actions/)
- [Page Object Model Pattern](https://www.youtube.com/watch?v=tj0xZSRoUj4)
