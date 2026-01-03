import { Database } from './database'

// Base profile type from database
export type ProfileBase = Database['public']['Tables']['profiles']['Row']

// Extended profile interface with additional computed fields
export interface Profile extends ProfileBase {
  // Additional computed/UI fields (not in database)
  is_admin?: boolean
  is_suspended?: boolean
  is_favorite?: boolean
  avatar_url?: string | null // Alias for photo_url for backwards compatibility

  // Override interests to support both formats
  interests:
    | string[]
    | {
        music_genres: string[]
        food_preferences: string[]
        activities: string[]
      }
    | null

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
