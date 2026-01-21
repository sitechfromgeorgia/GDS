---
name: testing-vitest-nextjs-15
description: Comprehensive guide for setting up Vitest with Next.js 15 and React 19, including component testing, Server Actions testing, mocking strategies (Supabase, MSW, router), and coverage reporting. Use when implementing unit tests for Next.js projects, testing React components, mocking APIs, or setting up CI/CD test pipelines.
---

# Vitest Testing for Next.js 15 & React 19

## Quick Start

### 1. Install Dependencies

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths @vitest/ui vitest-canvas-mock
```

### 2. Create `vitest.config.mts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
```

### 3. Create `vitest.setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest expect with DOM matchers
expect.extend(matchers);

// Auto-cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/headers for Server Components
vi.mock('next/headers', async (importOriginal) => {
  return {
    cookies: () => ({
      get: (name: string) => ({ value: 'test-cookie' }),
      set: () => {},
    }),
    headers: () => ({
      get: (name: string) => 'test-header',
    }),
  };
});
```

### 4. Update `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:run": "vitest run"
  }
}
```

### 5. Create Test Utils (`src/test-utils.tsx`)

```typescript
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Wrap components with providers (Redux, Contexts, etc.)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## When to Use This Skill

- Setting up unit testing for Next.js 15 projects
- Testing React 19 components with modern hooks
- Creating tests for Server Actions and API routes
- Implementing mocking strategies for external services
- Setting up coverage reports and CI/CD pipelines
- Testing custom hooks and utility functions

## Core Concepts

### Test Organization Strategy

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
├── hooks/
│   ├── useCart.ts
│   └── useCart.test.ts
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts
├── app/
│   └── actions.test.ts          // Server Actions tests
└── __tests__/                   // Separate test directory (alternative)
    ├── integration/
    └── unit/
```

### Testing Philosophy

1. **User-Centric**: Test user interactions, not implementation details
2. **Minimal Mocks**: Mock only external dependencies, test real component logic
3. **Fast Execution**: Vitest runs tests in parallel, significantly faster than Jest
4. **Type Safety**: Full TypeScript support for type-safe test assertions

## Implementation Guide

### Component Testing (React 19)

```typescript
// src/components/Counter.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

describe('Counter Component', () => {
  it('increments count when button is clicked', async () => {
    render(<Counter initialCount={0} />);

    const button = screen.getByRole('button', { name: /increment/i });
    const user = userEvent.setup();

    await user.click(button);

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('calls onCountChange callback when count changes', async () => {
    const onCountChange = vi.fn();
    render(<Counter onCountChange={onCountChange} />);

    const button = screen.getByRole('button', { name: /increment/i });
    const user = userEvent.setup();

    await user.click(button);

    expect(onCountChange).toHaveBeenCalledWith(1);
  });

  it('supports controlled mode via props', () => {
    const { rerender } = render(<Counter count={5} />);

    expect(screen.getByText('Count: 5')).toBeInTheDocument();

    rerender(<Counter count={10} />);

    expect(screen.getByText('Count: 10')).toBeInTheDocument();
  });
});
```

### Custom Hooks Testing

```typescript
// src/hooks/useCart.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useCart from './useCart';

describe('useCart Hook', () => {
  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('adds items to cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 100 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(100);
  });

  it('removes items from cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 100 });
      result.current.removeItem('1');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});
```

### Server Actions Testing

```typescript
// src/app/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTodo } from './actions';

// Mock next/cache module
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates todo and revalidates cache', async () => {
    const { revalidatePath } = await import('next/cache');

    const result = await createTodo({ title: 'Test Todo' });

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: 'Test Todo',
      })
    );

    expect(revalidatePath).toHaveBeenCalledWith('/todos');
  });

  it('throws error for invalid input', async () => {
    await expect(createTodo({ title: '' })).rejects.toThrow(
      'Title is required'
    );
  });
});
```

### API Route Testing

```typescript
// src/app/api/users/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from './route';

