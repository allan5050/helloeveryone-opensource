import { useState, useEffect } from 'react'
import {
  fallbackData,
  type DemoProfile,
  type DemoMatchScore,
} from '@/lib/fallback/demo-data'

export interface FallbackMatch {
  id: string
  combined_score: number
  calculated_at: string
  profiles: {
    user_id: string
    display_name: string
    bio?: string
    age?: number
    interests?: string[]
    location?: string
    is_favorite?: boolean
    full_name?: string
  }
  common_interests?: string[]
}

export function useFallbackData(currentUserId?: string) {
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  useEffect(() => {
    setIsUsingFallback(fallbackData.isFallbackActive())
  }, [])

  const getFallbackProfiles = (
    page: number = 1,
    itemsPerPage: number = 50,
    searchTerm?: string
  ): {
    profiles: FallbackMatch[]
    hasMore: boolean
    total: number
  } => {
    if (!currentUserId) {
      return { profiles: [], hasMore: false, total: 0 }
    }

    // Get current user profile for interest comparison
    const currentUser = fallbackData.getProfile(currentUserId)
    const currentUserInterests = currentUser?.interests || []

    // Get profiles based on search or pagination
    let profiles = searchTerm
      ? fallbackData.searchProfiles(searchTerm, currentUserId)
      : fallbackData.getProfilesPaginated(page, itemsPerPage, currentUserId)
          .data

    // Transform to match format
    const matches: FallbackMatch[] = profiles.map(profile => {
      // Check for existing match score or generate one
      let matchScore = fallbackData.getMatchScore(
        currentUserId,
        profile.user_id
      )
      if (!matchScore && currentUser) {
        matchScore = fallbackData.generateFallbackMatchScore(
          currentUser,
          profile
        )
      }

      // Calculate common interests
      const commonInterests = fallbackData.calculateCommonInterests(
        currentUserId,
        profile.user_id
      )

      // Check if favorited
      const isFavorite = fallbackData.isFavorited(
        currentUserId,
        profile.user_id
      )

      return {
        id: `fallback-${profile.user_id}`,
        combined_score: matchScore?.combined_score || Math.random() * 0.5 + 0.3,
        calculated_at: matchScore?.calculated_at || new Date().toISOString(),
        profiles: {
          user_id: profile.user_id,
          display_name: profile.display_name || 'Unknown User',
          full_name: profile.full_name,
          bio: profile.bio,
          age: profile.age,
          interests: profile.interests,
          location: profile.location,
          is_favorite: isFavorite,
        },
        common_interests: commonInterests,
      }
    })

    // Sort by match score
    matches.sort((a, b) => b.combined_score - a.combined_score)

    const totalProfiles = fallbackData.getProfiles(currentUserId).length
    const hasMore = page * itemsPerPage < totalProfiles

    return {
      profiles: matches,
      hasMore,
      total: totalProfiles,
    }
  }

  const getFallbackProfile = (userId: string) => {
    const profile = fallbackData.getProfile(userId)
    if (!profile) return null

    return {
      ...profile,
      avatar_url: profile.photo_url,
    }
  }

  const getFallbackMatchScore = (userId1: string, userId2: string) => {
    let score = fallbackData.getMatchScore(userId1, userId2)
    if (!score) {
      const profile1 = fallbackData.getProfile(userId1)
      const profile2 = fallbackData.getProfile(userId2)
      if (profile1 && profile2) {
        score = fallbackData.generateFallbackMatchScore(profile1, profile2)
      }
    }
    return score
  }

  const toggleFavorite = (targetUserId: string): boolean => {
    if (!currentUserId) return false
    // In fallback mode, we just toggle the state locally
    return !fallbackData.isFavorited(currentUserId, targetUserId)
  }

  return {
    isUsingFallback,
    getFallbackProfiles,
    getFallbackProfile,
    getFallbackMatchScore,
    toggleFavorite,
    enableFallback: () => {
      fallbackData.enableFallback()
      setIsUsingFallback(true)
    },
    disableFallback: () => {
      fallbackData.disableFallback()
      setIsUsingFallback(false)
    },
  }
}
