import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult, queries, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, vi } from 'vitest'
import { testData } from './setupTests'

// Mock context providers for testing
const MockAuthProvider: React.FC<{ children?: React.ReactNode; initialUser?: any }> = ({
  children,
  initialUser = null,
}) => {
  return React.createElement('div', { 'data-testid': 'auth-provider' }, children || null)
}

const MockSupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'supabase-provider' }, children)
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: 'admin' | 'restaurant' | 'driver' | 'customer' | 'none'
  authState?: 'authenticated' | 'unauthenticated' | 'loading'
  initialEntries?: string[]
}

// Create a wrapper component that provides all necessary providers
function createWrapper(options: Partial<CustomRenderOptions> = {}) {
  const { user = 'none', authState = 'unauthenticated', initialEntries = ['/'] } = options

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    // Mock user state based on options
    const mockUser = user !== 'none' ? testData.users[user] : null

    // Create Query Client
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        MockSupabaseProvider,
        null,
        React.createElement(
          MockAuthProvider,
          { initialUser: mockUser },
          React.createElement('div', { 'data-testid': 'test-wrapper' }, children)
        )
      )
    )
  }
}

// Custom render function with all providers
function customRender(ui: ReactElement, options: CustomRenderOptions = {}): RenderResult {
  const {
    user = 'none',
    authState = 'unauthenticated',
    initialEntries = ['/'],
    ...renderOptions
  } = options

  const AllProviders = createWrapper({ user, authState, initialEntries })

  return render(ui, {
    wrapper: AllProviders,
    ...renderOptions,
  })
}

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }

// Helper functions for Georgian Distribution System testing

/**
 * Create a mock order with Georgian test data
 */
