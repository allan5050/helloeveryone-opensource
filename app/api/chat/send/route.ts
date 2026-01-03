import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { createClient } from '@/lib/supabase/server'

const sendMessageSchema = z.object({
  receiver_id: z.string().uuid('Invalid receiver ID'),
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(1000, 'Message too long'),
})

export async function POST(request: NextRequest) {
  // Rate limit: 100 requests per minute for chat
  const rateLimitResponse = checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Authenticate user
    const user = await requireAuth()

    // Parse and validate request body
    const body = await request.json()
    const { receiver_id, content } = sendMessageSchema.parse(body)

    // Check if user is trying to message themselves
    if (user.id === receiver_id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Check if receiver exists and if users have blocked each other
    const { data: receiverProfile, error: receiverError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', receiver_id)
      .single()

    if (receiverError || !receiverProfile) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Check if either user has blocked the other
    const { data: blockExists } = await supabase
      .from('blocks')
      .select('id')
      .or(
        `and(blocker_id.eq.${user.id},blocked_id.eq.${receiver_id}),and(blocker_id.eq.${receiver_id},blocked_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle()

    if (blockExists) {
      return NextResponse.json(
        { error: 'Cannot send message to this user' },
        { status: 403 }
      )
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        content: content.trim(),
      })
      .select('*, sender:profiles!sender_id(id, full_name, avatar_url)')
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error('Error in send message API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
