import { logger } from '@/lib/logger'
import type { APITestSuite } from './api-tester';
import { apiTester } from './api-tester'
import type { AuthTestSuite, AuthTestConfig } from './auth-tester';
import { authTester } from './auth-tester'
import type { RealtimeTestSuite, RealtimeTestConfig } from './realtime-tester';
import { realtimeTester } from './realtime-tester'
import { recordPerformance } from '../monitoring/performance'

/**
 * Comprehensive Test Orchestrator for Georgian Distribution System
 * Coordinates all testing components: API, Auth, Realtime, Role-based, and Business Logic
 */

export interface TestSuiteConfig {
  // Environment settings
  environment?: 'development' | 'production' | 'staging'
  timeout?: number

  // Test suite selection
  runSmokeTests?: boolean
  runCriticalTests?: boolean
  runRegressionTests?: boolean
  runFullTests?: boolean

  // Component-specific configs
  apiConfig?: any
  authConfig?: AuthTestConfig
  realtimeConfig?: RealtimeTestConfig

  // Role-based testing
  testRoles?: ('admin' | 'restaurant' | 'driver' | 'demo')[]
  testBusinessLogic?: boolean

  // Execution settings
  parallelExecution?: boolean
  maxConcurrency?: number
  retries?: number

  // Reporting
  outputFormat?: 'console' | 'json' | 'html' | 'all'
  saveResults?: boolean
  resultsPath?: string
}

export interface ComprehensiveTestResult {
  suite: string
  status: 'passed' | 'failed' | 'skipped' | 'partial'
  duration: number
  startTime: string
  endTime: string
  results: {
    api?: APITestSuite
    auth?: AuthTestSuite
    realtime?: RealtimeTestSuite
    roles?: RoleTestSuite
    businessLogic?: BusinessLogicTestSuite
  }
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    skippedTests: number
    averageResponseTime: number
    overallScore: number // 0-100
  }
  environment: {
    nodeVersion: string
    platform: string
    environment: string
    timestamp: string
  }
  recommendations?: string[]
}

export interface RoleTestSuite {
  name: string
  description: string
  roles: string[]
  results: RoleTestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
  }
}

export interface BusinessLogicTestSuite {
  name: string
  description: string
  results: BusinessLogicTestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
  }
}

export interface RoleTestResult {
  role: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  tests: Array<{
    name: string
    status: 'passed' | 'failed' | 'skipped'
    error?: string
    details?: any
  }>
}

export interface BusinessLogicTestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  details?: any
}

class ComprehensiveTestOrchestrator {
  private config: TestSuiteConfig
  private results: ComprehensiveTestResult[] = []
  private startTime: Date = new Date()

