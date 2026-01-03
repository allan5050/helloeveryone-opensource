import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// SECURITY: Only allow in development environment
function checkDevelopmentOnly() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }
  return null
}

interface User {
  user_id: string
  display_name: string
  age: number
  location: string
  interests: string[]
  bio: string
  bio_embedding?: number[]
}

// Calculate cosine similarity for embeddings
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (!vec1?.length || !vec2?.length || vec1.length !== vec2.length) return 0

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
  return denominator === 0 ? 0 : dotProduct / denominator
}

// Calculate Jaccard similarity for interests
function calculateJaccardSimilarity(set1: string[], set2: string[]): number {
  if (!set1?.length || !set2?.length) return 0

  const intersection = set1.filter(x => set2.includes(x)).length
  const union = new Set([...set1, ...set2]).size

  return union === 0 ? 0 : intersection / union
}

// Fuzzy match interests (for partial matches)
function fuzzyInterestMatch(
  interests1: string[],
  interests2: string[]
): number {
  if (!interests1?.length || !interests2?.length) return 0

  let matches = 0
  const total = Math.max(interests1.length, interests2.length)

  for (const i1 of interests1) {
    for (const i2 of interests2) {
      // Exact match
      if (i1 === i2) {
        matches += 1
        break
      }
      // Partial match (e.g., "data-science" and "data-analytics")
      if (i1.includes(i2) || i2.includes(i1)) {
        matches += 0.5
        break
      }
      // Category match (e.g., both contain "tech")
      const commonWords = [
        'tech',
        'science',
        'data',
        'fitness',
        'music',
        'food',
        'travel',
      ]
      for (const word of commonWords) {
        if (i1.includes(word) && i2.includes(word)) {
          matches += 0.3
          break
        }
      }
    }
  }

  return matches / total
}

// Calculate age compatibility
function calculateAgeCompatibility(age1: number, age2: number): number {
  if (!age1 || !age2) return 0.5

  const diff = Math.abs(age1 - age2)
  // Gaussian-like decay
  return Math.exp(-(diff * diff) / 100)
}

// Calculate location match
function calculateLocationMatch(loc1: string, loc2: string): number {
  if (!loc1 || !loc2) return 0.5

  // Same zip code
  if (loc1 === loc2) return 1.0

  // Adjacent zip codes (simplified - in reality would use geo distance)
  const zip1 = parseInt(loc1)
  const zip2 = parseInt(loc2)
  if (!isNaN(zip1) && !isNaN(zip2)) {
    const diff = Math.abs(zip1 - zip2)
    if (diff <= 3) return 0.7
    if (diff <= 10) return 0.3
  }

  return 0.0
}

// Advanced match calculation with multiple dimensions
function calculateAdvancedMatchScore(user1: User, user2: User) {
  // 1. Interest similarity (exact + fuzzy)
  const exactInterestScore = calculateJaccardSimilarity(
    user1.interests || [],
    user2.interests || []
  )
  const fuzzyInterestScore = fuzzyInterestMatch(
    user1.interests || [],
    user2.interests || []
  )
  const interestScore = exactInterestScore * 0.7 + fuzzyInterestScore * 0.3

  // 2. Bio semantic similarity (if embeddings available)
  const semanticScore =
    user1.bio_embedding && user2.bio_embedding
      ? cosineSimilarity(user1.bio_embedding, user2.bio_embedding)
      : 0.5

  // 3. Age compatibility
  const ageScore = calculateAgeCompatibility(user1.age, user2.age)

  // 4. Location proximity
  const locationScore = calculateLocationMatch(user1.location, user2.location)

  // 5. Profile completeness bonus
  const completeness1 =
    [user1.bio, user1.interests?.length, user1.age, user1.location].filter(
      x => x
    ).length / 4
  const completeness2 =
    [user2.bio, user2.interests?.length, user2.age, user2.location].filter(
      x => x
    ).length / 4
  const completenessBonus = (completeness1 + completeness2) / 2

  // Weighted combination
  const weights = {
    interests: 0.35, // 35% - Common interests are key
    semantic: 0.25, // 25% - Bio compatibility
    age: 0.15, // 15% - Age proximity
    location: 0.15, // 15% - Geographic proximity
    completeness: 0.1, // 10% - Profile quality bonus
  }

  const overallScore =
    interestScore * weights.interests +
    semanticScore * weights.semantic +
    ageScore * weights.age +
    locationScore * weights.location +
    completenessBonus * weights.completeness

  return {
    score: overallScore,
    interest_overlap: interestScore,
    semantic_similarity: semanticScore,
    age_compatibility: ageScore,
    location_match: locationScore,
    profile_quality: completenessBonus,
    breakdown: {
      interests: {
        exact: exactInterestScore,
        fuzzy: fuzzyInterestScore,
        combined: interestScore,
        weight: weights.interests,
        contribution: interestScore * weights.interests,
      },
      semantic: {
        score: semanticScore,
        weight: weights.semantic,
        contribution: semanticScore * weights.semantic,
      },
      age: {
        score: ageScore,
        diff: Math.abs((user1.age || 0) - (user2.age || 0)),
        weight: weights.age,
        contribution: ageScore * weights.age,
      },
      location: {
        score: locationScore,
        weight: weights.location,
        contribution: locationScore * weights.location,
      },
      quality: {
        score: completenessBonus,
        weight: weights.completeness,
        contribution: completenessBonus * weights.completeness,
      },
    },
  }
}

export async function POST() {
  const devCheck = checkDevelopmentOnly()
  if (devCheck) return devCheck

  try {
    const supabase = await createClient()

    // Fetch all demo users with embeddings if available
    const { data: users, error } = await supabase
      .from('profiles')
      .select(
        'user_id, display_name, age, location, interests, bio, bio_embedding'
      )
      .like('display_name', 'Demo:%')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ scores: [] })
    }

    // Calculate pairwise match scores with advanced algorithm
    const scores = []
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const matchData = calculateAdvancedMatchScore(users[i], users[j])
        scores.push({
          user1_id: users[i].user_id,
          user2_id: users[j].user_id,
          user1_name: users[i].display_name,
          user2_name: users[j].display_name,
          ...matchData,
        })
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    // Optionally store in match_scores table for persistence
    // This would allow historical tracking and caching

    return NextResponse.json({
      scores,
      metadata: {
        total_users: users.length,
        total_pairs: scores.length,
        avg_score: scores.reduce((a, b) => a + b.score, 0) / scores.length,
        strong_matches: scores.filter(s => s.score > 0.7).length,
        medium_matches: scores.filter(s => s.score >= 0.5 && s.score <= 0.7)
          .length,
        weak_matches: scores.filter(s => s.score < 0.5).length,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
