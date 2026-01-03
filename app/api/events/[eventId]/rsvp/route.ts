import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()

    // Try to use handle_rsvp RPC if available, otherwise handle manually
    // Note: The RPC function may not be defined in all environments
    let data: {
      success: boolean
      error?: string
      message?: string
      attendee_count?: number
      capacity?: number
    } | null = null
    let error: Error | null = null

    try {
      // Note: handle_rsvp is a custom RPC function that may not be in the generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpcResult = (await (supabase.rpc as any)('handle_rsvp', {
        p_event_id: eventId,
        p_user_id: user.id,
        p_action: action,
      })) as { data: unknown; error: Error | null }
      if (rpcResult.error) {
        throw rpcResult.error
      }
      data = rpcResult.data as typeof data
    } catch (rpcError) {
      // Fallback: Handle RSVP manually if RPC is not available
      console.warn('handle_rsvp RPC not available, using fallback:', rpcError)

      if (action === 'create') {
        // Check if already RSVPd
        const { data: existing } = await supabase
          .from('rsvps')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single()

        if (existing) {
          data = { success: false, error: 'Already RSVPd to this event' }
        } else {
          // Create RSVP
          const { error: insertError } = await supabase
            .from('rsvps')
            .insert({ event_id: eventId, user_id: user.id, status: 'going' })

          if (insertError) {
            error = insertError
          } else {
            // Get count
            const { count } = await supabase
              .from('rsvps')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', eventId)
            data = {
              success: true,
              message: 'RSVP created successfully',
              attendee_count: count || 0,
            }
          }
        }
      } else if (action === 'cancel') {
        const { error: deleteError } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)

        if (deleteError) {
          error = deleteError
        } else {
          const { count } = await supabase
            .from('rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
          data = {
            success: true,
            message: 'RSVP cancelled successfully',
            attendee_count: count || 0,
          }
        }
      }
    }

    if (error) {
      console.error('RSVP error:', error)
      return NextResponse.json(
        { error: 'Failed to process RSVP' },
        { status: 500 }
      )
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to process RSVP' },
        { status: 400 }
      )
    }

    // Get event capacity for calculating spots remaining
    const { data: eventData } = await supabase
      .from('events')
      .select('max_attendees')
      .eq('id', eventId)
      .single()

    const capacity = eventData?.max_attendees || 0
    const attendeeCount = data?.attendee_count || 0

    return NextResponse.json({
      success: true,
      message: data?.message,
      attendee_count: attendeeCount,
      user_rsvp_status: action === 'create' ? 'attending' : null,
      spots_remaining: capacity > 0 ? capacity - attendeeCount : null,
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
    const supabase = await createClient()

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get user's RSVP status
    const { data: userRsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    // Get RSVP count
    const { count: rsvpCount } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'going')

    const attendeeCount = rsvpCount || 0
    const capacity = event.max_attendees || 0
    const spotsRemaining = capacity > 0 ? capacity - attendeeCount : null

    return NextResponse.json({
      event_id: eventId,
      attendee_count: attendeeCount,
      capacity: event.max_attendees,
      spots_remaining: spotsRemaining,
      is_full: capacity > 0 && attendeeCount >= capacity,
      user_rsvp_status: userRsvp?.status || null,
    })
  } catch (error) {
    console.error('Get RSVP API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