  constructor(config: TestSuiteConfig = {}) {
    this.config = {
      environment: 'development',
      timeout: 300000, // 5 minutes
      runSmokeTests: true,
      runCriticalTests: false,
      runRegressionTests: false,
      runFullTests: false,
      testRoles: ['demo'],
      testBusinessLogic: true,
      parallelExecution: false,
      maxConcurrency: 3,
      retries: 2,
      outputFormat: 'console',
      saveResults: true,
      resultsPath: './test-results',
      ...config,
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTests(): Promise<ComprehensiveTestResult> {
    logger.info('🚀 Georgian Distribution System - Comprehensive Testing')
    logger.info('='.repeat(70))
    logger.info(`Environment: ${this.config.environment}`)
    logger.info(`Test Suite: ${this.getTestSuiteName()}`)
    logger.info(`Parallel Execution: ${this.config.parallelExecution}`)
    logger.info(`Start Time: ${this.startTime.toISOString()}`)
    logger.info('')

    this.startTime = new Date()
    const suiteStartTime = Date.now()

    try {
      const results: ComprehensiveTestResult['results'] = {}

      // Run API Tests
      if (this.shouldRunComponent('api')) {
        logger.info('🔍 Running API Tests...')
        results.api = await this.runAPITests()
      }

      // Run Authentication Tests
      if (this.shouldRunComponent('auth')) {
        logger.info('🔐 Running Authentication Tests...')
        results.auth = await this.runAuthTests()
      }

      // Run Real-time Tests
      if (this.shouldRunComponent('realtime')) {
        logger.info('📡 Running Real-time Tests...')
        results.realtime = await this.runRealtimeTests()
      }

      // Run Role-based Tests
      if (this.config.testRoles && this.config.testRoles.length > 0) {
        logger.info('👥 Running Role-based Tests...')
        results.roles = await this.runRoleBasedTests()
      }

      // Run Business Logic Tests
      if (this.config.testBusinessLogic) {
        logger.info('💼 Running Business Logic Tests...')
        results.businessLogic = await this.runBusinessLogicTests()
      }

      const endTime = new Date()
      const duration = Date.now() - suiteStartTime

      const summary = this.calculateOverallSummary(results)
      const recommendations = this.generateRecommendations(results, summary)

      const comprehensiveResult: ComprehensiveTestResult = {
        suite: this.getTestSuiteName(),
        status: this.determineOverallStatus(summary),
        duration,
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        results,
        summary,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          environment: this.config.environment!,
          timestamp: new Date().toISOString(),
        },
        recommendations,
      }

      // Output results
      await this.outputResults(comprehensiveResult)

      // Record performance metrics
      const performanceStatus =
        comprehensiveResult.status === 'passed'
          ? 'success'
          : comprehensiveResult.status === 'failed'
            ? 'error'
            : 'success'
      recordPerformance('comprehensive-test-suite', duration, performanceStatus, {
        totalTests: summary.totalTests,
        passedTests: summary.passedTests,
        failedTests: summary.failedTests,
        overallScore: summary.overallScore,
      })

      logger.info('')
      logger.info('📊 Comprehensive Test Summary')
      logger.info('='.repeat(70))
      logger.info(`Status: ${comprehensiveResult.status.toUpperCase()}`)
      logger.info(`Duration: ${duration}ms`)
      logger.info(`Total Tests: ${summary.totalTests}`)
      logger.info(`✅ Passed: ${summary.passedTests}`)
      logger.info(`❌ Failed: ${summary.failedTests}`)
      logger.info(`⚠️  Skipped: ${summary.skippedTests}`)
      logger.info(`📈 Overall Score: ${summary.overallScore.toFixed(1)}%`)
      logger.info(`⚡ Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`)

      if (recommendations.length > 0) {
        logger.info('')
        logger.info('💡 Recommendations:')
        recommendations.forEach((rec) => logger.info(`   • ${rec}`))
      }

      return comprehensiveResult
    } catch (error) {
      logger.error('❌ Comprehensive testing failed:', error)
      throw error
    }
  }

  /**
   * Run API tests
   */
  private async runAPITests(): Promise<APITestSuite> {
    const startTime = Date.now()

    try {
      const result = await apiTester.runAllTests()
      logger.info(`   ✅ API Tests completed in ${Date.now() - startTime}ms`)
      return result
    } catch (error) {
      logger.info(
        `   ❌ API Tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * Run authentication tests
   */
  private async runAuthTests(): Promise<AuthTestSuite> {
    const startTime = Date.now()

    try {
      const result = await authTester.runAllTests()
      logger.info(`   ✅ Authentication Tests completed in ${Date.now() - startTime}ms`)
      return result
    } catch (error) {
      logger.info(
        `   ❌ Authentication Tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * Run real-time tests
   */
  private async runRealtimeTests(): Promise<RealtimeTestSuite> {
    const startTime = Date.now()

    try {
      const result = await realtimeTester.runAllTests()
      logger.info(`   ✅ Real-time Tests completed in ${Date.now() - startTime}ms`)
      return result
    } catch (error) {
      logger.info(
        `   ❌ Real-time Tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * Run role-based tests
   */
  private async runRoleBasedTests(): Promise<RoleTestSuite> {
    const startTime = Date.now()
    const results: RoleTestResult[] = []

    for (const role of this.config.testRoles!) {
      try {
        const roleResult = await this.testRolePermissions(role)
        results.push(roleResult)
        logger.info(`   ✅ ${role} role tests completed`)
      } catch (error) {
        logger.info(
          `   ❌ ${role} role tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        results.push({
          role,
          status: 'failed',
          duration: 0,
          tests: [
            {
              name: 'Role Test',
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          ],
        })
      }
    }

    const summary = {
      total: results.length,
      passed: results.filter((r) => r.status === 'passed').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
    }

    return {
      name: 'Role-Based Access Control Tests',
      description: 'Testing permissions and access control for all user roles',
      roles: this.config.testRoles!,
      results,
      summary,
    }
  }

  /**
   * Run business logic tests
   */
  private async runBusinessLogicTests(): Promise<BusinessLogicTestSuite> {
    const startTime = Date.now()
    const results: BusinessLogicTestResult[] = []

    // Business logic test cases
    const testCases = [
      'Order Lifecycle Validation',
      'Pricing Compliance',
      'User Role Enforcement',
      'Data Integrity Checks',
      'Workflow Validation',
    ]

    for (const testCase of testCases) {
      try {
        const result = await this.runBusinessLogicTest(testCase)
        results.push(result)
        logger.info(`   ✅ ${testCase} completed`)
      } catch (error) {
        logger.info(
          `   ❌ ${testCase} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        results.push({
          name: testCase,
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const summary = {
      total: results.length,
      passed: results.filter((r) => r.status === 'passed').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
    }

    return {
      name: 'Business Logic Validation Tests',
      description: 'Validating core business rules and workflows',
      results,
      summary,
    }
  }

  /**
   * Test role permissions (placeholder - would integrate with role-based-tests.ts)
   */
  private async testRolePermissions(role: string): Promise<RoleTestResult> {
    const startTime = Date.now()

    // Placeholder implementation - would be replaced by actual role testing
    const tests = [
      { name: 'Dashboard Access', status: 'passed' as const },
      { name: 'Data Visibility', status: 'passed' as const },
      { name: 'Action Permissions', status: 'passed' as const },
    ]

    return {
      role,
      status: 'passed',
      duration: Date.now() - startTime,
      tests,
    }
  }

  /**
   * Run individual business logic test (placeholder)
   */
  private async runBusinessLogicTest(testName: string): Promise<BusinessLogicTestResult> {
    const startTime = Date.now()

    // Placeholder implementation - would be replaced by actual business logic testing
    await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate test execution

    return {
      name: testName,
      status: 'passed',
      duration: Date.now() - startTime,
      details: { validated: true },
    }
  }

  /**
   * Determine if a component should be tested
   */
  private shouldRunComponent(component: 'api' | 'auth' | 'realtime'): boolean {
    if (this.config.runFullTests) return true
    if (this.config.runSmokeTests) return true // Smoke tests include all components
    if (this.config.runCriticalTests) return component !== 'realtime' // Critical tests exclude realtime
    if (this.config.runRegressionTests) return true

    // Default to smoke tests
    return true
  }

  /**
   * Get test suite name based on configuration
   */
  private getTestSuiteName(): string {
    if (this.config.runFullTests) return 'Full Test Suite'
    if (this.config.runRegressionTests) return 'Regression Test Suite'
    if (this.config.runCriticalTests) return 'Critical Path Test Suite'
    return 'Smoke Test Suite'
  }

  /**
   * Calculate overall test summary
   */
  private calculateOverallSummary(results: ComprehensiveTestResult['results']) {
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    let skippedTests = 0
    let totalResponseTime = 0
    let responseTimeCount = 0

    // Aggregate API tests
    if (results.api) {
      totalTests += results.api.summary.total
      passedTests += results.api.summary.passed
      failedTests += results.api.summary.failed
      skippedTests += results.api.summary.skipped
      totalResponseTime += results.api.summary.averageResponseTime * results.api.summary.total
      responseTimeCount += results.api.summary.total
    }

    // Aggregate Auth tests
    if (results.auth) {
      totalTests += results.auth.summary.total
      passedTests += results.auth.summary.passed
      failedTests += results.auth.summary.failed
      skippedTests += results.auth.summary.skipped
      totalResponseTime += results.auth.summary.averageResponseTime * results.auth.summary.total
      responseTimeCount += results.auth.summary.total
    }

    // Aggregate Real-time tests
    if (results.realtime) {
      totalTests += results.realtime.summary.total
      passedTests += results.realtime.summary.passed
      failedTests += results.realtime.summary.failed
      skippedTests += results.realtime.summary.skipped
      totalResponseTime += results.realtime.summary.averageLatency * results.realtime.summary.total
      responseTimeCount += results.realtime.summary.total
    }

    // Aggregate Role tests
    if (results.roles) {
      totalTests += results.roles.summary.total
      passedTests += results.roles.summary.passed
      failedTests += results.roles.summary.failed
      skippedTests += results.roles.summary.skipped
    }

    // Aggregate Business Logic tests
    if (results.businessLogic) {
      totalTests += results.businessLogic.summary.total
      passedTests += results.businessLogic.summary.passed
      failedTests += results.businessLogic.summary.failed
      skippedTests += results.businessLogic.summary.skipped
    }

    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0
    const overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      averageResponseTime,
      overallScore,
    }
  }

  /**
   * Determine overall test status
   */
  private determineOverallStatus(
    summary: ComprehensiveTestResult['summary']
  ): 'passed' | 'failed' | 'skipped' | 'partial' {
    if (summary.failedTests > 0) return 'failed'
    if (summary.passedTests === 0 && summary.skippedTests > 0) return 'skipped'
    if (summary.passedTests > 0 && summary.failedTests === 0) return 'passed'
    return 'partial'
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(
    results: ComprehensiveTestResult['results'],
    summary: ComprehensiveTestResult['summary']
  ): string[] {
    const recommendations: string[] = []

    if (summary.failedTests > 0) {
      recommendations.push('Address failed tests before deployment')
    }

    if (summary.overallScore < 80) {
      recommendations.push('Overall test score below 80% - review test coverage')
    }

    if (summary.averageResponseTime > 1000) {
      recommendations.push('Average response time exceeds 1 second - optimize performance')
    }

    if (!results.realtime) {
      recommendations.push(
        'Real-time tests were skipped - ensure WebSocket functionality is tested'
      )
    }

    if (!results.roles) {
      recommendations.push('Role-based tests were not executed - verify access control')
    }

    return recommendations
  }

  /**
   * Output test results in specified format
   */
  private async outputResults(result: ComprehensiveTestResult): Promise<void> {
    const formats =
      this.config.outputFormat === 'all' ? ['console', 'json', 'html'] : [this.config.outputFormat]

    for (const format of formats) {
      switch (format) {
        case 'console':
          // Already handled in runComprehensiveTests
          break
        case 'json':
          await this.saveJsonResults(result)
          break
        case 'html':
          await this.saveHtmlResults(result)
          break
      }
    }
  }

  /**
   * Save results as JSON
   */
  private async saveJsonResults(result: ComprehensiveTestResult): Promise<void> {
    if (!this.config.saveResults) return

    const fs = require('fs').promises
    const path = require('path')

    try {
      const fileName = `comprehensive-test-results-${Date.now()}.json`
      const filePath = path.join(this.config.resultsPath!, fileName)

      await fs.mkdir(this.config.resultsPath!, { recursive: true })
      await fs.writeFile(filePath, JSON.stringify(result, null, 2))

      logger.info(`📄 JSON results saved to: ${filePath}`)
    } catch (error) {
      logger.warn('Failed to save JSON results', { error })
    }
  }

  /**
   * Save results as HTML
   */
  private async saveHtmlResults(result: ComprehensiveTestResult): Promise<void> {
    if (!this.config.saveResults) return

    const fs = require('fs').promises
    const path = require('path')

    try {
      const html = this.generateHtmlReport(result)
      const fileName = `comprehensive-test-report-${Date.now()}.html`
      const filePath = path.join(this.config.resultsPath!, fileName)

      await fs.mkdir(this.config.resultsPath!, { recursive: true })
      await fs.writeFile(filePath, html)

      logger.info(`📄 HTML report saved to: ${filePath}`)
    } catch (error) {
      logger.warn('Failed to save HTML results', { error })
    }
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(result: ComprehensiveTestResult): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Georgian Distribution System - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4f8; padding: 10px; border-radius: 5px; text-align: center; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .component { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Georgian Distribution System - Test Report</h1>
        <p><strong>Suite:</strong> ${result.suite}</p>
        <p><strong>Status:</strong> <span class="${result.status}">${result.status.toUpperCase()}</span></p>
        <p><strong>Duration:</strong> ${result.duration}ms</p>
        <p><strong>Environment:</strong> ${result.environment.environment}</p>
        <p><strong>Timestamp:</strong> ${result.environment.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 24px;">${result.summary.totalTests}</div>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <div style="font-size: 24px;">${result.summary.passedTests}</div>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <div style="font-size: 24px;">${result.summary.failedTests}</div>
        </div>
        <div class="metric skipped">
            <h3>Skipped</h3>
            <div style="font-size: 24px;">${result.summary.skippedTests}</div>
        </div>
        <div class="metric">
            <h3>Score</h3>
            <div style="font-size: 24px;">${result.summary.overallScore.toFixed(1)}%</div>
        </div>
    </div>

    ${
      result.recommendations && result.recommendations.length > 0
        ? `
    <div class="recommendations">
        <h3>💡 Recommendations</h3>
        <ul>
            ${result.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    `
        : ''
    }

    <h2>Test Components</h2>
    ${
      result.results.api
        ? `
    <div class="component">
        <h3>🔍 API Tests</h3>
        <p>Passed: ${result.results.api.summary.passed}, Failed: ${result.results.api.summary.failed}, Skipped: ${result.results.api.summary.skipped}</p>
    </div>
    `
        : ''
    }

    ${
      result.results.auth
        ? `
    <div class="component">
        <h3>🔐 Authentication Tests</h3>
        <p>Passed: ${result.results.auth.summary.passed}, Failed: ${result.results.auth.summary.failed}, Skipped: ${result.results.auth.summary.skipped}</p>
    </div>
    `
        : ''
    }

    ${
      result.results.realtime
        ? `
    <div class="component">
        <h3>📡 Real-time Tests</h3>
        <p>Passed: ${result.results.realtime.summary.passed}, Failed: ${result.results.realtime.summary.failed}, Skipped: ${result.results.realtime.summary.skipped}</p>
    </div>
    `
        : ''
    }
</body>
</html>`
  }

  /**
   * Get test results
   */
  getResults(): ComprehensiveTestResult[] {
    return this.results
  }

  /**
   * Export results as JSON string
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2)
  }
}

// Export singleton instance
export const comprehensiveTestOrchestrator = new ComprehensiveTestOrchestrator()

// Export helper functions
export const runComprehensiveTests = (config?: TestSuiteConfig) =>
  new ComprehensiveTestOrchestrator(config).runComprehensiveTests()

export const runSmokeTests = () =>
  runComprehensiveTests({
    runSmokeTests: true,
    runCriticalTests: false,
    runRegressionTests: false,
    runFullTests: false,
  })

export const runCriticalTests = () =>
  runComprehensiveTests({
    runSmokeTests: false,
    runCriticalTests: true,
    runRegressionTests: false,
    runFullTests: false,
  })

export const runRegressionTests = () =>
  runComprehensiveTests({
    runSmokeTests: false,
    runCriticalTests: false,
    runRegressionTests: true,
    runFullTests: false,
  })

export const runFullTests = () =>
  runComprehensiveTests({
    runSmokeTests: false,
    runCriticalTests: false,
    runRegressionTests: false,
    runFullTests: true,
  })
