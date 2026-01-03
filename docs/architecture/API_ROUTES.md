# API Routes Documentation

## Overview

All API routes run server-side in Next.js and are hidden from users. Sensitive logic like matching
algorithms live here.

## Route Structure

**Current API Routes (19 total):**

```
app/api/
├── calendar/
│   └── event/[eventId]/        # ICS file generation
├── chat/
│   ├── conversations/          # Get user's conversations
│   ├── messages/[userId]/      # Get messages with specific user
│   └── send/                   # Send a message
├── events/
│   ├── rsvp/                   # RSVP to events
│   ├── social-proof/           # Get event social proof data
│   ├── suggested/              # Get suggested events based on matches
│   └── [eventId]/
│       ├── attendees/          # Get event attendees
│       └── rsvp/               # Event-specific RSVP
├── health/                     # Health check endpoint
├── match/
│   ├── batch/                  # Batch match calculations
│   ├── calculate/              # Main matching engine
│   ├── event/[eventId]/        # Event-specific matches
│   ├── generate-embeddings/    # OpenAI embedding generation
│   └── refresh/                # Refresh cached matches
├── privacy/
│   ├── block/                  # Block users
│   ├── delete/                 # Delete account
│   └── export/                 # GDPR data export
└── profile/
    └── favorite/               # Toggle user favorites
```

**Page Routes:**
```
app/
├── (public)/
│   ├── page.tsx               # Landing page
│   ├── login/page.tsx         # Login page
│   ├── signup/page.tsx        # Signup page
│   └── auth/
│       └── reset-password/page.tsx  # Password reset
├── (protected)/               # Auth-required routes
│   ├── admin/                 # Admin panel (role-based)
│   ├── chat/                  # Messaging interface
│   ├── dashboard/             # Main user dashboard
│   ├── events/                # Event browsing and details
│   ├── favorites/             # User's favorited profiles
│   └── matches/               # Match results and profiles
└── auth/callback/route.ts     # OAuth callback handler
```

## Authentication Pattern

All routes should verify authentication using the server-side auth helpers:

```typescript
// lib/api/auth.ts - Server-side auth helpers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

// For page components - redirects to login if not authenticated
export async function requireAuth(): Promise<User> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    redirect('/login')
  }

  return session.user
}

// For API routes - throws error if not authenticated
export async function requireAuthAPI(): Promise<User> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    throw new Error('Unauthorized')
  }

  return session.user
}

// For optional auth - returns user or null
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.user ?? null
}
```

### Client-side Authentication

For client components, use the AuthContext:

```typescript
// app/contexts/AuthContext.tsx - Client-side auth state
import { useAuth } from '@/app/contexts/AuthContext'

export default function MyComponent() {
  const { user, signIn, signOut, signUp, resetPassword } = useAuth()

  if (!user) {
    return <div>Please login</div>
  }

  return <div>Welcome {user.email}</div>
}
```

## 1. Matching Endpoints

### POST /api/match/calculate

Calculate matches for a user (expensive operation, cached)

```typescript
// app/api/match/calculate/route.ts
export async function POST(request: Request) {
  const user = await requireAuthAPI() // Uses API auth helper

  // Parse request
  const { limit = 10, forceRefresh = false } = await request.json()

  // Check cache unless forced refresh
  if (!forceRefresh) {
    const cached = await getCachedMatches(user.id)
    if (cached) return Response.json(cached)
  }

  // Heavy computation (runs server-side only)
  const matches = await computeMatches(user.id, limit)

  // Cache results
  await cacheMatches(user.id, matches)

  return Response.json({
    matches,
    generated_at: new Date().toISOString(),
  })
}
```

### GET /api/match/event/[eventId]

Get matches for specific event attendees

```typescript
// app/api/match/event/[eventId]/route.ts
export async function GET(request: Request, { params }: { params: { eventId: string } }) {
  const user = await requireAuthAPI()

  // Call PostgreSQL function
  const { data: matches } = await supabase.rpc('get_event_matches', {
    p_user_id: user.id,
    p_event_id: params.eventId,
    p_limit: 5,
  })

  // Enhance with additional data
  const enhanced = await enhanceMatchData(matches)

  return Response.json({
    event_id: params.eventId,
    matches: enhanced,
    your_match_potential: calculatePotential(matches),
  })
}
```

### POST /api/match/generate-embeddings

Generate embeddings for user bio (OpenAI integration)

