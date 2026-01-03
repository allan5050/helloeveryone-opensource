'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { getPastEvents } from '@/lib/supabase/events'
import type { Event } from '@/types/event'

function PastEventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.event_date)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3 className="mr-3 line-clamp-2 flex-1 text-lg font-semibold text-gray-700">
            {event.title}
          </h3>
          <div className="flex flex-col items-end gap-1">
            {event.event_type && (
              <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {event.event_type}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Attended
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="mb-4 line-clamp-2 text-sm text-gray-600">
            {event.description}
          </p>
        )}

        {/* Event Details */}
        <div className="mb-4 space-y-2">
          {/* Date & Time */}
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="mr-2 h-4 w-4 flex-shrink-0"
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
            <span>
              {formatDate(eventDate)} at {formatTime(event.start_time)}
            </span>
          </div>

          {/* Final Attendance */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">Final attendance:</span>
            <span className="ml-2">
              {event.rsvp_count || 0}/{event.capacity} people
            </span>
          </div>
        </div>

        {/* Host Info */}
        {event.host && (
          <div className="flex items-center">
            {event.host.avatar_url ? (
              <img
                src={event.host.avatar_url}
                alt={event.host.full_name}
                className="mr-2 h-6 w-6 rounded-full opacity-75"
              />
            ) : (
              <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 opacity-75">
                <span className="text-xs font-medium text-gray-600">
                  {event.host.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">
              Hosted by {event.host.full_name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PastEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPastEvents()
    }
  }, [user])

  const loadPastEvents = async () => {
    if (!user) return

    try {
      setLoading(true)
      const pastEvents = await getPastEvents(user.id)
      setEvents(pastEvents)
    } catch (err) {
      setError('Failed to load past events')
      console.error('Error loading past events:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Past Events
            </h1>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={loadPastEvents}
                className="mt-2 text-red-600 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Past Events
            </h1>
            <p className="text-gray-600">Events you've attended in the past</p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View Upcoming Events
          </Link>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 p-6"
              >
                <div className="mb-3 h-6 rounded bg-gray-200"></div>
                <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 rounded bg-gray-200"></div>
                  <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="mb-6 text-sm text-gray-600">
              You attended {events.length} event{events.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map(event => (
                <PastEventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-400"
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
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No past events
            </h3>
            <p className="mb-6 text-gray-600">
              You haven't attended any events yet. Join some upcoming events to
              get started!
            </p>
            <Link
              href="/events"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Browse Upcoming Events
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
