import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

// Validation schemas
const rsvpRequestSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
  action: z.enum(['create', 'cancel'], {
    errorMap: () => ({ message: 'Action must be either "create" or "cancel"' }),
  }),
})

const rsvpQuerySchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
})

interface RSVPResponse {
  success?: boolean
  message?: string
  attendeeCount?: number
  hasRsvp?: boolean
  rsvp?: {
    id: string
    status: string
    created_at: string
  } | null
  event?: {
    capacity: number | null
    attendeeCount: number
    isFull: boolean
  }
  error?: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RSVPResponse>> {
  try {
    const user = await requireAuth(request)

    // Parse and validate request body
    const body = await request.json()
    const validationResult = rsvpRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { eventId, action } = validationResult.data
    const supabase = await createClient()

    // Try to use handle_rsvp RPC if available, otherwise handle manually
    let data: { success: boolean; error?: string; message?: string; attendee_count?: number } | null = null
    let rpcError: Error | null = null

    try {
      // Note: handle_rsvp is a custom RPC function that may not be in the generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpcResult = await (supabase.rpc as any)('handle_rsvp', {
        p_event_id: eventId,
        p_user_id: user.id,
        p_action: action,
      }) as { data: unknown; error: Error | null }
      if (rpcResult.error) {
        throw rpcResult.error
      }
      data = rpcResult.data as typeof data
    } catch (err) {
      // Fallback: Handle RSVP manually if RPC is not available
      console.warn('handle_rsvp RPC not available, using fallback:', err)

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
            rpcError = insertError
          } else {
            // Get count
            const { count } = await supabase
              .from('rsvps')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', eventId)
            data = { success: true, message: 'RSVP created successfully', attendee_count: count || 0 }
          }
        }
      } else if (action === 'cancel') {
        const { error: deleteError } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)

        if (deleteError) {
          rpcError = deleteError
        } else {
          const { count } = await supabase
            .from('rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
          data = { success: true, message: 'RSVP cancelled successfully', attendee_count: count || 0 }
        }
      }
    }

    if (rpcError) {
      console.error('RSVP error:', rpcError)
      return NextResponse.json(
        { error: 'Failed to process RSVP' },
        { status: 500 }
      )
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to process RSVP' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      attendeeCount: data.attendee_count,
    })
  } catch (error) {
    console.error('RSVP route error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<RSVPResponse>> {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    // Validate query parameter
    const validationResult = rsvpQuerySchema.safeParse({ eventId })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if the user has RSVPd to this event
    const { data: rsvp, error } = await supabase
      .from('rsvps')
      .select('id, status, created_at')
      .eq('event_id', validationResult.data.eventId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching RSVP:', error)
      return NextResponse.json(
        { error: 'Failed to fetch RSVP status' },
        { status: 500 }
      )
    }

    // Get event capacity info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('max_attendees')
      .eq('id', validationResult.data.eventId)
      .single()

    if (eventError && eventError.code !== 'PGRST116') {
      console.error('Error fetching event:', eventError)
    }

    return NextResponse.json({
      hasRsvp: !!rsvp,
      rsvp: rsvp || null,
      event: event
        ? {
            capacity: event.max_attendees,
            attendeeCount: 0,
            isFull: false,
          }
        : undefined,
    })
  } catch (error) {
    console.error('GET RSVP route error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
