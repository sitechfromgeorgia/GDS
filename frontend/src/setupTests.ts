// Test setup file for Georgian Distribution System
// This file runs before each test file

import '@testing-library/jest-dom/vitest'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock environment variables for testing
Object.defineProperty(process, 'env', {
  value: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NODE_ENV: process.env.NODE_ENV || 'test',
  },
  configurable: true,
})

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
    refreshSession: vi.fn(),
    getUserAttributes: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
    then: (resolve: any) => resolve({ data: [], error: null }),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
  realtime: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      off: vi.fn().mockReturnThis(),
      track: vi.fn(),
      untrack: vi.fn(),
    })),
  },
  rpc: vi.fn(),
}

// Mock createBrowserClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock Supabase SSR functions
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => mockSupabaseClient,
  createServerClient: () => mockSupabaseClient,
  createClient: () => mockSupabaseClient,
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    forEach: vi.fn(),
  }),
  usePathname: () => '/test',
  useParams: () => ({}),
}))

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}))

// Mock Zustand
vi.mock('zustand', () => ({
  create: vi.fn(() => vi.fn()),
}))

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn(),
    formState: { errors: {} },
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
  }),
  Controller: () => null,
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  User: () => null,
  ShoppingCart: () => null,
  Settings: () => null,
  LogOut: () => null,
  Menu: () => null,
  X: () => null,
  Plus: () => null,
  Edit: () => null,
  Trash: () => null,
  Eye: () => null,
  EyeOff: () => null,
  Search: () => null,
  Filter: () => null,
  Download: () => null,
  Upload: () => null,
  Check: () => null,
  XCircle: () => null,
  AlertCircle: () => null,
  Info: () => null,
  CheckCircle: () => null,
  Clock: () => null,
  Calendar: () => null,
  MapPin: () => null,
  Phone: () => null,
  Mail: () => null,
  UserCircle: () => null,
  Lock: () => null,
  Unlock: () => null,
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2023-01-01'),
  parseISO: vi.fn(() => new Date('2023-01-01')),
  isValid: vi.fn(() => true),
  addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
  formatDistance: vi.fn(() => '2 hours'),
  differenceInDays: vi.fn(() => 1),
  differenceInHours: vi.fn(() => 2),
  differenceInMinutes: vi.fn(() => 30),
}))

// Mock global timers
vi.useFakeTimers()

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})) as any

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})) as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:test-url'),
})

// Mock window.URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

// Setup cleanup
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Test data for Georgian Distribution System
export const testData = {
  users: {
    admin: {
      id: 'test-admin-id',
      email: 'admin@greenland77.ge',
      role: 'admin' as const,
      full_name: 'ადმინ მუნჯოი',
      created_at: '2023-01-01T00:00:00Z',
    },
    restaurant: {
      id: 'test-restaurant-id',
      email: 'restaurant@greenland77.ge',
      role: 'restaurant' as const,
      full_name: 'რესტორანი თბილისი',
      created_at: '2023-01-01T00:00:00Z',
    },
    driver: {
      id: 'test-driver-id',
      email: 'driver@greenland77.ge',
      role: 'driver' as const,
      full_name: 'მძღოლი გიორგი',
      created_at: '2023-01-01T00:00:00Z',
    },
    customer: {
      id: 'test-customer-id',
      email: 'customer@greenland77.ge',
      role: 'customer' as const,
      full_name: 'კლიენტი მარია',
      created_at: '2023-01-01T00:00:00Z',
    },
  },
  restaurants: [
    {
      id: 'restaurant-1',
      name: 'რესტორანი "ქართული კერძი"',
      description: 'ტრადიციული ქართული სამზარეულო',
      address: 'თბილისი, რუსთაველის გამზირი 12',
      phone: '+995555123456',
      cuisine: 'ქართული',
      rating: 4.5,
      available: true,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'restaurant-2',
      name: 'Pizza House',
      description: 'იტალიური პიცა და პასტა',
      address: 'თბილისი, ჩოლოყაშვილის 5',
      phone: '+995555654321',
      cuisine: 'იტალიური',
      rating: 4.2,
      available: true,
      created_at: '2023-01-01T00:00:00Z',
    },
  ],
  products: [
    {
      id: 'product-1',
      restaurant_id: 'restaurant-1',
      name: 'ხაჭაპური',
      description: 'ტრადიციული ქართული კერძი',
      price: 25.0,
      category: 'ძირითადი კერძი',
      available: true,
      image_url: null,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'product-2',
      restaurant_id: 'restaurant-1',
      name: 'ტყემაფლოს კერძი',
      description: 'ტყემაფლოს მწვანილით',
      price: 35.0,
      category: 'ძირითადი კერძი',
      available: true,
      image_url: null,
      created_at: '2023-01-01T00:00:00Z',
    },
  ],
  orders: [
    {
      id: 'order-1',
      customer_id: 'test-customer-id',
      restaurant_id: 'restaurant-1',
      driver_id: 'test-driver-id',
      status: 'pending',
      total_amount: 60.0,
      delivery_address: 'თბილისი, გურამიშვილის 15',
      notes: 'სასურველი მიწოდების დრო: 19:00',
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-01T12:00:00Z',
    },
    {
      id: 'order-2',
      customer_id: 'test-customer-id',
      restaurant_id: 'restaurant-1',
      driver_id: null,
      status: 'completed',
      total_amount: 45.0,
      delivery_address: 'თბილისი, ვაკის 7',
      notes: '',
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-01-01T11:30:00Z',
    },
  ],
}

// Georgian language utilities for testing
export const georgianUtils = {
  // Convert Georgian text to Latin equivalents for testing
  toLatin: (text: string): string => {
    const georgianToLatin: Record<string, string> = {
      ა: 'a',
      ბ: 'b',
      გ: 'g',
      დ: 'd',
      ე: 'e',
      ვ: 'v',
      ზ: 'z',
      თ: 't',
      ი: 'i',
      კ: 'k',
      ლ: 'l',
      მ: 'm',
      ნ: 'n',
      ო: 'o',
      პ: 'p',
      ჟ: 'zh',
      რ: 'r',
      ს: 's',
      ტ: 't',
      უ: 'u',
      ფ: 'ph',
      ქ: 'q',
      ღ: 'gh',
      ყ: 'y',
      შ: 'sh',
      ჩ: 'ch',
      ც: 'ts',
      ძ: 'dz',
      წ: 'ts',
      ჭ: 'ch',
      ხ: 'kh',
      ჯ: 'j',
      ჰ: 'h',
    }

    return text
      .split('')
      .map((char) => georgianToLatin[char] || char)
      .join('')
  },

  // Generate random Georgian text
  generateRandomText: (length: number = 50): string => {
    const georgianChars = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += georgianChars.charAt(Math.floor(Math.random() * georgianChars.length))
    }
    return result
  },

  // Validate Georgian postal code
  isValidGeorgianPostcode: (postcode: string): boolean => {
    return /^\d{5}$/.test(postcode)
  },

  // Validate Georgian phone number
  isValidGeorgianPhone: (phone: string): boolean => {
    return /^(\+995|0)[5-9]\d{8}$/.test(phone)
  },

  // Generate Georgian business ID
  generateGeorgianBusinessId: (): string => {
    return Math.random().toString().slice(2, 14)
  },
}

// Export for use in tests
export type TestUser = (typeof testData.users)[keyof typeof testData.users]
export type TestRestaurant = (typeof testData.restaurants)[number]
export type TestProduct = (typeof testData.products)[number]
export type TestOrder = (typeof testData.orders)[number]
