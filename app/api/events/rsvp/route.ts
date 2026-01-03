import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/auth'
import { z } from 'zod'

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

// Type definitions
interface RSVPRequest {
  eventId: string
  action: 'create' | 'cancel'
}

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
    capacity: number
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
