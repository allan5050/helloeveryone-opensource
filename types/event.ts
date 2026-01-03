import { Database } from './database'

// Base types from database
export type Event = Database['public']['Tables']['events']['Row']
export type RSVP = Database['public']['Tables']['rsvps']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

// Extended event type with joined data
export interface EventWithDetails extends Event {
  creator?: {
    user_id: string
    display_name: string
  }
  rsvp_count?: number
  user_rsvp?: RSVP | null
  rsvps?: Array<
    RSVP & {
      user?: {
        user_id: string
        display_name: string
      }
    }
  >
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