describe('Users API Route', () => {
  it('GET returns list of users', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
    ]));
  });

  it('POST creates new user', async () => {
    const request = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('John Doe');
  });
});
```

## Mocking Strategies

### 1. MSW (Mock Service Worker) - Network-Level Mocking

**Setup MSW handlers** (`src/mocks/handlers.ts`):

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ]);
  }),

  http.post('/api/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json(
        { token: 'jwt-token', user: { id: '1', email: body.email } },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),
];
```

**Setup MSW server** (`src/mocks/server.ts`):

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Configure in `vitest.setup.ts`**:

```typescript
import { server } from './src/mocks/server';
import { beforeAll, afterEach, afterAll } from 'vitest';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Use in tests**:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { server } from '@/mocks/server';
import { HttpResponse, http } from 'msw';
import UserProfile from './UserProfile';

describe('UserProfile with MSW', () => {
  it('fetches and displays user data', async () => {
    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles login error', async () => {
    server.use(
      http.post('/api/login', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    render(<LoginForm />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });
});
```

### 2. Supabase Client Mocking

```typescript
// vitest.setup.ts - Add this alongside other mocks
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }),
      insert: vi.fn().mockResolvedValue({ data: { id: '1' } }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: { id: '1' } }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({}),
      }),
    })),
  })),

  createBrowserClient: vi.fn(() => ({
    auth: {
      onAuthStateChange: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }),
    })),
  })),
}));
```

**Use in tests**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createServerClient } from '@supabase/ssr';
import { fetchUsers } from './actions';

describe('Supabase Server Actions', () => {
  it('fetches users from database', async () => {
    const supabase = createServerClient();
    const result = await fetchUsers();

    expect(supabase.from).toHaveBeenCalledWith('users');
  });
});
```

### 3. Next.js Router Mocking

```typescript
// vitest.setup.ts
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
```

**Use in tests**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { useRouter } from 'next/navigation';
import NavigationComponent from './Navigation';

describe('Navigation with Router Mock', () => {
  it('navigates to page on link click', async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);

    render(<NavigationComponent />);

    const user = userEvent.setup();
    await user.click(screen.getByText('Home'));

    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
```

### 4. Module Mocking with `vi.mock()`

```typescript
// Mock entire module before imports
vi.mock('@/lib/utils', () => ({
  parseJSON: vi.fn((json: string) => JSON.parse(json)),
  formatDate: vi.fn((date: Date) => date.toISOString()),
}));

// Use mocked module
import { parseJSON, formatDate } from '@/lib/utils';

describe('Utils Mocking', () => {
  it('calls parseJSON with correct input', () => {
    const result = parseJSON('{"name":"test"}');

    expect(parseJSON).toHaveBeenCalledWith('{"name":"test"}');
    expect(result).toEqual({ name: 'test' });
  });
});
```

## Best Practices

### 1. Query by Semantics, Not Implementation

```typescript
// ❌ Bad: Queries by implementation details
screen.getByTestId('user-input');
screen.getByClassName('input-field');

// ✅ Good: Queries by user-facing semantics
screen.getByRole('textbox', { name: /username/i });
screen.getByLabelText(/password/i);
screen.getByPlaceholderText(/search/i);
```

### 2. Use `userEvent` Instead of `fireEvent`

```typescript
// ❌ Bad: Direct DOM manipulation
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'test' } });

// ✅ Good: Realistic user interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'test');
```

### 3. Async Test Handling

```typescript
// ✅ Good: Proper async handling
it('loads data asynchronously', async () => {
  render(<AsyncComponent />);

  // Wait for loading state to disappear
  expect(screen.getByRole('status')).toHaveTextContent('Loading');

  // Wait for data to appear
  const user = await screen.findByRole('heading', { name: /user name/i });
  expect(user).toBeInTheDocument();
});
```

