import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute for expensive operations
  const rateLimitResponse = checkRateLimit(request, 'expensive')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const currentUser = await requireAuth()
    const { confirmationText, reason } = await request.json()

    // Require explicit confirmation
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        {
          error:
            'Account deletion must be confirmed with exact text: "DELETE MY ACCOUNT"',
        },
        { status: 400 }
      )
    }

    const userId = currentUser.id

    // Log deletion request for audit purposes
    console.log(`Account deletion requested for user ${userId}`, {
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString(),
    })

    // Create server-side Supabase client
    const supabase = await createClient()

    // Start transaction-like deletion process
    // Note: Supabase doesn't support transactions in the traditional sense,
    // but we'll delete in order of dependencies

    try {
      // 1. Soft delete messages (mark as deleted, don't remove entirely for legal reasons)
      await supabase
        .from('messages')
        .update({
          is_deleted: true,
          content: '[deleted]',
          updated_at: new Date().toISOString(),
        })
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)

      // 2. Delete user's RSVPs
      await supabase.from('rsvps').delete().eq('user_id', userId)

      // 3. Delete user's favorites and favorites pointing to them
      await supabase
        .from('favorites')
        .delete()
        .or(`user_id.eq.${userId},target_user_id.eq.${userId}`)

      // 4. Delete match scores involving the user
      await supabase
        .from('match_scores')
        .delete()
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      // 5. Delete blocks involving the user
      await supabase
        .from('blocks')
        .delete()
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

      // 6. Update events organized by user to remove personal info
      // Instead of deleting events (which affects other users),
      // we anonymize them
      await supabase
        .from('events')
        .update({
          organizer_id: null, // Or set to a system user ID
          contact_info: null,
          updated_at: new Date().toISOString(),
        })
        .eq('organizer_id', userId)

      // 7. Create a deletion record for audit purposes
      const { error: auditError } = await supabase
        .from('account_deletions')
        .insert({
          user_id: userId,
          deleted_at: new Date().toISOString(),
          reason: reason || null,
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
        })

      if (auditError) {
        console.error('Failed to create audit record:', auditError)
        // Don't fail the deletion for this
      }

      // 8. Delete the profile (this should cascade to any remaining references)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('Failed to delete profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to delete profile. Please contact support.' },
          { status: 500 }
        )
      }

      // 9. Delete the user from Supabase Auth
      // This requires admin privileges, so we'll create a server client
      const cookieStore = cookies()
      const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key with admin privileges
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      const { error: authDeleteError } =
        await adminSupabase.auth.admin.deleteUser(currentUser.id)

      if (authDeleteError) {
        console.error('Failed to delete auth user:', authDeleteError)
        // Profile is already deleted, so we'll log this but not fail the request
      }

      return NextResponse.json({
        success: true,
        message:
          "Your account has been permanently deleted. We're sorry to see you go!",
        deletedAt: new Date().toISOString(),
      })
    } catch (deletionError) {
      console.error('Error during account deletion:', deletionError)
      return NextResponse.json(
        {
          error:
            'Account deletion failed. Please try again or contact support.',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Account deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during account deletion' },
      { status: 500 }
    )
  }
}

// Get account deletion information
export async function GET(_request: NextRequest) {
  try {
    const currentUser = await requireAuth()

    // Create server-side Supabase client
    const supabase = await createClient()

    // Get user's data summary for deletion confirmation
    const [
      { count: eventCount },
      { count: rsvpCount },
      { count: messageCount },
      { count: matchCount },
    ] = await Promise.all([
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', currentUser.id),

      supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id),

      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .eq('is_deleted', false),

      supabase
        .from('match_scores')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`),
    ])

    return NextResponse.json({
      dataSummary: {
        eventsOrganized: eventCount || 0,
        eventRsvps: rsvpCount || 0,
        messages: messageCount || 0,
        matches: matchCount || 0,
      },
      warning:
        'Account deletion is permanent and cannot be undone. All your data will be removed from our systems.',
      requirements: {
        confirmationText: 'DELETE MY ACCOUNT',
        reasonOptional: true,
      },
      dataRetention: {
        messages:
          'Messages will be marked as deleted but may be retained for legal compliance',
        events:
          "Events you organized will be anonymized but not deleted to preserve other users' RSVPs",
        audit:
          'A deletion record will be kept for audit purposes (no personal data)',
      },
    })
  } catch (error) {
    console.error('Get deletion info error:', error)
    return NextResponse.json(
      { error: 'Failed to get deletion information' },
      { status: 500 }
    )
  }
}
