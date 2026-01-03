import { NextRequest, NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/api/rate-limit'
import { createClient } from '@/lib/supabase/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_LLM_MODEL || 'claude-sonnet-4-20250514'

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute for expensive AI operations
  const rateLimitResponse = checkRateLimit(request, 'expensive')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const {
      matchIds,
      currentUser,
      targetUser,
      sharedInterests,
      matchQuality,
      forceRefresh,
    } = await request.json()

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json(
        { error: 'matchIds array is required' },
        { status: 400 }
      )
    }

    // Get the current user from session
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = user.id
    const targetUserId = matchIds[0] // We're processing one match at a time

    // Check if we already have AI insights for this match (unless force refresh)
    if (!forceRefresh) {
      const { data: existingInsight } = await supabase
        .from('ai_insights')
        .select(
          'compatibility_reason, conversation_starters, meeting_suggestions, shared_interests'
        )
        .eq('user_id', currentUserId)
        .eq('target_user_id', targetUserId)
        .single()

      // If we have existing insights, return them
      if (existingInsight && existingInsight.compatibility_reason) {
        const explanations = [
          {
            user_id: targetUserId,
            display_name: 'Match',
            compatibilityReason: existingInsight.compatibility_reason,
            conversationStarters: existingInsight.conversation_starters || [],
            meetingSuggestions: existingInsight.meeting_suggestions || [],
            sharedInterests: existingInsight.shared_interests || [],
            isHighPriority: true,
            fromCache: true,
          },
        ]

        return NextResponse.json({
          explanations,
          overallInsight:
            'AI-powered insights to help you make meaningful connections.',
          topRecommendations: [
            'Reach out with a personal message',
            'Suggest meeting for coffee',
            'Find shared activities',
          ],
        })
      }
    }

    // If no AI key, return mock data based on match quality
    if (!ANTHROPIC_API_KEY) {
      let mockReason = ''
      let mockSuggestions = []

      if (matchQuality === 'high' || sharedInterests?.length > 2) {
        mockReason = `You both share strong interests in ${sharedInterests?.slice(0, 3).join(', ') || 'multiple areas'}, which creates excellent potential for meaningful conversations and shared activities. Your complementary backgrounds could lead to engaging exchanges.`
        mockSuggestions = [
          'Specialty coffee tasting',
          'Local museum visit',
          'Cooking class',
          'Weekend farmers market',
        ]
      } else if (matchQuality === 'medium' || sharedInterests?.length > 0) {
        mockReason = `You share some common interests in ${sharedInterests?.join(', ') || 'a few areas'}, which provides a good starting point for conversation. There's potential to discover more common ground through shared experiences.`
        mockSuggestions = [
          'Local coffee shop',
          'Community event',
          'Public park walk',
          'Bookstore café',
        ]
      } else {
        mockReason =
          "While you don't have many obvious shared interests based on your profiles, sometimes the best connections come from unexpected places. Meeting in person could reveal commonalities that aren't apparent on paper."
        mockSuggestions = [
          'Casual coffee meetup',
          'Community volunteer event',
          'Local trivia night',
          'Public library café',
        ]
      }

      const mockExplanations = matchIds.map((userId: string) => ({
        user_id: userId,
        display_name: 'Demo User',
        compatibilityReason: mockReason,
        sharedInterests: sharedInterests || [],
        conversationStarters: [],
        meetingSuggestions: mockSuggestions,
        isHighPriority: matchQuality === 'high',
      }))

      return NextResponse.json({
        explanations: mockExplanations,
        overallInsight:
          'These connections show great potential for meaningful relationships based on shared interests and compatible lifestyles.',
        topRecommendations: [
          'Start with a message about shared interests',
          'Suggest meeting for coffee',
          'Ask about travel experiences',
        ],
      })
    }

    // Get location from current user's profile for location-specific suggestions
    // Get current user's actual profile data if not provided
    let userLocation = currentUser?.location
    if (!userLocation) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('location')
        .eq('user_id', currentUserId)
        .single()
      userLocation = userProfile?.location || 'United States'
    }

    // Get target user's profile data if not provided
    let targetUserBio = targetUser?.bio
    let targetUserInterests = targetUser?.interests
    if (!targetUserBio || !targetUserInterests) {
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('bio, interests')
        .eq('user_id', targetUserId)
        .single()
      targetUserBio = targetProfile?.bio || targetUser?.bio || ''
      targetUserInterests =
        targetProfile?.interests || targetUser?.interests || []
    }

    // Determine the appropriate prompt based on match quality
    const matchQualityLevel = matchQuality || 'low'

    let qualityContext = ''
    if (matchQualityLevel === 'low') {
      qualityContext = `IMPORTANT: This is a LOW compatibility match with very few or no shared interests.
Be HONEST about the limited common ground. It's OKAY to say they don't have much in common.
If there's truly no clear connection, suggest that they could try meeting for coffee or attending a community event to explore if they might discover unexpected common ground.
DO NOT make up shared interests or compatibility that doesn't exist.`
    } else if (matchQualityLevel === 'medium') {
      qualityContext =
        'This is a MEDIUM compatibility match with some shared interests. Focus on the genuine commonalities that exist.'
    } else {
      qualityContext =
        'This is a HIGH compatibility match with strong shared interests. Highlight the natural connection points.'
    }

    // Call Claude API for real insights
    const systemPrompt = `You are a helpful AI that explains why people might connect well.
    Focus on shared interests, complementary personalities, and networking potential.
    NEVER comment on appearance, race, religion, or make romantic suggestions.
    Keep suggestions appropriate for platonic connections and professional networking.
    Be HONEST about compatibility - if two people have little in common, say so.
    For meeting suggestions, suggest SPECIFIC types of venues or activities that would be good for a first meeting.
    These should be public places with reasonable cost (under $30 per person).
    Respond in JSON format only.`

    const userPrompt = `${qualityContext}

Current user bio: "${currentUser?.bio || 'No bio provided'}"
Current user interests: ${currentUser?.interests?.join(', ') || 'None specified'}
Current user location: ${userLocation}

Match profile bio: "${targetUserBio || 'No bio provided'}"
Match interests: ${targetUserInterests?.join(', ') || 'None specified'}
Shared interests: ${sharedInterests?.length > 0 ? sharedInterests.join(', ') : 'NONE'}

Provide an HONEST assessment of why they might (or might not) connect well, and suggest 3-4 specific places or activities where they could meet.

If they have little in common, acknowledge this honestly and suggest neutral meeting places where they might discover unexpected connections.

Respond in this JSON format:
{
  "compatibilityReason": "string",
  "meetingSuggestions": ["string", "string", "string", "string"]
}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 500,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        throw new Error('Claude API error')
      }

      const data = await response.json()
      const content = data.content[0]?.text

      let aiInsight
      try {
        const parsed = JSON.parse(content)
        // Ensure we have the right structure
        aiInsight = {
          compatibilityReason: parsed.compatibilityReason,
          conversationStarters: [], // No longer using conversation starters
          meetingSuggestions: parsed.meetingSuggestions || [],
        }
      } catch {
        // Fallback if JSON parsing fails
        aiInsight = {
          compatibilityReason:
            'Great potential for connection based on shared interests and complementary backgrounds.',
          conversationStarters: [],
          meetingSuggestions: [
            'Local coffee shop',
            'Board game café',
            'Walking trail',
            'Art gallery',
          ],
        }
      }

      // Save the AI insight to database
      const { error: saveError } = await supabase.from('ai_insights').upsert({
        user_id: currentUserId,
        target_user_id: targetUserId,
        compatibility_reason: aiInsight.compatibilityReason,
        conversation_starters: aiInsight.conversationStarters,
        meeting_suggestions: aiInsight.meetingSuggestions,
        shared_interests: sharedInterests || [],
      })

      if (saveError) {
        console.error('Error saving AI insight:', saveError)
      }

      const explanations = matchIds.map((userId: string) => ({
        user_id: userId,
        display_name: 'Match',
        ...aiInsight,
        sharedInterests: sharedInterests || [],
        isHighPriority: true,
        fromCache: false,
      }))

      return NextResponse.json({
        explanations,
        overallInsight:
          'AI-powered insights to help you make meaningful connections.',
        topRecommendations: [
          'Reach out with a personal message',
          'Suggest meeting for coffee',
          'Find shared activities',
        ],
      })
    } catch (aiError) {
      console.error('AI API error:', aiError)
      // Return fallback response based on actual compatibility
      const compatReason =
        sharedInterests?.length > 0
          ? `You share interests in ${sharedInterests.slice(0, 3).join(', ')}, which could be a good starting point for connection.`
          : 'While you may not have obvious shared interests, meeting in person could reveal unexpected common ground.'

      const fallbackExplanations = matchIds.map((userId: string) => ({
        user_id: userId,
        display_name: 'Match User',
        compatibilityReason: compatReason,
        sharedInterests: sharedInterests || [],
        conversationStarters: [],
        meetingSuggestions: [
          'Coffee shop',
          'Public park',
          'Library café',
          'Community center',
        ],
        isHighPriority: matchQuality === 'high',
      }))

      return NextResponse.json({
        explanations: fallbackExplanations,
        overallInsight:
          'These connections offer great potential for meaningful relationships.',
        topRecommendations: [
          'Start with a friendly message',
          'Suggest meeting for coffee',
        ],
      })
    }
  } catch (error) {
    console.error('Error in simple explain matches API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
