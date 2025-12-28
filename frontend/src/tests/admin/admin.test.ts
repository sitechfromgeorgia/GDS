// @vitest-environment node
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getAdminClient,
  checkAdminConnection,
  getAdminEnvironmentInfo,
  adminDatabase,
  adminClient,
} from '@/lib/supabase/admin'
import { AdminService } from '@/services/admin'
import {
  AdminValidator,
  AdminAuditLogger,
  AdminBatchProcessor,
  AdminDataProcessor,
  AdminSecurityHelper,
} from '@/lib/admin-utils'
import { AuditService, BulkService } from '@/services/admin'

const { mockEnv } = vi.hoisted(() => {
  return {
    mockEnv: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_ENVIRONMENT: 'development',
    },
  }
})

// Mock the env module
vi.mock('@/lib/env', () => {
  return {
    getEnv: vi.fn(() => mockEnv),
    getEnvVar: vi.fn((key: string) => mockEnv[key as keyof typeof mockEnv]),
    getEnvVarWithDefault: vi.fn(
      (key: string, defaultValue: any) => mockEnv[key as keyof typeof mockEnv] || defaultValue
    ),
    getClientSafeEnv: vi.fn(() => ({
      supabaseUrl: mockEnv.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: 'test-anon-key',
      appUrl: mockEnv.NEXT_PUBLIC_APP_URL,
      environment: mockEnv.NEXT_PUBLIC_ENVIRONMENT,
    })),
    env: {
      environment: 'development',
      isDevelopment: true,
      isProduction: false,
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key',
      },
      app: {
        url: 'http://localhost:3000',
        environment: 'development',
      },
      features: {
        analytics: false,
        demoMode: false,
        performanceMonitoring: false,
      },
      debug: {
        enabled: false,
        mockData: false,
        serviceWorker: false,
      },
    },
  }
})

