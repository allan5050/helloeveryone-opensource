const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Extract project reference from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
const dbPassword = process.env.DB_PASSWORD;

// PostgreSQL connection string for Supabase
// Try alternative connection formats
const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
// Alternative: const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

console.log('🚀 Direct Database Migration Script\n');
console.log('=' .repeat(50));
console.log(`📦 Project: ${projectRef}\n`);

async function runMigrations() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    // Check current state
    console.log('📋 Checking current database state...\n');
    
    // Check if pgvector extension exists
    const extResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    const hasVector = extResult.rows[0].count > 0;
    console.log(`   pgvector extension: ${hasVector ? '✅ Installed' : '❌ Not installed'}`);
    
    // Check if bio_embedding column exists
    const colResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'bio_embedding'
    `);
    const hasEmbedding = colResult.rows[0].count > 0;
    console.log(`   bio_embedding column: ${hasEmbedding ? '✅ Exists' : '❌ Missing'}`);
    
    // Check RLS status
    const rlsResult = await client.query(`
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE relname = 'profiles'
    `);
    const hasRLS = rlsResult.rows[0]?.relrowsecurity;
    console.log(`   RLS on profiles: ${hasRLS ? '✅ Enabled' : '❌ Disabled'}\n`);
    
    // Apply migrations if needed
    if (!hasVector || !hasEmbedding || !hasRLS) {
      console.log('📂 Applying necessary migrations...\n');
      
      // Apply pgvector migration if needed
      if (!hasVector || !hasEmbedding) {
        console.log('🔧 Installing pgvector extension and adding embeddings...');
        
        const embedPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250103000001_add_embeddings.sql');
        if (fs.existsSync(embedPath)) {
          const embedSQL = fs.readFileSync(embedPath, 'utf8');
          
          // Split into statements and execute
          const statements = embedSQL
            .split(/;\s*$/gm)
            .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));
          
          for (const statement of statements) {
            try {
              await client.query(statement);
              console.log('   ✅ Statement executed successfully');
            } catch (err) {
              if (err.message.includes('already exists')) {
                console.log('   ⚠️  Already exists (skipping)');
              } else {
                console.log(`   ❌ Error: ${err.message}`);
              }
            }
          }
        }
        console.log('   ✅ pgvector migration complete\n');
      }
      
      // Apply RLS policies if needed
      if (!hasRLS) {
        console.log('🔒 Applying Row Level Security policies...');
        
        const rlsPath = path.join(__dirname, '..', 'supabase', 'migrations', '006_enhanced_rls_policies.sql');
        if (fs.existsSync(rlsPath)) {
          const rlsSQL = fs.readFileSync(rlsPath, 'utf8');
          
          // Split into statements and execute
          const statements = rlsSQL
            .split(/;\s*$/gm)
            .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));
          
          for (const statement of statements) {
            try {
              await client.query(statement);
              console.log('   ✅ Policy applied');
            } catch (err) {
              if (err.message.includes('already exists')) {
                console.log('   ⚠️  Already exists (skipping)');
              } else {
                console.log(`   ⚠️  Warning: ${err.message}`);
              }
            }
          }
        }
        console.log('   ✅ RLS policies complete\n');
      }
      
      // Apply performance indexes
      console.log('⚡ Applying performance indexes...');
      
      const indexPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_performance_indexes.sql');
      if (fs.existsSync(indexPath)) {
        const indexSQL = fs.readFileSync(indexPath, 'utf8');
        
        const statements = indexSQL
          .split(/;\s*$/gm)
          .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));
        
        for (const statement of statements) {
          try {
            await client.query(statement);
            console.log('   ✅ Index created');
          } catch (err) {
            if (err.message.includes('already exists')) {
              console.log('   ⚠️  Already exists (skipping)');
            } else {
              console.log(`   ⚠️  Warning: ${err.message}`);
            }
          }
        }
      }
      console.log('   ✅ Performance indexes complete\n');
      
    } else {
      console.log('✅ All major migrations are already applied!\n');
    }
    
    // Verify final state
    console.log('🧪 Verifying final database state...\n');
    
    const tables = ['profiles', 'events', 'rsvps', 'match_scores', 'messages', 'favorites'];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ✅ Table '${table}': ${result.rows[0].count} rows`);
    }
    
    // Check pgvector again
    const finalExtResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    console.log(`\n   pgvector: ${finalExtResult.rows[0].count > 0 ? '✅ Installed' : '❌ Not installed'}`);
    
    // Check bio_embedding again
    const finalColResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'bio_embedding'
    `);
    console.log(`   bio_embedding: ${finalColResult.rows[0].count > 0 ? '✅ Exists' : '❌ Missing'}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✨ Migration process complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 The database password may be incorrect.');
      console.log('   Please verify DB_PASSWORD in your .env file');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection timeout. The database may be unreachable.');
      console.log('   Please check your network connection');
    }
    
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);