import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/auth'
import { z } from 'zod'

// Validation schemas
const socialProofQuerySchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
})

// Type definitions
interface FavoriteAttendee {
  id: string
  name: string
  photo_url: string | null
}

interface SocialProofResponse {
  favoriteAttendees?: FavoriteAttendee[]
  count?: number
  error?: string
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<SocialProofResponse>> {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    // Validate query parameter
    const validationResult = socialProofQuerySchema.safeParse({ eventId })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, get the list of user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('favorited_user_id')
      .eq('user_id', user.id)

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError)
      throw favoritesError
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({
        favoriteAttendees: [],
        count: 0,
      })
    }

    const favoriteUserIds = favorites.map(f => f.favorited_user_id)

    // Then, get the RSVPs for this event from favorite users
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select(
        `
        user_id,
        profiles!rsvps_user_id_fkey (
          id,
          name,
          photo_url
        )
      `
      )
      .eq('event_id', validationResult.data.eventId)
      .eq('status', 'going')
      .in('user_id', favoriteUserIds)

    if (rsvpError) {
      console.error('Error fetching RSVPs:', rsvpError)
      throw rsvpError
    }

    const favoriteAttendees: FavoriteAttendee[] =
      rsvps?.map(rsvp => rsvp.profiles as FavoriteAttendee).filter(Boolean) ||
      []

    return NextResponse.json({
      favoriteAttendees,
      count: favoriteAttendees.length,
    })
  } catch (error) {
    console.error('Error fetching favorite attendees:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
