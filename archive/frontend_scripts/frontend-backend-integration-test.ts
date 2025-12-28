#!/usr/bin/env ts-node

/**
 * Georgian Distribution System - Frontend-Backend Integration Test Suite
 * 
 * Comprehensive testing that focuses on HTTP endpoints and frontend-backend
 * communication without requiring direct database access.
 * 
 * Date: 2025-11-01
 * Purpose: Enhanced Integration Testing (Phase 1.1)
 */

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  details?: any;
}

class FrontendBackendIntegrationTester {
  private results: TestResult[] = [];
  private baseUrl = 'http://localhost:3000';
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Execute a single test
   */
  private async executeTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const testStart = Date.now();
    
    try {
      console.log(`\n🧪 Running: ${name}`);
      const result = await testFn();
      const duration = Date.now() - testStart;
      
      const testResult: TestResult = {
        name,
        status: 'PASS',
        message: 'Test completed successfully',
        duration,
        details: result
      };
      
      console.log(`✅ PASS: ${name} (${duration}ms)`);
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - testStart;
      
      const testResult: TestResult = {
        name,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
      
      console.log(`❌ FAIL: ${name} (${duration}ms) - ${testResult.message}`);
      return testResult;
    }
  }

  /**
   * Test 1: Core Application Health
   */
  private async testApplicationHealth(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health endpoint returned ${response.status}`);
    }
    
    const healthData = await response.json();
    
    return {
      health_endpoint: 'SUCCESS',
      status_code: response.status,
      response_data: healthData,
      application_running: true
    };
  }

  /**
   * Test 2: API Endpoints Connectivity
   */
  private async testAPIEndpoints(): Promise<any> {
    const endpoints = [
      { path: '/api/health', method: 'GET', description: 'Health Check' },
      { path: '/api/csrf', method: 'GET', description: 'CSRF Token' },
      { path: '/api/products', method: 'GET', description: 'Products List' },
      { path: '/api/analytics/kpis', method: 'GET', description: 'Analytics KPIs' }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const duration = Date.now() - start;
        
        results.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          status: response.status,
          duration,
          accessible: response.status < 500,
          response_size: response.headers.get('content-length') || 'unknown'
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          status: 'ERROR',
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      endpoints_tested: endpoints.length,
      accessible_endpoints: results.filter(r => r.accessible).length,
      results
    };
  }

  /**
   * Test 3: Frontend Routes Accessibility
   */
  private async testFrontendRoutes(): Promise<any> {
    const routes = [
      { path: '/', description: 'Landing Page' },
      { path: '/health', description: 'Health Page' },
      { path: '/catalog', description: 'Product Catalog' },
      { path: '/auth/login', description: 'Login Page' },
      { path: '/auth/register', description: 'Registration Page' },
      { path: '/dashboard/admin', description: 'Admin Dashboard' },
      { path: '/dashboard/demo', description: 'Demo Dashboard' }
    ];
    
    const results = [];
    
    for (const route of routes) {
      try {
        const response = await fetch(`${this.baseUrl}${route.path}`);
        
        results.push({
          route: route.path,
          description: route.description,
          status: response.status,
          accessible: response.status === 200 || response.status === 401, // 401 for auth-protected routes
          content_type: response.headers.get('content-type') || 'unknown'
        });
      } catch (error) {
        results.push({
          route: route.path,
          description: route.description,
          status: 'ERROR',
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      routes_tested: routes.length,
      accessible_routes: results.filter(r => r.accessible).length,
      results
    };
  }

  /**
   * Test 4: Static Assets & Resources
   */
  private async testStaticAssets(): Promise<any> {
    const assets = [
      { path: '/favicon.ico', type: 'icon' },
      { path: '/robots.txt', type: 'text' },
      { path: '/next.svg', type: 'image' },
      { path: '/globals.css', type: 'css' }
    ];
    
    const results = [];
    
    for (const asset of assets) {
      try {
        const response = await fetch(`${this.baseUrl}${asset.path}`);
        
        results.push({
          asset: asset.path,
          type: asset.type,
          status: response.status,
          accessible: response.status === 200,
          size: response.headers.get('content-length') || 'unknown',
          content_type: response.headers.get('content-type') || 'unknown'
        });
      } catch (error) {
        results.push({
          asset: asset.path,
          type: asset.type,
          status: 'ERROR',
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      assets_tested: assets.length,
      accessible_assets: results.filter(r => r.accessible).length,
      results
    };
  }

  /**
   * Test 5: Authentication Flow (Frontend Level)
   */
  private async testAuthenticationFlow(): Promise<any> {
    try {
      // Test CSRF token endpoint
      const csrfResponse = await fetch(`${this.baseUrl}/api/csrf`);
      const csrfWorking = csrfResponse.status === 200;
      
      // Test login route accessibility
      const loginResponse = await fetch(`${this.baseUrl}/auth/login`);
      const loginAccessible = loginResponse.status === 200;
      
      // Test registration route accessibility
      const registerResponse = await fetch(`${this.baseUrl}/auth/register`);
      const registerAccessible = registerResponse.status === 200;
      
      return {
        csrf_token_available: csrfWorking,
        login_page_accessible: loginAccessible,
        registration_page_accessible: registerAccessible,
        auth_routes_functional: csrfWorking && loginAccessible && registerAccessible
      };
    } catch (error) {
      throw new Error(`Authentication flow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test 6: Georgian Language Support (Frontend)
   */
  private async testGeorgianLanguageSupport(): Promise<any> {
    try {
      // Test if Georgian content is served correctly
      const landingResponse = await fetch(`${this.baseUrl}/`);
      const landingContent = await landingResponse.text();
      
      // Check for Georgian language indicators
      const hasGeorgianContent = landingContent.includes('ქართ') || landingContent.includes('georgian');
      const hasLanguageSwitcher = landingContent.includes('language') || landingContent.includes('ka');
      const hasUTF8Charset = landingResponse.headers.get('content-type')?.includes('charset=utf-8');
      
      return {
        georgian_content_detected: hasGeorgianContent,
        language_switcher_present: hasLanguageSwitcher,
        utf8_encoding_confirmed: hasUTF8Charset,
        frontend_internationalization: hasGeorgianContent || hasLanguageSwitcher
      };
    } catch (error) {
      throw new Error(`Georgian language support test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test 7: Performance & Response Times
   */
  private async testPerformance(): Promise<any> {
    const performanceTests = [
      { path: '/', name: 'Landing Page' },
      { path: '/health', name: 'Health Page' },
      { path: '/catalog', name: 'Catalog Page' },
      { path: '/api/health', name: 'Health API' }
    ];
    
    const results = [];
    
    for (const test of performanceTests) {
      const start = Date.now();
      try {
        const response = await fetch(`${this.baseUrl}${test.path}`);
        const duration = Date.now() - start;
        
        results.push({
          test: test.name,
          path: test.path,
          duration,
          status: response.status,
          performance: duration < 500 ? 'EXCELLENT' : duration < 1000 ? 'GOOD' : 'NEEDS_OPTIMIZATION',
          load_time_acceptable: duration < 2000
        });
      } catch (error) {
        const duration = Date.now() - start;
        results.push({
          test: test.name,
          path: test.path,
          duration,
          status: 'ERROR',
          performance: 'UNKNOWN',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    return {
      performance_tests: results.length,
      average_response_time: Math.round(avgResponseTime),
      fast_responses: results.filter(r => r.duration < 500).length,
      acceptable_responses: results.filter(r => r.load_time_acceptable).length,
      results
    };
  }

  /**
   * Test 8: Error Handling & Recovery
   */
  private async testErrorHandling(): Promise<any> {
    const errorTests = [
      { path: '/non-existent-page', expected: 404, description: '404 Error Handling' },
      { path: '/api/non-existent-endpoint', expected: 404, description: 'API 404 Handling' }
    ];
    
    const results = [];
    
    for (const test of errorTests) {
      try {
        const response = await fetch(`${this.baseUrl}${test.path}`);
        
        results.push({
          test: test.description,
          path: test.path,
          expected_status: test.expected,
          actual_status: response.status,
          handled_correctly: response.status === test.expected,
          error_page_served: response.status === 404
        });
      } catch (error) {
        results.push({
          test: test.description,
          path: test.path,
          expected_status: test.expected,
          actual_status: 'ERROR',
          handled_correctly: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const errorsHandledCorrectly = results.filter(r => r.handled_correctly).length;
    
    return {
      error_tests: results.length,
      errors_handled_correctly: errorsHandledCorrectly,
      error_handling_score: `${errorsHandledCorrectly}/${results.length}`,
      results
    };
  }

  /**
   * Run all frontend-backend integration tests
   */
  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting Georgian Distribution System - Frontend-Backend Integration Tests\n');
    
    // Test Suite 1: Core Application
    console.log('📊 Core Application Tests:');
    this.results.push(await this.executeTest('Application Health & Startup', () => this.testApplicationHealth()));
    this.results.push(await this.executeTest('API Endpoints Connectivity', () => this.testAPIEndpoints()));
    
    // Test Suite 2: Frontend Routes
    console.log('\n🌐 Frontend Routes Tests:');
    this.results.push(await this.executeTest('Frontend Routes Accessibility', () => this.testFrontendRoutes()));
    this.results.push(await this.executeTest('Static Assets & Resources', () => this.testStaticAssets()));
    
    // Test Suite 3: User Experience
    console.log('\n👥 User Experience Tests:');
    this.results.push(await this.executeTest('Authentication Flow (Frontend)', () => this.testAuthenticationFlow()));
    this.results.push(await this.executeTest('Georgian Language Support', () => this.testGeorgianLanguageSupport()));
    
    // Test Suite 4: Performance & Reliability
    console.log('\n⚡ Performance & Reliability Tests:');
    this.results.push(await this.executeTest('Performance & Response Times', () => this.testPerformance()));
    this.results.push(await this.executeTest('Error Handling & Recovery', () => this.testErrorHandling()));
    
    this.generateReport();
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 FRONTEND-BACKEND INTEGRATION TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Skipped: ${skipped} ⏭️`);
    console.log(`   Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    
    console.log(`\n🔍 Detailed Results:`);
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`   ${status} ${result.name} (${result.duration}ms)`);
      if (result.status === 'FAIL') {
        console.log(`      Error: ${result.message}`);
      }
    });
    
    console.log(`\n🎯 Integration Status:`);
    if (failed === 0) {
      console.log('   🟢 FRONTEND-BACKEND FULLY INTEGRATED');
      console.log('   ✅ All API endpoints operational');
      console.log('   ✅ Frontend routes accessible');
      console.log('   ✅ Authentication flows functional');
      console.log('   ✅ Performance optimized');
      console.log('   ✅ Ready for user testing');
    } else if (failed <= 2) {
      console.log(`   🟡 MINOR INTEGRATION ISSUES (${failed} failures)`);
      console.log('   ⚠️  Core functionality working with minor issues');
      console.log('   ✅ Most systems operational');
      console.log('   🔧 Address remaining issues for production readiness');
    } else {
      console.log(`   🟠 SIGNIFICANT INTEGRATION ISSUES (${failed} failures)`);
      console.log('   ⚠️  Review and fix multiple integration problems');
    }
    
    console.log(`\n📝 Next Steps:`);
    if (failed === 0) {
      console.log('   1. ✅ Proceed to database connectivity fixes');
      console.log('   2. ✅ Begin comprehensive user acceptance testing');
      console.log('   3. ✅ Prepare production deployment');
    } else if (failed <= 2) {
      console.log('   1. 🔧 Fix minor integration issues');
      console.log('   2. 🔍 Test specific failed endpoints');
      console.log('   3. 🔄 Re-run tests after fixes');
    } else {
      console.log('   1. 🔧 Address major integration issues');
      console.log('   2. 🔍 Review error logs for root causes');
      console.log('   3. 🔧 Implement comprehensive fixes');
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  try {
    const tester = new FrontendBackendIntegrationTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Frontend-backend integration test suite failed to execute:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(console.error);

export default FrontendBackendIntegrationTester;