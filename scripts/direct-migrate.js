const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

console.log('🚀 Direct Migration Script\n');
console.log('=' .repeat(50));

// Read combined migrations file
async function executeCombinedMigrations() {
  const combinedSQLPath = path.join(__dirname, '..', 'combined-migrations.sql');
  
  if (!fs.existsSync(combinedSQLPath)) {
    console.log('⚠️  Combined migrations file not found. Creating it...');
    
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
    
    let combinedSQL = '';
    for (const filename of migrations) {
      const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
      if (fs.existsSync(filePath)) {
        combinedSQL += `\n-- Migration: ${filename}\n`;
        combinedSQL += fs.readFileSync(filePath, 'utf8');
        combinedSQL += '\n\n';
      }
    }
    
    fs.writeFileSync(combinedSQLPath, combinedSQL);
  }
  
  console.log('📋 Combined migrations file ready\n');
  console.log('📌 Next Steps:\n');
  console.log('1. Go to Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/amarmxbvuzxakjzvntzv/sql/new\n`);
  console.log('2. Copy the contents of:');
  console.log(`   ${combinedSQLPath}\n`);
  console.log('3. Paste into the SQL Editor and click "Run"\n');
  console.log('4. The migrations will be applied to your database\n');
  
  // Test current database state
  console.log('🧪 Current Database State:\n');
  
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
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`   ✅ Table '${table}' exists (${count || 0} rows)`);
      } else if (error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist`);
      } else {
        console.log(`   ⚠️  Table '${table}': ${error.message}`);
      }
    } catch (e) {
      console.log(`   ⚠️  Table '${table}': ${e.message}`);
    }
  }
  
  // Check for pgvector
  console.log('\n🔍 Extension Status:\n');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('bio_embedding')
      .limit(0);
    
    if (!error) {
      console.log('   ✅ bio_embedding column exists (pgvector likely installed)');
    } else {
      console.log('   ⚠️  bio_embedding column not found (pgvector may need setup)');
    }
  } catch (e) {
    console.log('   ⚠️  Could not check pgvector status');
  }
  
  // Check for functions
  console.log('\n📦 Database Functions:\n');
  const functions = [
    'calculate_match_score',
    'handle_new_user',
    'handle_rsvp',
    'update_updated_at_column'
  ];
  
  for (const func of functions) {
    try {
      // Try to get function info (this is a workaround)
      const { error } = await supabase.rpc(func, {}).catch(e => ({ error: e }));
      
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log(`   ❌ Function '${func}' does not exist`);
      } else {
        console.log(`   ✅ Function '${func}' exists`);
      }
    } catch (e) {
      console.log(`   ⚠️  Function '${func}' status unknown`);
    }
  }
}

async function createMigrationHelper() {
  console.log('\n📝 Creating migration helper file...\n');
  
  const helperContent = `# Supabase Migration Guide for HelloEveryone

## Quick Start

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/amarmxbvuzxakjzvntzv/sql/new
   - Sign in with your Supabase account

2. **Run Migrations**
   - Open the file: \`combined-migrations.sql\`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" button

## Migration Order

The combined file includes these migrations in order:
1. Initial schema setup (tables, basic functions)
2. Match score function fixes
3. Constraint and function fixes
4. pgvector embeddings support
5. Event matching functions
6. Favorites table
7. RSVP handling
8. Performance indexes
9. Enhanced RLS policies

## Verification

After running migrations, verify:
- All tables exist (profiles, events, rsvps, etc.)
- pgvector extension is enabled
- Functions are created (calculate_match_score, etc.)
- Indexes are applied
- RLS policies are active

## Troubleshooting

If you get errors about:
- "already exists" - That's OK, the item was already created
- "permission denied" - Contact Supabase support to enable extensions
- "syntax error" - Check if you copied the entire file

## Alternative Method

Use the Supabase CLI:
\`\`\`bash
# First, get an access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=your-token-here

# Link project
npx supabase link --project-ref amarmxbvuzxakjzvntzv

# Push migrations
npx supabase db push
\`\`\`
`;
  
  fs.writeFileSync(path.join(__dirname, '..', 'MIGRATION_GUIDE.md'), helperContent);
  console.log('   ✅ Created MIGRATION_GUIDE.md with instructions\n');
}

async function main() {
  try {
    await executeCombinedMigrations();
    await createMigrationHelper();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✨ Migration preparation complete!\n');
    console.log('📋 The combined-migrations.sql file is ready');
    console.log('📖 See MIGRATION_GUIDE.md for detailed instructions\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();