```typescript
// app/api/match/generate-embeddings/route.ts
export async function POST(request: Request) {
  const user = await requireAuthAPI()
  const { bio } = await request.json()

  // Validate bio
  if (!bio || bio.length < 20) {
    return Response.json({ error: 'Bio too short' }, { status: 400 })
  }

  // Generate embedding using OpenAI
  const embedding = await generateEmbedding(bio)

  // Store in database
  await supabase
    .from('profiles')
    .update({
      bio_embedding: embedding,
      bio: bio,
    })
    .eq('id', user.id)

  return Response.json({ success: true })
}

// lib/openai/embeddings.ts (SERVER ONLY)
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  const data = await response.json()
  return data.data[0].embedding
}
```

## 2. Event Endpoints

### GET /api/events/suggested

Get events with high match potential

```typescript
// app/api/events/suggested/route.ts
export async function GET(request: Request) {
  const user = await requireAuthAPI()

  // Complex query combining events and match scores
  const query = `
    WITH user_matches AS (
      SELECT 
        CASE 
          WHEN user1_id = $1 THEN user2_id 
          ELSE user1_id 
        END as matched_user_id,
        total_score
      FROM match_scores
      WHERE $1 IN (user1_id, user2_id)
        AND total_score > 60
    ),
    event_potential AS (
      SELECT 
        e.id,
        e.title,
        e.event_date,
        COUNT(um.matched_user_id) as high_match_count,
        AVG(um.total_score) as avg_match_score
      FROM events e
      JOIN rsvps r ON r.event_id = e.id
      JOIN user_matches um ON um.matched_user_id = r.user_id
      WHERE e.event_date > NOW()
        AND r.status = 'going'
      GROUP BY e.id
    )
    SELECT * FROM event_potential
    ORDER BY high_match_count DESC, avg_match_score DESC
    LIMIT 5
  `

  const { data: events } = await supabase.rpc('run_query', {
    query,
    params: [user.id],
  })

  return Response.json({
    suggested_events: events,
    reasoning: "These events have people you'll click with",
  })
}
```

### POST /api/events/rsvp

RSVP to an event with capacity check

```typescript
// app/api/events/rsvp/route.ts
export async function POST(request: Request) {
  const user = await requireAuthAPI()
  const { eventId, status } = await request.json()

  // Use database transaction for atomicity
  const { data, error } = await supabase.rpc('handle_rsvp', {
    p_user_id: user.id,
    p_event_id: eventId,
    p_status: status,
  })

  if (error) {
    if (error.message.includes('capacity')) {
      return Response.json({ error: 'Event is full' }, { status: 409 })
    }
    throw error
  }

  // Trigger match calculation in background
  await queueMatchCalculation(user.id, eventId)

  return Response.json({
    success: true,
    attendee_count: data.attendee_count,
  })
}
```

## 3. Calendar Endpoints

### GET /api/calendar/event/[eventId]

Generate ICS file for event

```typescript
// app/api/calendar/event/[eventId]/route.ts
import ics from 'ics'

export async function GET(request: Request, { params }: { params: { eventId: string } }) {
  const user = await requireAuthAPI()

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.eventId)
    .single()

  // Get user's matches for this event
  const { data: matches } = await supabase.rpc('get_event_matches', {
    p_user_id: user.id,
    p_event_id: params.eventId,
    p_limit: 3,
  })

  // Create ICS event
  const { value: icsContent } = ics.createEvent({
    title: `HelloEveryone: ${event.title}`,
    description: formatDescription(event, matches),
    location: event.venue_address,
    start: dateToArray(event.event_date),
    duration: { hours: event.duration_hours || 2 },
    alarms: [
      { action: 'display', trigger: { hours: 24, before: true } },
      { action: 'display', trigger: { hours: 1, before: true } },
    ],
  })

  // Return as downloadable file
  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar',
      'Content-Disposition': `attachment; filename="${event.title}.ics"`,
    },
  })
}

function formatDescription(event: Event, matches: Match[]): string {
  let desc = event.description + '\n\n'

  if (matches.length > 0) {
    desc += '🎯 People to meet:\n'
    matches.forEach(m => {
      desc += `• ${m.first_name} (${m.match_score}% match)\n`
    })
  }

  desc += `\n📍 ${event.venue_name}\n`
  desc += `🔗 ${event.venue_url || ''}`

  return desc
}
```

## 4. Profile Endpoints

### PUT /api/profile/update

Update profile with privacy controls

