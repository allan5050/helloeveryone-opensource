'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RSVPButtonProps {
  eventId: string
  capacity?: number
  initialAttendeeCount?: number
  initialHasRsvp?: boolean
  onRsvpChange?: (hasRsvp: boolean, attendeeCount: number) => void
}

export default function RSVPButton({
  eventId,
  capacity,
  initialAttendeeCount = 0,
  initialHasRsvp = false,
  onRsvpChange,
}: RSVPButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasRsvp, setHasRsvp] = useState(initialHasRsvp)
  const [attendeeCount, setAttendeeCount] = useState(initialAttendeeCount)
  const [error, setError] = useState<string | null>(null)

  const isFull = capacity ? attendeeCount >= capacity : false
  const spotsLeft = capacity ? Math.max(0, capacity - attendeeCount) : null

  useEffect(() => {
    fetchRsvpStatus()
  }, [eventId])

  const fetchRsvpStatus = async () => {
    try {
      const response = await fetch(`/api/events/rsvp?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setHasRsvp(data.hasRsvp)
        setAttendeeCount(data.event.attendeeCount)
      }
    } catch (error) {
      console.error('Error fetching RSVP status:', error)
    }
  }

  const handleRsvp = async () => {
    setLoading(true)
    setError(null)

    // Optimistic update
    const previousHasRsvp = hasRsvp
    const previousAttendeeCount = attendeeCount

    if (hasRsvp) {
      setHasRsvp(false)
      setAttendeeCount(prev => Math.max(0, prev - 1))
    } else {
      if (!isFull) {
        setHasRsvp(true)
        setAttendeeCount(prev => prev + 1)
      }
    }

    try {
      const response = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          action: hasRsvp ? 'cancel' : 'create',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update RSVP')
      }

      // Update with server response
      setAttendeeCount(data.attendeeCount)
      onRsvpChange?.(!previousHasRsvp, data.attendeeCount)

      // Refresh the page to update the attendee list if needed
      router.refresh()
    } catch (error) {
      // Rollback on error
      setHasRsvp(previousHasRsvp)
      setAttendeeCount(previousAttendeeCount)
      setError(error instanceof Error ? error.message : 'Failed to update RSVP')
      console.error('RSVP error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'}
          {capacity && (
            <span className="ml-2">
              ({spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left)
            </span>
          )}
        </div>
        {isFull && !hasRsvp && (
          <span className="text-sm font-medium text-red-600">Event Full</span>
        )}
      </div>

      <button
        onClick={handleRsvp}
        disabled={loading || (isFull && !hasRsvp)}
        className={`
          w-full rounded-lg px-4 py-2 font-medium transition-all duration-200
          ${loading ? 'cursor-not-allowed opacity-50' : ''}
          ${
            hasRsvp
              ? 'bg-red-600 text-white hover:bg-red-700'
              : isFull
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : hasRsvp ? (
          'Cancel RSVP'
        ) : isFull ? (
          'Event Full'
        ) : (
          'RSVP to Event'
        )}
      </button>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      {capacity && !isFull && spotsLeft !== null && spotsLeft <= 5 && (
        <div className="text-center text-sm font-medium text-orange-600">
          Hurry! Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining
        </div>
      )}
    </div>
  )
}
