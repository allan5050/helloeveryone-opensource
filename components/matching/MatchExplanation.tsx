interface MatchExplanationProps {
  matchScore: number
  sharedInterests: string[]
  ageCompatibility: number
  bioSimilarity: number
  locationScore: number
  commonEvents?: string[]
}

export default function MatchExplanation({
  matchScore,
  sharedInterests,
  ageCompatibility,
  bioSimilarity,
  locationScore,
  commonEvents = [],
}: MatchExplanationProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreWidth = (score: number) => {
    return Math.max(10, Math.min(100, score))
  }

  const matchFactors = [
    {
      label: 'Shared Interests',
      score: (sharedInterests.length / 10) * 100, // Assume max 10 interests
      weight: '40%',
      description: `${sharedInterests.length} interests in common`,
    },
    {
      label: 'Bio Compatibility',
      score: bioSimilarity,
      weight: '30%',
      description: 'Similar lifestyle and values',
    },
    {
      label: 'Age Compatibility',
      score: ageCompatibility,
      weight: '20%',
      description: 'Age range preference match',
    },
    {
      label: 'Location & Availability',
      score: locationScore,
      weight: '10%',
      description: 'Geographic and schedule compatibility',
    },
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6 text-center">
        <div
          className={`inline-flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold ${getScoreColor(matchScore)}`}
        >
          {Math.round(matchScore)}%
        </div>
        <h3 className="mt-3 text-xl font-semibold text-gray-900">
          Match Compatibility
        </h3>
        <p className="mt-1 text-gray-600">Here's why you two might click</p>
      </div>

      {/* Match Breakdown */}
      <div className="mb-6 space-y-4">
        <h4 className="font-semibold text-gray-900">Compatibility Breakdown</h4>
        {matchFactors.map((factor, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {factor.label}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{factor.weight}</span>
                <span
                  className={`rounded px-2 py-1 text-sm font-medium ${getScoreColor(factor.score)}`}
                >
                  {Math.round(factor.score)}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  factor.score >= 80
                    ? 'bg-green-500'
                    : factor.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${getScoreWidth(factor.score)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">{factor.description}</p>
          </div>
        ))}
      </div>

      {/* Shared Interests Details */}
      {sharedInterests.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 font-semibold text-gray-900">
            Your Shared Interests ({sharedInterests.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {sharedInterests.map((interest, index) => (
              <span
                key={index}
                className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Common Events */}
      {commonEvents.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 font-semibold text-gray-900">
            Events You've Both Attended
          </h4>
          <div className="space-y-2">
            {commonEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-gray-600"
              >
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span>{event}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Tips */}
      <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4">
        <h4 className="mb-2 font-semibold text-gray-900">
          💡 Conversation Starters
        </h4>
        <div className="space-y-1 text-sm text-gray-600">
          {sharedInterests.length > 0 && (
            <p>• Ask about their experience with {sharedInterests[0]}</p>
          )}
          {commonEvents.length > 0 && (
            <p>• Mention you were both at {commonEvents[0]}</p>
          )}
          <p>• Share what you're looking forward to in upcoming events</p>
        </div>
      </div>
    </div>
  )
}
