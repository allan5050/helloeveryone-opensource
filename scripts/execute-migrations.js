const { createClient } = require('@supabase/supabase-js')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')
const execPromise = util.promisify(exec)

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]

console.log('🚀 Supabase Migration Executor\n')
console.log('='.repeat(50))
console.log(`📦 Project: ${projectRef}`)
console.log(`🌐 URL: ${supabaseUrl}\n`)

// Create config for Supabase CLI
async function setupSupabaseConfig() {
  console.log('⚙️  Setting up Supabase configuration...')

  // Check if supabase directory exists
  if (!fs.existsSync('supabase')) {
    console.log('   Creating supabase directory...')
    fs.mkdirSync('supabase', { recursive: true })
  }

  // Check if config exists
  const configPath = path.join('supabase', 'config.toml')
  if (!fs.existsSync(configPath)) {
    console.log('   ⚠️  config.toml not found, creating...')
    const config = `# Supabase Configuration
project_id = "${projectRef}"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323
`
    fs.writeFileSync(configPath, config)
  }

  console.log('   ✅ Configuration ready\n')
}

// Apply migrations using Supabase CLI
async function applyMigrationsViaCLI() {
  console.log('📋 Applying migrations via Supabase CLI...\n')

  try {
    // First, link to the project
    console.log('🔗 Linking to Supabase project...')
    const linkCmd = `npx supabase link --project-ref ${projectRef}`

    try {
      const { stdout, stderr } = await execPromise(linkCmd, {
        env: {
          ...process.env,
          SUPABASE_ACCESS_TOKEN: supabaseServiceKey,
        },
      })
      console.log('   ✅ Project linked successfully\n')
    } catch (error) {
      console.log('   ⚠️  Project may already be linked\n')
    }

    // Push migrations
    console.log('🚀 Pushing database changes...')
    const pushCmd = 'npx supabase db push'

    const { stdout, stderr } = await execPromise(pushCmd, {
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: supabaseServiceKey,
      },
    })

    if (stdout) console.log(stdout)
    if (stderr) console.log('Warnings:', stderr)

    console.log('\n✅ Migrations applied successfully!\n')
    return true
  } catch (error) {
    console.error('❌ Error applying migrations:', error.message)
    console.log(
      '\n💡 Alternative: Apply migrations manually via Supabase Dashboard\n'
    )
    return false
  }
}

// Test database after migrations
async function testDatabase() {
  console.log('🧪 Testing database after migrations...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Test tables
  const tables = [
    'profiles',
    'events',
    'rsvps',
    'match_scores',
    'messages',
    'favorites',
  ]

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count').limit(0)
    console.log(
      `   ${error ? '❌' : '✅'} Table '${table}'${error ? `: ${error.message}` : ''}`
    )
  }

  // Test pgvector extension
  console.log('\n🔍 Checking pgvector extension...')
  const { data: extensions, error: extError } = await supabase
    .rpc('exec_sql', {
      sql_query: "SELECT extname FROM pg_extension WHERE extname = 'vector';",
    })
    .catch(() => ({ data: null, error: 'RPC not available' }))

  if (extensions) {
    console.log('   ✅ pgvector extension is installed')
  } else {
    console.log('   ⚠️  pgvector status unknown (manual check needed)')
  }
}

// Alternative: Create SQL file for manual execution
async function createCombinedSQL() {
  console.log('📝 Creating combined SQL file for manual execution...\n')

  const migrations = [
    '001_initial_schema.sql',
    '002_fix_match_score_function.sql',
    '003_fix_constraints_and_function.sql',
    '20250103000001_add_embeddings.sql',
    '20250103000002_event_matching_functions.sql',
    '20240104000000_create_favorites_table.sql',
    '20250904_handle_rsvp.sql',
    '005_performance_indexes.sql',
    '006_enhanced_rls_policies.sql',
  ]

  let combinedSQL = '-- Combined Supabase Migrations for HelloEveryone\n'
  combinedSQL += '-- Generated: ' + new Date().toISOString() + '\n\n'

  for (const filename of migrations) {
    const filePath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      filename
    )

    if (fs.existsSync(filePath)) {
      combinedSQL += `\n-- ========================================\n`
      combinedSQL += `-- Migration: ${filename}\n`
      combinedSQL += `-- ========================================\n\n`
      combinedSQL += fs.readFileSync(filePath, 'utf8')
      combinedSQL += '\n\n'
    }
  }

  const outputPath = path.join(__dirname, '..', 'combined-migrations.sql')
  fs.writeFileSync(outputPath, combinedSQL)

  console.log(`   ✅ Created: ${outputPath}`)
  console.log('   📋 You can run this file in Supabase Dashboard SQL Editor\n')
}

async function main() {
  try {
    // Setup configuration
    await setupSupabaseConfig()

    // Try to apply via CLI
    const cliSuccess = await applyMigrationsViaCLI()

    if (!cliSuccess) {
      // Create combined SQL as fallback
      await createCombinedSQL()

      console.log('📌 Manual Migration Steps:')
      console.log(
        '   1. Go to: https://supabase.com/dashboard/project/' + projectRef
      )
      console.log('   2. Navigate to SQL Editor')
      console.log('   3. Open combined-migrations.sql')
      console.log('   4. Run the SQL statements\n')
    }

    // Test the database
    await testDatabase()

    console.log('\n' + '='.repeat(50))
    console.log('✨ Migration process complete!')
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

main()
