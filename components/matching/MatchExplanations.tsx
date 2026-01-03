'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Sparkles, MessageCircle, MapPin, Loader, AlertCircle } from 'lucide-react'
import { MatchExplanationsResponse } from '@/lib/llm/match-explainer'

interface MatchExplanationsProps {
  matchIds: string[]
  className?: string
}

export default function MatchExplanations({ matchIds, className = '' }: MatchExplanationsProps) {
  const [explanations, setExplanations] = useState<MatchExplanationsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExplanations, setShowExplanations] = useState(false)

  const fetchExplanations = async () => {
    if (matchIds.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/matches/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI insights')
      }

      const data = await response.json()
      setExplanations(data)
    } catch (err) {
      console.error('Error fetching explanations:', err)
      setError('Failed to load AI insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGetInsights = () => {
    setShowExplanations(true)
    fetchExplanations()
  }

  if (matchIds.length === 0) {
    return null
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Match Insights</h3>
        </div>

        {!showExplanations && (
          <button
            onClick={handleGetInsights}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-purple-400"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            {loading ? 'Analyzing...' : 'Get AI Insights'}
          </button>
        )}
      </div>

      {!showExplanations && (
        <p className="text-gray-600">
          Get personalized AI insights about why these matches could be great connections for you.
          Our AI analyzes profiles, shared interests, and compatibility to give you compelling reasons to reach out.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchExplanations}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {loading && showExplanations && (
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader className="h-5 w-5 animate-spin" />
            <span>AI is analyzing your matches...</span>
          </div>
        </div>
      )}

      {explanations && showExplanations && !loading && (
        <div className="mt-6 space-y-6">
          {/* Overall Insight */}
          <div className="rounded-lg bg-purple-50 p-4">
            <h4 className="mb-2 font-medium text-purple-900">Overall Insight</h4>
            <p className="text-purple-800">{explanations.overallInsight}</p>
          </div>

          {/* Top Recommendations */}
          {explanations.topRecommendations && explanations.topRecommendations.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">Top Recommendations</h4>
              <ul className="space-y-1 text-blue-800">
                {explanations.topRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Individual Match Explanations */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Why These Matches Are Compelling</h4>
            {explanations.explanations.map((explanation, index) => (
              <div
                key={explanation.user_id}
                className={`rounded-lg border p-4 ${
                  explanation.isHighPriority
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">
                    {explanation.display_name}
                  </h5>
                  {explanation.isHighPriority && (
                    <span className="rounded-full bg-yellow-200 px-2 py-1 text-xs font-medium text-yellow-800">
                      High Priority
                    </span>
                  )}
                </div>

                <p className="mb-3 text-gray-700">{explanation.compatibilityReason}</p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {/* Shared Interests */}
                  {explanation.sharedInterests.length > 0 && (
                    <div>
                      <h6 className="mb-1 text-xs font-medium uppercase text-gray-500">
                        Shared Interests
                      </h6>
                      <div className="flex flex-wrap gap-1">
                        {explanation.sharedInterests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation Starters */}
                  {explanation.conversationStarters.length > 0 && (
                    <div>
                      <h6 className="mb-1 flex items-center gap-1 text-xs font-medium uppercase text-gray-500">
                        <MessageCircle className="h-3 w-3" />
                        Conversation Ideas
                      </h6>
                      <ul className="space-y-1">
                        {explanation.conversationStarters.slice(0, 2).map((starter, idx) => (
                          <li key={idx} className="text-xs text-gray-600">
                            "{starter}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Meeting Suggestions */}
                  {explanation.meetingSuggestions.length > 0 && (
                    <div>
                      <h6 className="mb-1 flex items-center gap-1 text-xs font-medium uppercase text-gray-500">
                        <MapPin className="h-3 w-3" />
                        Meet-up Ideas
                      </h6>
                      <ul className="space-y-1">
                        {explanation.meetingSuggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs text-gray-600">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}