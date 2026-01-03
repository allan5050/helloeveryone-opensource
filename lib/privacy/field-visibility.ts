import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface FieldVisibilityCheck {
  field: string
  canView: boolean
  canFilter: boolean
  reason?: string
}

export interface PrivacySettings {
  visibility_settings: {
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
  notification_settings?: {
    email_matches: boolean
    email_messages: boolean
    email_events: boolean
    push_matches: boolean
    push_messages: boolean
    push_events: boolean
  }
  privacy_settings?: {
    show_online_status: boolean
    allow_message_requests: boolean
    show_last_active: boolean
    show_read_receipts: boolean
  }
}

/**
 * Check field-level visibility permissions between two users
 */
export async function checkFieldVisibility(
  requestingUserId: string,
  targetUserId: string,
  fields: string[]
): Promise<FieldVisibilityCheck[]> {
  if (requestingUserId === targetUserId) {
    // Users can always see their own fields
    return fields.map(field => ({
      field,
      canView: true,
      canFilter: true,
      reason: 'Own profile',
    }))
  }

  // Check if users are blocked
  const blocked = await areUsersBlocked(requestingUserId, targetUserId)
  if (blocked) {
    return fields.map(field => ({
      field,
      canView: false,
      canFilter: false,
      reason: 'Users are blocked',
    }))
  }

  // Get both users' privacy settings
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, visibility_settings')
    .in('id', [requestingUserId, targetUserId])

  if (error || !profiles || profiles.length !== 2) {
    return fields.map(field => ({
      field,
      canView: false,
      canFilter: false,
      reason: 'Failed to fetch privacy settings',
    }))
  }

  const requestingProfile = profiles.find(p => p.id === requestingUserId)
  const targetProfile = profiles.find(p => p.id === targetUserId)

  if (!requestingProfile || !targetProfile) {
    return fields.map(field => ({
      field,
      canView: false,
      canFilter: false,
      reason: 'Profile not found',
    }))
  }

  const requestingSettings =
    requestingProfile.visibility_settings as PrivacySettings['visibility_settings']
  const targetSettings =
    targetProfile.visibility_settings as PrivacySettings['visibility_settings']

  return fields.map(field => {
    const requestingAllows =
      requestingSettings?.[field as keyof typeof requestingSettings] ?? false
    const targetAllows =
      targetSettings?.[field as keyof typeof targetSettings] ?? false

    const canView = requestingAllows && targetAllows
    const canFilter = requestingAllows // Can only filter by fields you share

    let reason = ''
    if (!requestingAllows && !targetAllows) {
      reason = 'Neither user shares this field'
    } else if (!requestingAllows) {
      reason = 'You must share this field to view it'
    } else if (!targetAllows) {
      reason = 'Target user has not shared this field'
    } else {
      reason = 'Mutual visibility allowed'
    }

    return {
      field,
      canView,
      canFilter,
      reason,
    }
  })
}

/**
 * Filter query parameters based on user's visibility settings
 */
export async function filterQueryParams(
  userId: string,
  queryParams: Record<string, any>
): Promise<Record<string, any>> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('visibility_settings')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    // If we can't get settings, allow no filtering
    return {}
  }

  const visibilitySettings =
    profile.visibility_settings as PrivacySettings['visibility_settings']
  const filteredParams: Record<string, any> = {}

  // Mapping of query parameters to visibility fields
  const paramFieldMap: Record<
    string,
    keyof PrivacySettings['visibility_settings']
  > = {
    age_min: 'age',
    age_max: 'age',
    city: 'location',
    state: 'location',
    occupation: 'occupation',
    education: 'education',
    interests: 'interests',
    relationship_goals: 'relationship_goals',
    lifestyle: 'lifestyle',
  }

  Object.entries(queryParams).forEach(([param, value]) => {
    const requiredField = paramFieldMap[param]

    if (!requiredField) {
      // Allow parameters that don't require field visibility
      filteredParams[param] = value
      return
    }

    if (visibilitySettings?.[requiredField] === true) {
      filteredParams[param] = value
    }
    // Silently ignore parameters for fields the user doesn't share
  })

  return filteredParams
}

/**
 * Get user's privacy dashboard data
 */
export async function getPrivacyDashboard(userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'visibility_settings, notification_settings, privacy_settings, created_at'
    )
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error('Failed to fetch privacy settings')
  }

  // Get blocked users count
  const { count: blockedCount } = await supabase
    .from('blocks')
    .select('*', { count: 'exact', head: true })
    .eq('blocker_id', userId)

  // Get data usage statistics
  const [{ count: messageCount }, { count: matchCount }, { count: rsvpCount }] =
    await Promise.all([
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('is_deleted', false),

      supabase
        .from('match_scores')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),

      supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

  return {
    settings: {
      visibility: profile.visibility_settings || {},
      notifications: profile.notification_settings || {},
      privacy: profile.privacy_settings || {},
    },
    statistics: {
      accountCreated: profile.created_at,
      blockedUsers: blockedCount || 0,
      messagesSent: messageCount || 0,
      matches: matchCount || 0,
      eventRsvps: rsvpCount || 0,
    },
    dataRights: {
      canExport: true,
      canDelete: true,
      canModifySettings: true,
      gdprCompliant: true,
    },
  }
}

/**
 * Update user's privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>
): Promise<boolean> {
  const updates: any = {}

  if (settings.visibility_settings) {
    updates.visibility_settings = settings.visibility_settings
  }

  if (settings.notification_settings) {
    updates.notification_settings = settings.notification_settings
  }

  if (settings.privacy_settings) {
    updates.privacy_settings = settings.privacy_settings
  }

  updates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  return !error
}

/**
 * Check if two users are blocked (helper function)
 */
async function areUsersBlocked(
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
    return false
  }

  return data && data.length > 0
}

/**
 * Sanitize user data for public API responses
 */
export function sanitizeUserData(
  profile: Partial<Profile>,
  requestingUserId: string,
  fieldVisibility: FieldVisibilityCheck[]
): Partial<Profile> {
  const sanitized: Partial<Profile> = {
    id: profile.id,
    display_name: profile.display_name,
    profile_image_url: profile.profile_image_url,
  }

  fieldVisibility.forEach(({ field, canView }) => {
    if (canView && profile[field as keyof Profile] !== undefined) {
      ;(sanitized as any)[field] = profile[field as keyof Profile]
    }
  })

  // Never include sensitive internal fields in API responses
  delete (sanitized as any).auth_user_id
  delete (sanitized as any).bio_embedding
  delete (sanitized as any).email // Only include if explicitly allowed

  return sanitized
}

/**
 * Create audit log entry for privacy-related actions
 */
export async function createPrivacyAuditLog(
  userId: string,
  action: string,
  details: Record<string, any>
) {
  try {
    await supabase.from('privacy_audit_log').insert({
      user_id: userId,
      action,
      details,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to create privacy audit log:', error)
    // Don't fail the main operation if audit logging fails
  }
}

/**
 * Default privacy settings for new users
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  visibility_settings: {
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
  },
  notification_settings: {
    email_matches: true,
    email_messages: true,
    email_events: false,
    push_matches: true,
    push_messages: true,
    push_events: false,
  },
  privacy_settings: {
    show_online_status: true,
    allow_message_requests: true,
    show_last_active: false,
    show_read_receipts: true,
  },
}
