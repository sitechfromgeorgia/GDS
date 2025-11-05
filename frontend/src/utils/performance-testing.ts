/**
 * Performance Testing Utilities
 *
 * Utility functions for automated performance testing in the Georgian Distribution System.
 */

// Import performance monitoring utilities
import { logger } from '@/lib/logger'
import { getPerformanceMonitor } from '@/lib/performance-monitoring'

/**
 * Performance Test Result Interface
 */
interface PerformanceTestResult {
  testName: string
  duration: number
  memoryUsage?: number
  cpuUsage?: number
  success: boolean
  errorMessage?: string
  metrics: Record<string, number>
}

/**
 * Performance Test Suite Interface
 */
interface PerformanceTestSuite {
  name: string
  tests: Array<() => Promise<PerformanceTestResult>>
}

/**
 * Memory Info Interface
 */
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

/**
 * Performance Testing Class
 */
class PerformanceTester {
  private testSuites: PerformanceTestSuite[] = []
  private results: PerformanceTestResult[] = []

  /**
   * Add a test suite to the tester
   * @param suite Test suite to add
   */
  public addTestSuite(suite: PerformanceTestSuite): void {
    this.testSuites.push(suite)
  }

  /**
   * Run all test suites
   * @returns Promise resolving to array of test results
   */
  public async runAllTests(): Promise<PerformanceTestResult[]> {
    this.results = []

    for (const suite of this.testSuites) {
      logger.info(`Running test suite: ${suite.name}`)

      for (const test of suite.tests) {
        try {
          const result = await test()
          this.results.push(result)
          logger.info(
            `Test ${result.testName}: ${result.success ? 'PASS' : 'FAIL'} (${result.duration}ms)`
          )
        } catch (error) {
          const result: PerformanceTestResult = {
            testName: 'Unknown Test',
            duration: 0,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            metrics: {},
          }
          this.results.push(result)
          logger.error('Test failed:', error)
        }
      }
    }

    return this.results
  }

  /**
   * Get test results
   * @returns Array of test results
   */
  public getResults(): PerformanceTestResult[] {
    return [...this.results]
  }

  /**
   * Clear test results
   */
  public clearResults(): void {
    this.results = []
  }

  /**
   * Generate performance report
   * @returns Performance report string
   */
  public generateReport(): string {
    let report = 'Performance Test Report\n'
    report += '======================\n\n'

    const passedTests = this.results.filter((r) => r.success).length
    const failedTests = this.results.filter((r) => !r.success).length
    const avgDuration =
      this.results.length > 0
        ? this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
        : 0

    report += `Total Tests: ${this.results.length}\n`
    report += `Passed: ${passedTests}\n`
    report += `Failed: ${failedTests}\n`
    report += `Average Duration: ${avgDuration.toFixed(2)}ms\n\n`

    report += 'Test Details:\n'
    report += '-------------\n'

    for (const result of this.results) {
      report += `${result.testName}: ${result.success ? 'PASS' : 'FAIL'} (${result.duration}ms)\n`
      if (result.errorMessage) {
        report += `  Error: ${result.errorMessage}\n`
      }
      if (Object.keys(result.metrics).length > 0) {
        report += '  Metrics:\n'
        for (const [key, value] of Object.entries(result.metrics)) {
          report += `    ${key}: ${value}\n`
        }
      }
      report += '\n'
    }

    return report
  }
}

/**
 * Measure execution time of a function
 * @param fn Function to measure
 * @param name Test name
 * @returns Promise resolving to test result
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T> | T,
  name: string
): Promise<PerformanceTestResult> {
  const startTime = performance.now()

  // Get memory info if available
  const perf = performance as Performance & { memory?: MemoryInfo }
  const startMemory = perf.memory ? perf.memory.usedJSHeapSize : 0

  try {
    const result = await Promise.resolve(fn())
    const endTime = performance.now()
    const endMemory = perf.memory ? perf.memory.usedJSHeapSize : 0

    return {
      testName: name,
      duration: endTime - startTime,
      memoryUsage: startMemory > 0 && endMemory > 0 ? endMemory - startMemory : undefined,
      success: true,
      metrics: {
        execution_time_ms: endTime - startTime,
        memory_delta_bytes: startMemory > 0 && endMemory > 0 ? endMemory - startMemory : 0,
      },
    }
  } catch (error) {
    const endTime = performance.now()

    return {
      testName: name,
      duration: endTime - startTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      metrics: {
        execution_time_ms: endTime - startTime,
      },
    }
  }
}

/**
 * Test page load performance
 * @param url Page URL to test
 * @param name Test name
 * @returns Promise resolving to test result
 */
