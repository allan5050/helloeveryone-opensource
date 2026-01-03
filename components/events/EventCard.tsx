'use client'

import { Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { Event } from '@/types/event'

interface EventCardProps {
  event: Event
}

interface FavoriteAttendee {
  id: string
  name: string
  photo_url: string | null
}

export default function EventCard({ event }: EventCardProps) {
  const [favoriteAttendees, setFavoriteAttendees] = useState<
    FavoriteAttendee[]
  >([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true)

  useEffect(() => {
    const fetchFavoriteAttendees = async () => {
      try {
        const response = await fetch(
          `/api/events/social-proof?eventId=${event.id}`
        )
        if (response.ok) {
          const data = await response.json()
          setFavoriteAttendees(data.favoriteAttendees || [])
        }
      } catch (error) {
        console.error('Error fetching favorite attendees:', error)
      } finally {
        setIsLoadingFavorites(false)
      }
    }

    fetchFavoriteAttendees()
  }, [event.id])
  const eventDate = new Date(event.event_date)
  const currentRsvps = event.rsvp_count || 0
  const capacity = event.capacity
  const isNearlyFull = currentRsvps >= capacity * 0.8
  const isFull = currentRsvps >= capacity
  const favoriteCount = favoriteAttendees.length

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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
    <Link href={`/events/${event.id}`}>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <h3 className="mr-3 line-clamp-2 flex-1 text-lg font-semibold text-gray-900">
              {event.title}
            </h3>
            <div className="flex items-center gap-2">
              {!isLoadingFavorites && favoriteCount > 0 && (
                <span className="inline-flex flex-shrink-0 items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  {favoriteCount} favorite{favoriteCount === 1 ? '' : 's'}{' '}
                  attending
                </span>
              )}
              {event.event_type && (
                <span className="inline-flex flex-shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {event.event_type}
                </span>
              )}
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
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </span>
            </div>

            {/* Location */}
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>

            {/* Capacity */}
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span
                className={`${
                  isFull
                    ? 'font-medium text-red-600'
                    : isNearlyFull
                      ? 'font-medium text-amber-600'
                      : ''
                }`}
              >
                {currentRsvps}/{capacity} spots filled
              </span>
              {isFull && (
                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Full
                </span>
              )}
              {isNearlyFull && !isFull && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Nearly Full
                </span>
              )}
            </div>
          </div>

          {/* Host Info */}
          {event.host && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {event.host.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={event.host.avatar_url}
                    alt={event.host.full_name}
                    className="mr-2 h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                    <span className="text-xs font-medium text-gray-600">
                      {event.host.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  Hosted by {event.host.full_name}
                </span>
              </div>
            </div>
          )}

          {/* Capacity Progress Bar */}
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isFull
                    ? 'bg-red-500'
                    : isNearlyFull
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min((currentRsvps / capacity) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
