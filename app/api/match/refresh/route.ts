import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Rate limit: 60 requests per minute for matching operations
  const rateLimitResponse = checkRateLimit(request, 'matching')
  if (rateLimitResponse) return rateLimitResponse

  const startTime = Date.now()

  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { profileId, targetProfiles } = await request.json()

    // Use authenticated user's ID if no profileId provided
    const targetProfileId = profileId || user.id

    // Check if user has permission to refresh matches for this profile
    if (targetProfileId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to refresh matches for this profile' },
        { status: 403 }
      )
    }

    let updatedCount = 0

    if (targetProfiles && Array.isArray(targetProfiles)) {
      // Refresh specific profile pairs
      for (const otherProfileId of targetProfiles) {
        try {
          // Calculate match score using database function
          const { data: scoreResult, error: scoreError } = await supabase.rpc(
            'calculate_match_score',
            {
              user1_id: targetProfileId,
              user2_id: otherProfileId,
            }
          )

          if (scoreError) {
            console.error('Error calculating match score:', scoreError)
            continue
          }

          const score = Number(scoreResult)

          // Update the match score
          const { error: upsertError } = await supabase
            .from('match_scores')
            .upsert(
              {
                user_id_1:
                  targetProfileId < otherProfileId
                    ? targetProfileId
                    : otherProfileId,
                user_id_2:
                  targetProfileId < otherProfileId
                    ? otherProfileId
                    : targetProfileId,
                combined_score: score,
                semantic_score: 0,
                interest_score: 0,
              },
              {
                onConflict: 'user_id_1,user_id_2',
              }
            )

          if (upsertError) {
            console.error('Error upserting match score:', upsertError)
            continue
          }

          updatedCount++
        } catch (error) {
          console.error(
            'Error processing match for profile:',
            otherProfileId,
            error
          )
          continue
        }
      }
    } else {
      // Refresh all matches for the profile using the database function
      // Cast to any since the function may not be in the generated types
      const { data: refreshResult, error: refreshError } = await (supabase.rpc as any)(
        'refresh_match_scores_for_profile',
        {
          target_profile_id: targetProfileId,
        }
      )

      if (refreshError) {
        return NextResponse.json(
          { error: 'Failed to refresh match scores' },
          { status: 500 }
        )
      }

      updatedCount = refreshResult || 0
    }

    // Refresh materialized view (if it exists)
    try {
      await (supabase.rpc as any)('refresh_materialized_view', {
        view_name: 'top_matches',
      })
    } catch (error) {
      console.error('Warning: Could not refresh materialized view:', error)
      // Non-critical error, continue
    }

    const computationTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      updatedCount,
      computationTime,
      message: `Refreshed ${updatedCount} match scores`,
    })
  } catch (error) {
    console.error('Error in refresh matches API:', error)

    const computationTime = Date.now() - startTime

    return NextResponse.json(
      {
        error: 'Internal server error',
        computationTime,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check when matches were last updated
export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Get the most recent match score update for this user
    const { data: recentMatch, error } = await supabase
      .from('match_scores')
      .select('calculated_at')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Failed to check match status' },
        { status: 500 }
      )
    }

    // Count total matches for this user
    const { count: totalMatches } = await supabase
      .from('match_scores')
      .select('*', { count: 'exact', head: true })
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .gte('combined_score', 20)

    return NextResponse.json({
      success: true,
      lastUpdated: recentMatch?.calculated_at || null,
      totalMatches: totalMatches || 0,
      needsRefresh: !recentMatch, // If no matches exist, needs refresh
    })
  } catch (error) {
    console.error('Error checking match refresh status:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
