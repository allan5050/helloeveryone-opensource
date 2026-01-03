import { createClient } from '@/lib/supabase/server'

interface RsvpResult {
  success: boolean
  error?: string
  data?: any
}

export async function rsvpToEvent(
  eventId: string,
  status: string
): Promise<RsvpResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if event exists and has capacity
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (!event) {
      return { success: false, error: 'Event not found' }
    }

    // Cast event to any since we need to check current_attendees which may come from a computed field
    const eventData = event as any
    const currentAttendees = eventData.current_attendees || 0
    const capacity = event.max_attendees || Infinity
    if (status === 'going' && currentAttendees >= capacity) {
      return { success: false, error: 'Event is at capacity' }
    }

    // Check for existing RSVP
    const { data: existingRsvp } = await supabase
      .from('rsvps')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    if (existingRsvp) {
      return { success: false, error: 'RSVP already exists for this event' }
    }

    // Create RSVP
    const { data, error } = await supabase
      .from('rsvps')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: status as 'going' | 'maybe' | 'not_going',
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function updateRsvpStatus(
  eventId: string,
  status: string
): Promise<RsvpResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('rsvps')
      .update({ status: status as 'going' | 'maybe' | 'not_going' })
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function cancelRsvp(eventId: string): Promise<RsvpResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', eventId)

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'RSVP not found' }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function checkEventCapacity(eventId: string): Promise<any> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase.rpc as any)('check_event_capacity', {
      event_id: eventId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return data
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}
