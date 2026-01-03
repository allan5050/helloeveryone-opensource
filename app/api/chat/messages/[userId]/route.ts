import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const paramsSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Authenticate user
    const user = await requireAuth(request)
    const resolvedParams = await params

    // Validate params
    const validationResult = paramsSchema.safeParse(resolvedParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { userId: otherUserId } = validationResult.data

    // Validate other user ID
    if (!otherUserId || otherUserId === user.id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createClient()

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch messages between current user and other user
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
        sender:profiles!messages_sender_id_fkey(user_id, display_name)
      `
      )
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Mark messages from other user as read
    if (messages && messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => msg.sender_id === otherUserId && !msg.is_read)
        .map(msg => msg.id)

      if (unreadMessageIds.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds)

        if (updateError) {
          console.error('Error marking messages as read:', updateError)
        }
      }
    }

    // Get other user's profile info
    const { data: otherUserProfile } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('user_id', otherUserId)
      .single()

    return NextResponse.json({
      messages: messages || [],
      other_user: otherUserProfile,
      has_more: messages?.length === limit,
    })
  } catch (error) {
    console.error('Error in messages API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
