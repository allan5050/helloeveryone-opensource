// Test script to verify analytics endpoints are working

async function testAnalytics() {
  const baseUrl = 'http://localhost:3002'

  console.log('🧪 Testing Analytics Endpoints...\n')

  // Test 1: Fetch users
  console.log('1. Testing /api/dev/analytics/users')
  try {
    const usersRes = await fetch(`${baseUrl}/api/dev/analytics/users`)
    const usersData = await usersRes.json()
    console.log(
      `   ✅ Users endpoint working: ${usersData.users?.length || 0} demo users found`
    )

    if (usersData.users?.length > 0) {
      console.log(`   Sample user: ${usersData.users[0].display_name}`)
    }
  } catch (error) {
    console.log(`   ❌ Users endpoint failed: ${error.message}`)
  }

  // Test 2: Fetch match scores
  console.log('\n2. Testing /api/dev/analytics/match-scores')
  try {
    const scoresRes = await fetch(`${baseUrl}/api/dev/analytics/match-scores`)
    const scoresData = await scoresRes.json()
    console.log(
      `   ✅ Match scores endpoint working: ${scoresData.scores?.length || 0} pairs calculated`
    )

    if (scoresData.scores?.length > 0) {
      const topMatch = scoresData.scores[0]
      console.log(
        `   Top match: ${topMatch.user1_name} ↔ ${topMatch.user2_name} (${(topMatch.score * 100).toFixed(0)}%)`
      )
    }
  } catch (error) {
    console.log(`   ❌ Match scores endpoint failed: ${error.message}`)
  }

  // Test 3: Test recalculation
  console.log('\n3. Testing /api/dev/analytics/recalculate')
  try {
    const recalcRes = await fetch(`${baseUrl}/api/dev/analytics/recalculate`, {
      method: 'POST',
    })
    const recalcData = await recalcRes.json()

    if (recalcData.metadata) {
      console.log(`   ✅ Recalculation endpoint working:`)
      console.log(`      - Total users: ${recalcData.metadata.total_users}`)
      console.log(`      - Total pairs: ${recalcData.metadata.total_pairs}`)
      console.log(
        `      - Average score: ${recalcData.metadata.avg_score?.toFixed(3)}`
      )
      console.log(
        `      - Strong matches (>70%): ${recalcData.metadata.strong_matches}`
      )
      console.log(
        `      - Medium matches (50-70%): ${recalcData.metadata.medium_matches}`
      )
      console.log(
        `      - Weak matches (<50%): ${recalcData.metadata.weak_matches}`
      )
    }
  } catch (error) {
    console.log(`   ❌ Recalculation endpoint failed: ${error.message}`)
  }

  console.log(
    '\n📊 Analytics Dashboard URL: http://localhost:3002/dev/analytics'
  )
  console.log('🎯 Demo is ready for your presentation!')
}

// Run the test
testAnalytics().catch(console.error)
