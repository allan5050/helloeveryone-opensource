import { Database } from './database'

// Base types from database
export type Event = Database['public']['Tables']['events']['Row']
export type RSVP = Database['public']['Tables']['rsvps']['Row']

// Profile is imported from profile.ts to avoid conflicts
type ProfileRow = Database['public']['Tables']['profiles']['Row']

// Partial RSVP type for query results that only select specific fields
export interface PartialRSVP {
  id: string
  status: 'going' | 'maybe' | 'not_going'
  user_id: string
  event_id?: string
  created_at?: string
  updated_at?: string
  user?: {
    user_id: string
    display_name: string
  }
}

// Extended event type with joined data
export interface EventWithDetails extends Event {
  creator?: {
    user_id: string
    display_name: string
  }
  rsvp_count?: number
  user_rsvp?: PartialRSVP | null
  rsvps?: Array<PartialRSVP>
  // Legacy field alias for backward compatibility
  capacity?: number | null
}

// Event creation/update types
export interface CreateEventData {
  title: string
  description?: string | null
  location: string
  start_time: string
  end_time: string
  max_attendees?: number | null
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string
}

// Event filter options
export interface EventFilters {
  location?: string
  event_type?: string
  search?: string
}

// RSVP response type
export interface RSVPResponse {
  success: boolean
  message: string
  rsvp?: RSVP
}

// RSVP status type
export type RSVPStatus = Database['public']['Enums']['rsvp_status']

// Extended RSVP with user details
export interface RSVPWithUser extends RSVP {
  user?: {
    user_id: string
    display_name: string
  }
}

// Event with comprehensive data for detailed views
export interface FullEventDetails extends Event {
  creator: {
    user_id: string
    display_name: string
    bio?: string | null
    location?: string | null
  }
  attendees: RSVPWithUser[]
  going_count: number
  maybe_count: number
  spots_remaining: number
  user_rsvp?: RSVP | null
}

// RSVP user info for EventWithRSVP
export interface RSVPUserInfo {
  id: string
  event_id: string
  user_id: string
  status: 'attending' | 'going' | 'maybe' | 'not_going'
  created_at: string
  updated_at: string
}

// Event with RSVP data for UI components
export interface EventWithRSVP {
  id: string
  title: string
  description?: string | null
  location: string
  date_time: string
  capacity: number
  attendee_count: number
  created_by: string
  created_at: string
  updated_at: string
  spots_remaining: number
  is_full: boolean
  tags?: string[]
  user_rsvp?: RSVPUserInfo
}
