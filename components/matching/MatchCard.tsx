'use client'

import { MessageCircle, Sparkles, Loader, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import FavoriteButton from '@/components/profile/FavoriteButton'
import Avatar from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

interface MatchCardProps {
  profile: Profile
  matchScore: number
  sharedInterests: string[]
  className?: string
  showAIButton?: boolean
  currentUserBio?: string
  currentUserInterests?: string[]
}

interface AIInsight {
  compatibilityReason: string
  conversationStarters: string[]
  meetingSuggestions: string[]
}

export default function MatchCard({
  profile,
  matchScore,
  sharedInterests,
  className = '',
  showAIButton = false,
  currentUserBio = '',
  currentUserInterests = [],
}: MatchCardProps) {
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const [isFromCache, setIsFromCache] = useState(false)
  const [hasCachedInsight, setHasCachedInsight] = useState(false)
  const supabase = createClient()

  // Check for cached AI insights on component mount
  useEffect(() => {
    const checkCachedInsight = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Check if we have cached insights (table may not exist or be empty)
        // Use maybeSingle() to avoid 406 error when no rows match
        const { data: cachedInsight, error } = await supabase
          .from('ai_insights')
          .select('compatibility_reason, meeting_suggestions')
          .eq('user_id', user.id)
          .eq('target_user_id', profile.user_id)
          .maybeSingle()

        // Silently handle errors (table might not exist, or no data)
        if (error || !cachedInsight) return

        if ((cachedInsight as any).compatibility_reason) {
          setAiInsight({
            compatibilityReason: (cachedInsight as any).compatibility_reason,
            conversationStarters: [],
            meetingSuggestions:
              (cachedInsight as any).meeting_suggestions || [],
          })
          setIsFromCache(true)
          setHasCachedInsight(true)
        }
      } catch {
        // No cached insights found - that's okay
      }
    }

    if (showAIButton) {
      checkCachedInsight()
    }
  }, [profile.user_id, showAIButton, supabase])
  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement message functionality or navigate to chat
    console.log('Message clicked for user:', profile.user_id)
  }

  const handleAIInsight = async (e: React.MouseEvent, forceRefresh = false) => {
    e.preventDefault()
    e.stopPropagation()

    if (aiInsight && !forceRefresh) {
      setShowInsight(!showInsight)
      return
    }

    setLoadingInsight(true)
    try {
      const response = await fetch('/api/matches/explain-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchIds: [profile.user_id],
          currentUser: {
            bio: currentUserBio,
            interests: currentUserInterests,
          },
          sharedInterests,
          matchQuality: getMatchQuality(matchScore),
          forceRefresh,
        }),
      })

      if (!response.ok) throw new Error('Failed to get AI insight')

      const data = await response.json()
      if (data.explanations && data.explanations[0]) {
        setAiInsight({
          compatibilityReason: data.explanations[0].compatibilityReason,
          conversationStarters: data.explanations[0].conversationStarters || [],
          meetingSuggestions: data.explanations[0].meetingSuggestions,
        })
        setIsFromCache(
          forceRefresh ? false : data.explanations[0].fromCache || false
        )
        setHasCachedInsight(true)
        setShowInsight(true)
      }
    } catch (error) {
      console.error('Error fetching AI insight:', error)
    } finally {
      setLoadingInsight(false)
    }
  }

  const getMatchQuality = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    return 'low'
  }

  const getMatchQualityColor = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
    }
  }

  const matchQuality = getMatchQuality(matchScore)

  // Sort interests to show shared ones first
  const profileInterests = Array.isArray(profile.interests)
    ? profile.interests
    : []
  const sortedInterests =
    profileInterests.length > 0
      ? [...profileInterests].sort((a, b) => {
          const aIsShared =
            sharedInterests.some(
              shared => shared.toLowerCase() === a.toLowerCase()
            ) ||
            currentUserInterests.some(
              interest => interest.toLowerCase() === a.toLowerCase()
            )
          const bIsShared =
            sharedInterests.some(
              shared => shared.toLowerCase() === b.toLowerCase()
            ) ||
            currentUserInterests.some(
              interest => interest.toLowerCase() === b.toLowerCase()
            )

          if (aIsShared && !bIsShared) return -1
          if (!aIsShared && bIsShared) return 1
          return 0
        })
      : []

  const getAvatarSrc = () => {
    // Check for photo_url first (new field for local images)
    const photoUrl = (profile as any).photo_url
    if (photoUrl) {
      // Handle local images from public folder
      if (photoUrl.startsWith('/images/')) {
        return photoUrl
      }
      // Handle full URLs
      if (photoUrl.startsWith('http')) {
        return photoUrl
      }
    }

    // No avatar_url available, proceed to placeholder

    return `/api/placeholder/100/100?text=${encodeURIComponent(profile.display_name?.charAt(0) || 'U')}`
  }

  return (
    <Link
      href={`/matches/${profile.user_id}`}
      className={`block rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-purple-300 hover:shadow-md ${className}`}
    >
      <div className="p-4">
        {/* Header with Avatar and Score */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              src={getAvatarSrc()}
              alt={`${profile.display_name || 'User'}'s avatar`}
              fallbackText={profile.display_name || 'User'}
              size="sm"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {profile.display_name}
              </h3>
              {profile.age && (
                <p className="text-sm text-gray-500">{profile.age} years old</p>
              )}
            </div>
          </div>

          {/* Match Score */}
          <div className="flex flex-col items-end space-y-2">
            <div
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${getMatchQualityColor(matchQuality)}`}
            >
              {matchQuality} match
            </div>
          </div>
        </div>

        {/* Bio Snippet */}
        {profile.bio && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
            {profile.bio}
          </p>
        )}

        {/* AI Insight Display - Prominent and obvious */}
        {showInsight && aiInsight && (
          <div className="mb-4 rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h4 className="text-base font-bold text-purple-900">
                  AI Insights
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {isFromCache && (
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-600">
                    📋 Saved
                  </span>
                )}
                <button
                  onClick={e => handleAIInsight(e, true)}
                  disabled={loadingInsight}
                  className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50"
                  title="Refresh AI insights"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${loadingInsight ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowInsight(false)
                  }}
                  className="text-xs font-medium text-purple-600 hover:text-purple-800"
                >
                  Hide
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-md bg-white/70 p-3">
              <p className="text-sm font-medium text-purple-800">
                {aiInsight.compatibilityReason}
              </p>
            </div>

            {aiInsight.meetingSuggestions.length > 0 && (
              <div className="rounded-md bg-white/50 p-3">
                <h5 className="mb-2 flex items-center gap-1 text-sm font-bold text-purple-700">
                  📍 Perfect places to meet:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {aiInsight.meetingSuggestions.map((suggestion, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Interests with shared ones highlighted */}
        {sortedInterests.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Interests{' '}
              {sharedInterests.length > 0 &&
                `(${sharedInterests.length} shared)`}
            </p>
            <div className="flex flex-wrap gap-1">
              {sortedInterests.slice(0, 6).map((interest, index) => {
                const isShared =
                  sharedInterests.some(
                    shared => shared.toLowerCase() === interest.toLowerCase()
                  ) ||
                  currentUserInterests.some(
                    userInterest =>
                      userInterest.toLowerCase() === interest.toLowerCase()
                  )

                return (
                  <span
                    key={index}
                    className={`rounded-full px-2 py-1 text-xs font-medium transition-all ${
                      isShared
                        ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {interest}
                    {isShared && (
                      <span className="ml-1" aria-label="Shared interest">
                        ✨
                      </span>
                    )}
                  </span>
                )
              })}
              {sortedInterests.length > 6 && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  +{sortedInterests.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleMessage}
              className="flex items-center space-x-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              <MessageCircle size={16} />
              <span>Message</span>
            </button>

            {showAIButton && (
              <button
                onClick={handleAIInsight}
                disabled={loadingInsight}
                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-medium text-white transition-all hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {loadingInsight ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {aiInsight
                        ? showInsight
                          ? 'Hide'
                          : 'Show'
                        : hasCachedInsight
                          ? 'Show'
                          : 'AI'}
                    </span>
                    <span className="hidden sm:inline">
                      {aiInsight
                        ? ' Insights'
                        : hasCachedInsight
                          ? ' Insights'
                          : ''}
                    </span>
                    {hasCachedInsight && (
                      <span className="ml-1 text-xs opacity-75">📋</span>
                    )}
                  </>
                )}
              </button>
            )}
          </div>

          <div
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <FavoriteButton profileId={profile.user_id || profile.id} />
          </div>
        </div>
      </div>
    </Link>
  )
}
