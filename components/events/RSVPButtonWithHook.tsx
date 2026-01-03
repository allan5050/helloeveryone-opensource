'use client'

import { useState } from 'react'
import { useRSVP } from '@/hooks/useRSVP'
import { Button } from '@/components/ui/button'
import { Loader2, UserCheck, UserPlus, Users } from 'lucide-react'
import { EventWithRSVP } from '@/types/events'

interface RSVPButtonWithHookProps {
  event: EventWithRSVP
  onEventUpdate?: (updatedEvent: EventWithRSVP) => void
  disabled?: boolean
}

export function RSVPButtonWithHook({
  event: initialEvent,
  onEventUpdate,
  disabled,
}: RSVPButtonWithHookProps) {
  const [localEvent, setLocalEvent] = useState(initialEvent)

  const { isLoading, createRSVP, cancelRSVP } = useRSVP(localEvent.id, {
    onSuccess: (action, newCount) => {
      const updatedEvent = {
        ...localEvent,
        attendee_count: newCount,
        spots_remaining: localEvent.capacity - newCount,
        is_full: newCount >= localEvent.capacity,
        user_rsvp:
          action === 'create'
            ? {
                id: 'temp-rsvp',
                event_id: localEvent.id,
                user_id: 'current-user',
                status: 'attending' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : undefined,
      }
      setLocalEvent(updatedEvent)
      onEventUpdate?.(updatedEvent)
    },
    onError: () => {
      // Reset to original state on error
      setLocalEvent(initialEvent)
      onEventUpdate?.(initialEvent)
    },
  })

  const isAttending = localEvent.user_rsvp?.status === 'attending'
  const spotsRemaining = localEvent.spots_remaining
  const isFull = localEvent.is_full && !isAttending

  // Check if event is past
  const isPastEvent = new Date(localEvent.date_time) < new Date()

  const handleRSVP = async () => {
    if (isPastEvent || disabled || isLoading) return

    // Apply optimistic update immediately
    const action = isAttending ? 'cancel' : 'create'
    const optimisticCount = isAttending
      ? localEvent.attendee_count - 1
      : localEvent.attendee_count + 1

    const optimisticEvent = {
      ...localEvent,
      attendee_count: optimisticCount,
      spots_remaining: localEvent.capacity - optimisticCount,
      is_full: optimisticCount >= localEvent.capacity,
      user_rsvp:
        action === 'create'
          ? {
              id: 'temp-rsvp',
              event_id: localEvent.id,
              user_id: 'current-user',
              status: 'attending' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : undefined,
    }

    setLocalEvent(optimisticEvent)
    onEventUpdate?.(optimisticEvent)

    try {
      if (action === 'create') {
        await createRSVP()
      } else {
        await cancelRSVP()
      }
    } catch (error) {
      // Error handling and rollback is done in the hook's onError callback
    }
  }

  // Show different states based on conditions
  if (isPastEvent) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Users className="mr-2 h-4 w-4" />
        Past Event
      </Button>
    )
  }

  if (isFull) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Users className="mr-2 h-4 w-4" />
        Event Full
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleRSVP}
        disabled={isLoading || disabled}
        variant={isAttending ? 'outline' : 'default'}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isAttending ? 'Cancelling...' : 'Joining...'}
          </>
        ) : isAttending ? (
          <>
            <UserCheck className="mr-2 h-4 w-4" />
            Cancel RSVP
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            RSVP
          </>
        )}
      </Button>

      {/* Capacity information */}
      <div className="text-center text-xs text-muted-foreground">
        {localEvent.attendee_count} / {localEvent.capacity} attending
        {spotsRemaining > 0 && spotsRemaining <= 10 && (
          <span className="font-medium text-orange-600">
            {' '}
            • {spotsRemaining} spot{spotsRemaining === 1 ? '' : 's'} left
          </span>
        )}
      </div>
    </div>
  )
}
