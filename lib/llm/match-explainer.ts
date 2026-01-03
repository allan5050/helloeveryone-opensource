import { callClaude } from './claude-client'

export interface UserProfile {
  user_id: string
  display_name: string
  bio?: string
  age?: number
  interests: string[]
  location?: string
  looking_for?: string[]
  availability?: string[]
}

export interface MatchExplanation {
  user_id: string
  display_name: string
  compatibilityReason: string
  sharedInterests: string[]
  conversationStarters: string[]
  meetingSuggestions: string[]
  isHighPriority: boolean
}

export interface MatchExplanationsResponse {
  explanations: MatchExplanation[]
  overallInsight: string
  topRecommendations: string[]
}

const SAFETY_GUARDRAILS = `
IMPORTANT SAFETY GUIDELINES - You MUST follow these rules:
1. Never make comments about physical appearance, race, ethnicity, religion, or sexuality
2. Never make assumptions about someone's personal life, relationship status, or family situation
3. Focus only on shared interests, activities, and positive personality traits
4. Keep suggestions appropriate for platonic connections and networking
5. Avoid romantic language or dating-specific advice
6. If you cannot provide safe, appropriate explanations, return a generic positive message
7. Be encouraging but realistic - don't oversell compatibility
8. Respect privacy - only use information explicitly provided
`

const MATCH_EXPLANATION_PROMPT = `
You are a helpful AI assistant that explains why people might be good connections based on their profiles and shared interests. You help busy professionals understand potential networking and friendship opportunities.

${SAFETY_GUARDRAILS}

For each potential match, provide:
1. A brief, encouraging explanation of why they might connect well (2-3 sentences)
2. Shared interests that could be conversation topics
3. 2-3 natural conversation starters based on their profiles
4. 1-2 activity suggestions for meeting (coffee, events, etc.)
5. Whether this seems like a high-priority connection

Focus on intellectual compatibility, shared activities, and professional networking potential.
Keep explanations concise, positive, and actionable for someone who is busy and doesn't want to spend time filtering through profiles.
`

export async function explainMatches(
  currentUser: UserProfile,
  potentialMatches: UserProfile[],
  matchScores?: { [userId: string]: number }
): Promise<MatchExplanationsResponse> {
  try {
    // Safety check: limit number of matches to process
    const matchesToProcess = potentialMatches.slice(0, 10)

    const userProfileText = `
User Profile:
- Name: ${currentUser.display_name}
- Bio: ${currentUser.bio || 'Not provided'}
- Age: ${currentUser.age || 'Not specified'}
- Interests: ${currentUser.interests.join(', ')}
- Location: ${currentUser.location || 'Not specified'}
- Looking for: ${currentUser.looking_for?.join(', ') || 'General connections'}
`

    const matchesText = matchesToProcess
      .map(
        (match, index) => `
Match ${index + 1}:
- Name: ${match.display_name}
- Bio: ${match.bio || 'Not provided'}
- Age: ${match.age || 'Not specified'}
- Interests: ${match.interests.join(', ')}
- Location: ${match.location || 'Not specified'}
- Match Score: ${matchScores?.[match.user_id] ? `${Math.round(matchScores[match.user_id] * 100)}%` : 'Not calculated'}
`
      )
      .join('\n')

    const userMessage = `
${userProfileText}

Potential Matches:
${matchesText}

Please analyze these potential connections and provide explanations for why each person might be a good match for networking or friendship. For each match, provide:

1. Compatibility reason (2-3 sentences explaining why they'd connect well)
2. Shared interests list
3. 2-3 conversation starters
4. 1-2 meeting suggestions
5. High priority status (true/false)

Also provide an overall insight about the user's matching patterns and top 3 recommendations for who to reach out to first.

Format your response as JSON with this structure:
{
  "explanations": [
    {
      "user_id": "string",
      "display_name": "string",
      "compatibilityReason": "string",
      "sharedInterests": ["string"],
      "conversationStarters": ["string"],
      "meetingSuggestions": ["string"],
      "isHighPriority": boolean
    }
  ],
  "overallInsight": "string",
  "topRecommendations": ["string"]
}
`

    const response = await callClaude(
      [{ role: 'user', content: userMessage }],
      {
        systemPrompt: MATCH_EXPLANATION_PROMPT,
        maxTokens: 2000,
        temperature: 0.8,
      }
    )

    // Parse the JSON response
    let parsedResponse: MatchExplanationsResponse
    try {
      parsedResponse = JSON.parse(response.content)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      // Fallback response
      return generateFallbackResponse(matchesToProcess)
    }

    // Validate and sanitize the response
    return validateAndSanitizeResponse(parsedResponse, matchesToProcess)
  } catch (error) {
    console.error('Error explaining matches:', error)
    return generateFallbackResponse(potentialMatches.slice(0, 10))
  }
}

function generateFallbackResponse(
  matches: UserProfile[]
): MatchExplanationsResponse {
  return {
    explanations: matches.map(match => ({
      user_id: match.user_id,
      display_name: match.display_name,
      compatibilityReason:
        'You both have interesting profiles that suggest potential for good conversation and shared activities.',
      sharedInterests: [],
      conversationStarters: [
        'Hi! I noticed we might have some common interests.',
        'Would love to chat about shared hobbies sometime.',
      ],
      meetingSuggestions: ['Coffee meetup', 'Local event'],
      isHighPriority: false,
    })),
    overallInsight:
      'These connections show promise for meaningful networking and friendship opportunities.',
    topRecommendations: [
      'Reach out with a friendly message',
      'Suggest meeting for coffee',
      'Find a shared activity',
    ],
  }
}

function validateAndSanitizeResponse(
  response: MatchExplanationsResponse,
  originalMatches: UserProfile[]
): MatchExplanationsResponse {
  // Ensure we have explanations for all matches
  const validatedExplanations = originalMatches.map(match => {
    const explanation = response.explanations.find(
      e => e.user_id === match.user_id
    )
    return (
      explanation || {
        user_id: match.user_id,
        display_name: match.display_name,
        compatibilityReason:
          'Great potential for connection based on shared interests.',
        sharedInterests: [],
        conversationStarters: [
          'Hi! Nice to meet you.',
          'Would love to chat sometime.',
        ],
        meetingSuggestions: ['Coffee', 'Local event'],
        isHighPriority: false,
      }
    )
  })

  return {
    explanations: validatedExplanations,
    overallInsight:
      response.overallInsight ||
      'These connections offer great potential for meaningful relationships.',
    topRecommendations: response.topRecommendations || [
      'Start with a friendly message',
      'Suggest meeting for coffee',
    ],
  }
}
