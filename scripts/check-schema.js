const { Client } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]
const dbPassword = process.env.DB_PASSWORD

const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`

console.log('📊 Checking Database Schema\n')
console.log('='.repeat(50))

async function checkSchema() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Check profiles table columns
    console.log('📋 Profiles table columns:\n')
    const profileCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `)

    for (const col of profileCols.rows) {
      console.log(
        `   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`
      )
    }

    // Check if is_admin column exists
    const adminCheck = profileCols.rows.find(
      col => col.column_name === 'is_admin'
    )
    if (!adminCheck) {
      console.log('\n   ⚠️  Note: is_admin column does not exist')
    }

    // Check events table columns
    console.log('\n📋 Events table columns:\n')
    const eventCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      ORDER BY ordinal_position
    `)

    for (const col of eventCols.rows) {
      console.log(`   ${col.column_name}: ${col.data_type}`)
    }

    // Check existing RLS policies
    console.log('\n🔒 Existing RLS Policies:\n')
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      ORDER BY tablename, policyname
    `)

    let currentTable = ''
    for (const policy of policies.rows) {
      if (policy.tablename !== currentTable) {
        currentTable = policy.tablename
        console.log(`\n   ${currentTable}:`)
      }
      console.log(`     - ${policy.policyname}`)
    }

    console.log('\n' + '='.repeat(50))
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkSchema().catch(console.error)
