import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const supabase = createClient()
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
        .select('profile_id')
        .eq('event_id', eventId)
        .neq('profile_id', user.id)

      if (attendeesError) {
        throw new Error('Failed to fetch event attendees')
      }

      // Calculate matches for each attendee
      for (const attendee of attendees || []) {
        const { data: score } = await supabase
          .from('match_scores')
          .select('score')
          .or(
            `and(profile1_id.eq.${user.id},profile2_id.eq.${attendee.profile_id}),and(profile1_id.eq.${attendee.profile_id},profile2_id.eq.${user.id})`
          )
          .single()

        matches.push({
          userId: user.id,
          targetUserId: attendee.profile_id,
          score: score?.score || 50,
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
          .select('score')
          .or(
            `and(profile1_id.eq.${user.id},profile2_id.eq.${targetId}),and(profile1_id.eq.${targetId},profile2_id.eq.${user.id})`
          )
          .single()

        matches.push({
          userId: user.id,
          targetUserId: targetId,
          score: score?.score || 50,
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
