import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const { blockedUserId } = await request.json()

    if (!blockedUserId) {
      return NextResponse.json(
        { error: 'Blocked user ID is required' },
        { status: 400 }
      )
    }

    if (currentUser.id === blockedUserId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create unidirectional block (only the blocker's intent is recorded)
    // Note: Bidirectional was removed as it creates blocks the other user didn't consent to
    const { error } = await supabase.from('blocks').insert({
      blocker_id: currentUser.id,
      blocked_id: blockedUserId,
    })

    if (error) {
      console.error('Error creating block:', error)
      return NextResponse.json(
        { error: 'Failed to block user' },
        { status: 500 }
      )
    }

    // Remove existing matches between users
    await supabase
      .from('match_scores')
      .delete()
      .or(
        `and(user_id_1.eq.${currentUser.id},user_id_2.eq.${blockedUserId}),and(user_id_1.eq.${blockedUserId},user_id_2.eq.${currentUser.id})`
      )

    // Remove from favorites
    await supabase
      .from('favorites')
      .delete()
      .or(
        `and(user_id.eq.${currentUser.id},favorited_user_id.eq.${blockedUserId}),and(user_id.eq.${blockedUserId},favorited_user_id.eq.${currentUser.id})`
      )

    // Hide existing messages (soft delete by setting is_deleted = true)
    // Note: Messages table doesn't have is_deleted column in current schema
    // Consider adding this column or implementing a different soft delete strategy

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Block API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const { searchParams } = new URL(request.url)
    const blockedUserId = searchParams.get('userId')

    if (!blockedUserId) {
      return NextResponse.json(
        { error: 'Blocked user ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Only remove blocks created by the current user (not blocks by others)
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', currentUser.id)
      .eq('blocked_id', blockedUserId)

    if (error) {
      console.error('Error removing block:', error)
      return NextResponse.json(
        { error: 'Failed to unblock user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unblock API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const supabase = await createClient()

    const { data: blockedUsers, error } = await supabase
      .from('blocks')
      .select(
        `
        blocked_id,
        profiles!blocks_blocked_id_fkey (
          user_id,
          display_name
        )
      `
      )
      .eq('blocker_id', currentUser.id)

    if (error) {
      console.error('Error fetching blocked users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blocked users' },
        { status: 500 }
      )
    }

    return NextResponse.json({ blockedUsers })
  } catch (error) {
    console.error('Get blocked users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
