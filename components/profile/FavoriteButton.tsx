'use client'

import { Star } from 'lucide-react'
import { useState, useEffect } from 'react'

import { useAuth } from '@/app/contexts/AuthContext'

interface FavoriteButtonProps {
  profileId: string
  className?: string
}

export default function FavoriteButton({
  profileId,
  className = '',
}: FavoriteButtonProps) {
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check initial favorite status
  useEffect(() => {
    if (!user || !profileId) return

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

  const handleToggleFavorite = async () => {
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
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorited(previousState)
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || isChecking) {
    return (
      <div
        className={`h-8 w-8 animate-pulse rounded-full bg-gray-100 ${className}`}
      />
    )
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`rounded-full p-2 transition-all duration-200 hover:scale-110 disabled:opacity-50 ${
        isFavorited
          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
    </button>
  )
}
