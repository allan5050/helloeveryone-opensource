import type {
  EventWithDetails,
  RSVP,
  EventFilters,
  RSVPResponse,
} from '@/types/event'

import { createClient } from './client'

export async function getUpcomingEvents(
  filters: EventFilters = {}
): Promise<EventWithDetails[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Get events with creator profile
  let query = supabase
    .from('events')
    .select(
      `
      *,
      creator:profiles!events_created_by_fkey(user_id, display_name)
    `
    )
    .gte('start_time', today)
    .eq('is_active', true)
    .order('start_time', { ascending: true })

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  // Skip event_type filter since column doesn't exist
  // if (filters.event_type) {
  //   query = query.eq('event_type', filters.event_type)
  // }

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }

  const { data: events, error } = await query

  if (error) {
    console.error('Error fetching upcoming events:', error)
    throw error
  }

  if (!events || events.length === 0) {
    return []
  }

  // Get RSVP counts separately to avoid RLS issues
  const eventIds = events.map(e => e.id)
  const { data: rsvpCounts } = await supabase
    .from('rsvps')
    .select('event_id')
    .in('event_id', eventIds)
    .eq('status', 'going')

  // Count RSVPs per event
  const rsvpCountMap = new Map<string, number>()
  rsvpCounts?.forEach(rsvp => {
    const count = rsvpCountMap.get(rsvp.event_id) || 0
    rsvpCountMap.set(rsvp.event_id, count + 1)
  })

  // Process the data to add rsvp_count
  return events.map(event => ({
    ...event,
    rsvp_count: rsvpCountMap.get(event.id) || 0,
  }))
}

export async function getPastEvents(
  userId: string
): Promise<EventWithDetails[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      creator:profiles!events_created_by_fkey(user_id, display_name),
      rsvps(id, status, user_id)
    `
    )
    .lt('start_time', today)
    .eq('is_active', true)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching past events:', error)
    throw error
  }

  return data.map(event => ({
    ...event,
    rsvp_count:
      event.rsvps?.filter((r: any) => r.status === 'going').length || 0,
    user_rsvp: event.rsvps?.find((r: any) => r.user_id === userId) || null,
  }))
}

export async function getEventById(
  eventId: string,
  userId?: string
): Promise<EventWithDetails | null> {
  const supabase = createClient()
  const query = supabase
    .from('events')
    .select(
      `
      *,
      creator:profiles!events_created_by_fkey(user_id, display_name),
      rsvps(
        id,
        status,
        user_id,
        user:profiles!rsvps_user_id_fkey(user_id, display_name)
      )
    `
    )
    .eq('id', eventId)
    .single()

  const { data: event, error } = await query

  if (error) {
    console.error('Error fetching event:', error)
    return null
  }

  if (!event) return null

  // Count going RSVPs
  const goingRsvps = event.rsvps?.filter(rsvp => rsvp.status === 'going') || []

  // Find user's RSVP if userId provided
  const userRsvp = userId
    ? event.rsvps?.find(rsvp => rsvp.user_id === userId)
    : null

  return {
    ...event,
    rsvp_count: goingRsvps.length,
    user_rsvp: userRsvp || null,
  }
}

export async function getEventAttendees(eventId: string): Promise<RSVP[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rsvps')
    .select(
      `
      *,
      user:profiles!rsvps_user_id_fkey(user_id, display_name)
    `
    )
    .eq('event_id', eventId)
    .eq('status', 'going')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching event attendees:', error)
    throw error
  }

  return data || []
}

export async function createRSVP(
  eventId: string,
  userId: string
): Promise<RSVPResponse> {
  const supabase = createClient()
  try {
    // First check if event exists and has capacity
    const event = await getEventById(eventId)
    if (!event) {
      return { success: false, message: 'Event not found' }
    }

    // Check if user already has an RSVP
    const { data: existingRsvp } = await supabase
      .from('rsvps')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (existingRsvp?.status === 'going') {
      return {
        success: false,
        message: 'You are already registered for this event',
      }
    }

    // Check capacity
    const goingCount = event.rsvp_count || 0
    const status =
      goingCount >= (event.max_attendees || event.capacity) ? 'maybe' : 'going'

    // Create or update RSVP
    const { data, error } = await supabase
      .from('rsvps')
      .upsert({
        event_id: eventId,
        user_id: userId,
        status,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating RSVP:', error)
      return { success: false, message: 'Failed to register for event' }
    }

    const message =
      status === 'maybe'
        ? "Added to waitlist - you'll be notified if a spot opens up"
        : 'Successfully registered for event'

    return { success: true, message, rsvp: data }
  } catch (error) {
    console.error('Error in createRSVP:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

export async function cancelRSVP(
  eventId: string,
  userId: string
): Promise<RSVPResponse> {
  const supabase = createClient()
  try {
    const { error } = await supabase
      .from('rsvps')
      .update({
        status: 'not_going',
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error cancelling RSVP:', error)
      return { success: false, message: 'Failed to cancel registration' }
    }

    // TODO: Promote someone from waitlist if applicable

    return { success: true, message: 'Registration cancelled successfully' }
  } catch (error) {
    console.error('Error in cancelRSVP:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

export async function getEventTypes(): Promise<string[]> {
  // Event types not stored in database, return hardcoded list
  return ['Social', 'Professional', 'Sports', 'Arts', 'Technology', 'Other']
}

export async function getEventLocations(): Promise<string[]> {
  // Return hardcoded locations to avoid RLS issues
  // In production, you might want to cache these or use a different approach
  return [
    'San Francisco',
    'New York',
    'Los Angeles',
    'Chicago',
    'Seattle',
    'Austin',
  ]
}
