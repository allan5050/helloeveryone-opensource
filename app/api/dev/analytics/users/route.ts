import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // SECURITY: Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createClient()

    // Fetch all demo users plus Allan as just another node
    const { data: users, error } = await supabase
      .from('profiles')
      .select(
        'user_id, display_name, full_name, bio, age, location, interests, photo_url'
      )
      .or('display_name.like.Demo:%,display_name.eq.Allan')
      .order('display_name')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
