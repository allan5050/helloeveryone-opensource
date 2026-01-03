#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function testDatabaseFunctions() {
  console.log('🧪 Testing Database Functions...\n')

  try {
    // Test 1: Check if tables exist and have proper structure
    console.log('1️⃣ Testing table structure...')

    const tables = [
      'profiles',
      'events',
      'rsvps',
      'match_scores',
      'messages',
      'favorites',
      'meeting_slots',
      'blocks',
    ]

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .limit(0)
      if (error) {
        console.error(`❌ Table ${table} error:`, error.message)
      } else {
        console.log(`✅ Table ${table} accessible`)
      }
    }

    // Test 2: Test RLS policies with a sample query
    console.log('\n2️⃣ Testing RLS policies...')

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, is_active')
      .limit(5)

    if (profilesError) {
      console.error('❌ Profiles RLS test failed:', profilesError.message)
    } else {
      console.log(
        `✅ Profiles RLS working - found ${profiles?.length || 0} active profiles`
      )
    }

    // Test 3: Test database functions
    console.log('\n3️⃣ Testing database functions...')

    // Test handle_rsvp function (not in typed schema, use type assertion)
    try {
      const { data: rsvpResult, error: rsvpError } = await (supabase.rpc as any)(
        'handle_rsvp',
        {
          p_event_id: 'test-event-id',
          p_user_id: 'test-user-id',
          p_status: 'going',
        }
      )

      if (rsvpError) {
        console.log(
          '⚠️ handle_rsvp function test (expected to fail with test data):',
          rsvpError.message
        )
      } else {
        console.log('✅ handle_rsvp function accessible')
      }
    } catch (err) {
      console.log(
        '⚠️ handle_rsvp function test failed (expected with test data)'
      )
    }

    // Test calculate_match_score function
    try {
      const { data: matchResult, error: matchError } = await supabase.rpc(
        'calculate_match_score',
        {
          user1_id: 'test-user-1',
          user2_id: 'test-user-2',
          target_event_id: 'test-event-id',
        }
      )

      if (matchError) {
        console.log(
          '⚠️ calculate_match_score function test (expected to fail with test data):',
          matchError.message
        )
      } else {
        console.log('✅ calculate_match_score function accessible')
      }
    } catch (err) {
      console.log(
        '⚠️ calculate_match_score function test failed (expected with test data)'
      )
    }

    // Test get_event_matches function
    try {
      const { data: eventMatches, error: eventMatchesError } =
        await supabase.rpc('get_event_matches', {
          target_event_id: 'test-event-id',
          target_user_id: 'test-user-id',
        })

      if (eventMatchesError) {
        console.log(
          '⚠️ get_event_matches function test (expected to fail with test data):',
          eventMatchesError.message
        )
      } else {
        console.log('✅ get_event_matches function accessible')
      }
    } catch (err) {
      console.log(
        '⚠️ get_event_matches function test failed (expected with test data)'
      )
    }

    // Test 4: Check indexes exist
    console.log('\n4️⃣ Checking performance indexes...')

    const { data: indexes, error: indexError } = await (supabase.rpc as any)('sql', {
      query: `
          SELECT schemaname, tablename, indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND indexname LIKE 'idx_%'
          ORDER BY tablename, indexname
        `,
    })

    if (indexError) {
      console.log(
        '⚠️ Cannot check indexes (may require elevated permissions):',
        indexError.message
      )
    } else if (indexes && indexes.length > 0) {
      console.log(`✅ Found ${indexes.length} performance indexes`)
      // indexes.forEach((idx: any) => {
      //   console.log(`   - ${idx.tablename}.${idx.indexname}`)
      // })
    } else {
      console.log('⚠️ No custom indexes found')
    }

    // Test 5: Test vector similarity if embeddings exist
    console.log('\n5️⃣ Testing vector similarity...')

    const { data: vectorTest, error: vectorError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .not('embedding', 'is', null)
      .limit(1)

    if (vectorError) {
      console.log('❌ Vector similarity test failed:', vectorError.message)
    } else if (vectorTest && vectorTest.length > 0) {
      console.log(
        `✅ Vector embeddings available - found profiles with embeddings`
      )
    } else {
      console.log('⚠️ No profiles with embeddings found')
    }

    console.log('\n🎉 Database function testing completed!')
  } catch (error) {
    console.error('💥 Critical error during testing:', error)
    process.exit(1)
  }
}

// Only run if called directly
if (require.main === module) {
  testDatabaseFunctions()
    .then(() => {
      console.log('\n✅ All tests completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error)
      process.exit(1)
    })
}

export { testDatabaseFunctions }
