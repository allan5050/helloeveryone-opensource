import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const TEST_EVENT_CAPACITY = 5
const NUM_CONCURRENT_USERS = 10

describe('Concurrent RSVP Testing', () => {
  let supabase: any
  let testEventId: string
  let testUserIds: string[] = []

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Create test event with limited capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Test Event - Concurrent RSVP',
        description: 'Testing concurrent RSVP with capacity limits',
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 90000000).toISOString(),
        location: 'Test Location',
        capacity: TEST_EVENT_CAPACITY,
        attendee_count: 0,
      })
      .select()
      .single()

    if (eventError) throw eventError
    testEventId = event.id

    // Create test users
    for (let i = 0; i < NUM_CONCURRENT_USERS; i++) {
      const { data: auth } = await supabase.auth.signUp({
        email: `test-concurrent-${i}@example.com`,
        password: 'TestPassword123!',
      })
      if (auth?.user) {
        testUserIds.push(auth.user.id)
      }
    }
  })

  afterAll(async () => {
    // Cleanup test data
    if (testEventId) {
      await supabase.from('rsvps').delete().eq('event_id', testEventId)
      await supabase.from('events').delete().eq('id', testEventId)
    }

    // Cleanup test users
    for (const userId of testUserIds) {
      await supabase.auth.admin.deleteUser(userId)
    }
  })

  test('Concurrent RSVPs should respect capacity limits', async () => {
    // Create promises for concurrent RSVP attempts
    const rsvpPromises = testUserIds.map(userId =>
      supabase.rpc('handle_rsvp', {
        p_event_id: testEventId,
        p_user_id: userId,
        p_action: 'create',
      })
    )

    // Execute all RSVPs concurrently
    const results = await Promise.allSettled(rsvpPromises)

    // Count successful RSVPs
    let successCount = 0
    let failureCount = 0

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data?.success) {
        successCount++
      } else {
        failureCount++
      }
    })

    // Verify that exactly TEST_EVENT_CAPACITY RSVPs succeeded
    expect(successCount).toBe(TEST_EVENT_CAPACITY)
    expect(failureCount).toBe(NUM_CONCURRENT_USERS - TEST_EVENT_CAPACITY)

    // Verify the database state
    const { data: finalEvent } = await supabase
      .from('events')
      .select('attendee_count')
      .eq('id', testEventId)
      .single()

    expect(finalEvent.attendee_count).toBe(TEST_EVENT_CAPACITY)

    // Verify actual RSVP records
    const { data: rsvps, count } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact' })
      .eq('event_id', testEventId)
      .eq('status', 'confirmed')

    expect(count).toBe(TEST_EVENT_CAPACITY)
  })

  test('Cancelling RSVP should free up a spot', async () => {
    // Cancel one RSVP
    const userToCancel = testUserIds[0]
    const { data: cancelResult } = await supabase.rpc('handle_rsvp', {
      p_event_id: testEventId,
      p_user_id: userToCancel,
      p_action: 'cancel',
    })

    expect(cancelResult.success).toBe(true)
    expect(cancelResult.attendee_count).toBe(TEST_EVENT_CAPACITY - 1)

    // Try to RSVP with a user who couldn't before
    const newUserId = testUserIds[TEST_EVENT_CAPACITY + 1]
    const { data: newRsvpResult } = await supabase.rpc('handle_rsvp', {
      p_event_id: testEventId,
      p_user_id: newUserId,
      p_action: 'create',
    })

    expect(newRsvpResult.success).toBe(true)
    expect(newRsvpResult.attendee_count).toBe(TEST_EVENT_CAPACITY)
  })

  test('Double RSVP should be prevented', async () => {
    const userId = testUserIds[1]

    // First RSVP should already exist from previous test
    const { data: result } = await supabase.rpc('handle_rsvp', {
      p_event_id: testEventId,
      p_user_id: userId,
      p_action: 'create',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Already RSVPd')
  })

  test('API endpoint should handle concurrent requests', async () => {
    // Create a new test event
    const { data: newEvent } = await supabase
      .from('events')
      .insert({
        title: 'API Concurrent Test',
        capacity: 3,
        attendee_count: 0,
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 90000000).toISOString(),
      })
      .select()
      .single()

    // Simulate concurrent API calls
    const apiPromises = testUserIds.slice(0, 5).map(async userId => {
      const response = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userId}`, // Mock auth
        },
        body: JSON.stringify({
          eventId: newEvent.id,
          action: 'create',
        }),
      })
      return response.json()
    })

    const apiResults = await Promise.allSettled(apiPromises)
    const successfulApis = apiResults.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length

    // Should not exceed capacity
    expect(successfulApis).toBeLessThanOrEqual(3)

    // Cleanup
    await supabase.from('events').delete().eq('id', newEvent.id)
  })
})
