import { createClient } from '@/lib/supabase/server'

interface PrivacyResult {
  success: boolean
  error?: string
  data?: any
}

export async function updatePrivacySettings(
  settings: Record<string, any>
): Promise<PrivacyResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ privacy_settings: settings })
      .eq('user_id', user.id)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function exportUserData(): Promise<PrivacyResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await (supabase.rpc as any)('export_user_data', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function deleteUserAccount(): Promise<PrivacyResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await (supabase.rpc as any)('delete_user_account', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function requestDataPortability(): Promise<PrivacyResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await (supabase.rpc as any)('request_data_portability', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function anonymizeUserData(
  userId: string
): Promise<PrivacyResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase.rpc as any)('anonymize_user_data', {
      user_id: userId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export function validatePrivacySettings(
  settings: Record<string, any>
): boolean {
  const values = Object.values(settings)
  // Cannot hide all fields
  return values.some(value => value === true)
}

export function getDefaultPrivacySettings() {
  return {
    show_age: true,
    show_location: true,
    show_interests: true,
    show_favorites: false, // Conservative default
  }
}
