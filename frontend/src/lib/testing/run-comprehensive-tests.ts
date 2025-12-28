/**
 * CLI Script for Running Comprehensive Tests
 * Georgian Distribution System Testing Suite
 *
 * Usage:
 *   npm run test:comprehensive
 *   npm run test:smoke
 *   npm run test:critical
 *   npm run test:regression
 *   npm run test:full
 *
 * Environment Variables:
 *   TEST_ENVIRONMENT=development|production|staging
 *   TEST_OUTPUT_FORMAT=console|json|html|all
 *   TEST_SAVE_RESULTS=true|false
 *   TEST_TIMEOUT=30000
 */

import { logger } from '@/lib/logger'
import 'dotenv/config'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import type {
  TestSuiteConfig} from './comprehensive-test-orchestrator.js';
import {
  runComprehensiveTests,
  runSmokeTests,
  runCriticalTests,
  runRegressionTests,
  runFullTests
} from './comprehensive-test-orchestrator.js'
import {
  runRoleBasedTests,
  testAdminRole,
  testRestaurantRole,
  testDriverRole,
  testDemoRole,
} from './role-based-tests.js'
import {
  runBusinessLogicTests,
  validateOrderLifecycle,
  validatePricingCompliance,
  validateDataIntegrity,
} from './business-logic-validator.js'
import { runAPITests } from './api-tester.js'
import { runAuthTests } from './auth-tester.js'
import { runRealtimeTests } from './realtime-tester.js'

/**
 * Parse command line arguments
 */
function parseArgs(): { command: string; config: TestSuiteConfig } {
  const args = process.argv.slice(2)
  const command = args[0] || 'smoke'

  // Parse environment variables for configuration
  const config: TestSuiteConfig = {
    environment:
      (process.env.TEST_ENVIRONMENT as 'development' | 'production' | 'staging') || 'development',
    timeout: parseInt(process.env.TEST_TIMEOUT || '300000'), // 5 minutes default
    outputFormat:
      (process.env.TEST_OUTPUT_FORMAT as 'console' | 'json' | 'html' | 'all') || 'console',
    saveResults: process.env.TEST_SAVE_RESULTS === 'true',
    resultsPath: process.env.TEST_RESULTS_PATH || './test-results',
  }

  // Parse additional command line flags
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--json':
        config.outputFormat = 'json'
        break
      case '--html':
        config.outputFormat = 'html'
        break
      case '--all':
        config.outputFormat = 'all'
        break
      case '--save':
        config.saveResults = true
        break
      case '--timeout':
        if (args[i + 1]) {
          config.timeout = parseInt(args[i + 1]!)
          i++ // Skip next arg
        }
        break
      case '--roles':
        if (args[i + 1]) {
          const roles = args[i + 1]!.split(',')
          config.testRoles = roles as ('admin' | 'restaurant' | 'driver' | 'demo')[]
          i++ // Skip next arg
        }
        break
      case '--parallel':
        config.parallelExecution = true
        break
      case '--sequential':
        config.parallelExecution = false
        break
    }
  }

  return { command, config }
}

/**
 * Display help information
 */
