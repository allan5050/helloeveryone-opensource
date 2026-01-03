import { NextRequest, NextResponse } from 'next/server'

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

interface EnhancedMatchRequest {
  enableDiversity?: boolean
  diversityFactor?: number // 0-0.2 range
  interestWeights?: Record<string, number> // Interest -> weight (1-5)
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

// Weighted Jaccard similarity
function weightedJaccardSimilarity(
  set1: string[],
  set2: string[],
  weights?: Record<string, number>
): number {
  if (!set1?.length || !set2?.length) return 0

  const allItems = new Set([...set1, ...set2])
  let weightedIntersection = 0
  let weightedUnion = 0

  allItems.forEach(item => {
    const weight = weights?.[item] || 3 // Default weight of 3 (neutral)
    const inSet1 = set1.includes(item)
    const inSet2 = set2.includes(item)

    if (inSet1 && inSet2) {
      weightedIntersection += weight
    }
    if (inSet1 || inSet2) {
      weightedUnion += weight
    }
  })

  return weightedUnion === 0 ? 0 : weightedIntersection / weightedUnion
}

// Fuzzy interest matching with semantic understanding
function semanticInterestMatch(
  interests1: string[],
  interests2: string[]
): number {
  if (!interests1?.length || !interests2?.length) return 0

  // Define semantic clusters
  const clusters: Record<string, string[]> = {
    tech: [
      'data-science',
      'machine-learning',
      'software-engineering',
      'devops',
      'cybersecurity',
      'blockchain',
      'ai',
      'nlp',
    ],
    health: [
      'healthcare',
      'medical-research',
      'fitness',
      'yoga',
      'running',
      'pilates',
      'nutrition',
      'wellness',
    ],
    creative: [
      'art',
      'design',
      'photography',
      'music',
      'writing',
      'illustration',
      'sketching',
    ],
    social: [
      'volunteering',
      'community',
      'mentoring',
      'networking',
      'social-impact',
    ],
    lifestyle: [
      'cooking',
      'food',
      'wine',
      'coffee',
      'travel',
      'gardening',
      'baking',
    ],
    entertainment: [
      'gaming',
      'board-games',
      'movies',
      'reading',
      'podcasts',
      'sci-fi',
      'star-trek',
      'star-wars',
    ],
    pets: ['dogs', 'cats', 'pets', 'animals'],
    sports: [
      'basketball',
      'golf',
      'cycling',
      'hiking',
      'climbing',
      'triathlon',
    ],
    family: ['parenting', 'kids', 'education', 'family'],
  }

  // Check which clusters each user's interests belong to
  const userClusters1 = new Set<string>()
  const userClusters2 = new Set<string>()

  interests1.forEach((interest: string) => {
    Object.entries(clusters).forEach(([cluster, keywords]) => {
      if (keywords.some(kw => interest.includes(kw))) {
        userClusters1.add(cluster)
      }
    })
  })

  interests2.forEach(interest => {
    Object.entries(clusters).forEach(([cluster, keywords]) => {
      if (keywords.some(kw => interest.includes(kw))) {
        userClusters2.add(cluster)
      }
    })
  })

  // Calculate cluster overlap
  const commonClusters = [...userClusters1].filter(c => userClusters2.has(c))
  const allClusters = new Set([...userClusters1, ...userClusters2])

  return allClusters.size === 0 ? 0 : commonClusters.length / allClusters.size
}

// Age compatibility with configurable tolerance
function calculateAgeCompatibility(
  age1: number,
  age2: number,
  tolerance: number = 5
): number {
  if (!age1 || !age2) return 0.5

  const diff = Math.abs(age1 - age2)

  // Different scoring based on age difference
  if (diff <= tolerance) return 1.0 // Perfect match within tolerance
  if (diff <= tolerance * 2) return 0.8 // Good match
  if (diff <= tolerance * 3) return 0.5 // Moderate match
  if (diff <= tolerance * 4) return 0.3 // Weak match
  return 0.1 // Very weak but not zero (for diversity)
}

// Serendipity factor - introduces controlled randomness
function addSerendipity(baseScore: number, factor: number = 0.1): number {
  // Add random variation between -factor and +factor
  const randomAdjustment = (Math.random() - 0.5) * 2 * factor
  return Math.max(0, Math.min(1, baseScore + randomAdjustment))
}

// Calculate match score with all enhancements
function calculateEnhancedMatchScore(
  user1: User,
  user2: User,
  options: EnhancedMatchRequest = {}
) {
  const {
    enableDiversity = true,
    diversityFactor = 0.1,
    interestWeights,
  } = options

  // 1. Interest similarity (weighted if provided)
  const exactInterestScore = interestWeights
    ? weightedJaccardSimilarity(
        user1.interests || [],
        user2.interests || [],
        interestWeights
      )
    : calculateJaccardSimilarity(user1.interests || [], user2.interests || [])

  const semanticInterestScore = semanticInterestMatch(
    user1.interests || [],
    user2.interests || []
  )
  const interestScore = exactInterestScore * 0.6 + semanticInterestScore * 0.4

  // 2. Bio semantic similarity
  const semanticScore =
    user1.bio_embedding && user2.bio_embedding
      ? cosineSimilarity(user1.bio_embedding, user2.bio_embedding)
      : 0.5

  // 3. Age compatibility
  const ageScore = calculateAgeCompatibility(user1.age, user2.age)

  // 4. Location proximity
  const locationScore = calculateLocationMatch(user1.location, user2.location)

  // 5. Profile completeness
  const completeness1 =
    [user1.bio, user1.interests?.length, user1.age, user1.location].filter(
      x => x
    ).length / 4
  const completeness2 =
    [user2.bio, user2.interests?.length, user2.age, user2.location].filter(
      x => x
    ).length / 4
  const completenessBonus = (completeness1 + completeness2) / 2

  // Base weights (can be adjusted)
  const weights = {
    interests: 0.35,
    semantic: 0.25,
    age: 0.15,
    location: 0.15,
    completeness: 0.1,
  }

  // Calculate base score
  const baseScore =
    interestScore * weights.interests +
    semanticScore * weights.semantic +
    ageScore * weights.age +
    locationScore * weights.location +
    completenessBonus * weights.completeness

  // Apply diversity/serendipity if enabled
  const finalScore = enableDiversity
    ? addSerendipity(baseScore, diversityFactor)
    : baseScore

  // Determine match category for UI display
  let matchCategory: 'low' | 'medium' | 'high'
  if (finalScore >= 0.7) matchCategory = 'high'
  else if (finalScore >= 0.4) matchCategory = 'medium'
  else matchCategory = 'low'

  return {
    score: finalScore,
    baseScore,
    matchCategory,
    diversityApplied: enableDiversity,
    components: {
      interests: {
        exact: exactInterestScore,
        semantic: semanticInterestScore,
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
    insights: generateMatchInsights(
      user1,
      user2,
      finalScore,
      interestScore,
      ageScore
    ),
  }
}

// Generate human-readable insights
function generateMatchInsights(
  user1: User,
  user2: User,
  score: number,
  interestScore: number,
  ageScore: number
): string[] {
  const insights: string[] = []

  // Common interests
  const commonInterests =
    user1.interests?.filter(i => user2.interests?.includes(i)) || []
  if (commonInterests.length > 0) {
    insights.push(
      `Share ${commonInterests.length} common interests: ${commonInterests.slice(0, 3).join(', ')}`
    )
  }

  // Age compatibility
  if (ageScore > 0.8) {
    insights.push('Very compatible age range')
  } else if (ageScore > 0.5) {
    insights.push('Compatible age range')
  }

  // Location
  if (user1.location === user2.location) {
    insights.push('Same neighborhood')
  }

  // Overall compatibility
  if (score > 0.7) {
    insights.push('Strong overall compatibility')
  } else if (score > 0.5) {
    insights.push('Good potential for connection')
  } else if (score > 0.3) {
    insights.push('Some common ground')
  }

  return insights
}

// Helper functions
function calculateJaccardSimilarity(set1: string[], set2: string[]): number {
  if (!set1?.length || !set2?.length) return 0
  const intersection = set1.filter(x => set2.includes(x)).length
  const union = new Set([...set1, ...set2]).size
  return union === 0 ? 0 : intersection / union
}

function calculateLocationMatch(loc1: string, loc2: string): number {
  if (!loc1 || !loc2) return 0.5
  if (loc1 === loc2) return 1.0
  const zip1 = parseInt(loc1)
  const zip2 = parseInt(loc2)
  if (!isNaN(zip1) && !isNaN(zip2)) {
    const diff = Math.abs(zip1 - zip2)
    if (diff <= 3) return 0.7
    if (diff <= 10) return 0.3
  }
  return 0.0
}

export async function POST(request: NextRequest) {
  const devCheck = checkDevelopmentOnly()
  if (devCheck) return devCheck

  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => ({}))
    const options: EnhancedMatchRequest = body

    // Fetch all demo users
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

    // Calculate enhanced pairwise match scores
    const scores = []
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const matchData = calculateEnhancedMatchScore(
          users[i],
          users[j],
          options
        )
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

    // Calculate distribution stats
    const distribution = {
      high: scores.filter(s => s.matchCategory === 'high').length,
      medium: scores.filter(s => s.matchCategory === 'medium').length,
      low: scores.filter(s => s.matchCategory === 'low').length,
    }

    return NextResponse.json({
      scores,
      metadata: {
        total_users: users.length,
        total_pairs: scores.length,
        avg_score: scores.reduce((a, b) => a + b.score, 0) / scores.length,
        diversity_enabled: options.enableDiversity ?? true,
        diversity_factor: options.diversityFactor ?? 0.1,
        distribution,
        top_matches: scores.slice(0, 5).map(s => ({
          pair: `${s.user1_name} ↔ ${s.user2_name}`,
          score: `${(s.score * 100).toFixed(0)}%`,
          category: s.matchCategory,
          insights: s.insights,
        })),
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