```typescript
// app/api/profile/update/route.ts
export async function PUT(request: Request) {
  const user = await requireAuthAPI()
  const updates = await request.json()

  // Validate updates
  const validated = validateProfileUpdate(updates)

  // If bio changed, regenerate embedding
  if (validated.bio) {
    validated.bio_embedding = await generateEmbedding(validated.bio)
  }

  // Update profile
  const { data, error } = await supabase
    .from('profiles')
    .update(validated)
    .eq('id', user.id)
    .select()
    .single()

  // Trigger match recalculation in background
  if (validated.bio_embedding || validated.interests) {
    await queueMatchRecalculation(user.id)
  }

  return Response.json({ profile: data })
}
```

### POST /api/profile/upload-photo

Handle photo uploads to Supabase Storage

```typescript
// app/api/profile/upload-photo/route.ts
export async function POST(request: Request) {
  const user = await requireAuthAPI()
  const formData = await request.formData()
  const file = formData.get('photo') as File

  // Validate file
  if (!file || file.size > 5_000_000) {
    return Response.json({ error: 'Invalid file or too large' }, { status: 400 })
  }

  // Upload to Supabase Storage
  const fileName = `${user.id}-${Date.now()}.jpg`
  const { data, error } = await supabase.storage.from('profile-photos').upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
  })

  if (error) throw error

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-photos').getPublicUrl(fileName)

  // Update profile
  await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', user.id)

  return Response.json({ photo_url: publicUrl })
}
```

## 5. Chat Endpoints

### GET /api/chat/conversations

Get user's conversations

```typescript
// app/api/chat/conversations/route.ts
export async function GET(request: Request) {
  const user = await requireAuthAPI()

  // Complex query to get conversations with last message
  const { data: conversations } = await supabase
    .from('messages')
    .select(
      `
      *,
      sender:profiles!sender_id(first_name, photo_url),
      recipient:profiles!recipient_id(first_name, photo_url)
    `
    )
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('sent_at', { ascending: false })

  // Group by conversation
  const grouped = groupByConversation(conversations, user.id)

  return Response.json({ conversations: grouped })
}
```

### POST /api/chat/send

Send a message with blocking check

```typescript
// app/api/chat/send/route.ts
export async function POST(request: Request) {
  const user = await requireAuthAPI()
  const { recipientId, content } = await request.json()

  // Check for blocks
  const { data: blocked } = await supabase
    .from('blocks')
    .select('*')
    .or(
      `
      blocker_id.eq.${user.id},blocked_id.eq.${recipientId},
      blocker_id.eq.${recipientId},blocked_id.eq.${user.id}
    `
    )
    .single()

  if (blocked) {
    return Response.json({ error: 'Cannot send message' }, { status: 403 })
  }

  // Insert message
  const { data: message } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.slice(0, 1000), // Enforce limit
    })
    .select()
    .single()

  // Trigger notification (if recipient has enabled)
  await sendNotification(recipientId, {
    type: 'new_message',
    from: user.id,
  })

  return Response.json({ message })
}
```

## 6. Privacy Endpoints

### POST /api/privacy/block

Block a user

```typescript
// app/api/privacy/block/route.ts
export async function POST(request: Request) {
  const user = await requireAuthAPI()
  const { blockedUserId, reason } = await request.json()

  // Insert block record
  await supabase.from('blocks').insert({
    blocker_id: user.id,
    blocked_id: blockedUserId,
    reason: reason || 'other',
  })

  // Remove from matches cache
  await supabase.from('match_scores').delete().or(`
      user1_id.eq.${user.id},user2_id.eq.${blockedUserId},
      user1_id.eq.${blockedUserId},user2_id.eq.${user.id}
    `)

  return Response.json({ success: true })
}
```

### GET /api/privacy/export

GDPR data export

```typescript
// app/api/privacy/export/route.ts
export async function GET(request: Request) {
  const user = await requireAuthAPI()

  // Collect all user data
  const userData = await collectUserData(user.id)

  // Format as JSON
  const exportData = {
    profile: userData.profile,
    events_attended: userData.events,
    messages_sent: userData.messages,
    matches: userData.matches,
    exported_at: new Date().toISOString(),
  }

  return Response.json(exportData, {
    headers: {
      'Content-Disposition': 'attachment; filename="my-data.json"',
    },
  })
}
```

## Error Handling Pattern

```typescript
// lib/api/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
  }
}

// Usage in routes
export async function POST(request: Request) {
  try {
    // ... route logic
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.statusCode })
    }

    // Log to Sentry
    console.error('Unexpected error:', error)

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})

export async function middleware(request: Request) {
  if (request.url.includes('/api/match/calculate')) {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return Response.json({ error: 'Too many requests' }, { status: 429 })
    }
  }
}

export const config = {
  matcher: '/api/:path*',
}
```
