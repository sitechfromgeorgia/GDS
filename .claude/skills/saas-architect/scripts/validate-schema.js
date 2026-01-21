#!/usr/bin/env node
/**
 * Schema Validation Script
 * Checks if generated SQL schema follows SaaS best practices
 */

const fs = require('fs');
const path = require('path');

function validateSchema(schemaPath) {
  console.log('🔍 Validating SaaS Schema...\n');
  
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  const errors = [];
  const warnings = [];
  const passed = [];
  
  // Check 1: RLS is enabled on tables
  const tableMatches = schema.matchAll(/CREATE TABLE (\w+)/gi);
  const tables = Array.from(tableMatches).map(m => m[1]);
  
  for (const table of tables) {
    const rlsEnabled = schema.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    
    if (!rlsEnabled && !['profiles'].includes(table)) {
      errors.push(`❌ Table '${table}' does not have RLS enabled`);
    } else {
      passed.push(`✅ Table '${table}' has RLS enabled`);
    }
  }
  
  // Check 2: Essential tables exist
  const essentialTables = [
    'profiles',
    'organizations',
    'organization_members',
    'customers',
    'subscriptions'
  ];
  
  for (const table of essentialTables) {
    if (schema.includes(`CREATE TABLE ${table}`)) {
      passed.push(`✅ Essential table '${table}' exists`);
    } else {
      errors.push(`❌ Missing essential table: '${table}'`);
    }
  }
  
  // Check 3: Organization membership table has proper structure
  if (schema.includes('CREATE TABLE organization_members')) {
    const hasForeignKeys = 
      schema.includes('organization_id UUID REFERENCES organizations') &&
      schema.includes('user_id UUID REFERENCES auth.users');
    
    if (hasForeignKeys) {
      passed.push(`✅ organization_members has proper foreign keys`);
    } else {
      errors.push(`❌ organization_members missing proper foreign keys`);
    }
  }
  
  // Check 4: Subscription tables have Stripe IDs
  if (schema.includes('CREATE TABLE subscriptions')) {
    const hasStripeId = schema.includes('TEXT PRIMARY KEY') && 
                       schema.toLowerCase().includes('stripe');
    
    if (hasStripeId) {
      passed.push(`✅ Subscriptions table uses Stripe IDs`);
    } else {
      warnings.push(`⚠️  Subscriptions table should use Stripe IDs as primary key`);
    }
  }
  
  // Check 5: Timestamps exist
  const hasTimestamps = schema.includes('created_at') && 
                       schema.includes('TIMESTAMPTZ');
  
  if (hasTimestamps) {
    passed.push(`✅ Tables include timestamp fields`);
  } else {
    warnings.push(`⚠️  Consider adding created_at timestamps`);
  }
  
  // Check 6: Policies exist for tables with RLS
  for (const table of tables) {
    const hasPolicy = schema.includes(`CREATE POLICY`) && 
                     schema.includes(`ON ${table}`);
    
    if (hasPolicy) {
      passed.push(`✅ Table '${table}' has RLS policies`);
    } else {
      warnings.push(`⚠️  Table '${table}' has no RLS policies defined`);
    }
  }
  
  // Print results
  console.log('📊 Validation Results:\n');
  
  if (passed.length > 0) {
    console.log('✅ PASSED CHECKS:');
    passed.forEach(p => console.log(`   ${p}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach(e => console.log(`   ${e}`));
    console.log('');
  }
  
  // Summary
  console.log('📋 Summary:');
  console.log(`   Passed: ${passed.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log('');
  
  if (errors.length === 0) {
    console.log('🎉 Schema validation passed! Ready for Supabase.');
    return true;
  } else {
    console.log('⛔ Schema validation failed. Please fix errors before deploying.');
    return false;
  }
}

// Usage
if (process.argv.length < 3) {
  console.log('Usage: node validate-schema.js <schema.sql>');
  process.exit(1);
}

const schemaPath = process.argv[2];

if (!fs.existsSync(schemaPath)) {
  console.error(`❌ File not found: ${schemaPath}`);
  process.exit(1);
}

const isValid = validateSchema(schemaPath);
process.exit(isValid ? 0 : 1);