export function createMockOrder(overrides: Partial<(typeof testData.orders)[0]> = {}) {
  return {
    ...testData.orders[0],
    id: `order-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock product with Georgian test data
 */
export function createMockProduct(overrides: Partial<(typeof testData.products)[0]> = {}) {
  return {
    ...testData.products[0],
    id: `product-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock user with Georgian test data
 */
export function createMockUser(
  overrides: Partial<(typeof testData.users)[keyof typeof testData.users]> = {}
) {
  return {
    ...testData.users.admin,
    id: `user-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Wait for Georgian text to appear in the document
 */
export async function waitForGeorgianText(
  text: string | RegExp,
  options?: { timeout?: number; onTimeout?: (error: Error) => Error }
) {
  return waitFor(() => {
    const element = document.body
    expect(element).toHaveTextContent(text)
  }, options)
}

/**
 * Wait for loading state to complete
 */
export async function waitForLoadingToComplete() {
  return waitFor(() => {
    const loadingElements = document.querySelectorAll(
      '[data-testid="loading"], .loading, [aria-busy="true"]'
    )
    expect(loadingElements.length).toBe(0)
  })
}

/**
 * Mock Georgian phone number validation
 */
export function mockGeorgianPhoneValidation() {
  return {
    validateGeorgianPhone: (phone: string) => /^(\+995|0)[5-9]\d{8}$/.test(phone),
    formatGeorgianPhone: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '')

      if (cleaned.startsWith('0')) {
        return `+995${cleaned}`
      } else if (cleaned.startsWith('995')) {
        return `+${cleaned}`
      } else {
        return phone
      }
    },
  }
}

/**
 * Mock Georgian business data
 */
export function createGeorgianBusinessData() {
  return {
    cities: [
      { name: 'თბილისი', nameLatin: 'Tbilisi', code: '5501' },
      { name: 'ბათუმი', nameLatin: 'Batumi', code: '5502' },
      { name: 'ქუთაისი', nameLatin: 'Kutaisi', code: '5503' },
      { name: 'რუსთავი', nameLatin: 'Rustavi', code: '5504' },
    ],
    cuisines: ['ქართული', 'იტალიური', 'ამერიკული', 'აზიური', 'მექსიკური', 'ინდური'],
    currencies: [
      { code: 'GEL', symbol: '₾', name: 'ქართული ლარი' },
      { code: 'USD', symbol: '$', name: 'ამერიკული დოლარი' },
      { code: 'EUR', symbol: '€', name: 'ევრო' },
    ],
  }
}

/**
 * Mock Georgian address validation
 */
export function validateGeorgianAddress(address: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  const lines = address.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length < 1) {
    errors.push('Address must contain at least one line')
  }

  const hasValidPostcode = /\b\d{5}\b/.test(address)
  if (!hasValidPostcode) {
    errors.push('Address must contain valid Georgian postal code (5 digits)')
  }

  const hasGeorgianCity = /(თბილისი|ბათუმი|ქუთაისი|რუსთავი|ზუგდიდი|გორი)/i.test(address)
  if (!hasGeorgianCity) {
    errors.push('Address should include a major Georgian city')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Mock Georgian language text for testing
 */
export function generateGeorgianTestText(type: 'short' | 'medium' | 'long' = 'medium'): string {
  const texts = {
    short: ['კეთილი იყოს თქვენი მობრძანება', 'გამარჯობა', 'მადლობა', 'ბოდიში'],
    medium: [
      'ტრადიციული ქართული სამზარეულო ბუღალტერული მომსახურება',
      'მიწოდების სერვისი მთავარი სტუდენტური დაწესებულება',
      'საუკეთესო რესტორანი კავშირგასვლელი მომხმარებელი',
    ],
    long: [
      'თბილისის ბაზრის საუკეთესო მონაცემთა ბაზაში ტექნოლოგიური რევოლუცია და ბიზნეს-პროცესების ციფრული ტრანსფორმაცია',
    ],
  }

  const collection = texts[type]
  return collection[Math.floor(Math.random() * collection.length)]!
}

/**
 * Mock Supabase query response for testing
 */
export function mockSupabaseResponse<T>(data: T[], error: any = null) {
  return { data, error, count: data?.length || null }
}

/**
 * Create mock order with realistic Georgian business data
 */
export function createGeorgianOrder(orderNumber?: string) {
  const orderId = orderNumber || `GDS-${Date.now()}`
  const cities = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი']
  const streets = [
    'რუსთაველის გამზირი',
    'ჩოლოყაშვილის ქუჩა',
    'კოსტავას ქუჩა',
    'თამარ მეფის გამზირი',
  ]

  return {
    id: orderId,
    customer_id: testData.users.customer.id,
    restaurant_id: testData.restaurants[0]!.id,
    driver_id: testData.users.driver.id,
    status: 'pending' as const,
    total_amount: 45.0,
    delivery_address: `${cities[0]!}, ${streets[0]!} ${Math.floor(Math.random() * 200) + 1}`,
    notes: 'სასურველი მიწოდების დრო: 19:00-20:00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Mock Georgian product categories
 */
export const georgianProductCategories = {
  main: 'ძირითადი კერძი',
  soup: 'წვნიანი',
  salad: 'სალათი',
  appetizer: 'დესერტი',
  dessert: 'დესერტი',
  drink: 'სასმელი',
  bread: 'პური',
  sauce: 'სოუსი',
}

// Custom selectors for Georgian content
export const georgianQueries = {
  ...queries,
  getByGeorgianText: (container: HTMLElement, text: string) => {
    const elements = Array.from(container.querySelectorAll('*')).filter((el) =>
      el.textContent?.includes(text)
    )
    return elements[0] || null
  },
  queryByGeorgianText: (container: HTMLElement, text: string) => {
    const elements = Array.from(container.querySelectorAll('*')).filter((el) =>
      el.textContent?.includes(text)
    )
    return elements[0] || null
  },
  findByGeorgianText: async (container: HTMLElement, text: string) => {
    await waitFor(() => {
      const element = georgianQueries.getByGeorgianText(container, text)
      expect(element).toBeInTheDocument()
    })
    return georgianQueries.getByGeorgianText(container, text)!
  },
}

// Export types for use in tests
export type MockOrder = ReturnType<typeof createGeorgianOrder>
export type MockProduct = ReturnType<typeof createMockProduct>
export type MockUser = ReturnType<typeof createMockUser>
