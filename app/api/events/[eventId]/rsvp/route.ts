import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params
    const { action } = await request.json()

    if (!['create', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "create" or "cancel"' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Call the handle_rsvp function for atomic operation
    const { data, error } = await supabase.rpc('handle_rsvp', {
      p_event_id: eventId,
      p_user_id: user.id,
      p_action: action,
    })

    if (error) {
      console.error('RSVP error:', error)
      return NextResponse.json(
        { error: 'Failed to process RSVP' },
        { status: 500 }
      )
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      attendee_count: data.attendee_count,
      user_rsvp_status: action === 'create' ? 'attending' : null,
      spots_remaining:
        data.spots_remaining || data.capacity - data.attendee_count,
    })
  } catch (error) {
    console.error('RSVP route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params
    const supabase = createClient()

    // Get event with RSVP status and count
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        rsvps!left(id, status, user_id),
        rsvp_count:rsvps(count)
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Find user's RSVP
    const userRSVP = event.rsvps?.find((rsvp: any) => rsvp.user_id === user.id)
    const spotsRemaining = (event.max_attendees || 0) - (event.rsvp_count || 0)

    return NextResponse.json({
      event_id: eventId,
      attendee_count: event.rsvp_count || 0,
      capacity: event.max_attendees,
      spots_remaining: spotsRemaining,
      is_full: spotsRemaining <= 0,
      user_rsvp_status: userRSVP?.status || null,
    })
  } catch (error) {
    console.error('Get RSVP API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
