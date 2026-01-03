'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useAuth } from '@/app/contexts/AuthContext'
import {
  getEventById,
  getEventAttendees,
  createRSVP,
  cancelRSVP,
} from '@/lib/supabase/events'
import type { EventWithDetails, RSVPWithUser } from '@/types/event'

export default function EventDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [attendees, setAttendees] = useState<RSVPWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadEventDetails()
    }
  }, [id, user?.id])

  const loadEventDetails = async () => {
    if (!id) return

    try {
      setLoading(true)
      const [eventData, attendeesData] = await Promise.all([
        getEventById(id as string, user?.id),
        getEventAttendees(id as string),
      ])

      setEvent(eventData)
      setAttendees(attendeesData)
    } catch (err) {
      setError('Failed to load event details')
      console.error('Error loading event details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async () => {
    if (!event || !user) return

    try {
      setRsvpLoading(true)
      const response = await createRSVP(event.id, user.id)

      if (response.success) {
        setMessage(response.message)
        // Reload event to get updated RSVP status
        await loadEventDetails()
      } else {
        setError(response.message)
      }
    } catch {
      setError('Failed to register for event')
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleCancelRSVP = async () => {
    if (!event || !user) return

    try {
      setRsvpLoading(true)
      const response = await cancelRSVP(event.id, user.id)

      if (response.success) {
        setMessage(response.message)
        // Reload event to get updated RSVP status
        await loadEventDetails()
      } else {
        setError(response.message)
      }
    } catch {
      setError('Failed to cancel registration')
    } finally {
      setRsvpLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, error])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="mb-6 h-8 rounded bg-gray-200"></div>
            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-4 h-8 rounded bg-gray-200"></div>
              <div className="mb-6 h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="space-y-4">
                <div className="h-4 rounded bg-gray-200"></div>
                <div className="h-4 rounded bg-gray-200"></div>
                <div className="h-4 w-2/3 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Event Not Found
            </h1>
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!event) return null

  const currentRsvps = event.rsvp_count || 0
  const maxAttendees = event.max_attendees || 999
  const isEventFull = currentRsvps >= maxAttendees
  const userRsvpStatus = event.user_rsvp?.status
  const isUserRegistered =
    userRsvpStatus === 'going' || userRsvpStatus === 'maybe'

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/events"
          className="mb-6 inline-flex items-center text-gray-600 transition-colors hover:text-gray-900"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Events
        </Link>

        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && event && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Event Details */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    {event.title}
                  </h1>
                </div>

                {/* Host Info */}
                {event.creator && (
                  <div className="mb-6 flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                      <span className="text-sm font-medium text-gray-600">
                        {event.creator.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.creator.display_name}
                      </p>
                      <p className="text-sm text-gray-600">Event Host</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP Section */}
              <div className="flex-shrink-0 text-center sm:text-right">
                <div className="mb-4">
                  <div
                    className={`text-2xl font-bold ${
                      isEventFull ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {currentRsvps}/{maxAttendees}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isEventFull ? 'Event Full' : 'Spots Available'}
                  </div>
                </div>

                {user && (
                  <div>
                    {!isUserRegistered ? (
                      <button
                        onClick={handleRSVP}
                        disabled={rsvpLoading}
                        className={`w-full rounded-lg px-6 py-3 font-medium transition-colors sm:w-auto ${
                          rsvpLoading
                            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                            : isEventFull
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {rsvpLoading
                          ? 'Processing...'
                          : isEventFull
                            ? 'Join Waitlist'
                            : 'Register for Event'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            userRsvpStatus === 'going'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {userRsvpStatus === 'going'
                            ? 'Registered'
                            : 'On Waitlist'}
                        </div>
                        <button
                          onClick={handleCancelRSVP}
                          disabled={rsvpLoading}
                          className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 sm:w-auto"
                        >
                          {rsvpLoading
                            ? 'Cancelling...'
                            : 'Cancel Registration'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Info */}
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Left Column - Event Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Event Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="mr-3 h-5 w-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formatDate(event.start_time)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="mr-3 h-5 w-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        {formatTime(event.start_time)}
                        {event.end_time && ` - ${formatTime(event.end_time)}`}
                      </span>
                    </div>
                    <div className="flex items-start text-gray-600">
                      <svg
                        className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>{event.location}</div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="mr-3 h-5 w-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>Maximum {maxAttendees} attendees</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold text-gray-900">
                      About This Event
                    </h2>
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-600">
                      {event.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Attendees */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Attendees ({attendees.length})
                </h2>
                {attendees.length > 0 ? (
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {attendees.map(attendee => (
                      <div key={attendee.id} className="flex items-center">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                          <span className="text-xs font-medium text-gray-600">
                            {attendee.user?.display_name
                              ?.charAt(0)
                              .toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">
                          {attendee.user?.display_name || 'Unknown User'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <svg
                      className="mx-auto mb-3 h-12 w-12 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <p>No attendees yet</p>
                    <p className="text-sm">Be the first to register!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
