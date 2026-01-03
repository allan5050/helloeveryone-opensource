'use client'

import { useState, useEffect, useCallback } from 'react'

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
  matchExplanation: {
    interestOverlap: string[]
    ageCompatibility: 'excellent' | 'good' | 'fair'
    locationMatch: 'same_city' | 'different_location'
    bioSimilarity: string
    summary: string
  }
}

interface UseEventMatchesOptions {
  eventId: string
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useEventMatches({
  eventId,
  limit = 20,
  autoRefresh = false,
  refreshInterval = 30000,
}: UseEventMatchesOptions) {
  const [matches, setMatches] = useState<EventMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchMatches = useCallback(
    async (reset = false) => {
      if (!eventId) return

      try {
        const currentOffset = reset ? 0 : offset
        setLoading(true)
        if (reset) setError(null)

        const response = await fetch(
          `/api/match/event/${eventId}?limit=${limit}&offset=${currentOffset}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch matches')
        }

        const data = await response.json()
        const newMatches = data.matches || []

        if (reset) {
          setMatches(newMatches)
          setOffset(newMatches.length)
        } else {
          setMatches(prev => [...prev, ...newMatches])
          setOffset(prev => prev + newMatches.length)
        }

        setHasMore(data.pagination.hasMore)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches')
      } finally {
        setLoading(false)
      }
    },
    [eventId, limit, offset]
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchMatches(false)
  }, [fetchMatches, hasMore, loading])

  const refresh = useCallback(async () => {
    setOffset(0)
    await fetchMatches(true)
  }, [fetchMatches])

  // Initial load
  useEffect(() => {
    fetchMatches(true)
  }, [eventId, limit])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !eventId) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refresh, eventId])

  return {
    matches,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  }
}
