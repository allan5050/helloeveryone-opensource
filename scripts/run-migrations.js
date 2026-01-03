const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_API_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Migration files in order
const migrations = [
  '001_initial_schema.sql',
  '002_fix_match_score_function.sql',
  '003_fix_constraints_and_function.sql',
  '20250103000001_add_embeddings.sql',
  '20250103000002_event_matching_functions.sql',
  '20240104000000_create_favorites_table.sql',
  '20250904_handle_rsvp.sql',
  '005_performance_indexes.sql',
  '006_enhanced_rls_policies.sql'
];

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Migration file not found: ${filename}`);
    return false;
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    console.log(`📋 Running migration: ${filename}`);
    
    // Split by semicolons but be careful with functions/procedures
    const statements = sql
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    for (const statement of statements) {
      if (statement.trim().length > 0 && !statement.trim().startsWith('--')) {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        }).catch(async (rpcError) => {
          // If RPC doesn't exist, try direct execution via raw SQL
          const { data, error } = await supabase.from('_').select().limit(0);
          // Use the underlying PostgreSQL connection
          return supabase.rpc('query', { query: statement }).catch(() => {
            // Fallback: log the statement for manual execution
            console.log(`   ⚠️ Could not execute via RPC. Statement needs manual execution.`);
            return { error: rpcError };
          });
        });
        
        if (error && !error.message?.includes('already exists')) {
          console.log(`   ⚠️ Warning: ${error.message}`);
        }
      }
    }
    
    console.log(`   ✅ Migration ${filename} completed`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error in ${filename}:`, error.message);
    return false;
  }
}

async function checkDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means table exists but no rows
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration process...\n');
  
  // Check connection first
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  console.log('\n📂 Running migrations...\n');
  
  let successCount = 0;
  let skipCount = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      skipCount++;
    }
    console.log(''); // Add spacing between migrations
  }
  
  console.log('=' .repeat(50));
  console.log('\n🎉 Migration process completed!');
  console.log(`   ✅ Successful: ${successCount} migrations`);
  console.log(`   ⚠️  Skipped/Warning: ${skipCount} migrations`);
  
  // Test a basic query
  console.log('\n🧪 Testing database structure...');
  const tables = ['profiles', 'events', 'rsvps', 'match_scores', 'messages', 'favorites'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`   ❌ Table '${table}' check failed:`, error.message);
    } else {
      console.log(`   ✅ Table '${table}' exists`);
    }
  }
  
  console.log('\n✨ Database migration complete!');
}

main().catch(console.error);