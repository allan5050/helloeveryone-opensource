const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

console.log('🔍 Checking Migration Status\n')
console.log('='.repeat(50))

async function checkMigrationStatus() {
  const status = {
    needsPgVector: false,
    needsIndexes: false,
    needsRLSPolicies: false,
    needsFunctions: false,
    summary: [],
  }

  // Check pgvector extension and bio_embedding column
  console.log('\n📦 Checking pgvector and embeddings...')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, bio_embedding')
      .limit(1)

    if (error && error.message.includes('bio_embedding')) {
      console.log('   ❌ bio_embedding column does not exist')
      status.needsPgVector = true
      status.summary.push(
        'Need to add pgvector extension and bio_embedding columns'
      )
    } else {
      console.log('   ✅ bio_embedding column exists')
    }
  } catch (e) {
    console.log('   ⚠️  Could not check bio_embedding')
  }

  // Check for specific indexes
  console.log('\n🔍 Checking performance indexes...')
  const indexChecks = [
    { table: 'profiles', column: 'interests' },
    { table: 'events', column: 'event_date' },
    { table: 'rsvps', column: 'status' },
    { table: 'match_scores', column: 'score' },
  ]

  for (const check of indexChecks) {
    // Try a query that would benefit from the index
    const start = Date.now()
    const { data, error } = await supabase
      .from(check.table)
      .select('id')
      .order(check.column)
      .limit(1)
    const time = Date.now() - start

    if (!error) {
      console.log(`   ✅ ${check.table}.${check.column} accessible (${time}ms)`)
    } else {
      console.log(`   ⚠️  ${check.table}.${check.column}: ${error.message}`)
    }
  }

  // Check RLS policies
  console.log('\n🔒 Checking RLS policies...')
  const tables = ['profiles', 'events', 'rsvps', 'messages', 'match_scores']

  for (const table of tables) {
    try {
      // Try to select without auth (should fail if RLS is enabled)
      const anonSupabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data, error } = await anonSupabase
        .from(table)
        .select('id')
        .limit(1)

      if (error && error.message.includes('row-level security')) {
        console.log(`   ✅ ${table} has RLS enabled`)
      } else if (data) {
        console.log(
          `   ⚠️  ${table} may need RLS policies (data accessible without auth)`
        )
        status.needsRLSPolicies = true
      } else {
        console.log(`   ✅ ${table} protected`)
      }
    } catch (e) {
      console.log(`   ⚠️  Could not check ${table} RLS`)
    }
  }

  // Generate migration recommendations
  console.log('\n📋 Migration Recommendations:\n')

  if (status.needsPgVector) {
    console.log(
      '1. Apply pgvector migration (20250103000001_add_embeddings.sql)'
    )
    console.log('   - Enables vector extension')
    console.log('   - Adds bio_embedding columns')
    console.log('   - Sets up similarity search\n')
  }

  if (status.needsIndexes) {
    console.log('2. Apply performance indexes (005_performance_indexes.sql)')
    console.log('   - Speeds up common queries')
    console.log('   - Optimizes match calculations\n')
  }

  if (status.needsRLSPolicies) {
    console.log('3. Apply RLS policies (006_enhanced_rls_policies.sql)')
    console.log('   - Secures data access')
    console.log('   - Implements privacy controls\n')
  }

  if (
    !status.needsPgVector &&
    !status.needsIndexes &&
    !status.needsRLSPolicies
  ) {
    console.log('✅ All major migrations appear to be applied!')
    console.log('   You may still want to run the combined-migrations.sql')
    console.log('   to ensure all functions and constraints are up to date.\n')
  }

  // Create targeted migration file
  if (status.needsPgVector || status.needsIndexes || status.needsRLSPolicies) {
    console.log('📝 Creating targeted migration file...')

    let targetedSQL = '-- Targeted Migrations for Missing Components\n\n'

    if (status.needsPgVector) {
      const embedPath = path.join(
        __dirname,
        '..',
        'supabase',
        'migrations',
        '20250103000001_add_embeddings.sql'
      )
      if (fs.existsSync(embedPath)) {
        targetedSQL += '-- PgVector and Embeddings\n'
        targetedSQL += fs.readFileSync(embedPath, 'utf8')
        targetedSQL += '\n\n'
      }
    }

    if (status.needsIndexes) {
      const indexPath = path.join(
        __dirname,
        '..',
        'supabase',
        'migrations',
        '005_performance_indexes.sql'
      )
      if (fs.existsSync(indexPath)) {
        targetedSQL += '-- Performance Indexes\n'
        targetedSQL += fs.readFileSync(indexPath, 'utf8')
        targetedSQL += '\n\n'
      }
    }

    if (status.needsRLSPolicies) {
      const rlsPath = path.join(
        __dirname,
        '..',
        'supabase',
        'migrations',
        '006_enhanced_rls_policies.sql'
      )
      if (fs.existsSync(rlsPath)) {
        targetedSQL += '-- Enhanced RLS Policies\n'
        targetedSQL += fs.readFileSync(rlsPath, 'utf8')
        targetedSQL += '\n\n'
      }
    }

    fs.writeFileSync(
      path.join(__dirname, '..', 'targeted-migrations.sql'),
      targetedSQL
    )
    console.log(
      '   ✅ Created targeted-migrations.sql with only needed migrations\n'
    )
  }
}

async function main() {
  try {
    await checkMigrationStatus()

    console.log('='.repeat(50))
    console.log('\n📌 Next Steps:\n')
    console.log('1. Go to Supabase SQL Editor:')
    console.log(
      `   https://supabase.com/dashboard/project/amarmxbvuzxakjzvntzv/sql/new\n`
    )
    console.log('2. Run either:')
    console.log('   - targeted-migrations.sql (only missing components)')
    console.log('   - combined-migrations.sql (all migrations)\n')
    console.log('3. Click "Run" to apply the migrations\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()
