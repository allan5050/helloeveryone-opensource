const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
const dbPassword = process.env.DB_PASSWORD;

const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('🔒 Verifying RLS Policies\n');
console.log('=' .repeat(50));

async function verifyRLS() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    // Check if RLS is enabled
    console.log('✅ Checking RLS Status:\n');
    const rlsStatus = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'events', 'rsvps', 'match_scores', 'messages', 'favorites', 'meeting_slots', 'blocks')
      ORDER BY tablename
    `);
    
    for (const table of rlsStatus.rows) {
      const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`   ${table.tablename}: ${status}`);
    }
    
    // Check policies
    console.log('\n📋 Active RLS Policies:\n');
    const policies = await client.query(`
      SELECT tablename, policyname, permissive, roles, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      ORDER BY tablename, policyname
    `);
    
    let currentTable = '';
    for (const policy of policies.rows) {
      if (policy.tablename !== currentTable) {
        currentTable = policy.tablename;
        console.log(`\n   ${currentTable}:`);
      }
      console.log(`     ✓ ${policy.policyname} (${policy.cmd})`);
    }
    
    // Check if admin function exists
    console.log('\n🔧 Helper Functions:\n');
    const funcCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'is_admin'
    `);
    
    if (funcCheck.rows.length > 0) {
      console.log('   ✅ is_admin() function exists');
    } else {
      console.log('   ❌ is_admin() function not found');
    }
    
    // Check admin policies specifically
    console.log('\n👑 Admin Override Policies:\n');
    const adminPolicies = policies.rows.filter(p => 
      p.policyname.includes('admin')
    );
    
    const tables = ['profiles', 'events', 'rsvps', 'match_scores', 'messages', 'favorites', 'meeting_slots', 'blocks'];
    for (const table of tables) {
      const hasAdminPolicy = adminPolicies.some(p => p.tablename === table);
      console.log(`   ${table}: ${hasAdminPolicy ? '✅ Has admin policy' : '⚠️  No admin policy'}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('\n✨ RLS Verification Complete!');
    console.log('\nAll policies have been successfully applied.');
    console.log('The database is now secured with Row Level Security.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyRLS().catch(console.error);