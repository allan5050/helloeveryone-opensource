import { createClient } from '@/lib/supabase/server'

interface ChatResult {
  success: boolean
  error?: string
  data?: any
  count?: number
}

export async function sendMessage(
  recipientId: string,
  content: string
): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user is blocked
    const { data: blockCheck } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('blocked_user_id', recipientId)
      .single()

    if (blockCheck) {
      return { success: false, error: 'Cannot send message to blocked user' }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content,
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'Database error' }
  }
}

export async function getChatMessages(
  userId: string,
  offset = 0,
  limit = 50
): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function blockUser(blockedUserId: string): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('blocked_users')
      .insert({
        user_id: user.id,
        blocked_user_id: blockedUserId,
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function unblockUser(blockedUserId: string): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', user.id)
      .eq('blocked_user_id', blockedUserId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getUnreadMessageCount(
  userId: string
): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('sender_id', userId)
      .eq('is_read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function markMessagesAsRead(userId: string): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('sender_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getTotalUnreadCount(): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase.rpc('get_total_unread_messages', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: data?.total_unread || 0 }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getChatList(): Promise<ChatResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase.rpc('get_chat_list', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Sort by last message time
    const sortedData = (data || []).sort(
      (a: any, b: any) =>
        new Date(b.last_message_time).getTime() -
        new Date(a.last_message_time).getTime()
    )

    return { success: true, data: sortedData }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}
