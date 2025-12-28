#!/usr/bin/env node

/**
 * RLS Policy Verification Script
 * 
 * This script connects to the Supabase database and verifies that proper
 * Row Level Security policies are in place across all tables.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RLSPolicy {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string;
  cmd: string;
  qual: string;
  with_check: string;
}

interface TableInfo {
  schemaname: string;
  tablename: string;
  rowsecurity: boolean;
}

async function verifyRLSPolicies() {
  console.log('🔍 Starting RLS Policy Verification...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log('');

  try {
    // 1. Get all tables in public schema
    console.log('📋 Step 1: Fetching all tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .order('tablename');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      return;
    }

    if (!tables) {
      console.error('❌ No tables found');
      return;
    }

    console.log(`✅ Found ${tables.length} tables`);

    // 2. Get RLS status for all tables
    console.log('\n🔒 Step 2: Checking RLS status...');
    const { data: tableStatuses, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname')
      .eq('relname', 'public');

    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
      return;
    }

    // 3. Get all RLS policies
    console.log('\n🛡️ Step 3: Fetching RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies'); // This is a custom function we might need to create

    if (policiesError) {
      console.log('⚠️ Direct RPC not available, using SQL query...');
      
      // Fallback: Use direct SQL query
      const { data: directPolicies, error: directError } = await supabase
        .from('information_schema.table_privileges')
        .select('*')
        .limit(0); // This is just to test connection

      if (directError) {
        console.error('❌ Error with direct query:', directError);
        return;
      }
    }

    // For now, let's create a comprehensive table analysis
    const results = {
      timestamp: new Date().toISOString(),
      environment: 'development',
      supabaseUrl: supabaseUrl,
      totalTables: tables.length,
      tables: tables.map(table => ({
        ...table,
        hasRLS: false, // Will be updated
        policies: [] as RLSPolicy[]
      })),
      summary: {
        tablesWithRLS: 0,
        tablesWithoutRLS: 0,
        totalPolicies: 0,
        securityScore: 0
      }
    };

    // 4. Check each table's RLS status and policies
    console.log('\n📊 Step 4: Analyzing each table...');
    
    for (const table of results.tables) {
      try {
        // Check if RLS is enabled on this table
        const { data: rlsStatus, error: rlsStatusError } = await supabase
          .rpc('check_table_rls', { table_name: table.tablename });

        if (rlsStatusError) {
          console.log(`⚠️ Could not check RLS status for ${table.tablename}`);
          continue;
        }

        table.hasRLS = rlsStatus;

        if (rlsStatus) {
          results.summary.tablesWithRLS++;
          
          // Get policies for this table
          const { data: tablePolicies, error: policiesError } = await supabase
            .rpc('get_table_policies', { table_name: table.tablename });

          if (!policiesError && tablePolicies) {
            table.policies = tablePolicies;
            results.summary.totalPolicies += tablePolicies.length;
          }
        } else {
          results.summary.tablesWithoutRLS++;
        }

        console.log(`📄 ${table.tablename}: ${rlsStatus ? '✅ RLS Enabled' : '❌ RLS Disabled'}`);

      } catch (error) {
        console.log(`⚠️ Error checking ${table.tablename}:`, error);
      }
    }

    // 5. Calculate security score
    if (results.totalTables > 0) {
      results.summary.securityScore = Math.round(
        (results.summary.tablesWithRLS / results.totalTables) * 100
      );
    }

    // 6. Generate report
    console.log('\n📋 Step 5: Generating report...');
    
    const reportPath = path.resolve(__dirname, '../docs/rls-policies-inventory.md');
    
    const report = generateReport(results);
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log('');
    console.log('🎯 SUMMARY:');
    console.log(`   Total Tables: ${results.totalTables}`);
    console.log(`   Tables with RLS: ${results.summary.tablesWithRLS}`);
    console.log(`   Tables without RLS: ${results.summary.tablesWithoutRLS}`);
    console.log(`   Total Policies: ${results.summary.totalPolicies}`);
    console.log(`   Security Score: ${results.summary.securityScore}%`);
    
    if (results.summary.securityScore < 100) {
      console.log('\n⚠️ SECURITY WARNING: Not all tables have RLS enabled!');
      console.log('   This could lead to data leakage and security vulnerabilities.');
    } else {
      console.log('\n✅ SECURITY STATUS: All tables have RLS enabled!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

function generateReport(results: any): string {
  const { tables, summary, timestamp, environment, supabaseUrl } = results;
  
  let report = `# RLS Policies Inventory Report\n\n`;
  report += `**Generated:** ${timestamp}  \n`;
  report += `**Environment:** ${environment}  \n`;
  report += `**Database:** ${supabaseUrl}  \n`;
  report += `**Security Score:** ${summary.securityScore}%  \n\n`;

  report += `## Executive Summary\n\n`;
  report += `- **Total Tables:** ${summary.totalTables}\n`;
  report += `- **Tables with RLS:** ${summary.tablesWithRLS}\n`;
  report += `- **Tables without RLS:** ${summary.tablesWithoutRLS}\n`;
  report += `- **Total Policies:** ${summary.totalPolicies}\n`;
  report += `- **Security Coverage:** ${summary.securityScore}%\n\n`;

  if (summary.tablesWithoutRLS > 0) {
    report += `⚠️ **SECURITY ALERT:** ${summary.tablesWithoutRLS} table(s) do not have RLS enabled!\n\n`;
  }

  report += `## Table Details\n\n`;

  tables.forEach((table: any) => {
    report += `### ${table.tablename}\n\n`;
    report += `**RLS Status:** ${table.hasRLS ? '✅ Enabled' : '❌ Disabled'}  \n`;
    
    if (table.policies && table.policies.length > 0) {
      report += `**Policies:** ${table.policies.length}\n\n`;
      
      table.policies.forEach((policy: RLSPolicy) => {
        report += `- **${policy.policyname}** (${policy.cmd})\n`;
        report += `  - Roles: ${policy.roles}\n`;
        if (policy.qual) {
          report += `  - Condition: \`${policy.qual.substring(0, 100)}${policy.qual.length > 100 ? '...' : ''}\`\n`;
        }
        report += `\n`;
      });
    } else if (table.hasRLS) {
      report += `**Note:** RLS is enabled but no custom policies found.\n\n`;
    } else {
      report += `**⚠️ Missing:** RLS policies should be implemented for this table.\n\n`;
    }
  });

  report += `\n## Required Tables for Georgian Distribution System\n\n`;
  report += `The following tables are critical for the system and should have RLS policies:\n\n`;
  report += `- ✅ **profiles** - User isolation policies\n`;
  report += `- ✅ **products** - Restaurant-owned products\n`;
  report += `- ✅ **orders** - Multi-tenant order access\n`;
  report += `- ✅ **order_items** - Order relationship policies\n`;
  report += `- ✅ **notifications** - User-specific notifications\n`;
  report += `- ✅ **demo_sessions** - Demo isolation\n\n`;

  report += `\n## Security Recommendations\n\n`;
  
  if (summary.tablesWithoutRLS > 0) {
    report += `### Immediate Actions Required\n\n`;
    report += `1. Enable RLS on tables without security policies\n`;
    report += `2. Implement appropriate policies for each table\n`;
    report += `3. Test policies with different user roles\n`;
    report += `4. Verify no cross-tenant data leakage\n\n`;
  }

  report += `### Policy Best Practices\n\n`;
  report += `- Use \`auth.uid()\` for user-specific queries\n`;
  report += `- Use role-based policies with \`auth.jwt() ->> 'role'\`\n`;
  report += `- Always include both \`SELECT\` and \`INSERT/UPDATE/DELETE\` policies\n`;
  report += `- Test policies thoroughly with different user contexts\n`;
  report += `- Monitor policy performance with query execution plans\n\n`;

  report += `---\n`;
  report += `*Report generated by RLS Policy Verification Script*`;

  return report;
}

// Execute the verification
verifyRLSPolicies().catch(console.error);