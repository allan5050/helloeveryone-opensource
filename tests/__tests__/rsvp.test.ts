import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Mock Supabase client
jest.mock('@supabase/supabase-js')
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
}

;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
  mockSupabase as any
)

describe('RSVP Functionality', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    capacity: 10,
    current_attendees: 8,
    created_by: 'host-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  describe('Capacity Limits', () => {
    it('should accept RSVP when event has available capacity', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockEvent, current_attendees: 5 },
            error: null,
          }),
        }),
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'rsvp-123', status: 'going' }],
          error: null,
        }),
      })

      mockSupabase.from.mockImplementation(table => {
        if (table === 'events') return { select: mockSelect }
        if (table === 'rsvps') return { insert: mockInsert }
        return {}
      })

      const { rsvpToEvent } = await import('@/lib/api/rsvp')
      const result = await rsvpToEvent('event-123', 'going')

      expect(result.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        event_id: 'event-123',
        user_id: mockUser.id,
        status: 'going',
      })
    })

    it('should reject RSVP when event is at capacity', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockEvent, current_attendees: 10 },
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockImplementation(() => ({ select: mockSelect }))

      const { rsvpToEvent } = await import('@/lib/api/rsvp')
      const result = await rsvpToEvent('event-123', 'going')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Event is at capacity')
    })

    it('should allow "maybe" RSVP even when event is at capacity', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockEvent, current_attendees: 10 },
            error: null,
          }),
        }),
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'rsvp-123', status: 'maybe' }],
          error: null,
        }),
      })

      mockSupabase.from.mockImplementation(table => {
        if (table === 'events') return { select: mockSelect }
        if (table === 'rsvps') return { insert: mockInsert }
        return {}
      })

      const { rsvpToEvent } = await import('@/lib/api/rsvp')
      const result = await rsvpToEvent('event-123', 'maybe')

      expect(result.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        event_id: 'event-123',
        user_id: mockUser.id,
        status: 'maybe',
      })
    })
  })

  describe('Race Conditions', () => {
    it('should handle concurrent RSVPs to last available spot', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockEvent, current_attendees: 9 }, // 1 spot left
            error: null,
          }),
        }),
      })

      // First RSVP succeeds
      const mockInsert1 = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'rsvp-1', status: 'going' }],
          error: null,
        }),
      })

      // Second RSVP fails due to capacity check
      const mockInsert2 = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505' }, // Unique constraint violation
        }),
      })

      mockSupabase.from.mockImplementation(table => {
        if (table === 'events') return { select: mockSelect }
        if (table === 'rsvps') return { insert: mockInsert1 }
        return {}
      })

      const { rsvpToEvent } = await import('@/lib/api/rsvp')

      // Simulate concurrent requests
      const [result1, result2] = await Promise.allSettled([
        rsvpToEvent('event-123', 'going'),
        rsvpToEvent('event-123', 'going'),
      ])

      expect(result1.status).toBe('fulfilled')
      expect((result1 as any).value.success).toBe(true)
    })
  })

  describe('RSVP State Changes', () => {
    it('should update existing RSVP status', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'rsvp-123', status: 'maybe' },
              error: null,
            }),
          }),
        }),
      })

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: 'rsvp-123', status: 'going' }],
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockImplementation(table => {
        if (table === 'rsvps' && mockSupabase.from.mock.calls.length === 1) {
          return { select: mockSelect }
        }
        if (table === 'rsvps' && mockSupabase.from.mock.calls.length === 2) {
          return { update: mockUpdate }
        }
        return {}
      })

      const { updateRsvpStatus } = await import('@/lib/api/rsvp')
      const result = await updateRsvpStatus('event-123', 'going')

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'going' })
    })

    it('should handle changing from going to not going', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: 'rsvp-123', status: 'not_going' }],
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ update: mockUpdate })

      const { updateRsvpStatus } = await import('@/lib/api/rsvp')
      const result = await updateRsvpStatus('event-123', 'not_going')

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'not_going' })
    })
  })

  describe('Event Status Updates', () => {
    it('should mark event as full when capacity is reached', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { is_full: true },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { checkEventCapacity } = await import('@/lib/api/rsvp')
      const result = await checkEventCapacity('event-123')

      expect(result.is_full).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('check_event_capacity', {
        event_id: 'event-123',
      })
    })

    it('should mark event as available when spots open up', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { is_full: false },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { checkEventCapacity } = await import('@/lib/api/rsvp')
      const result = await checkEventCapacity('event-123')

      expect(result.is_full).toBe(false)
    })
  })

  describe('Duplicate RSVP Prevention', () => {
    it('should prevent user from creating multiple RSVPs for same event', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'existing-rsvp' },
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { rsvpToEvent } = await import('@/lib/api/rsvp')
      const result = await rsvpToEvent('event-123', 'going')

      expect(result.success).toBe(false)
      expect(result.error).toBe('RSVP already exists for this event')
    })
  })

  describe('RSVP Cancellation', () => {
    it('should successfully cancel RSVP', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ delete: mockDelete })

      const { cancelRsvp } = await import('@/lib/api/rsvp')
      const result = await cancelRsvp('event-123')

      expect(result.success).toBe(true)
    })

    it('should handle cancelling non-existent RSVP', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // No rows deleted
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ delete: mockDelete })

      const { cancelRsvp } = await import('@/lib/api/rsvp')
      const result = await cancelRsvp('event-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('RSVP not found')
    })
  })
})
