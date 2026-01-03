import { Database, Json } from './database'

// Base profile type from database
export type ProfileBase = Database['public']['Tables']['profiles']['Row']

// Extended interests type for structured interests
export interface StructuredInterests {
  music_genres?: string[]
  food_preferences?: string[]
  activities?: string[]
}

// Privacy settings type
export interface PrivacySettings {
  show_age?: boolean
  show_interests?: boolean
  show_location?: boolean
}

// Extended profile interface with additional computed fields
// Note: This is used for UI/display purposes and includes computed fields
export interface Profile {
  // Core database fields
  id: string
  user_id: string
  display_name: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  bio?: string | null
  age?: number | null
  location?: string | null
  interests?: string[] | null
  embedding?: string | null
  bio_embedding?: string | null
  role?: 'user' | 'admin'
  is_active?: boolean
  is_profile_complete?: boolean
  photo_url?: string | null
  preferred_age_min?: number | null
  preferred_age_max?: number | null
  looking_for?: string[] | null
  availability?: string[] | null
  privacy_settings?: PrivacySettings | Json | null
  created_at?: string
  updated_at?: string

  // Additional computed/UI fields (not in database)
  is_admin?: boolean
  is_suspended?: boolean
  is_favorite?: boolean
  avatar_url?: string | null // Alias for photo_url for backwards compatibility

  // Structured interests for edit forms
  structured_interests?: StructuredInterests | null

  // Convenience fields for visibility
  visible_fields?: {
    age_visible: boolean
    interests_visible: boolean
    bio_visible: boolean
  }
}

export interface MatchScore {
  id: string
  user_id_1: string
  user_id_2: string
  total_score: number
  interest_score: number
  bio_similarity: number
  age_compatibility: number
  location_score: number
  common_interests: string[] | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface InterestCategory {
  name: string
  options: readonly string[]
  maxSelections: number
}
