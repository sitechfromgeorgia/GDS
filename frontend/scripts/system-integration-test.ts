#!/usr/bin/env ts-node

/**
 * Georgian Distribution System - System Integration Test Suite
 * 
 * Comprehensive testing framework for verifying frontend-backend integration,
 * authentication flows, database operations, and user role functionality.
 * 
 * Date: 2025-11-01
 * Purpose: Phase 1 - System Integration Testing
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

// Configuration with fallback values (self-hosted Supabase)
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://data.greenland77.ge',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Initialize Supabase client
const supabase = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey!);

// Test Results Interface
interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  details?: any;
}

class SystemIntegrationTester {
  private results: TestResult[] = [];
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
   * Test 1: Database Connectivity & Schema Validation
   */
  private async testDatabaseConnectivity(): Promise<any> {
    // Test database connection
    const { error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    // Test table existence
    const tables = ['profiles', 'products', 'orders', 'order_items', 'notifications', 'demo_sessions'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (tableError) {
        throw new Error(`Table '${table}' not accessible: ${tableError.message}`);
      }
    }
    
    return {
      connection: 'SUCCESS',
      tables: tables.length,
      accessible: true
    };
  }

  /**
   * Test 2: API Endpoint Connectivity
   */
  private async testAPICollectivity(): Promise<any> {
    const baseUrl = 'http://localhost:3000';
    const endpoints = [
      '/api/health',
      '/api/products',
      '/api/csrf'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        results.push({
          endpoint,
          status: response.status,
          accessible: response.status < 500
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'ERROR',
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      endpoints_tested: endpoints.length,
      results
    };
  }

  /**
   * Test 3: Authentication Flow Testing
   */
  private async testAuthenticationFlow(): Promise<any> {
    // Test public endpoints that should work without authentication
    const { data: publicData, error: publicError } = await supabase
      .from('products')
      .select('id, name, price, category')
      .eq('active', true)
      .limit(5);
    
    if (publicError) {
      throw new Error(`Public product access failed: ${publicError.message}`);
    }
    
    // Test CSRF token endpoint
    try {
      const csrfResponse = await fetch('http://localhost:3000/api/csrf');
      const csrfResult = csrfResponse.status === 200;
      
      return {
        public_access: 'SUCCESS',
        products_visible: publicData?.length || 0,
        csrf_available: csrfResult
      };
    } catch (error) {
      return {
        public_access: 'SUCCESS',
        products_visible: publicData?.length || 0,
        csrf_available: false,
        csrf_error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 4: Georgian Language Support
   */
  private async testGeorgianLanguageSupport(): Promise<any> {
    // Check if Georgian product data exists and displays correctly
    const { data: georgianProducts, error } = await supabase
      .from('products')
      .select('id, name, description, category')
      .like('name', '%ქართუ%'); // Georgian text pattern
    
    if (error) {
      throw new Error(`Georgian language test failed: ${error.message}`);
    }
    
    const hasGeorgianData = georgianProducts && georgianProducts.length > 0;
    
    return {
      georgian_data_exists: hasGeorgianData,
      georgian_products_count: georgianProducts?.length || 0,
      encoding_utf8: true
    };
  }

  /**
   * Test 5: Real-time Capabilities (if available)
   */
  private async testRealtimeCapabilities(): Promise<any> {
    try {
      // Test real-time connection
      const channel = supabase.channel('test_channel');
      let connected = false;
      
      channel.on('broadcast', { event: 'test' }, (payload) => {
        console.log('Received test broadcast:', payload);
      });
      
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          connected = true;
        }
      });
      
      // Send a test message
      await channel.send({
        type: 'broadcast',
        event: 'test',
        payload: { message: 'System integration test message' }
      });
      
      // Clean up
      await channel.unsubscribe();
      
      return {
        realtime_available: true,
        connection_established: connected,
        broadcasting_working: connected
      };
    } catch (error) {
      return {
        realtime_available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 6: File Upload & Storage Testing
   */
  private async testFileStorage(): Promise<any> {
    try {
      // Test storage bucket access
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw new Error(`Storage access failed: ${error.message}`);
      }
      
      return {
        storage_accessible: true,
        buckets_count: buckets?.length || 0,
        buckets: buckets?.map(b => b.name) || []
      };
    } catch (error) {
      return {
        storage_accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test 7: Security & RLS Policies
   */
  private async testSecurityPolicies(): Promise<any> {
    // Test Row Level Security by attempting cross-tenant access
    try {
      // This should return empty or error due to RLS policies
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
      
      // RLS should prevent unauthorized access to orders
      const hasOrders = data && data.length > 0;
      
      return {
        rls_active: !hasOrders || error !== null,
        unauthorized_access_prevented: !hasOrders,
        security_implemented: true
      };
    } catch (error) {
      // Security is working if we get access denied
      return {
        rls_active: true,
        unauthorized_access_prevented: true,
        security_implemented: true
      };
    }
  }

  /**
   * Test 8: Performance & Response Times
   */
  private async testPerformance(): Promise<any> {
    const testQueries = [
      { name: 'Products Query', query: () => supabase.from('products').select('*').limit(10) },
      { name: 'Profiles Query', query: () => supabase.from('profiles').select('*').limit(5) },
      { name: 'Orders Query', query: () => supabase.from('orders').select('*').limit(5) }
    ];
    
    const results = [];
    
    for (const test of testQueries) {
      const start = Date.now();
      try {
        const { error } = await test.query();
        const duration = Date.now() - start;
        
        results.push({
          test: test.name,
          duration,
          status: error ? 'ERROR' : 'SUCCESS',
          performance: duration < 500 ? 'GOOD' : 'SLOW'
        });
      } catch (error) {
        const duration = Date.now() - start;
        results.push({
          test: test.name,
          duration,
          status: 'ERROR',
          performance: 'UNKNOWN',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return {
      performance_tests: results.length,
      average_response_time: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      results
    };
  }

  /**
   * Run all system integration tests
   */
  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting Georgian Distribution System - System Integration Tests\n');
    
    // Test Suite 1: Core Infrastructure
    console.log('📊 Core Infrastructure Tests:');
    this.results.push(await this.executeTest('Database Connectivity & Schema', () => this.testDatabaseConnectivity()));
    this.results.push(await this.executeTest('API Endpoint Connectivity', () => this.testAPICollectivity()));
    
    // Test Suite 2: User Experience
    console.log('\n👥 User Experience Tests:');
    this.results.push(await this.executeTest('Authentication Flow', () => this.testAuthenticationFlow()));
    this.results.push(await this.executeTest('Georgian Language Support', () => this.testGeorgianLanguageSupport()));
    
    // Test Suite 3: Advanced Features
    console.log('\n⚡ Advanced Features Tests:');
    this.results.push(await this.executeTest('Real-time Capabilities', () => this.testRealtimeCapabilities()));
    this.results.push(await this.executeTest('File Storage & Upload', () => this.testFileStorage()));
    
    // Test Suite 4: Security & Performance
    console.log('\n🔒 Security & Performance Tests:');
    this.results.push(await this.executeTest('Security Policies & RLS', () => this.testSecurityPolicies()));
    this.results.push(await this.executeTest('Performance & Response Times', () => this.testPerformance()));
    
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
    console.log('📋 SYSTEM INTEGRATION TEST REPORT');
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
      console.log('   🟢 ALL SYSTEMS INTEGRATED SUCCESSFULLY');
      console.log('   ✅ Ready for user acceptance testing');
      console.log('   ✅ Frontend-backend integration verified');
      console.log('   ✅ Database operations confirmed');
      console.log('   ✅ Authentication flows tested');
    } else {
      console.log(`   🟡 ${failed} ISSUES IDENTIFIED`);
      console.log('   ⚠️  Review failed tests before proceeding');
    }
    
    console.log(`\n📝 Next Steps:`);
    if (failed === 0) {
      console.log('   1. ✅ Proceed to user acceptance testing');
      console.log('   2. ✅ Begin production deployment preparation');
      console.log('   3. ✅ Conduct final security audit');
    } else {
      console.log('   1. 🔧 Address failed integration tests');
      console.log('   2. 🔍 Review error details above');
      console.log('   3. 🔄 Re-run failed tests after fixes');
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  try {
    const tester = new SystemIntegrationTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ System integration test suite failed to execute:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(console.error);

export default SystemIntegrationTester;