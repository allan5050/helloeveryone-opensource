const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Get connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Extract database connection from Supabase URL
const dbUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const projectRef = dbUrl.split('.')[0];
const dbPassword = process.env.DB_PASSWORD || 'your-db-password';

// Database connection string
const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

console.log('🔌 Connecting to database...');
console.log(`   Project: ${projectRef}`);

// Migration files
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

async function applyMigrationsWithSupabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('\n📂 Applying migrations via Supabase client...\n');
  
  for (const filename of migrations) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filename} (file not found)`);
      continue;
    }
    
    console.log(`📋 Processing: ${filename}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // For now, log what would be executed
    console.log(`   - Would execute ${sqlContent.length} characters of SQL`);
    
    // Parse and validate SQL statements
    const statements = sqlContent
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim());
    
    console.log(`   - Found ${statements.length} SQL statements`);
    
    // Check for key elements
    if (filename.includes('initial_schema')) {
      console.log('   ✓ Initial schema - creates base tables');
    } else if (filename.includes('fix_match_score')) {
      console.log('   ✓ Match score function fixes');
    } else if (filename.includes('embeddings')) {
      console.log('   ✓ Adds pgvector and embeddings support');
    } else if (filename.includes('performance_indexes')) {
      console.log('   ✓ Adds performance indexes');
    } else if (filename.includes('rls_policies')) {
      console.log('   ✓ Enhances Row Level Security');
    }
    
    console.log('');
  }
  
  // Test connection
  console.log('🧪 Testing Supabase connection...');
  const { data, error } = await supabase.auth.getSession();
  console.log('   Connection test:', error ? `Failed: ${error.message}` : 'Success');
  
  return true;
}

async function testDatabaseStructure() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('\n🔍 Checking current database structure...\n');
  
  const tables = [
    'profiles',
    'events', 
    'rsvps',
    'match_scores',
    'messages',
    'favorites',
    'meeting_slots',
    'blocks'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error && error.code === 'PGRST204') {
      console.log(`   ✅ Table '${table}' exists (empty)`);
    } else if (error && error.code === '42P01') {
      console.log(`   ❌ Table '${table}' does not exist`);
    } else if (!error) {
      console.log(`   ✅ Table '${table}' exists`);
    } else {
      console.log(`   ⚠️  Table '${table}' status unknown:`, error.code);
    }
  }
}

async function main() {
  console.log('🚀 Supabase Migration Tool\n');
  console.log('=' .repeat(50));
  
  try {
    // First, test what we have
    await testDatabaseStructure();
    
    // Show what migrations would be applied
    await applyMigrationsWithSupabase();
    
    console.log('\n' + '=' .repeat(50));
    console.log('\n📝 Migration Summary:');
    console.log('   - Initial schema setup');
    console.log('   - Match scoring functions');
    console.log('   - pgvector embeddings support');
    console.log('   - Performance optimizations');
    console.log('   - Security policies');
    
    console.log('\n💡 To apply migrations directly:');
    console.log('   1. Use Supabase Dashboard SQL Editor');
    console.log('   2. Or use: npx supabase db push');
    console.log('   3. Or run SQL files manually');
    
    console.log('\n✨ Migration analysis complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();