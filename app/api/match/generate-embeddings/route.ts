import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[]
  }>
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Preprocess text for consistency
  const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ')

  if (!cleanText) {
    // Return zero vector for empty text
    return new Array(EMBEDDING_DIMENSIONS).fill(0)
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanText,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
    )
  }

  const data: OpenAIEmbeddingResponse = await response.json()
  return data.data[0].embedding
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute for expensive AI operations
  const rateLimitResponse = checkRateLimit(request, 'expensive')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { user } = await requireAuth()
    const supabase = createClient()

    // Get request body
    const { profileId, forceRegenerate = false } = await request.json()

    // Use authenticated user's ID if no profileId provided
    const targetProfileId = profileId || user.id

    // Check if user has permission to generate embeddings for this profile
    if (targetProfileId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to generate embeddings for this profile' },
        { status: 403 }
      )
    }

    // Get the profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, bio, interests, bio_embedding, interests_embedding')
      .eq('id', targetProfileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const updates: { bio_embedding?: string; interests_embedding?: string } = {}
    let embeddingsGenerated = 0

    // Generate bio embedding if bio exists and embedding doesn't exist or force regenerate
    if (profile.bio && (!profile.bio_embedding || forceRegenerate)) {
      try {
        const bioEmbedding = await generateEmbedding(profile.bio)
        updates.bio_embedding = JSON.stringify(bioEmbedding)
        embeddingsGenerated++
      } catch (error) {
        console.error('Error generating bio embedding:', error)
        return NextResponse.json(
          { error: 'Failed to generate bio embedding' },
          { status: 500 }
        )
      }
    }

    // Generate interests embedding if interests exist and embedding doesn't exist or force regenerate
    if (
      profile.interests &&
      Array.isArray(profile.interests) &&
      profile.interests.length > 0 &&
      (!profile.interests_embedding || forceRegenerate)
    ) {
      try {
        // Convert interests array to a readable string
        const interestsText = profile.interests.join(', ')
        const interestsEmbedding = await generateEmbedding(interestsText)
        updates.interests_embedding = JSON.stringify(interestsEmbedding)
        embeddingsGenerated++
      } catch (error) {
        console.error('Error generating interests embedding:', error)
        return NextResponse.json(
          { error: 'Failed to generate interests embedding' },
          { status: 500 }
        )
      }
    }

    // Update the profile with new embeddings
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', targetProfileId)

      if (updateError) {
        console.error('Error updating profile embeddings:', updateError)
        return NextResponse.json(
          { error: 'Failed to save embeddings' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      embeddingsGenerated,
      message:
        embeddingsGenerated > 0
          ? `Generated ${embeddingsGenerated} embedding(s)`
          : 'No embeddings needed',
    })
  } catch (error) {
    console.error('Error in generate-embeddings API:', error)

    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    )
  }
}

// GET endpoint to check embedding status
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const supabase = createClient()

    // Get the profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, bio, interests, bio_embedding, interests_embedding')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const status = {
      hasBio: !!profile.bio,
      hasBioEmbedding: !!profile.bio_embedding,
      hasInterests: !!(
        profile.interests &&
        Array.isArray(profile.interests) &&
        profile.interests.length > 0
      ),
      hasInterestsEmbedding: !!profile.interests_embedding,
    }

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      embeddingStatus: status,
      needsEmbeddings:
        (status.hasBio && !status.hasBioEmbedding) ||
        (status.hasInterests && !status.hasInterestsEmbedding),
    })
  } catch (error) {
    console.error('Error checking embedding status:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
