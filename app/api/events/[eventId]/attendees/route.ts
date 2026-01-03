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
    await requireAuth(request)
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

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Get total count for pagination
    const { count } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'going')

    // Get attendees with profile information
    const { data: attendees, error } = await supabase
      .from('rsvps')
      .select(
        `
        id,
        status,
        created_at,
        user_id,
        profiles!inner (
          user_id,
          display_name,
          bio,
          age,
          location,
          interests
        )
      `
      )
      .eq('event_id', eventId)
      .eq('status', 'going')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching attendees:', error)
      return NextResponse.json(
        { error: 'Failed to fetch attendees' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedAttendees =
      attendees?.map(rsvp => ({
        id: rsvp.id,
        userId: rsvp.user_id,
        rsvpDate: rsvp.created_at,
        profile: {
          user_id: rsvp.profiles.user_id,
          displayName: rsvp.profiles.display_name,
          bio: rsvp.profiles.bio,
          age: rsvp.profiles.age,
          location: rsvp.profiles.location,
          interests: rsvp.profiles.interests,
        },
      })) || []

    return NextResponse.json({
      attendees: formattedAttendees,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Attendees route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
