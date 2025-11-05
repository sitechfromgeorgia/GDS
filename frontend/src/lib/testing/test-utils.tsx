/**
 * Testing Utilities
 *
 * Reusable test helpers, mock factories, and custom render functions.
 * Import these utilities in your test files to reduce boilerplate.
 *
 * @example
 * import { renderWithProviders, mockSupabaseClient } from '@/lib/testing/test-utils'
 */

import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { vi, beforeAll, afterAll } from 'vitest'
import type { Database } from '@/types/database'

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Generate mock user profile
 */
export function createMockProfile(
  overrides?: Partial<Database['public']['Tables']['profiles']['Row']>
) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'restaurant' as const,
    full_name: 'Test User',
    phone: '+995555123456',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate mock order
 */
export function createMockOrder(
  overrides?: Partial<Database['public']['Tables']['orders']['Row']>
) {
  return {
    id: 'test-order-id',
    restaurant_id: 'test-restaurant-id',
    driver_id: null,
    status: 'pending' as const,
    total_amount: 100,
    items: [{ product_id: '1', quantity: 2, price: 50 }],
    delivery_address: '123 Test Street',
    delivery_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate mock product
 */
export function createMockProduct(
  overrides?: Partial<Database['public']['Tables']['products']['Row']>
) {
  return {
    id: 'test-product-id',
    name: 'Test Product',
    description: 'Test product description',
    price: 50,
    category: 'food',
    image_url: null,
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================================================
// Supabase Mocks
// ============================================================================

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: [],
            error: null,
          })
        ),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      })),
      insert: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
      update: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
      })),
    })),
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: {
            session: {
              user: {
                id: 'test-user-id',
                email: 'test@example.com',
                aud: 'authenticated',
                role: 'authenticated',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              access_token: 'test-access-token',
              refresh_token: 'test-refresh-token',
              expires_at: Date.now() + 3600000,
              expires_in: 3600,
              token_type: 'bearer',
            },
          },
          error: null,
        })
      ),
      getUser: vi.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          error: null,
        })
      ),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            session: {
              access_token: 'test-access-token',
              refresh_token: 'test-refresh-token',
              expires_at: Date.now() + 3600000,
              expires_in: 3600,
              token_type: 'bearer',
              user: {
                id: 'test-user-id',
                email: 'test@example.com',
                aud: 'authenticated',
                role: 'authenticated',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            },
          },
          error: null,
        })
      ),
      signOut: vi.fn(() =>
        Promise.resolve({
          error: null,
        })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  }
}

/**
 * Mock the Supabase module for testing
 */
export function mockSupabaseModule() {
  vi.mock('@/lib/supabase', () => ({
    createBrowserClient: vi.fn(() => createMockSupabaseClient()),
  }))
}

// ============================================================================
// Custom Render Functions
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial route for testing
   */
  initialRoute?: string
}

/**
 * Custom render function with all providers
 *
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  const { initialRoute = '/', ...renderOptions } = options || {}

  function Wrapper({ children }: { children: ReactNode }) {
    // Add providers here as needed (QueryClientProvider, etc.)
    return <>{children}</>
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Wait for async operations to complete
 */
export function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Create a mock router for testing
 */
export function createMockRouter(overrides?: any) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    ...overrides,
  }
}

/**
 * Suppress console errors in tests
 */
export function suppressConsoleError() {
  const originalError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })
  afterAll(() => {
    console.error = originalError
  })
}

/**
 * Create a mock file for upload testing
 */
export function createMockFile(name = 'test.png', size = 1024, type = 'image/png'): File {
  const blob = new Blob(['test'], { type })
  return new File([blob], name, { type })
}
