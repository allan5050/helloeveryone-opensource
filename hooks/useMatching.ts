'use client'

import { useState, useCallback } from 'react'

export interface MatchProfile {
  id: string
  firstName: string
  lastName: string
  age?: number
  location?: string
  bio?: string
  interests?: string[]
}

export interface Match {
  profileId: string
  score: number
  profile: MatchProfile
  breakdown?: {
    bioSimilarity: number
    interestOverlap: number
    ageProximity: number
    locationBonus: number
  }
}

export interface EmbeddingStatus {
  hasBio: boolean
  hasBioEmbedding: boolean
  hasInterests: boolean
  hasInterestsEmbedding: boolean
  needsEmbeddings: boolean
}

export function useMatching() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate embeddings for the current user's profile
  const generateEmbeddings = useCallback(async (forceRegenerate = false) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/match/generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceRegenerate }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate embeddings')
      }

      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Check embedding status
  const checkEmbeddingStatus =
    useCallback(async (): Promise<EmbeddingStatus> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/match/generate-embeddings')

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to check embedding status')
        }

        const result = await response.json()
        return result.embeddingStatus
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    }, [])

  // Calculate matches for the current user
  const calculateMatches = useCallback(
    async (
      options: {
        targetProfileId?: string
        eventId?: string
        limit?: number
        minScore?: number
        forceRecalculate?: boolean
      } = {}
    ) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/match/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to calculate matches')
        }

        const result = await response.json()
        return {
          matches: result.matches as Match[],
          cached: result.cached,
          computationTime: result.computationTime,
          totalCalculated: result.totalCalculated,
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Get cached matches
  const getMatches = useCallback(
    async (
      options: {
        limit?: number
        minScore?: number
        eventId?: string
      } = {}
    ) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (options.limit) searchParams.set('limit', options.limit.toString())
        if (options.minScore)
          searchParams.set('minScore', options.minScore.toString())
        if (options.eventId) searchParams.set('eventId', options.eventId)

        const response = await fetch(`/api/match/calculate?${searchParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to get matches')
        }

        const result = await response.json()
        return {
          matches: result.matches as Match[],
          computationTime: result.computationTime,
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Refresh match scores
  const refreshMatches = useCallback(async (targetProfiles?: string[]) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/match/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetProfiles }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refresh matches')
      }

      const result = await response.json()
      return {
        updatedCount: result.updatedCount,
        computationTime: result.computationTime,
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Check refresh status
  const checkRefreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/match/refresh')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check refresh status')
      }

      const result = await response.json()
      return {
        lastUpdated: result.lastUpdated,
        totalMatches: result.totalMatches,
        needsRefresh: result.needsRefresh,
      }
    } catch (err) {
      console.error('Error checking refresh status:', err)
      return {
        lastUpdated: null,
        totalMatches: 0,
        needsRefresh: true,
      }
    }
  }, [])

  return {
    loading,
    error,
    generateEmbeddings,
    checkEmbeddingStatus,
    calculateMatches,
    getMatches,
    refreshMatches,
    checkRefreshStatus,
  }
}
