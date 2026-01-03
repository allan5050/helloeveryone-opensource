import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's interests and location for filtering
    const { data: profile } = await supabase
      .from('profiles')
      .select('interests, location')
      .eq('id', user.id)
      .single()

    // Get suggested events
    const { data: events, error } = await supabase
      .from('events')
      .select(
        `
        *,
        profiles!events_organizer_id_fkey(first_name, last_name),
        rsvps(count)
      `
      )
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching suggested events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suggested events' },
        { status: 500 }
      )
    }

    // Transform events with recommendations
    const transformedEvents = (events || []).map((event: any) => {
      const attendeeCount = event.rsvps?.[0]?.count || 0
      const matchScore = calculateEventMatchScore(event, profile)

      return {
        eventId: event.id,
        title: event.title,
        description: event.description,
        dateTime: event.date,
        location: event.location,
        organizerName:
          `${event.profiles?.first_name || ''} ${event.profiles?.last_name || ''}`.trim(),
        attendeeCount,
        potentialMatches: Math.floor(attendeeCount * 0.3), // Estimate
        interestMatchScore: matchScore,
        recommendation: {
          reason: generateRecommendationReason(
            matchScore,
            attendeeCount,
            event.location === profile?.location
          ),
          matchQuality:
            matchScore > 70 ? 'excellent' : matchScore > 40 ? 'good' : 'fair',
          attendeeInsight: getAttendeeInsight(attendeeCount),
        },
      }
    })

    return NextResponse.json({
      events: transformedEvents,
      pagination: {
        limit,
        offset,
        hasMore: transformedEvents.length === limit,
      },
    })
  } catch (error) {
    console.error('Suggested events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateEventMatchScore(event: any, profile: any): number {
  let score = 50 // Base score

  // Location match adds points
  if (profile?.location && event.location === profile.location) {
    score += 30
  }

  // Random variation to simulate interest matching
  score += Math.random() * 20

  return Math.min(100, Math.round(score))
}

function generateRecommendationReason(
  score: number,
  attendeeCount: number,
  sameLocation: boolean
): string {
  const reasons = []

  if (score > 70) {
    reasons.push('Strong interest alignment')
  } else if (score > 40) {
    reasons.push('Good interest match')
  }

  if (attendeeCount > 10) {
    reasons.push(`${attendeeCount} people attending`)
  }

  if (sameLocation) {
    reasons.push('In your area')
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'New event opportunity'
}

function getAttendeeInsight(count: number): string {
  if (count === 0) return 'Be the first to join!'
  if (count === 1) return '1 person attending'
  if (count <= 5) return `${count} people attending`
  if (count <= 15) return `${count} people - great for conversations`
  return `${count}+ people - popular event!`
}
