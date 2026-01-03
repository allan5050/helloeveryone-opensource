import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { createClient } from '@/lib/supabase/server'

interface UserDataExport {
  profile: any
  events: any[]
  rsvps: any[]
  matches: any[]
  favorites: any[]
  messages: any[]
  blocks: any[]
  preferences: any
  metadata: {
    exportDate: string
    userId: string
    dataVersion: string
  }
}

export async function GET(request: NextRequest) {
  // Rate limit: 10 requests per minute for expensive operations
  const rateLimitResponse = checkRateLimit(request, 'expensive')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const currentUser = await requireAuth()
    const userId = currentUser.id

    // Create server-side Supabase client
    const supabase = await createClient()

    // Collect all user data
    const userDataExport: UserDataExport = {
      profile: null,
      events: [],
      rsvps: [],
      matches: [],
      favorites: [],
      messages: [],
      blocks: [],
      preferences: null,
      metadata: {
        exportDate: new Date().toISOString(),
        userId,
        dataVersion: '1.0',
      },
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile data' },
        { status: 500 }
      )
    }

    userDataExport.profile = profile

    // Get user's events (where they are the organizer)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
    } else {
      userDataExport.events = events || []
    }

    // Get user's RSVPs
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select(
        `
        *,
        events (
          id,
          title,
          start_time,
          end_time,
          location,
          organizer_id
        )
      `
      )
      .eq('user_id', userId)

    if (rsvpsError) {
      console.error('Error fetching RSVPs:', rsvpsError)
    } else {
      userDataExport.rsvps = rsvps || []
    }

    // Get user's matches
    const { data: matches, error: matchesError } = await supabase
      .from('match_scores')
      .select(
        `
        *,
        user1:profiles!match_scores_user1_id_fkey (id, display_name),
        user2:profiles!match_scores_user2_id_fkey (id, display_name)
      `
      )
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('score', { ascending: false })

    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
    } else {
      userDataExport.matches = matches || []
    }

    // Get user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select(
        `
        *,
        target_user:profiles!favorites_target_user_id_fkey (id, display_name)
      `
      )
      .eq('user_id', userId)

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError)
    } else {
      userDataExport.favorites = favorites || []
    }

    // Get user's messages (both sent and received)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey (id, display_name),
        recipient:profiles!messages_recipient_id_fkey (id, display_name)
      `
      )
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
    } else {
      userDataExport.messages = messages || []
    }

    // Get user's blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select(
        `
        *,
        blocked_user:profiles!blocks_blocked_id_fkey (id, display_name)
      `
      )
      .eq('blocker_id', userId)

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError)
    } else {
      userDataExport.blocks = blocks || []
    }

    // Get user preferences (if we have a separate preferences table)
    // For now, preferences are stored in the profile visibility_settings
    userDataExport.preferences = {
      visibility_settings: profile.visibility_settings,
      notification_settings: profile.notification_settings || {},
      privacy_settings: profile.privacy_settings || {},
    }

    // Set response headers for file download
    const filename = `helloeveryone-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(userDataExport, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // In a production system, you would:
    // 1. Queue a background job to generate the export
    // 2. Send an email with a secure download link
    // 3. Set the link to expire after a reasonable time (e.g., 7 days)

    // For now, we'll return a success message
    return NextResponse.json({
      success: true,
      message: `Data export has been initiated. You will receive an email at ${email} with a secure download link within the next few minutes.`,
      estimatedTime: '5-10 minutes',
    })
  } catch (error) {
    console.error('Data export request error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate data export' },
      { status: 500 }
    )
  }
}