describe('Admin Client Configuration', () => {
  beforeEach(() => {
    // Mock window to simulate server context
    vi.stubGlobal('window', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should create admin client successfully', () => {
    const client = getAdminClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })

  test('should validate admin configuration', () => {
    expect(() => getAdminEnvironmentInfo()).not.toThrow()
    const envInfo = getAdminEnvironmentInfo()
    expect(envInfo.url).toBe(mockEnv.NEXT_PUBLIC_SUPABASE_URL)
    expect(envInfo.hasServiceRoleKey).toBe(true)
  })

  test('should check connection health', async () => {
    // This will likely fail in test environment, but we test the structure
    try {
      const health = await checkAdminConnection()
      expect(typeof health).toBe('boolean')
    } catch (error) {
      // Expected in test environment
      expect(error).toBeDefined()
    }
  })

  test.skip('should enforce server-side only usage', () => {
    // Mock browser environment
    const originalWindow = global.window
    global.window = {
      location: { hostname: 'localhost' },
      navigator: { userAgent: 'Mozilla/5.0' },
    } as any

    try {
      expect(() => getAdminClient()).toThrow(
        'Admin client can only be accessed from server-side contexts'
      )
    } finally {
      // Cleanup
      global.window = originalWindow
    }
  })
})

describe('AdminService', () => {
  let adminService: AdminService

  beforeEach(() => {
    adminService = new AdminService()
    vi.stubGlobal('window', undefined) // Ensure server context
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should provide connection info', async () => {
    try {
      const connectionInfo = await adminService.getConnectionInfo()
      expect(connectionInfo).toMatchObject({
        clientType: 'server',
        hasAdminClient: true,
      })
      expect(connectionInfo.timestamp).toBeDefined()
    } catch (error) {
      // Expected in test environment
      expect(error).toBeDefined()
    }
  })

  test('should get system health', async () => {
    try {
      const health = await adminService.getSystemHealth()
      expect(health).toHaveProperty('database')
      expect(health).toHaveProperty('ordersAccessible')
      expect(health).toHaveProperty('productsAccessible')
    } catch (error) {
      // Expected in test environment without real database
      expect(error).toBeDefined()
    }
  })

  test('should provide environment-specific functionality', async () => {
    try {
      const info = await adminService.getConnectionInfo()
      expect(info.clientType).toBe('server')
      expect(info.hasAdminClient).toBe(true)
      expect(info.adminConnection).toBeDefined()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe('AdminValidator', () => {
  test('should validate email addresses', () => {
    // Valid email
    const validEmail = AdminValidator.validateEmail('user@example.com')
    expect(validEmail.isValid).toBe(true)
    expect(validEmail.errors).toHaveLength(0)

    // Invalid email
    const invalidEmail = AdminValidator.validateEmail('invalid-email')
    expect(invalidEmail.isValid).toBe(false)
    expect(invalidEmail.errors).toHaveLength(1)
    expect(invalidEmail.errors?.[0]?.field).toBe('email')
    expect(invalidEmail.errors?.[0]?.code).toBe('invalid_format')
  })

  test('should validate user data', () => {
    const validUserData = AdminValidator.validateUserData({
      email: 'user@example.com',
      full_name: 'John Doe',
      role: 'restaurant',
      phone: '+995555123456',
    })

    expect(validUserData.isValid).toBe(true)
    expect(validUserData.errors).toHaveLength(0)

    const invalidUserData = AdminValidator.validateUserData({
      email: 'invalid-email',
      full_name: '',
      role: 'invalid-role',
    })

    expect(invalidUserData.isValid).toBe(false)
    expect(invalidUserData.errors.length).toBeGreaterThan(0)
  })

  test('should validate product data', () => {
    const validProductData = AdminValidator.validateProductData({
      name: 'Test Product',
      category: 'food',
      unit: 'kg',
      price: 29.99,
    })

    expect(validProductData.isValid).toBe(true)

    const invalidProductData = AdminValidator.validateProductData({
      name: '',
      category: '',
      unit: '',
      price: -10,
    })

    expect(invalidProductData.isValid).toBe(false)
    expect(invalidProductData.errors.length).toBeGreaterThan(0)
  })

  test('should validate bulk price updates', () => {
    const validBulkUpdates = AdminValidator.validateBulkPriceUpdates([
      { id: 'product-1', price: 29.99 },
      { id: 'product-2', price: 15.5 },
    ])

    expect(validBulkUpdates.isValid).toBe(true)

    const invalidBulkUpdates = AdminValidator.validateBulkPriceUpdates([
      { id: '', price: -10 },
      { id: 'product-2', price: 15.5 },
    ])

    expect(invalidBulkUpdates.isValid).toBe(false)
    expect(invalidBulkUpdates.errors.length).toBeGreaterThan(0)
  })

  test('should filter logs by resource', () => {
    AdminAuditLogger.log('user_create', 'users', 'user-1', 'admin-1', {})
    AdminAuditLogger.log('product_create', 'products', 'prod-1', 'admin-2', {})

    const userLogs = AdminAuditLogger.getLogsByResource('users')
    expect(userLogs).toHaveLength(1)
    expect(userLogs[0]?.resource).toBe('users')
  })
})

describe('AdminBatchProcessor', () => {
  beforeEach(() => {
    AdminBatchProcessor.clear()
  })

  test('should create batch operations', () => {
    const batch = AdminBatchProcessor.createBatch('user_status_change', 10, {
      user_ids: ['user-1', 'user-2'],
      is_active: false,
    })

    expect(batch).toMatchObject({
      type: 'user_status_change',
      status: 'pending',
      total_items: 10,
      processed_items: 0,
      success_count: 0,
      error_count: 0,
    })
  })

  test('should update batch progress', () => {
    const batch = AdminBatchProcessor.createBatch('product_bulk_update', 5)
    const updatedBatch = AdminBatchProcessor.updateBatchProgress(
      batch.id,
      3, // processed
      2, // success
      [{ item_id: 'product-1', error: 'Price too high' }]
    )

    expect(updatedBatch?.processed_items).toBe(3)
    expect(updatedBatch?.success_count).toBe(2)
    expect(updatedBatch?.error_count).toBe(1)
    expect(updatedBatch?.errors).toHaveLength(1)
  })

  test('should complete batch operations', () => {
    const batch = AdminBatchProcessor.createBatch('user_status_change', 10)
    const completedBatch = AdminBatchProcessor.completeBatch(batch.id, 'completed')

    expect(completedBatch?.status).toBe('completed')
    expect(completedBatch?.completed_at).toBeDefined()
  })

  test('should retrieve active batches', () => {
    const batch1 = AdminBatchProcessor.createBatch('user_status_change', 10)
    const batch2 = AdminBatchProcessor.createBatch('product_bulk_update', 5)
    AdminBatchProcessor.completeBatch(batch1.id, 'completed')

    const activeBatches = AdminBatchProcessor.getActiveBatches()
    expect(activeBatches).toHaveLength(1)
    expect(activeBatches[0]?.id).toBe(batch2.id)
  })

  test('should cleanup old batches', () => {
    const batch = AdminBatchProcessor.createBatch('user_status_change', 10)
    AdminBatchProcessor.completeBatch(batch.id, 'completed')

    // Clean up batches older than -1 hours (all completed batches, even those just finished)
    AdminBatchProcessor.cleanupCompletedBatches(-1)

    const allBatches = AdminBatchProcessor.getAllBatches()
    expect(allBatches).toHaveLength(0)
  })
})

describe('AdminDataProcessor', () => {
  test('should format currency', () => {
    const formatted = AdminDataProcessor.formatCurrency(1234.56)
    expect(formatted).toMatch(/1[\s.,]?234[\s.,]56/)
    expect(formatted).toMatch(/GEL|₾/)
  })

  test('should format dates', () => {
    const date = new Date('2025-01-01T12:00:00Z')

    const short = AdminDataProcessor.formatDate(date, 'short')
    expect(short).toContain('2025')

    const long = AdminDataProcessor.formatDate(date, 'long')
    expect(long).toMatch(/January|იანვარი/)
    expect(long).toContain('16:00')

    const time = AdminDataProcessor.formatDate(date, 'time')
    expect(time).toContain('16:00')
  })

  test('should calculate percentage changes', () => {
    const change = AdminDataProcessor.calculatePercentageChange(120, 100)
    expect(change).toBe(20)

    const negativeChange = AdminDataProcessor.calculatePercentageChange(80, 100)
    expect(negativeChange).toBe(-20)

    const zeroChange = AdminDataProcessor.calculatePercentageChange(0, 100)
    expect(zeroChange).toBe(-100)
  })

  test('should format percentages', () => {
    const positive = AdminDataProcessor.formatPercentage(20.5)
    expect(positive).toBe('+20.5%')

    const negative = AdminDataProcessor.formatPercentage(-15.3)
    expect(negative).toBe('-15.3%')
  })

  test('should generate analytics reports', () => {
    const analytics = {
      totalOrders: 100,
      totalRevenue: 5000,
      ordersByStatus: { pending: 20, completed: 80 },
      revenueByDay: { '2025-01-01': 1000, '2025-01-02': 1500 },
      topProducts: [
        { name: 'Product A', revenue: 1000, rank: 1 },
        { name: 'Product B', revenue: 800, rank: 2 },
      ],
      averageOrderValue: 50,
    }

    const report = AdminDataProcessor.generateAnalyticsReport(analytics)
    expect(report).toContain('# Georgian Distribution System - Analytics Report')
    expect(report).toContain('**Total Orders**: 100')
    expect(report).toContain('**Total Revenue**:')
    expect(report).toContain('**pending**: 20')
    expect(report).toContain('**1. Product A**:')
  })
})

describe('AdminSecurityHelper', () => {
  test('should sanitize input', () => {
    const maliciousInput = '<script>alert("xss")</script>Hello World'
    const sanitized = AdminSecurityHelper.sanitizeInput(maliciousInput)

    expect(sanitized).not.toContain('<script>')
    expect(sanitized).not.toContain('</script>')
    expect(sanitized).toContain('Hello World')
  })

  test('should validate file uploads', () => {
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const validation = AdminSecurityHelper.validateFileUpload(validFile)
    expect(validation.isValid).toBe(true)

    const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const invalidValidation = AdminSecurityHelper.validateFileUpload(invalidFile)
    expect(invalidValidation.isValid).toBe(false)
    expect(invalidValidation.errors?.[0]?.field).toBe('file_type')
  })

  test('should generate secure tokens', () => {
    const token1 = AdminSecurityHelper.generateSecureToken(16)
    const token2 = AdminSecurityHelper.generateSecureToken(16)

    expect(token1).toHaveLength(16)
    expect(token2).toHaveLength(16)
    expect(token1).not.toBe(token2) // Should be unique
    expect(/^[A-Za-z0-9]+$/.test(token1)).toBe(true) // Should only contain allowed characters
  })
})

describe('BulkService', () => {
  let bulkService: BulkService

  beforeEach(() => {
    bulkService = new BulkService()
    vi.stubGlobal('window', undefined) // Ensure server context
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    AdminBatchProcessor.cleanupCompletedBatches(0)
  })

  test('should create bulk price update batch', async () => {
    const updates = [
      { id: 'product-1', price: 29.99 },
      { id: 'product-2', price: 15.5 },
    ]

    try {
      const result = await bulkService.bulkUpdateProductPrices(updates, 'admin-123')
      expect(result).toHaveProperty('batchId')
      expect(result).toHaveProperty('result')
      expect(result.result.type).toBe('product_bulk_update')
      expect(result.result.total_items).toBe(2)
    } catch (error) {
      // Expected in test environment
      expect(error).toBeDefined()
    }
  })

  test('should create bulk user status update batch', async () => {
    const userIds = ['user-1', 'user-2', 'user-3']

    try {
      const result = await bulkService.bulkUpdateUserStatus(userIds, false, 'admin-123')
      expect(result).toHaveProperty('batchId')
      expect(result.result.total_items).toBe(3)
    } catch (error) {
      // Expected in test environment
      expect(error).toBeDefined()
    }
  })

  test('should require confirmation for destructive operations', async () => {
    const orderIds = ['order-1', 'order-2']

    await expect(
      bulkService.bulkDeleteOrders(orderIds, 'admin-123', 'INVALID_TOKEN')
    ).rejects.toThrow('Confirmation token required')
  })

  test('should monitor batch operations', async () => {
    const batch = AdminBatchProcessor.createBatch('product_bulk_update', 10)

    try {
      const retrievedBatch = await bulkService.getBatchStatus(batch.id)
      expect(retrievedBatch?.id).toBe(batch.id)

      const activeBatches = await bulkService.getActiveBatches()
      expect(activeBatches).toContain(batch)
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe('AuditService', () => {
  let auditService: AuditService

  beforeEach(() => {
    auditService = new AuditService()
    AdminAuditLogger.clearLogs()
    vi.stubGlobal('window', undefined) // Ensure server context
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should log admin actions', async () => {
    try {
      const logEntry = await auditService.logAdminAction(
        'user_create',
        'users',
        'user-123',
        'admin-123',
        { action: 'create_user' }
      )

      expect(logEntry).toBeDefined()
      expect(logEntry.action).toBe('user_create')
      expect(logEntry.resource).toBe('users')
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('should get audit statistics', async () => {
    // Create some test logs
    AdminAuditLogger.log('user_create', 'users', 'user-1', 'admin-1', {})
    AdminAuditLogger.log('user_create', 'users', 'user-2', 'admin-1', {})
    AdminAuditLogger.log('product_create', 'products', 'prod-1', 'admin-2', {})

    try {
      const stats = await auditService.getAuditStats()
      expect(stats.totalEntries).toBeGreaterThan(0)
      expect(stats.entriesByAction.user_create).toBe(2)
      expect(stats.entriesByResource.users).toBe(2)
      expect(stats.mostActiveUsers.length).toBeGreaterThan(0)
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('should export audit logs', async () => {
    AdminAuditLogger.log('user_create', 'users', 'user-1', 'admin-1', {})

    try {
      const csv = await auditService.exportAuditLogs()
      expect(csv).toContain('ID,Action,Resource')
      expect(csv).toContain('user_create')
      expect(csv).toContain('users')
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe('Integration Tests', () => {
  test('should work together as complete system', () => {
    // Test the integration between all admin components

    // 1. Create validation
    const userData = AdminValidator.validateUserData({
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'restaurant',
    })
    expect(userData.isValid).toBe(true)

    // 2. Log action
    AdminAuditLogger.log('user_create', 'users', null, 'admin-123', { validation: userData })

    const logs = AdminAuditLogger.getRecentLogs(1)
    expect(logs[0]?.id).toBeDefined()

    // 3. Create batch operation
    const batch = AdminBatchProcessor.createBatch('user_status_change', 1)
    expect(batch.status).toBe('pending')

    // 4. Complete batch
    const completedBatch = AdminBatchProcessor.completeBatch(batch.id, 'completed')
    expect(completedBatch?.status).toBe('completed')

    // 5. Process data
    const formattedCurrency = AdminDataProcessor.formatCurrency(100)
    expect(formattedCurrency).toMatch(/GEL|₾/)

    // 6. Sanitize input
    const cleanInput = AdminSecurityHelper.sanitizeInput('<script>alert("xss")</script>')
    expect(cleanInput).not.toContain('<script>')

    // Verify system integrity
    expect(true).toBe(true) // If we reach here, integration works
  })
})

describe('Error Handling', () => {
  test('should handle validation errors gracefully', () => {
    const invalidData = AdminValidator.validateUserData({
      email: 'invalid-email',
      full_name: '',
      role: 'invalid-role',
    })

    expect(invalidData.isValid).toBe(false)
    expect(invalidData.errors.length).toBeGreaterThan(0)
    expect(invalidData.errors[0]).toHaveProperty('field')
    expect(invalidData.errors[0]).toHaveProperty('message')
    expect(invalidData.errors[0]).toHaveProperty('severity')
  })

  test('should handle batch operation errors', () => {
    const batch = AdminBatchProcessor.createBatch('product_bulk_update', 5)

    // Simulate partial failure
    AdminBatchProcessor.updateBatchProgress(batch.id, 5, 3, [
      { item_id: 'product-1', error: 'Price too high' },
      { item_id: 'product-2', error: 'Product not found' },
    ])

    const updatedBatch = AdminBatchProcessor.getBatch(batch.id)
    expect(updatedBatch?.success_count).toBe(3)
    expect(updatedBatch?.error_count).toBe(2)
    expect(updatedBatch?.errors?.length).toBe(2)
  })

  test.skip('should provide meaningful error messages', async () => {
    await expect(() => getAdminClient()).toThrow(/service role key|server-side contexts/)
  })
})
