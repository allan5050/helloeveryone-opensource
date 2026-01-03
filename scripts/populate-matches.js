const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_API_KEY
)

async function populateMatchScores() {
  try {
    console.log('Fetching all active profiles...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, interests, bio')
      .eq('is_active', true)

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
      return
    }

    console.log(`Found ${profiles.length} active profiles`)

    const matchScores = []

    // Generate match scores for all profile pairs
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const profile1 = profiles[i]
        const profile2 = profiles[j]

        // Calculate match score based on shared interests
        const interests1 = profile1.interests || []
        const interests2 = profile2.interests || []
        const commonInterests = interests1.filter(interest =>
          interests2.includes(interest)
        )

        // Calculate score (0-1 range)
        let score = 0

        // 40% weight for common interests
        if (interests1.length > 0 && interests2.length > 0) {
          score +=
            (commonInterests.length /
              Math.max(interests1.length, interests2.length)) *
            0.4
        }

        // 30% base score for having a bio
        if (profile1.bio && profile2.bio) {
          score += 0.3
        }

        // 30% random factor for variety
        score += Math.random() * 0.3

        // Create bidirectional match scores with all required fields
        const interestScore =
          commonInterests.length > 0
            ? commonInterests.length /
              Math.max(interests1.length, interests2.length)
            : 0
        const semanticScore =
          profile1.bio && profile2.bio ? 0.3 + Math.random() * 0.3 : 0

        // Only create one match per pair (user_id_1 < user_id_2)
        const [userId1, userId2] =
          profile1.user_id < profile2.user_id
            ? [profile1.user_id, profile2.user_id]
            : [profile2.user_id, profile1.user_id]

        matchScores.push({
          user_id_1: userId1,
          user_id_2: userId2,
          interest_score: interestScore,
          semantic_score: semanticScore,
          combined_score: Math.min(score, 0.95), // Cap at 0.95
          calculated_at: new Date().toISOString(),
        })
      }
    }

    console.log(`Generated ${matchScores.length} match scores`)

    // Insert in batches
    const batchSize = 100
    for (let i = 0; i < matchScores.length; i += batchSize) {
      const batch = matchScores.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('match_scores')
        .insert(batch)

      if (insertError) {
        console.error('Error inserting batch:', insertError)
      } else {
        console.log(
          `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(matchScores.length / batchSize)}`
        )
      }
    }

    console.log('Match scores populated successfully!')
  } catch (error) {
    console.error('Error:', error)
  }
}

populateMatchScores()
