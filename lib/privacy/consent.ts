import { supabase } from '@/lib/supabase/client'

export type ConsentType =
  | 'privacy_policy'
  | 'terms_of_service'
  | 'marketing_emails'
  | 'data_processing'
  | 'cookie_consent'
  | 'location_sharing'
  | 'profile_visibility'

export interface ConsentRecord {
  id: string
  user_id: string
  consent_type: ConsentType
  consent_given: boolean
  consent_version: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}

export interface ConsentRequest {
  consent_type: ConsentType
  consent_given: boolean
  consent_version: string
  ip_address?: string
  user_agent?: string
}

/**
 * Record user consent for GDPR compliance
 */
export async function recordConsent(
  userId: string,
  consentRequest: ConsentRequest
): Promise<boolean> {
  try {
    // Check if consent already exists for this type and version
    const { data: existing } = await supabase
      .from('user_consents')
      .select('id')
      .eq('user_id', userId)
      .eq('consent_type', consentRequest.consent_type)
      .eq('consent_version', consentRequest.consent_version)
      .single()

    if (existing) {
      // Update existing consent
      const { error } = await supabase
        .from('user_consents')
        .update({
          consent_given: consentRequest.consent_given,
          ip_address: consentRequest.ip_address,
          user_agent: consentRequest.user_agent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      return !error
    } else {
      // Create new consent record
      const { error } = await supabase.from('user_consents').insert({
        user_id: userId,
        consent_type: consentRequest.consent_type,
        consent_given: consentRequest.consent_given,
        consent_version: consentRequest.consent_version,
        ip_address: consentRequest.ip_address,
        user_agent: consentRequest.user_agent,
      })

      return !error
    }
  } catch (error) {
    console.error('Error recording consent:', error)
    return false
  }
}

/**
 * Get user's current consent status
 */
export async function getUserConsent(
  userId: string,
  consentType?: ConsentType
): Promise<ConsentRecord[]> {
  let query = supabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (consentType) {
    query = query.eq('consent_type', consentType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching consent:', error)
    return []
  }

  return data || []
}

/**
 * Check if user has given consent for a specific type
 */
export async function hasValidConsent(
  userId: string,
  consentType: ConsentType,
  requiredVersion?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('user_consents')
      .select('consent_given, consent_version')
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .eq('consent_given', true)

    if (requiredVersion) {
      query = query.eq('consent_version', requiredVersion)
    }

    query = query.order('created_at', { ascending: false }).limit(1)

    const { data, error } = await query.single()

    if (error || !data) {
      return false
    }

    return data.consent_given === true
  } catch (error) {
    console.error('Error checking consent:', error)
    return false
  }
}

/**
 * Withdraw consent for a specific type
 */
export async function withdrawConsent(
  userId: string,
  consentType: ConsentType,
  version: string,
  metadata?: { ip_address?: string; user_agent?: string }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_consents').insert({
      user_id: userId,
      consent_type: consentType,
      consent_given: false,
      consent_version: version,
      ip_address: metadata?.ip_address,
      user_agent: metadata?.user_agent,
    })

    return !error
  } catch (error) {
    console.error('Error withdrawing consent:', error)
    return false
  }
}

/**
 * Get all consent types that require user agreement
 */
export function getRequiredConsentTypes(): {
  type: ConsentType
  name: string
  description: string
  required: boolean
  currentVersion: string
}[] {
  return [
    {
      type: 'privacy_policy',
      name: 'Privacy Policy',
      description:
        'Agreement to our privacy policy and data handling practices',
      required: true,
      currentVersion: '2024-01-01',
    },
    {
      type: 'terms_of_service',
      name: 'Terms of Service',
      description: 'Agreement to our terms of service and platform rules',
      required: true,
      currentVersion: '2024-01-01',
    },
    {
      type: 'data_processing',
      name: 'Data Processing',
      description:
        'Consent for processing personal data for matching and platform features',
      required: true,
      currentVersion: '2024-01-01',
    },
    {
      type: 'marketing_emails',
      name: 'Marketing Communications',
      description: 'Receive promotional emails and platform updates',
      required: false,
      currentVersion: '2024-01-01',
    },
    {
      type: 'location_sharing',
      name: 'Location Sharing',
      description: 'Share your location for local event and user matching',
      required: false,
      currentVersion: '2024-01-01',
    },
    {
      type: 'profile_visibility',
      name: 'Profile Visibility',
      description: 'Make your profile discoverable to other users',
      required: true,
      currentVersion: '2024-01-01',
    },
    {
      type: 'cookie_consent',
      name: 'Cookie Usage',
      description: 'Use of cookies for platform functionality and analytics',
      required: true,
      currentVersion: '2024-01-01',
    },
  ]
}

/**
 * Check if user needs to update any consents due to version changes
 */
export async function checkConsentUpdatesNeeded(userId: string): Promise<
  {
    type: ConsentType
    name: string
    currentVersion: string
    userVersion: string | null
    updateRequired: boolean
  }[]
> {
  const requiredConsents = getRequiredConsentTypes()
  const userConsents = await getUserConsent(userId)

  return requiredConsents.map(required => {
    const userConsent = userConsents.find(
      uc => uc.consent_type === required.type && uc.consent_given
    )

    const updateRequired =
      !userConsent || userConsent.consent_version !== required.currentVersion

    return {
      type: required.type,
      name: required.name,
      currentVersion: required.currentVersion,
      userVersion: userConsent?.consent_version || null,
      updateRequired,
    }
  })
}

/**
 * Bulk record multiple consents (useful for registration)
 */
export async function recordMultipleConsents(
  userId: string,
  consents: ConsentRequest[]
): Promise<boolean> {
  try {
    const consentRecords = consents.map(consent => ({
      user_id: userId,
      consent_type: consent.consent_type,
      consent_given: consent.consent_given,
      consent_version: consent.consent_version,
      ip_address: consent.ip_address,
      user_agent: consent.user_agent,
    }))

    const { error } = await supabase
      .from('user_consents')
      .insert(consentRecords)

    return !error
  } catch (error) {
    console.error('Error recording multiple consents:', error)
    return false
  }
}

/**
 * Get consent history for a user (for audit purposes)
 */
export async function getConsentHistory(
  userId: string,
  consentType?: ConsentType
): Promise<ConsentRecord[]> {
  let query = supabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (consentType) {
    query = query.eq('consent_type', consentType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching consent history:', error)
    return []
  }

  return data || []
}
