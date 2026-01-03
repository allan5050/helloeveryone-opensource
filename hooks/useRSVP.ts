import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface UseRSVPOptions {
  onSuccess?: (action: 'create' | 'cancel', newCount: number) => void
  onError?: (error: string) => void
}

interface RSVPState {
  isLoading: boolean
  error: string | null
}

export function useRSVP(eventId: string, options: UseRSVPOptions = {}) {
  const [state, setState] = useState<RSVPState>({
    isLoading: false,
    error: null,
  })

  const { toast } = useToast()

  const createRSVP = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create RSVP')
      }

      options.onSuccess?.('create', result.attendee_count)

      toast({
        title: 'RSVP Confirmed',
        description: "You're now registered for this event!",
      })

      return result
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create RSVP'
      setState(prev => ({ ...prev, error: errorMessage }))
      options.onError?.(errorMessage)

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })

      throw error
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [eventId, options, toast])

  const cancelRSVP = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel RSVP')
      }

      options.onSuccess?.('cancel', result.attendee_count)

      toast({
        title: 'RSVP Cancelled',
        description: 'You are no longer attending this event.',
      })

      return result
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to cancel RSVP'
      setState(prev => ({ ...prev, error: errorMessage }))
      options.onError?.(errorMessage)

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })

      throw error
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [eventId, options, toast])

  const getRSVPStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'GET',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get RSVP status')
      }

      return result
    } catch (error) {
      console.error('Error fetching RSVP status:', error)
      return null
    }
  }, [eventId])

  return {
    ...state,
    createRSVP,
    cancelRSVP,
    getRSVPStatus,
  }
}
