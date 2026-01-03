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
    const { user } = await requireAuth()
    const supabase = createClient()

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
              profile1_id: targetProfileId,
              profile2_id: otherProfileId,
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
                profile1_id:
                  targetProfileId < otherProfileId
                    ? targetProfileId
                    : otherProfileId,
                profile2_id:
                  targetProfileId < otherProfileId
                    ? otherProfileId
                    : targetProfileId,
                score,
              },
              {
                onConflict: 'profile1_id,profile2_id',
              }
            )

          if (upsertError) {
            console.error('Error upserting match score:', upsertError)
            continue
          }

          updatedCount++
        } catch (error) {
          console.error('Error processing match for profile:', otherProfileId, error)
          continue
        }
      }
    } else {
      // Refresh all matches for the profile using the database function
      const { data: refreshResult, error: refreshError } = await supabase.rpc(
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
      await supabase.rpc('refresh_materialized_view', {
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
    const { user } = await requireAuth()
    const supabase = createClient()

    // Get the most recent match score update for this user
    const { data: recentMatch, error } = await supabase
      .from('match_scores')
      .select('updated_at')
      .or(`profile1_id.eq.${user.id},profile2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
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
      .or(`profile1_id.eq.${user.id},profile2_id.eq.${user.id}`)
      .gte('score', 20)

    return NextResponse.json({
      success: true,
      lastUpdated: recentMatch?.updated_at || null,
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
