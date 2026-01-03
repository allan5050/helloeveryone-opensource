import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'

export function useFavoriteStatus(profileId: string) {
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!user || !profileId) {
      setIsChecking(false)
      return
    }

    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(
          `/api/profile/favorite?profileId=${profileId}`
        )
        if (response.ok) {
          const data = await response.json()
          setIsFavorited(data.isFavorited)
        }
      } catch (error) {
        console.error('Error checking favorite status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkFavoriteStatus()
  }, [user, profileId])

  const toggleFavorite = async () => {
    if (!user || isLoading) return

    setIsLoading(true)
    const previousState = isFavorited

    // Optimistic update
    setIsFavorited(!isFavorited)

    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const response = await fetch('/api/profile/favorite', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setIsFavorited(previousState)
        const error = await response.json()
        console.error('Error toggling favorite:', error)
        throw new Error(error.error || 'Failed to toggle favorite')
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorited(previousState)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isFavorited,
    isLoading,
    isChecking,
    toggleFavorite,
  }
}
