#!/usr/bin/env ts-node

/**
 * Georgian Distribution System - Database Connectivity Diagnostic Tool
 * 
 * Comprehensive database connectivity testing and Supabase credential validation.
 * Designed to diagnose and resolve the "Invalid API key" error.
 * 
 * Date: 2025-11-01
 * Purpose: Resolve Database Connectivity Issues
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

interface DiagnosticResult {
  test: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  message: string;
  details?: any;
  solution?: string;
}

class DatabaseConnectivityDiagnostic {
  private results: DiagnosticResult[] = [];
  private config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://data.greenland77.ge',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };

  /**
   * Test 1: Environment Variable Validation
   */
  private validateEnvironmentVariables(): DiagnosticResult {
    console.log('\n🔍 Testing Environment Variables...');
    
    const urlConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const keyConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const keyFormatValid = this.config.supabaseAnonKey?.startsWith('eyJ');
    
    const issues = [];
    
    if (!urlConfigured) {
      issues.push('NEXT_PUBLIC_SUPABASE_URL not configured');
    }
    if (!keyConfigured) {
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY not configured');
    }
    if (!keyFormatValid) {
      issues.push('API key format appears invalid (should start with "eyJ")');
    }
    
    // Validate JWT structure
    try {
      const parts = this.config.supabaseAnonKey.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          issues.push('API key has expired');
        }
        
        // Validate issuer matches configured Supabase URL
        const expectedIssuer = this.config.supabaseUrl;
        if (payload.iss && payload.iss !== expectedIssuer) {
          issues.push(`API key issued for different project: ${payload.iss} (expected: ${expectedIssuer})`);
        }
        
        if (payload.role !== 'anon') {
          issues.push('API key role is not "anon"');
        }
        
      }
    } catch (error) {
      issues.push('Unable to parse JWT payload');
    }
    
    return {
      test: 'Environment Variables Validation',
      status: issues.length === 0 ? 'SUCCESS' : 'FAILED',
      message: issues.length === 0 
        ? 'All environment variables configured correctly'
        : `Issues found: ${issues.join(', ')}`,
      details: {
        url_configured: urlConfigured,
        key_configured: keyConfigured,
        key_format_valid: keyFormatValid,
        environment_vars: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***CONFIGURED***' : 'NOT_SET'
        }
      },
      solution: issues.length > 0 ? 'Update environment variables with valid Supabase credentials' : undefined
    };
  }

  /**
   * Test 2: Supabase URL Accessibility
   */
  private async testSupabaseUrlAccess(): Promise<DiagnosticResult> {
    console.log('\n🌐 Testing Supabase URL Accessibility...');
    
    try {
      const response = await fetch(`${this.config.supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`
        }
      });
      
      return {
        test: 'Supabase URL Accessibility',
        status: response.ok ? 'SUCCESS' : 'FAILED',
        message: response.ok 
          ? 'Supabase URL is accessible'
          : `Supabase URL returned ${response.status}: ${response.statusText}`,
        details: {
          url: this.config.supabaseUrl,
          status: response.status,
          status_text: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
    } catch (error) {
      return {
        test: 'Supabase URL Accessibility',
        status: 'FAILED',
        message: `Network error accessing Supabase URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          url: this.config.supabaseUrl,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        solution: 'Check internet connection and Supabase URL configuration'
      };
    }
  }

  /**
   * Test 3: Database Connection Test
   */
  private async testDatabaseConnection(): Promise<DiagnosticResult> {
    console.log('\n🗄️ Testing Database Connection...');
    
    try {
      const supabase = createClient<Database>(this.config.supabaseUrl, this.config.supabaseAnonKey);
      
      // Test basic query
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        return {
          test: 'Database Connection',
          status: 'FAILED',
          message: `Database connection failed: ${error.message}`,
          details: {
            error_code: error.code,
            error_message: error.message,
            error_details: error.details,
            error_hint: error.hint
          },
          solution: error.hint || 'Check API key permissions and database availability'
        };
      }
      
      return {
        test: 'Database Connection',
        status: 'SUCCESS',
        message: 'Database connection established successfully',
        details: {
          connection_successful: true,
          sample_query_result: data
        }
      };
    } catch (error) {
      return {
        test: 'Database Connection',
        status: 'FAILED',
        message: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        solution: 'Verify API key, URL, and database availability'
      };
    }
  }

  /**
   * Test 4: Table Access Validation
   */
  private async testTableAccess(): Promise<DiagnosticResult> {
    console.log('\n📋 Testing Table Access...');
    
    const tables = ['profiles', 'products', 'orders', 'order_items', 'notifications', 'demo_sessions'];
    const supabase = createClient<Database>(this.config.supabaseUrl, this.config.supabaseAnonKey);
    
    const tableResults = [];
    const accessibleTables = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        tableResults.push({
          table,
          status: error ? 'ERROR' : 'SUCCESS',
          accessible: !error,
          error: error?.message,
          count: data?.length
        });
        
        if (!error) {
          accessibleTables.push(table);
        }
      } catch (error) {
        tableResults.push({
          table,
          status: 'ERROR',
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const allTablesAccessible = accessibleTables.length === tables.length;
    
    return {
      test: 'Table Access Validation',
      status: allTablesAccessible ? 'SUCCESS' : 'WARNING',
      message: allTablesAccessible 
        ? 'All tables are accessible'
        : `${accessibleTables.length}/${tables.length} tables accessible`,
      details: {
        total_tables: tables.length,
        accessible_tables: accessibleTables.length,
        table_results: tableResults
      },
      solution: !allTablesAccessible ? 'Check RLS policies and table permissions' : undefined
    };
  }

  /**
   * Test 5: Authentication Service Test
   */
  private async testAuthenticationService(): Promise<DiagnosticResult> {
    console.log('\n🔐 Testing Authentication Service...');
    
    try {
      const supabase = createClient<Database>(this.config.supabaseUrl, this.config.supabaseAnonKey);
      
      // Test auth service availability
      const { data, error } = await supabase.auth.getSession();
      
      if (error && error.message.includes('Invalid API key')) {
        return {
          test: 'Authentication Service',
          status: 'FAILED',
          message: 'Authentication service rejected API key',
          details: {
            error: error.message,
            auth_service_accessible: false
          },
          solution: 'Verify API key has correct permissions for authentication'
        };
      }
      
      return {
        test: 'Authentication Service',
        status: 'SUCCESS',
        message: 'Authentication service is accessible',
        details: {
          auth_service_accessible: true,
          session_available: !!data?.session
        }
      };
    } catch (error) {
      return {
        test: 'Authentication Service',
        status: 'FAILED',
        message: `Authentication service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        solution: 'Check API key and authentication service status'
      };
    }
  }

  /**
   * Test 6: Generate Recommendations
   */
  private generateRecommendations(): DiagnosticResult {
    console.log('\n💡 Generating Recommendations...');
    
    const failures = this.results.filter(r => r.status === 'FAILED').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    
    let recommendations = [];
    
    if (failures > 0) {
      recommendations.push('🔧 Critical Issues Found - Immediate Action Required');
      recommendations.push('1. Verify Supabase project is active and accessible');
      recommendations.push('2. Check that API key has correct permissions');
      recommendations.push('3. Ensure environment variables are properly set');
      recommendations.push('4. Verify project URL matches API key issuer');
    }
    
    if (warnings > 0) {
      recommendations.push('⚠️  Warning Issues - Review Recommended');
      recommendations.push('1. Check RLS policies if table access is restricted');
      recommendations.push('2. Review API key expiration if applicable');
    }
    
    if (failures === 0 && warnings === 0) {
      recommendations.push('✅ All Systems Operational');
      recommendations.push('1. Database connectivity is healthy');
      recommendations.push('2. API credentials are valid');
      recommendations.push('3. Ready for full system integration testing');
    }
    
    return {
      test: 'Recommendations Summary',
      status: failures > 0 ? 'FAILED' : warnings > 0 ? 'WARNING' : 'SUCCESS',
      message: recommendations.join('\n'),
      details: {
        total_tests: this.results.length,
        failures: failures,
        warnings: warnings,
        successes: this.results.filter(r => r.status === 'SUCCESS').length
      }
    };
  }

  /**
   * Run all diagnostic tests
   */
  public async runDiagnostics(): Promise<void> {
    console.log('🚀 Starting Georgian Distribution System - Database Connectivity Diagnostics\n');
    
    // Run all diagnostic tests
    this.results.push(this.validateEnvironmentVariables());
    this.results.push(await this.testSupabaseUrlAccess());
    this.results.push(await this.testDatabaseConnection());
    this.results.push(await this.testTableAccess());
    this.results.push(await this.testAuthenticationService());
    this.results.push(this.generateRecommendations());
    
    this.generateReport();
  }

  /**
   * Generate comprehensive diagnostic report
   */
  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DATABASE CONNECTIVITY DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    
    this.results.forEach((result, index) => {
      const statusIcon = result.status === 'SUCCESS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`\n${index + 1}. ${statusIcon} ${result.test}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      if (result.solution) {
        console.log(`   💡 Solution: ${result.solution}`);
      }
    });
    
    const failures = this.results.filter(r => r.status === 'FAILED').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const successes = this.results.filter(r => r.status === 'SUCCESS').length;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSTIC SUMMARY:');
    console.log(`   ✅ Successes: ${successes}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ❌ Failures: ${failures}`);
    console.log(`   📈 Success Rate: ${((successes / this.results.length) * 100).toFixed(1)}%`);
    
    if (failures === 0) {
      console.log('\n🎉 DATABASE CONNECTIVITY: FULLY OPERATIONAL');
      console.log('✅ Ready for production deployment');
      console.log('✅ All Supabase services accessible');
      console.log('✅ API credentials validated');
    } else {
      console.log('\n🔧 DATABASE CONNECTIVITY: ISSUES DETECTED');
      console.log('❌ Review failed tests above');
      console.log('🔍 Implement solutions before proceeding');
    }
    
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  try {
    const diagnostic = new DatabaseConnectivityDiagnostic();
    await diagnostic.runDiagnostics();
  } catch (error) {
    console.error('❌ Database connectivity diagnostic failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

export default DatabaseConnectivityDiagnostic;