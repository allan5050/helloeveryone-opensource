'use client'

import { Sparkles, Loader, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

interface AIInsightSectionProps {
  targetUserId: string
  targetUserBio?: string
  targetUserInterests?: string[]
  currentUserBio?: string
  currentUserInterests?: string[]
  currentUserLocation?: string
  sharedInterests?: string[]
  matchQuality?: 'high' | 'medium' | 'low'
  className?: string
}

interface AIInsight {
  compatibilityReason: string
  meetingSuggestions: string[]
}

export default function AIInsightSection({
  targetUserId,
  targetUserBio = '',
  targetUserInterests = [],
  currentUserBio = '',
  currentUserInterests = [],
  currentUserLocation = '',
  sharedInterests = [],
  matchQuality = 'low',
  className = '',
}: AIInsightSectionProps) {
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const [isFromCache, setIsFromCache] = useState(false)
  const [checkingCache, setCheckingCache] = useState(true)
  const supabase = createClient()

  // Check for cached insights on mount
  useEffect(() => {
    const checkCachedInsights = async () => {
      setCheckingCache(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setCheckingCache(false)
          return
        }

        // Check if we have cached insights (table may not exist or be empty)
        // Use maybeSingle() to avoid 406 error when no rows match
        const { data: cachedInsight, error } = await supabase
          .from('ai_insights')
          .select('compatibility_reason, meeting_suggestions')
          .eq('user_id', user.id)
          .eq('target_user_id', targetUserId)
          .maybeSingle()

        // Silently handle errors (table might not exist, or no data)
        if (error || !cachedInsight) return

        if (cachedInsight.compatibility_reason) {
          setAiInsight({
            compatibilityReason: cachedInsight.compatibility_reason,
            meetingSuggestions: cachedInsight.meeting_suggestions || [],
          })
          setIsFromCache(true)
          setShowInsight(true) // Auto-expand if we have cached insights
        }
      } catch (error) {
        console.error('Error checking cached insights:', error)
      } finally {
        setCheckingCache(false)
      }
    }

    checkCachedInsights()
  }, [targetUserId, supabase])

  const handleAIInsightClick = async (forceRefresh = false) => {
    // If we already have insights and not forcing refresh, just toggle visibility
    if (aiInsight && !forceRefresh) {
      setShowInsight(!showInsight)
      return
    }

    // Load insights (either first time or refresh)
    setLoadingInsight(true)
    setShowInsight(true)

    try {
      const response = await fetch('/api/matches/explain-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchIds: [targetUserId],
          currentUser: {
            bio: currentUserBio,
            interests: currentUserInterests,
            location: currentUserLocation || 'United States',
          },
          targetUser: {
            bio: targetUserBio,
            interests: targetUserInterests,
          },
          sharedInterests,
          matchQuality,
          forceRefresh, // Tell the API to skip cache
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.explanations && data.explanations[0]) {
          setAiInsight({
            compatibilityReason: data.explanations[0].compatibilityReason,
            meetingSuggestions: data.explanations[0].meetingSuggestions,
          })
          setIsFromCache(
            forceRefresh ? false : data.explanations[0].fromCache || false
          )
        }
      }
    } catch (error) {
      console.error('Error loading AI insight:', error)
      setAiInsight({
        compatibilityReason:
          'Unable to generate insights at this time. Please try again later.',
        meetingSuggestions: [],
      })
    } finally {
      setLoadingInsight(false)
    }
  }

  const getMatchQualityColor = () => {
    switch (matchQuality) {
      case 'high':
        return 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
      case 'medium':
        return 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
      case 'low':
        return 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
    }
  }

  // Don't render while checking cache
  if (checkingCache) {
    return null
  }

  // Always show the button or insights (no restrictions based on match quality)
  return (
    <div className={className}>
      {/* AI Insight Button */}
      {!showInsight && (
        <button
          onClick={() => handleAIInsightClick(false)}
          disabled={loadingInsight}
          className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${getMatchQualityColor()} px-6 py-3 text-white shadow-md transition-all disabled:opacity-50`}
        >
          {loadingInsight ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span className="font-medium">Analyzing compatibility...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">
                {aiInsight ? 'Show AI Insights' : 'Get AI Insights'}
                {matchQuality === 'high' && ' (Great Match!)'}
                {matchQuality === 'medium' && ' (Good Match)'}
                {matchQuality === 'low' && ' (Explore Potential)'}
              </span>
            </>
          )}
        </button>
      )}

      {/* AI Insights Display */}
      {showInsight && aiInsight && (
        <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-bold text-purple-900">AI Insights</h3>
            </div>
            <div className="flex items-center gap-2">
              {isFromCache && (
                <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-600">
                  📋 Saved
                </span>
              )}
              <button
                onClick={() => handleAIInsightClick(true)}
                disabled={loadingInsight}
                className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50"
                title="Refresh AI insights"
              >
                <RefreshCw
                  className={`h-3 w-3 ${loadingInsight ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowInsight(false)}
                className="text-sm font-medium text-purple-600 hover:text-purple-800"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Compatibility Reason */}
            <div className="rounded-lg bg-white/70 p-4">
              <h4 className="mb-2 font-semibold text-purple-800">
                {matchQuality === 'low'
                  ? 'Potential Connection Points'
                  : 'Why you match well'}
              </h4>
              <p className="text-gray-700">{aiInsight.compatibilityReason}</p>
            </div>

            {/* Meeting Suggestions */}
            {aiInsight.meetingSuggestions.length > 0 && (
              <div className="rounded-lg bg-white/50 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-purple-800">
                  📍 Great places to meet
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {aiInsight.meetingSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-3 text-center shadow-sm"
                    >
                      <span className="text-sm font-medium text-white">
                        {suggestion}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-purple-600">
                  These are public venues perfect for a first meeting (under
                  $30/person)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
