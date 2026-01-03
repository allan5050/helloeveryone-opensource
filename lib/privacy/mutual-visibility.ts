import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface VisibilityRules {
  age: boolean
  location: boolean
  occupation: boolean
  education: boolean
  interests: boolean
  bio: boolean
  relationship_goals: boolean
  lifestyle: boolean
  social_media: boolean
  contact_info: boolean
}

/**
 * Check if two users have mutual visibility for specific fields
 */
export function checkMutualVisibility(
  userProfile: Partial<Profile>,
  targetProfile: Partial<Profile>,
  fields: (keyof VisibilityRules)[]
): boolean {
  const userVisibility =
    (userProfile.privacy_settings as Partial<VisibilityRules>) ?? {}
  const targetVisibility =
    (targetProfile.privacy_settings as Partial<VisibilityRules>) ?? {}

  return fields.every(
    field => userVisibility[field] === true && targetVisibility[field] === true
  )
}

/**
 * Filter profile data based on mutual visibility rules
 */
export function filterProfileByVisibility(
  requestingUserProfile: Partial<Profile>,
  targetProfile: Partial<Profile>
): Partial<Profile> {
  const requestingVisibility =
    (requestingUserProfile.privacy_settings as Partial<VisibilityRules>) ?? {}
  const targetVisibility =
    (targetProfile.privacy_settings as Partial<VisibilityRules>) ?? {}

  const filteredProfile: Partial<Profile> = {
    id: targetProfile.id,
    display_name: targetProfile.display_name,
    photo_url: targetProfile.photo_url,
    created_at: targetProfile.created_at,
    updated_at: targetProfile.updated_at,
  }

  // Only include fields where both users allow visibility
  if (requestingVisibility.age && targetVisibility.age) {
    filteredProfile.age = targetProfile.age
  }

  if (requestingVisibility.location && targetVisibility.location) {
    filteredProfile.location = targetProfile.location
  }

  if (requestingVisibility.interests && targetVisibility.interests) {
    filteredProfile.interests = targetProfile.interests
  }

  if (requestingVisibility.bio && targetVisibility.bio) {
    filteredProfile.bio = targetProfile.bio
    filteredProfile.bio_embedding = targetProfile.bio_embedding
  }

  if (
    requestingVisibility.relationship_goals &&
    targetVisibility.relationship_goals
  ) {
    filteredProfile.looking_for = targetProfile.looking_for
  }

  return filteredProfile
}

/**
 * Get SQL WHERE clause for mutual visibility filtering
 * This ensures users can only filter by fields they both share
 */
export function getMutualVisibilityFilter(
  currentUserId: string,
  filterFields: (keyof VisibilityRules)[]
): string {
  if (filterFields.length === 0) {
    return '1=1' // No filters applied
  }

  const visibilityChecks = filterFields.map(
    field =>
      `(profiles.visibility_settings->>'${field}')::boolean = true AND (current_user_profile.visibility_settings->>'${field}')::boolean = true`
  )

  return `(${visibilityChecks.join(' AND ')})`
}

/**
 * Check if user can filter by specific fields based on their own visibility settings
 */
export function canFilterByField(
  userProfile: Partial<Profile>,
  field: keyof VisibilityRules
): boolean {
  const visibility =
    (userProfile.privacy_settings as Partial<VisibilityRules>) ?? {}
  return visibility[field] === true
}

/**
 * Get available filter options based on user's visibility settings
 */
export function getAvailableFilters(
  userProfile: Partial<Profile>
): (keyof VisibilityRules)[] {
  const visibility =
    (userProfile.privacy_settings as Partial<VisibilityRules>) ?? {}
  const availableFilters: (keyof VisibilityRules)[] = []

  Object.entries(visibility).forEach(([field, isVisible]) => {
    if (isVisible) {
      availableFilters.push(field as keyof VisibilityRules)
    }
  })

  return availableFilters
}

/**
 * Check if two users are blocked from seeing each other
 */
export async function areUsersBlocked(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`
    )
    .limit(1)

  if (error) {
    console.error('Error checking block status:', error)
    return false // Fail open for availability
  }

  return data && data.length > 0
}

/**
 * Create WHERE clause to exclude blocked users from queries
 */
export function getBlockedUsersFilter(currentUserId: string): string {
  return `
    NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = '${currentUserId}' AND blocked_id = profiles.id)
         OR (blocker_id = profiles.id AND blocked_id = '${currentUserId}')
    )
  `
}

/**
 * Sanitize profile data for API responses, removing sensitive internal fields
 */
export function sanitizeProfileForAPI(
  profile: Partial<Profile>
): Partial<Profile> {
  const sanitized = { ...profile }

  // Remove internal/sensitive fields
  delete sanitized.bio_embedding
  delete sanitized.embedding

  return sanitized
}

/**
 * Default visibility settings for new users
 */
export const DEFAULT_VISIBILITY_SETTINGS: VisibilityRules = {
  age: true,
  location: true,
  occupation: false,
  education: false,
  interests: true,
  bio: true,
  relationship_goals: true,
  lifestyle: false,
  social_media: false,
  contact_info: false,
}
