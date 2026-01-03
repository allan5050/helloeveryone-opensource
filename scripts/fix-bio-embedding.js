const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
const dbPassword = process.env.DB_PASSWORD;

const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('🔧 Fixing bio_embedding column\n');
console.log('=' .repeat(50));

async function fixBioEmbedding() {
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
    
    // Check if bio_embedding exists
    const checkCol = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'bio_embedding'
    `);
    
    if (checkCol.rows[0].count > 0) {
      console.log('✅ bio_embedding column already exists!');
      return;
    }
    
    console.log('📋 Adding bio_embedding column to profiles table...\n');
    
    // Add bio_embedding column
    try {
      await client.query(`
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS bio_embedding vector(1536)
      `);
      console.log('   ✅ bio_embedding column added');
    } catch (err) {
      console.log(`   ❌ Error adding column: ${err.message}`);
    }
    
    // Add interests_embedding column if missing
    const checkInterests = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'interests_embedding'
    `);
    
    if (checkInterests.rows[0].count === 0) {
      try {
        await client.query(`
          ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS interests_embedding vector(1536)
        `);
        console.log('   ✅ interests_embedding column added');
      } catch (err) {
        console.log(`   ⚠️  interests_embedding: ${err.message}`);
      }
    }
    
    // Add event_embedding to events table
    const checkEventEmbed = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name = 'event_embedding'
    `);
    
    if (checkEventEmbed.rows[0].count === 0) {
      try {
        await client.query(`
          ALTER TABLE events 
          ADD COLUMN IF NOT EXISTS event_embedding vector(1536)
        `);
        console.log('   ✅ event_embedding column added to events');
      } catch (err) {
        console.log(`   ⚠️  event_embedding: ${err.message}`);
      }
    }
    
    // Create indexes for vector columns
    console.log('\n⚡ Creating vector indexes...');
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_profiles_bio_embedding 
        ON profiles USING ivfflat (bio_embedding vector_cosine_ops) 
        WITH (lists = 100)
      `);
      console.log('   ✅ bio_embedding index created');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.log(`   ⚠️  bio_embedding index: ${err.message}`);
      }
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_profiles_interests_embedding 
        ON profiles USING ivfflat (interests_embedding vector_cosine_ops) 
        WITH (lists = 100)
      `);
      console.log('   ✅ interests_embedding index created');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.log(`   ⚠️  interests_embedding index: ${err.message}`);
      }
    }
    
    // Verify the changes
    console.log('\n🧪 Verifying changes...');
    
    const finalCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('bio_embedding', 'interests_embedding')
      ORDER BY column_name
    `);
    
    console.log('\n   Embedding columns in profiles table:');
    for (const row of finalCheck.rows) {
      console.log(`   ✅ ${row.column_name}: ${row.data_type}`);
    }
    
    // Check pgvector extension
    const extCheck = await client.query(`
      SELECT extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    
    if (extCheck.rows.length > 0) {
      console.log(`\n   ✅ pgvector extension version: ${extCheck.rows[0].extversion}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✨ bio_embedding fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixBioEmbedding().catch(console.error);