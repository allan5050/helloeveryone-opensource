'use client'

import {
  Heart,
  MessageCircle,
  Users,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface MatchExplanation {
  interestOverlap: string[]
  ageCompatibility: 'excellent' | 'good' | 'fair'
  locationMatch: 'same_city' | 'different_location'
  bioSimilarity: string
  summary: string
}

interface EventMatch {
  userId: string
  profileId: string
  fullName: string
  bio: string
  interests: string[]
  age: number
  location: string
  profilePictureUrl?: string
  matchScore: number
  sharedInterests: string[]
  matchExplanation: MatchExplanation
}

interface PeopleToMeetProps {
  eventId: string
  className?: string
}

export default function PeopleToMeet({
  eventId,
  className = '',
}: PeopleToMeetProps) {
  const [matches, setMatches] = useState<EventMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchMatches()
  }, [eventId])

  const fetchMatches = async () => {
    if (!eventId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/match/event/${eventId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }

      const data = await response.json()
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async (userId: string) => {
    setFavorites(prev => new Set(prev).add(userId))
    // API call would go here
  }

  const handleMessage = (userId: string) => {
    window.location.href = `/chat?with=${userId}`
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Great Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Potential Match'
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5" />
          People You'll Meet
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200"></div>
                  <div className="h-3 w-full rounded bg-gray-200"></div>
                  <div className="h-3 w-2/3 rounded bg-gray-200"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchMatches}
          className="mt-2 text-blue-600 underline hover:text-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-700">
          No matches yet
        </h3>
        <p className="text-gray-500">More people might join this event soon!</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
        <Users className="h-5 w-5" />
        People You'll Meet ({matches.length})
      </h3>

      <div className="space-y-4">
        {matches.map(match => (
          <div
            key={match.userId}
            className="rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-semibold text-gray-400">
                  {match.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>

                <div
                  className={`absolute -right-1 -top-1 rounded-full px-2 py-1 text-xs font-medium ${getScoreColor(match.matchScore)}`}
                >
                  {Math.round(match.matchScore)}%
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="truncate font-semibold text-gray-900">
                    {match.fullName || 'Anonymous'}
                  </h4>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getScoreColor(match.matchScore)}`}
                  >
                    {getScoreLabel(match.matchScore)}
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-1 text-sm text-gray-600">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span>{match.matchExplanation.summary}</span>
                </div>

                {match.bio && (
                  <p className="mb-3 line-clamp-2 text-sm text-gray-700">
                    {match.bio}
                  </p>
                )}

                {match.sharedInterests && match.sharedInterests.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {match.sharedInterests.slice(0, 4).map(interest => (
                        <span
                          key={interest}
                          className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                        >
                          {interest}
                        </span>
                      ))}
                      {match.sharedInterests.length > 4 && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          +{match.sharedInterests.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                  {match.age && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{match.age} years old</span>
                    </div>
                  )}
                  {match.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="max-w-[100px] truncate">
                        {match.location}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleFavorite(match.userId)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      favorites.has(match.userId)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${favorites.has(match.userId) ? 'fill-current' : ''}`}
                    />
                    {favorites.has(match.userId) ? 'Liked' : 'Like'}
                  </button>

                  <button
                    onClick={() => handleMessage(match.userId)}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
