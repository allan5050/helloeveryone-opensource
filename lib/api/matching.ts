import { createClient } from '@/lib/supabase/server'

interface MatchingResult {
  success: boolean
  error?: string
  data?: any
  matches?: any[]
}

export async function getMatches(): Promise<MatchingResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await (supabase.rpc as any)('get_user_matches', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}