export async function testPageLoadPerformance(
  url: string,
  name: string
): Promise<PerformanceTestResult> {
  return measureExecutionTime(async () => {
    // In a real implementation, you would navigate to the page and measure load time
    // This is a placeholder implementation
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000))

    // Get navigation timing data
    const navEntries = performance.getEntriesByType('navigation')
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming
      return {
        loadTime: navEntry.loadEventEnd,
        domContentLoaded: navEntry.domContentLoadedEventEnd,
        firstByte: navEntry.responseStart - navEntry.requestStart,
      }
    }

    return { loadTime: 0, domContentLoaded: 0, firstByte: 0 }
  }, name)
}

/**
 * Test API endpoint performance
 * @param url API endpoint URL
 * @param name Test name
 * @param options Fetch options
 * @returns Promise resolving to test result
 */
export async function testApiPerformance(
  url: string,
  name: string,
  options?: RequestInit
): Promise<PerformanceTestResult> {
  return measureExecutionTime(async () => {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    return response
  }, name)
}

/**
 * Test component render performance
 * @param renderFn Function that renders a component
 * @param name Test name
 * @param iterations Number of render iterations
 * @returns Promise resolving to test result
 */
export async function testComponentRenderPerformance(
  renderFn: () => void,
  name: string,
  iterations: number = 100
): Promise<PerformanceTestResult> {
  return measureExecutionTime(() => {
    const startTime = performance.now()

    for (let i = 0; i < iterations; i++) {
      renderFn()
    }

    const endTime = performance.now()
    const avgTime = (endTime - startTime) / iterations

    return {
      totalTime: endTime - startTime,
      avgTimePerRender: avgTime,
      iterations,
    }
  }, name)
}

/**
 * Test database query performance
 * @param queryFn Function that executes a database query
 * @param name Test name
 * @returns Promise resolving to test result
 */
export async function testDatabaseQueryPerformance<T>(
  queryFn: () => Promise<T>,
  name: string
): Promise<PerformanceTestResult> {
  return measureExecutionTime(async () => {
    const result = await queryFn()
    return result
  }, name)
}

/**
 * Test user interaction performance
 * @param interactionFn Function that simulates user interaction
 * @param name Test name
 * @returns Promise resolving to test result
 */
export async function testUserInteractionPerformance(
  interactionFn: () => Promise<void>,
  name: string
): Promise<PerformanceTestResult> {
  return measureExecutionTime(async () => {
    await interactionFn()
  }, name)
}

/**
 * Run a comprehensive performance test suite
 * @returns Promise resolving to performance tester
 */
export async function runComprehensivePerformanceTests(): Promise<PerformanceTester> {
  const tester = new PerformanceTester()

  // Add test suites
  tester.addTestSuite({
    name: 'Page Load Tests',
    tests: [
      () => testPageLoadPerformance('/', 'Homepage Load'),
      () => testPageLoadPerformance('/dashboard', 'Dashboard Load'),
      () => testPageLoadPerformance('/orders', 'Orders Page Load'),
    ],
  })

  tester.addTestSuite({
    name: 'API Performance Tests',
    tests: [
      () => testApiPerformance('/api/orders', 'Orders API'),
      () => testApiPerformance('/api/products', 'Products API'),
      () => testApiPerformance('/api/users', 'Users API'),
    ],
  })

  tester.addTestSuite({
    name: 'Component Render Tests',
    tests: [
      () =>
        testComponentRenderPerformance(
          () => {
            // Simulate rendering a component
            document.createElement('div')
          },
          'Simple Component Render',
          1000
        ),
      () =>
        testComponentRenderPerformance(
          () => {
            // Simulate rendering a complex component safely
            const div = document.createElement('div')
            const innerDiv = document.createElement('div')
            const span = document.createElement('span')
            const p = document.createElement('p')

            span.textContent = 'Test'
            p.textContent = 'Content'

            innerDiv.appendChild(span)
            innerDiv.appendChild(p)
            div.appendChild(innerDiv)
          },
          'Complex Component Render',
          100
        ),
    ],
  })

  // Run all tests
  await tester.runAllTests()

  return tester
}

// Export types and utilities
export type { PerformanceTestResult, PerformanceTestSuite, MemoryInfo }

export { PerformanceTester }
