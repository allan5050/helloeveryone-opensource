import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

const paramsSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth(request)
    const supabase = await createClient()
    const resolvedParams = await params

    // Validate params
    const validationResult = paramsSchema.safeParse(resolvedParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { eventId } = validationResult.data
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // eventId is already validated by zod schema

    // Check if user is attending this event
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (!rsvp) {
      return NextResponse.json(
        { error: 'You must be attending this event to see matches' },
        { status: 403 }
      )
    }

    // Get event matches using the database function
    const { data: matches, error } = await supabase.rpc('get_event_matches', {
      target_event_id: eventId,
      target_user_id: user.id,
      match_limit: limit,
    })

    if (error) {
      console.error('Error fetching event matches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    // Transform matches to include computed fields
    const transformedMatches = (matches || []).map((match: any) => ({
      userId: match.user_id,
      profileId: match.profile_id,
      fullName: match.full_name,
      bio: match.bio,
      interests: Array.isArray(match.interests) ? match.interests : [],
      age: match.age,
      location: match.location,
      matchScore: parseFloat(match.match_score) || 50,
      sharedInterests: Array.isArray(match.shared_interests)
        ? match.shared_interests
        : [],
      matchExplanation: {
        interestOverlap: [],
        ageCompatibility: 'good',
        locationMatch: match.location ? 'same_city' : 'different_location',
        bioSimilarity: 'unavailable',
        summary:
          match.match_explanation?.summary || 'You will both be at this event',
      },
    }))

    return NextResponse.json({
      matches: transformedMatches,
      pagination: {
        limit,
        offset,
        hasMore: transformedMatches.length === limit,
      },
    })
  } catch (error) {
    console.error('Event match API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
