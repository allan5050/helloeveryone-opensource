import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/api/rate-limit'
import { explainMatches, UserProfile } from '@/lib/llm/match-explainer'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute for expensive LLM operations
  const rateLimitResponse = checkRateLimit(request, 'expensive')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { matchIds } = await request.json()

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json(
        { error: 'matchIds array is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user's profile
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select(
        'user_id, display_name, bio, age, interests, location, looking_for, availability'
      )
      .eq('user_id', user.id)
      .single()

    if (currentUserError || !currentUserProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get match profiles
    const { data: matchProfiles, error: matchError } = await supabase
      .from('profiles')
      .select(
        'user_id, display_name, bio, age, interests, location, looking_for, availability'
      )
      .in('user_id', matchIds)

    if (matchError) {
      return NextResponse.json(
        { error: 'Failed to fetch match profiles' },
        { status: 500 }
      )
    }

    if (!matchProfiles || matchProfiles.length === 0) {
      return NextResponse.json(
        { error: 'No match profiles found' },
        { status: 404 }
      )
    }

    // Get match scores if available
    const { data: matchScores } = await supabase
      .from('match_scores')
      .select('user_id_2, combined_score')
      .eq('user_id_1', user.id)
      .in('user_id_2', matchIds)

    const scoreMap: { [userId: string]: number } = {}
    if (matchScores) {
      matchScores.forEach(score => {
        scoreMap[score.user_id_2] = score.combined_score
      })
    }

    // Call the LLM to explain matches
    const explanations = await explainMatches(
      currentUserProfile as UserProfile,
      matchProfiles as UserProfile[],
      scoreMap
    )

    // Cache the explanations (optional - could store in database)
    // For now, just return them directly

    return NextResponse.json(explanations)
  } catch (error) {
    console.error('Error in explain matches API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to retrieve cached explanations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchIds = searchParams.get('matchIds')?.split(',') || []

    if (matchIds.length === 0) {
      return NextResponse.json(
        { error: 'matchIds parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For now, always generate fresh explanations
    // In the future, we could implement caching logic here
    return NextResponse.json(
      { message: 'Use POST endpoint to generate explanations' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in explain matches GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
