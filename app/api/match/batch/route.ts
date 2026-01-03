import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const body = await request.json()

    const { eventId, targetUserIds, includeExplanations = true } = body

    // Validate input
    if (!eventId && (!targetUserIds || !Array.isArray(targetUserIds))) {
      return NextResponse.json(
        { error: 'Either eventId or targetUserIds array must be provided' },
        { status: 400 }
      )
    }

    if (targetUserIds && targetUserIds.length > 50) {
      return NextResponse.json(
        { error: 'Cannot process more than 50 target users at once' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const matches = []

    if (eventId) {
      // Get all attendees of the event
      const { data: attendees, error: attendeesError } = await supabase
        .from('rsvps')
        .select('user_id')
        .eq('event_id', eventId)
        .neq('user_id', user.id)

      if (attendeesError) {
        throw new Error('Failed to fetch event attendees')
      }

      // Calculate matches for each attendee
      for (const attendee of attendees || []) {
        const { data: score } = await supabase
          .from('match_scores')
          .select('combined_score')
          .or(
            `and(user_id_1.eq.${user.id},user_id_2.eq.${attendee.user_id}),and(user_id_1.eq.${attendee.user_id},user_id_2.eq.${user.id})`
          )
          .single()

        matches.push({
          userId: user.id,
          targetUserId: attendee.user_id,
          score: score?.combined_score || 50,
          explanation: includeExplanations
            ? {
                interestOverlap: [],
                ageCompatibility: 'good',
                locationMatch: 'same_city',
                bioSimilarity: 0,
                summary: 'You will both be at this event',
              }
            : undefined,
        })
      }
    } else if (targetUserIds) {
      // Process specific user IDs
      for (const targetId of targetUserIds) {
        const { data: score } = await supabase
          .from('match_scores')
          .select('combined_score')
          .or(
            `and(user_id_1.eq.${user.id},user_id_2.eq.${targetId}),and(user_id_1.eq.${targetId},user_id_2.eq.${user.id})`
          )
          .single()

        matches.push({
          userId: user.id,
          targetUserId: targetId,
          score: score?.combined_score || 50,
          explanation: includeExplanations
            ? {
                interestOverlap: [],
                ageCompatibility: 'good',
                locationMatch: 'same_city',
                bioSimilarity: 0,
                summary: 'Potential match based on profile',
              }
            : undefined,
        })
      }
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      matches,
      meta: {
        processingTime,
        cached: false,
        count: matches.length,
      },
    })
  } catch (error) {
    console.error('Batch matching API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
