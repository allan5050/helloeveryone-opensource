#!/usr/bin/env node

/**
 * Quick Start Script for LLMs
 * Run this to get immediate database context
 */

const SupabaseDBClient = require('./db-client');
const fs = require('fs');
const path = require('path');

async function quickStart() {
  console.log('🚀 MCP Quick Start - Database Context for LLMs\n');
  console.log('=' .repeat(60));
  
  try {
    const client = new SupabaseDBClient();
    
    // Basic connection info
    console.log('\n📌 CONNECTION INFO');
    console.log(`Project: ${client.projectRef}`);
    console.log(`URL: ${client.supabaseUrl}`);
    
    // Quick stats
    console.log('\n📊 DATABASE STATS');
    const tables = await client.getTables();
    let totalRows = 0;
    for (const table of tables) {
      const count = await client.getTableCount(table.tablename);
      totalRows += count;
    }
    console.log(`Tables: ${tables.length}`);
    console.log(`Total Rows: ${totalRows}`);
    
    // Check key features
    console.log('\n✅ FEATURES');
    const pgvector = await client.checkPgVector();
    console.log(`pgvector: ${pgvector ? 'Installed (v' + pgvector.extversion + ')' : 'Not installed'}`);
    
    const policies = await client.getRLSPolicies();
    console.log(`RLS Policies: ${policies.length} total`);
    
    const functions = await client.getFunctions();
    const customFunctions = functions.filter(f => 
      !f.routine_name.startsWith('vector_') && 
      !f.routine_name.startsWith('halfvec_') &&
      !f.routine_name.startsWith('sparsevec_') &&
      !f.routine_name.includes('trgm')
    );
    console.log(`Custom Functions: ${customFunctions.length}`);
    
    // Table summary
    console.log('\n📋 TABLES OVERVIEW');
    for (const table of tables) {
      const count = await client.getTableCount(table.tablename);
      console.log(`\n${table.tablename.toUpperCase()} (${count} rows)`);
      
      const schema = await client.getTableSchema(table.tablename);
      const columns = schema.map(c => c.column_name).slice(0, 5);
      console.log(`  Columns: ${columns.join(', ')}${schema.length > 5 ? ', ...' : ''}`);
      
      const fks = await client.getForeignKeys(table.tablename);
      if (fks.length > 0) {
        console.log(`  Relations: ${fks.map(fk => `→ ${fk.foreign_table_name}`).join(', ')}`);
      }
    }
    
    // Enum types
    console.log('\n🎯 ENUM TYPES');
    const enums = await client.getEnumTypes();
    for (const enumType of enums) {
      console.log(`${enumType.enum_name}: [${enumType.values.join(', ')}]`);
    }
    
    // Key functions
    console.log('\n🔧 KEY FUNCTIONS');
    const keyFunctions = ['calculate_match_score', 'is_admin', 'update_updated_at_column', 'get_event_matches'];
    for (const func of customFunctions) {
      if (keyFunctions.includes(func.routine_name)) {
        console.log(`- ${func.routine_name}() → ${func.return_type}`);
      }
    }
    
    // Quick tips
    console.log('\n💡 QUICK COMMANDS');
    console.log('node mcp/query.js                 # Interactive query mode');
    console.log('node mcp/query.js :sample profiles 3  # Sample data');
    console.log('node mcp/get-schema.js markdown   # Export readable schema');
    console.log('node mcp/inspect-db.js            # Full inspection');
    
    // Export paths
    console.log('\n📁 EXPORTED FILES');
    const schemaPath = path.join(__dirname, 'schema.json');
    if (fs.existsSync(schemaPath)) {
      const stats = fs.statSync(schemaPath);
      console.log(`schema.json: ${(stats.size / 1024).toFixed(1)} KB`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✨ Database context loaded! You can now query the database.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n⚠️  Check that .env contains:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  DB_PASSWORD');
    console.error('  SUPABASE_SERVICE_ROLE_API_KEY');
  }
}

// Run if called directly
if (require.main === module) {
  quickStart();
}

module.exports = quickStart;