function displayHelp(): void {
  logger.info(`
🧪 Georgian Distribution System - Comprehensive Testing Suite

USAGE:
  npx ts-node src/lib/testing/run-comprehensive-tests.ts [command] [options]

COMMANDS:
  smoke        Run smoke tests (default) - Quick validation of core functionality
  critical     Run critical path tests - Essential business workflows
  regression   Run regression tests - Full test suite for stability
  full         Run full comprehensive tests - Complete system validation

  api          Run API endpoint tests only
  auth         Run authentication tests only
  realtime     Run real-time functionality tests only
  roles        Run role-based access control tests only
  business     Run business logic validation tests only

  admin        Test admin role permissions
  restaurant   Test restaurant role permissions
  driver       Test driver role permissions
  demo         Test demo role permissions

  lifecycle    Validate order lifecycle
  pricing      Validate pricing compliance
  integrity    Validate data integrity

OPTIONS:
  --json              Output results as JSON
  --html              Output results as HTML report
  --all               Output results in all formats
  --save              Save results to files
  --timeout <ms>      Set test timeout (default: 300000ms)
  --roles <list>      Comma-separated list of roles to test (admin,restaurant,driver,demo)
  --parallel          Run tests in parallel (where supported)
  --sequential        Run tests sequentially (default)

ENVIRONMENT VARIABLES:
  TEST_ENVIRONMENT    development|production|staging (default: development)
  TEST_OUTPUT_FORMAT  console|json|html|all (default: console)
  TEST_SAVE_RESULTS   true|false (default: false)
  TEST_TIMEOUT        Timeout in milliseconds (default: 300000)
  TEST_RESULTS_PATH   Path to save results (default: ./test-results)

EXAMPLES:
  # Run smoke tests with JSON output
  npm run test:smoke -- --json --save

  # Run full tests for production environment
  TEST_ENVIRONMENT=production npm run test:full

  # Test specific roles
  npm run test:roles -- --roles admin,restaurant

  # Run business logic validation only
  npm run test:business

  # Generate HTML report for critical tests
  npm run test:critical -- --html --save

CONFIGURATION:
  Tests run against the Supabase instance configured in your environment variables.
  Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.

OUTPUT:
  Test results are displayed in the console by default.
  Use --save flag to persist results to files.
  HTML reports provide detailed breakdowns and recommendations.
`)
}

/**
 * Display banner
 */
function displayBanner(command: string, config: TestSuiteConfig): void {
  logger.info(`
🚀 Georgian Distribution System - Testing Suite
${'='.repeat(60)}
Command: ${command.toUpperCase()}
Environment: ${config.environment}
Timeout: ${config.timeout}ms
Output: ${config.outputFormat}
Save Results: ${config.saveResults}
${'='.repeat(60)}
`)
}

/**
 * Handle test execution and error handling
 */
async function executeTests(command: string, config: TestSuiteConfig): Promise<void> {
  try {
    let result

    switch (command) {
      case 'smoke':
        result = await runSmokeTests()
        break

      case 'critical':
        result = await runCriticalTests()
        break

      case 'regression':
        result = await runRegressionTests()
        break

      case 'full':
        result = await runFullTests()
        break

      case 'api':
        result = await runAPITests()
        break

      case 'auth':
        result = await runAuthTests()
        break

      case 'realtime':
        result = await runRealtimeTests()
        break

      case 'roles':
        result = await runRoleBasedTests(config)
        break

      case 'business':
        result = await runBusinessLogicTests(config)
        break

      case 'admin':
        result = await testAdminRole()
        break

      case 'restaurant':
        result = await testRestaurantRole()
        break

      case 'driver':
        result = await testDriverRole()
        break

      case 'demo':
        result = await testDemoRole()
        break

      case 'lifecycle':
        result = await validateOrderLifecycle()
        break

      case 'pricing':
        result = await validatePricingCompliance()
        break

      case 'integrity':
        result = await validateDataIntegrity()
        break

      case 'help':
      case '--help':
      case '-h':
        displayHelp()
        return

      default:
        logger.error(`❌ Unknown command: ${command}`)
        logger.info('Run with --help for usage information')
        process.exit(1)
    }

    // Handle exit codes for CI/CD
    const exitCode = determineExitCode(result)
    process.exit(exitCode)
  } catch (error) {
    logger.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

/**
 * Determine exit code based on test results
 */
function determineExitCode(result: any): number {
  if (!result) return 1

  // For comprehensive test results
  if (result.summary) {
    if (result.summary.failedTests > 0) return 1
    if (result.summary.overallScore < 80) return 1
    return 0
  }

  // For individual test suites
  if (result.summary?.failed > 0) return 1
  if (result.summary?.passed === 0) return 1

  return 0
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const { command, config } = parseArgs()

  // Display banner
  displayBanner(command, config)

  // Execute tests
  await executeTests(command, config)
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception', { error })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection', { promise, reason })
  process.exit(1)
})

// Execute main function
if (
  import.meta.url === `file://${process.argv[1]}` ||
  (process.argv[1] && import.meta.url.endsWith(process.argv[1]))
) {
  main().catch((error) => {
    logger.error('💥 Fatal error', { error })
    process.exit(1)
  })
}

export { main as runTestsCLI }
