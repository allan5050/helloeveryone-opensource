import { createClient } from '@/lib/supabase/server'

interface ProfileResult {
  success: boolean
  error?: string
  data?: any
}

export async function getProfileWithPrivacy(
  userId: string
): Promise<ProfileResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check connection level to determine what information to show
    const { data: profile, error } = await supabase.rpc(
      'get_profile_with_privacy',
      {
        profile_user_id: userId,
        requesting_user_id: user.id,
      }
    )

    if (error) {
      if (error.code === 'BLOCKED_USER') {
        return { success: false, error: 'Access denied' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data: profile }
  } catch (error) {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getPublicProfile(userId: string): Promise<ProfileResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_public_profile', {
      user_id: userId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'An error occurred' }
  }
}
