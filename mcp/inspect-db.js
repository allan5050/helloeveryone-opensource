#!/usr/bin/env node

/**
 * Database Introspection Tool
 * Run this to get complete database schema information
 */

const SupabaseDBClient = require('./db-client');
const fs = require('fs');
const path = require('path');

async function inspectDatabase() {
  console.log('🔍 Database Introspection Tool\n');
  console.log('=' .repeat(50));
  
  try {
    const client = new SupabaseDBClient();
    
    // Get basic info
    console.log(`\n📦 Project: ${client.projectRef}`);
    console.log(`🌐 URL: ${client.supabaseUrl}\n`);
    
    // Get tables
    console.log('📊 Tables:\n');
    const tables = await client.getTables();
    
    for (const table of tables) {
      const count = await client.getTableCount(table.tablename);
      console.log(`   ${table.tablename}: ${count} rows (${table.size})`);
      if (table.comment) {
        console.log(`     └─ ${table.comment}`);
      }
    }
    
    // Get enums
    console.log('\n🎯 Enum Types:\n');
    const enums = await client.getEnumTypes();
    
    for (const enumType of enums) {
      console.log(`   ${enumType.enum_name}:`);
      const values = Array.isArray(enumType.values) ? enumType.values : [enumType.values];
      console.log(`     Values: ${values.join(', ')}`);
    }
    
    // Check pgvector
    console.log('\n🔧 Extensions:\n');
    const pgvector = await client.checkPgVector();
    if (pgvector) {
      console.log(`   ✅ pgvector v${pgvector.extversion} installed`);
    } else {
      console.log('   ❌ pgvector not installed');
    }
    
    // Get functions
    console.log('\n📦 Functions:\n');
    const functions = await client.getFunctions();
    
    for (const func of functions) {
      console.log(`   ${func.routine_name}() -> ${func.return_type}`);
    }
    
    // Count RLS policies
    console.log('\n🔒 RLS Status:\n');
    const policies = await client.getRLSPolicies();
    const policyCount = {};
    
    for (const policy of policies) {
      policyCount[policy.tablename] = (policyCount[policy.tablename] || 0) + 1;
    }
    
    for (const [table, count] of Object.entries(policyCount)) {
      console.log(`   ${table}: ${count} policies`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('\n✅ Introspection complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure your .env file contains:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - DB_PASSWORD');
    console.error('  - SUPABASE_SERVICE_ROLE_API_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Run if called directly
if (require.main === module) {
  inspectDatabase();
}

module.exports = inspectDatabase;