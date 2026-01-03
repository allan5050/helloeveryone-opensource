const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
const dbPassword = process.env.DB_PASSWORD;

const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('👤 Checking User Roles\n');
console.log('=' .repeat(50));

async function checkRoles() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    
    // Check role column type
    console.log('📋 Role column information:\n');
    const roleInfo = await client.query(`
      SELECT data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'role'
    `);
    
    if (roleInfo.rows.length > 0) {
      console.log(`   Type: ${roleInfo.rows[0].data_type}`);
      console.log(`   UDT: ${roleInfo.rows[0].udt_name}\n`);
    }
    
    // If it's an enum, get the values
    if (roleInfo.rows[0]?.data_type === 'USER-DEFINED') {
      const enumValues = await client.query(`
        SELECT enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = $1
      `, [roleInfo.rows[0].udt_name]);
      
      if (enumValues.rows.length > 0) {
        console.log('   Allowed enum values:');
        for (const val of enumValues.rows) {
          console.log(`     - ${val.enumlabel}`);
        }
        console.log('');
      }
    }
    
    // Check current role values
    console.log('👥 Current user roles:\n');
    const roles = await client.query(`
      SELECT id, display_name, role 
      FROM profiles 
      ORDER BY created_at
    `);
    
    for (const user of roles.rows) {
      console.log(`   ${user.display_name}: ${user.role || 'null'}`);
    }
    
    // Count by role
    console.log('\n📊 Role distribution:\n');
    const roleCounts = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM profiles 
      GROUP BY role
    `);
    
    for (const count of roleCounts.rows) {
      console.log(`   ${count.role || 'null'}: ${count.count} users`);
    }
    
    console.log('\n' + '=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRoles().catch(console.error);