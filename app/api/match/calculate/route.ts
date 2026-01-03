import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { createClient } from '@/lib/supabase/server'

interface MatchCalculationRequest {
  targetProfileId?: string
  eventId?: string
  limit?: number
  minScore?: number
  forceRecalculate?: boolean
}

interface MatchScore {
  profileId: string
  score: number
  profile: {
    id: string
    firstName: string
    lastName: string
    age?: number
    location?: string
    bio?: string
    interests?: string[]
  }
  breakdown?: {
    bioSimilarity: number
    interestOverlap: number
    ageProximity: number
    locationBonus: number
  }
}

export async function POST(request: NextRequest) {
  // Rate limit: 60 requests per minute for matching operations
  const rateLimitResponse = checkRateLimit(request, 'matching')
  if (rateLimitResponse) return rateLimitResponse

  const startTime = Date.now()

  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const {
      targetProfileId,
      eventId,
      limit = 10,
      minScore = 20,
      forceRecalculate = false,
    }: MatchCalculationRequest = await request.json()

    let targetProfiles: string[] = []

    if (eventId) {
      // Get profiles attending the specific event
      const { data: rsvps, error: rsvpError } = await supabase
        .from('rsvps')
        .select('user_id')
        .eq('event_id', eventId)
        .neq('user_id', user.id)

      if (rsvpError) {
        return NextResponse.json(
          { error: 'Failed to fetch event attendees' },
          { status: 500 }
        )
      }

      targetProfiles = rsvps.map(rsvp => rsvp.user_id)
    } else if (targetProfileId) {
      targetProfiles = [targetProfileId]
    } else {
      // Get all profiles except the current user
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .neq('user_id', user.id)

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to fetch profiles' },
          { status: 500 }
        )
      }

      targetProfiles = profiles.map(p => p.user_id)
    }

    if (targetProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        computationTime: Date.now() - startTime,
      })
    }

    const matches: MatchScore[] = []

    // Check if we should use cached scores or recalculate
    if (!forceRecalculate) {
      // Try to get cached scores first
      const { data: cachedScores, error: cacheError } = await supabase
        .from('match_scores')
        .select(
          `
          combined_score,
          user_id_1,
          user_id_2
        `
        )
        .or(
          `and(user_id_1.eq.${user.id},user_id_2.in.(${targetProfiles.join(',')})),and(user_id_2.eq.${user.id},user_id_1.in.(${targetProfiles.join(',')}))`
        )
        .gte('combined_score', minScore)
        .order('combined_score', { ascending: false })
        .limit(limit)

      if (!cacheError && cachedScores && cachedScores.length > 0) {
        // Get profile details for cached matches
        const matchedProfileIds = cachedScores.map(score =>
          score.user_id_1 === user.id ? score.user_id_2 : score.user_id_1
        )

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, age, location, bio, interests')
          .in('user_id', matchedProfileIds)

        if (!profileError && profiles) {
          for (const score of cachedScores) {
            const matchedProfileId =
              score.user_id_1 === user.id ? score.user_id_2 : score.user_id_1
            const profile = profiles.find(p => p.user_id === matchedProfileId)

            if (profile) {
              matches.push({
                profileId: profile.user_id,
                score: Number(score.combined_score),
                profile: {
                  id: profile.user_id,
                  firstName: profile.display_name,
                  lastName: '',
                  age: profile.age ?? undefined,
                  location: profile.location ?? undefined,
                  bio: profile.bio ?? undefined,
                  interests: (profile.interests as string[]) || [],
                },
              })
            }
          }
        }
      }
    }

    // If we have cached results and don't need to force recalculate, return them
    if (matches.length > 0 && !forceRecalculate) {
      return NextResponse.json({
        success: true,
        matches: matches.slice(0, limit),
        cached: true,
        computationTime: Date.now() - startTime,
      })
    }

    // Calculate fresh scores using the database function
    const freshMatches: MatchScore[] = []

    for (const targetId of targetProfiles) {
      try {
        // Call the calculate_match_score function
        const { data: scoreResult, error: scoreError } = await supabase.rpc(
          'calculate_match_score',
          {
            user1_id: user.id,
            user2_id: targetId,
          }
        )

        if (scoreError) {
          console.error('Error calculating match score:', scoreError)
          continue
        }

        const score = Number(scoreResult)

        if (score >= minScore) {
          // Get profile details
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, display_name, age, location, bio, interests')
            .eq('user_id', targetId)
            .single()

          if (!profileError && profile) {
            freshMatches.push({
              profileId: profile.user_id,
              score,
              profile: {
                id: profile.user_id,
                firstName: profile.display_name,
                lastName: '',
                age: profile.age ?? undefined,
                location: profile.location ?? undefined,
                bio: profile.bio ?? undefined,
                interests: (profile.interests as string[]) || [],
              },
            })

            // Cache the score
            await supabase.from('match_scores').upsert(
              {
                user_id_1: user.id < targetId ? user.id : targetId,
                user_id_2: user.id < targetId ? targetId : user.id,
                combined_score: score,
                semantic_score: 0,
                interest_score: 0,
              },
              {
                onConflict: 'user_id_1,user_id_2',
              }
            )
          }
        }
      } catch (error) {
        console.error('Error processing match for profile:', targetId, error)
        continue
      }
    }

    // Sort by score and limit results
    freshMatches.sort((a, b) => b.score - a.score)
    const finalMatches = freshMatches.slice(0, limit)

    const computationTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      matches: finalMatches,
      cached: false,
      computationTime,
      totalCalculated: targetProfiles.length,
    })
  } catch (error) {
    console.error('Error in calculate matches API:', error)

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

// GET endpoint to retrieve matches for the current user
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const minScore = parseInt(searchParams.get('minScore') || '20')
    const eventId = searchParams.get('eventId')

    const supabase = await createClient()

    // Build the query
    const query = supabase
      .from('match_scores')
      .select('combined_score, user_id_1, user_id_2')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .gte('combined_score', minScore)
      .order('combined_score', { ascending: false })
      .limit(limit)

    const { data: matchScores, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    // Get profile details for all matches
    const profileIds = (matchScores || []).map(score =>
      score.user_id_1 === user.id ? score.user_id_2 : score.user_id_1
    )

    if (profileIds.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        computationTime: Date.now() - startTime,
      })
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, age, location, bio, interests')
      .in('user_id', profileIds)

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile details' },
        { status: 500 }
      )
    }

    const matches: MatchScore[] = []

    for (const score of matchScores || []) {
      const matchProfileId =
        score.user_id_1 === user.id ? score.user_id_2 : score.user_id_1
      const profile = profiles?.find(p => p.user_id === matchProfileId)

      if (profile) {
        matches.push({
          profileId: profile.user_id,
          score: Number(score.combined_score),
          profile: {
            id: profile.user_id,
            firstName: profile.display_name,
            lastName: '',
            age: profile.age ?? undefined,
            location: profile.location ?? undefined,
            bio: profile.bio ?? undefined,
            interests: (profile.interests as string[]) || [],
          },
        })
      }
    }

    // If eventId is specified, filter matches to only include event attendees
    let finalMatches = matches
    if (eventId) {
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('user_id')
        .eq('event_id', eventId)

      if (rsvps) {
        const eventAttendeeIds = new Set(rsvps.map(rsvp => rsvp.user_id))
        finalMatches = matches.filter(match =>
          eventAttendeeIds.has(match.profileId)
        )
      }
    }

    return NextResponse.json({
      success: true,
      matches: finalMatches,
      computationTime: Date.now() - startTime,
    })
  } catch (error) {
    console.error('Error fetching matches:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
