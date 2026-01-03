const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_API_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function runMigrations() {
  console.log('Running database migrations...')

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  const migrationFiles = fs.readdirSync(migrationsDir).sort()

  for (const file of migrationFiles) {
    if (file.endsWith('.sql')) {
      console.log(`Running migration: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

      try {
        const { error } = await supabase
          .rpc('exec_sql', { sql_query: sql })
          .single()
        if (error) {
          console.log(
            `Note: Migration ${file} may have already been applied or requires manual execution in Supabase dashboard`
          )
        } else {
          console.log(`✓ Migration ${file} completed`)
        }
      } catch (err) {
        console.log(
          `Note: Migration ${file} requires manual execution in Supabase dashboard`
        )
      }
    }
  }

  console.log(
    '\n⚠️  IMPORTANT: Some migrations may need to be run manually in your Supabase dashboard'
  )
  console.log(
    'Go to: https://supabase.com/dashboard/project/amarmxbvuzxakjzvntzv/sql/new'
  )
  console.log(
    'And run the migrations from the supabase/migrations folder in order'
  )
}

runMigrations().catch(console.error)