### 4. Test Isolation and Cleanup

```typescript
// ✅ Good: Clear mocks between tests
describe('Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    // Test without interference from other tests
  });

  it('test 2', () => {
    // Clean slate
  });
});
```

### 5. Type-Safe Test Utilities

```typescript
// Create strongly-typed render function
const renderWithProviders = (
  component: React.ReactElement,
  { theme = 'light', ...options }: { theme?: 'light' | 'dark' } = {}
) => {
  return render(
    <ThemeProvider initialTheme={theme}>{component}</ThemeProvider>,
    options
  );
};

// Use with TypeScript inference
renderWithProviders(<MyComponent />, { theme: 'dark' });
```

### 6. Coverage Targets for Production Code

```
Component Logic: 80% coverage minimum
Utility Functions: 90% coverage minimum
Business Logic: 85% coverage minimum
UI Interactions: 70% coverage minimum
```

## Project Structure Template

```
project/
├── vitest.config.mts
├── vitest.setup.ts
├── package.json
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useAuth.test.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── helpers.test.ts
│   ├── app/
│   │   ├── actions.ts
│   │   ├── actions.test.ts
│   │   └── api/
│   │       └── route.test.ts
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   └── test-utils.tsx
├── coverage/                    # Generated coverage reports
└── __tests__/                   # Alternative: Separate test directory
```

## Common Errors & Troubleshooting

### Error: "Cannot find module 'next/headers'"

**Solution**: Mock `next/headers` in `vitest.setup.ts`:

```typescript
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => ({ value: 'test' }),
  }),
}));
```

### Error: "Async test timed out after 5000ms"

**Solution**: Increase timeout or fix async logic:

```typescript
// Option 1: Increase timeout for specific test
it('fetches data', async () => {
  // test code
}, { timeout: 10000 });

// Option 2: Fix async issue - ensure proper waiting
it('fetches data', async () => {
  render(<Component />);
  const element = await screen.findByRole('heading'); // Use findBy, not getBy
  expect(element).toBeInTheDocument();
});
```

### Error: "TypeError: Cannot read property 'useRouter'"

**Solution**: Ensure mock is defined before component import:

```typescript
// ✅ Correct order
vi.mock('next/navigation');
import { useRouter } from 'next/navigation';
import MyComponent from './MyComponent';

// ❌ Wrong order
import MyComponent from './MyComponent';
vi.mock('next/navigation'); // Too late
```

### Error: "fetch is not defined" in Server Actions

**Solution**: Node.js environment includes fetch. Ensure test environment is set to `node`:

```typescript
// vitest.config.mts
test: {
  environment: 'node', // For Server Actions
  // or 'jsdom' for component tests
}
```

### Error: "ReferenceError: global is not defined"

**Solution**: This is normal in component tests with JSDOM. Check that `globals: true` is set:

```typescript
test: {
  globals: true, // Defines describe, it, expect globally
}
```

### Flaky Tests: Component States Not Updating

**Solution**: Wrap state updates in `act()`:

```typescript
import { act } from '@testing-library/react';

it('updates state correctly', async () => {
  const { result } = renderHook(() => useState(0));

  act(() => {
    result.current[1](1); // Set state
  });

  expect(result.current[0]).toBe(1);
});
```

## Coverage Reporting

### View Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report (auto-generated in ./coverage)
open coverage/index.html

# View in Vitest UI
npm run test:ui
# Then click "Coverage" button in the UI
```

### Configure Coverage Thresholds

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
```

### CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## References

- [Vitest Official Documentation](https://vitest.dev)
- [Vitest Configuration Guide](https://vitest.dev/config/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Mock Service Worker](https://mswjs.io)
- [Next.js Testing Documentation](https://nextjs.org/docs/app/guides/testing/vitest)
- [Vitest Coverage Configuration](https://vitest.dev/guide/coverage.html)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro)
