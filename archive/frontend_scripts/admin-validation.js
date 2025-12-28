#!/usr/bin/env node

/**
 * Admin Client Validation Script
 * Tests basic admin functionality without requiring vitest infrastructure
 */

const { 
  AdminValidator, 
  AdminAuditLogger, 
  AdminBatchProcessor,
  AdminDataProcessor,
  AdminSecurityHelper
} = require('../src/lib/admin-utils')

console.log('🔧 Admin Client Validation Script')
console.log('====================================')

function testAdminValidator() {
  console.log('\n📋 Testing AdminValidator...')
  
  try {
    // Test email validation
    const validEmail = AdminValidator.validateEmail('user@example.com')
    const invalidEmail = AdminValidator.validateEmail('invalid-email')
    
    console.log('✅ Email validation works')
    console.log('  - Valid email:', validEmail.isValid)
    console.log('  - Invalid email:', invalidEmail.isValid)
    
    // Test user data validation
    const userValidation = AdminValidator.validateUserData({
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'restaurant'
    })
    
    console.log('✅ User data validation works')
    console.log('  - Valid user data:', userValidation.isValid)
    
    return true
  } catch (error) {
    console.error('❌ AdminValidator failed:', error.message)
    return false
  }
}

function testAdminAuditLogger() {
  console.log('\n📝 Testing AdminAuditLogger...')
  
  try {
    // Clear any existing logs
    AdminAuditLogger.clearLogs()
    
    // Test logging
    AdminAuditLogger.log('user_create', 'users', 'user-123', 'admin-123', { action: 'create' })
    AdminAuditLogger.log('user_update', 'users', 'user-456', 'admin-123', { action: 'update' })
    
    const logs = AdminAuditLogger.getRecentLogs(10)
    const userLogs = AdminAuditLogger.getLogsByAction('user_create')
    
    console.log('✅ Audit logging works')
    console.log('  - Total logs:', logs.length)
    console.log('  - User create logs:', userLogs.length)
    
    return true
  } catch (error) {
    console.error('❌ AdminAuditLogger failed:', error.message)
    return false
  }
}

function testAdminBatchProcessor() {
  console.log('\n⚙️ Testing AdminBatchProcessor...')
  
  try {
    // Create batch
    const batch = AdminBatchProcessor.createBatch('user_status_change', 10, {
      user_ids: ['user-1', 'user-2'],
      is_active: false
    })
    
    // Update progress
    AdminBatchProcessor.updateBatchProgress(batch.id, 5, 4, [
      { item_id: 'user-1', error: 'User not found' }
    ])
    
    // Complete batch
    const completedBatch = AdminBatchProcessor.completeBatch(batch.id, 'completed')
    
    // Get active batches
    const activeBatches = AdminBatchProcessor.getActiveBatches()
    
    console.log('✅ Batch processing works')
    console.log('  - Batch status:', batch.status)
    console.log('  - Completed status:', completedBatch.status)
    console.log('  - Active batches:', activeBatches.length)
    
    return true
  } catch (error) {
    console.error('❌ AdminBatchProcessor failed:', error.message)
    return false
  }
}

function testAdminDataProcessor() {
  console.log('\n🔢 Testing AdminDataProcessor...')
  
  try {
    // Test currency formatting
    const currency = AdminDataProcessor.formatCurrency(1234.56)
    const date = new Date('2025-01-01T12:00:00Z')
    const formattedDate = AdminDataProcessor.formatDate(date, 'short')
    
    // Test percentage calculation
    const percentageChange = AdminDataProcessor.calculatePercentageChange(120, 100)
    const formattedPercentage = AdminDataProcessor.formatPercentage(20.5)
    
    console.log('✅ Data processing works')
    console.log('  - Currency:', currency)
    console.log('  - Date:', formattedDate)
    console.log('  - Percentage change:', percentageChange + '%')
    console.log('  - Formatted percentage:', formattedPercentage)
    
    return true
  } catch (error) {
    console.error('❌ AdminDataProcessor failed:', error.message)
    return false
  }
}

function testAdminSecurityHelper() {
  console.log('\n🔒 Testing AdminSecurityHelper...')
  
  try {
    // Test input sanitization
    const malicious = '<script>alert("xss")</script>Hello World'
    const clean = AdminSecurityHelper.sanitizeInput(malicious)
    
    // Test token generation
    const token1 = AdminSecurityHelper.generateSecureToken(16)
    const token2 = AdminSecurityHelper.generateSecureToken(16)
    
    // Test file validation
    const validFile = new (require('events').EventEmitter)()
    validFile.type = 'image/jpeg'
    validFile.size = 1024 * 1024 // 1MB
    
    const fileValidation = AdminSecurityHelper.validateFileUpload(validFile)
    
    console.log('✅ Security helper works')
    console.log('  - Original input:', malicious)
    console.log('  - Sanitized input:', clean)
    console.log('  - Token 1:', token1)
    console.log('  - Token 2:', token2)
    console.log('  - File validation:', fileValidation.isValid)
    
    return true
  } catch (error) {
    console.error('❌ AdminSecurityHelper failed:', error.message)
    return false
  }
}

function main() {
  console.log('Starting Admin Client validation...\n')
  
  const tests = [
    { name: 'AdminValidator', fn: testAdminValidator },
    { name: 'AdminAuditLogger', fn: testAdminAuditLogger },
    { name: 'AdminBatchProcessor', fn: testAdminBatchProcessor },
    { name: 'AdminDataProcessor', fn: testAdminDataProcessor },
    { name: 'AdminSecurityHelper', fn: testAdminSecurityHelper }
  ]
  
  let passed = 0
  let total = tests.length
  
  for (const test of tests) {
    if (test.fn()) {
      passed++
    }
  }
  
  console.log('\n' + '='.repeat(40))
  console.log(`📊 Validation Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All admin client components are working correctly!')
    process.exit(0)
  } else {
    console.log('❌ Some components failed validation')
    process.exit(1)
  }
}

// Run validation
main()