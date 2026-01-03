import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Authenticate user
    const user = await requireAuth()

    // Create Supabase client
    const supabase = await createClient()

    // Get all conversations with last message and other user info
    // We need to get messages where user is either sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select(
        `
        id,
        content,
        created_at,
        sender_id,
        recipient_id,
        is_read,
        sender:profiles!messages_sender_id_fkey(user_id, display_name),
        recipient:profiles!messages_recipient_id_fkey(user_id, display_name)
      `
      )
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Group messages by conversation (other user)
    const conversationMap = new Map()

    messages?.forEach(message => {
      // Determine the other user in the conversation
      const otherUserId =
        message.sender_id === user.id ? message.recipient_id : message.sender_id
      const otherUser =
        message.sender_id === user.id ? message.recipient : message.sender

      // Only keep the most recent message per conversation
      if (
        !conversationMap.has(otherUserId) ||
        conversationMap.get(otherUserId).last_message.created_at <
          message.created_at
      ) {
        conversationMap.set(otherUserId, {
          other_user_id: otherUserId,
          other_user: otherUser,
          last_message: {
            id: message.id,
            content: message.content,
            created_at: message.created_at,
            sender_id: message.sender_id,
            recipient_id: message.recipient_id,
            is_read: message.is_read,
            is_from_current_user: message.sender_id === user.id,
          },
          unread_count: 0, // We'll calculate this separately if needed
        })
      }
    })

    // Convert map to array and sort by last message timestamp
    const conversationsList = Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.last_message.created_at).getTime() -
        new Date(a.last_message.created_at).getTime()
    )

    // Count unread messages for each conversation
    for (const conversation of conversationsList) {
      if (!conversation.last_message.is_from_current_user) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', conversation.other_user_id)
          .eq('recipient_id', user.id)
          .eq('is_read', false)

        conversation.unread_count = count || 0
      }
    }

    return NextResponse.json({ conversations: conversationsList })
  } catch (error) {
    console.error('Error in conversations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
