import { createClient } from '@/lib/supabase/server'

interface SearchFilters {
  age_min?: number
  age_max?: number
  location?: string
  interests?: string[]
}

interface SearchResult {
  success: boolean
  error?: string
  data?: any[]
}

export async function searchProfiles(
  filters: SearchFilters
): Promise<SearchResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get user's privacy settings
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('privacy_settings')
      .eq('user_id', user.id)
      .single()

    const userPrivacy = (userProfile?.privacy_settings || {}) as Record<
      string,
      boolean
    >

    // Check mutual visibility rules
    if (filters.age_min !== undefined || filters.age_max !== undefined) {
      if (!userPrivacy.show_age) {
        return {
          success: false,
          error: 'Cannot filter by age - you have not shared your age',
        }
      }
    }

    if (filters.interests && filters.interests.length > 0) {
      if (!userPrivacy.show_interests) {
        return {
          success: false,
          error:
            'Cannot filter by interests - you have not shared your interests',
        }
      }
    }

    // Perform search with mutual visibility
    const { data, error } = await (supabase.rpc as any)(
      'search_profiles_with_mutual_visibility',
      {
        ...filters,
        searching_user_id: user.id,
      }
    )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data as any[]) || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}
