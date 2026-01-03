import { createClient } from '@/lib/supabase/server'

interface MessagesResult {
  success: boolean
  error?: string
  data?: any
}

export async function getUserMessages(userId: string): Promise<MessagesResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if trying to access another user's messages
    if (user.id !== userId) {
      return { success: false, error: 'Row level security violation' }
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}
