import { createClient } from '@/lib/supabase/server'

interface ScoreComponents {
  interest_score: number
  bio_similarity: number
  age_score: number
  location_score: number
}

interface MatchResult {
  success: boolean
  error?: string
  matches: any[]
}

export async function calculateMatches(
  userId: string,
  limit = 50
): Promise<MatchResult> {
  try {
    if (!userId || userId === 'invalid-user-id') {
      return { success: false, error: 'Invalid user ID provided', matches: [] }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('calculate_user_matches', {
      target_user_id: userId,
    })

    if (error) {
      return { success: false, error: error.message, matches: [] }
    }

    // Sort by match score descending and limit results
    const sortedMatches = (data || [])
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, limit)

    return { success: true, matches: sortedMatches }
  } catch (error) {
    return { success: false, error: 'Database connection failed', matches: [] }
  }
}

export function calculateOverallScore(
  components: Partial<ScoreComponents>
): number {
  const weights = {
    interest_score: 0.4,
    bio_similarity: 0.3,
    age_score: 0.2,
    location_score: 0.1,
  }

  const defaultValues = {
    interest_score: 0,
    bio_similarity: 0,
    age_score: 0,
    location_score: 0,
  }

  // Fill in missing components with defaults
  const fullComponents = { ...defaultValues, ...components }

  const score =
    fullComponents.interest_score * weights.interest_score +
    fullComponents.bio_similarity * weights.bio_similarity +
    fullComponents.age_score * weights.age_score +
    fullComponents.location_score * weights.location_score

  return Math.max(0, Math.min(1, score)) // Clamp to [0, 1]
}

export async function getFilteredMatches(
  userId: string,
  threshold: number
): Promise<MatchResult> {
  try {
    const allMatches = await calculateMatches(userId)

    if (!allMatches.success) {
      return allMatches
    }

    const filteredMatches = allMatches.matches.filter(
      match => match.match_score >= threshold
    )

    return { success: true, matches: filteredMatches }
  } catch (error) {
    return { success: false, error: 'An error occurred', matches: [] }
  }
}
