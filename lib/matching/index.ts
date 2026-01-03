/**
 * Matching Engine Helper Functions
 *
 * This module provides utility functions for calculating various components
 * of the matching score algorithm.
 */

export interface Profile {
  id: string
  bio?: string
  interests?: string[]
  age?: number
  location?: string
  bio_embedding?: number[]
  interests_embedding?: number[]
}

export interface MatchBreakdown {
  bioSimilarity: number
  interestOverlap: number
  ageProximity: number
  locationBonus: number
  total: number
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)

  if (magnitude === 0) {
    return 0
  }

  return dotProduct / magnitude
}

/**
 * Calculate bio similarity score (30% of total)
 */
export function calculateBioSimilarity(
  profile1: Profile,
  profile2: Profile
): number {
  if (!profile1.bio_embedding || !profile2.bio_embedding) {
    return 0
  }

  const similarity = cosineSimilarity(
    profile1.bio_embedding,
    profile2.bio_embedding
  )
  return Math.max(0, similarity) * 30
}

/**
 * Calculate interest overlap score (40% of total)
 * Uses both exact matching and semantic similarity
 */
export function calculateInterestOverlap(
  profile1: Profile,
  profile2: Profile
): number {
  const interests1 = profile1.interests || []
  const interests2 = profile2.interests || []

  if (interests1.length === 0 || interests2.length === 0) {
    return 0
  }

  // Exact match calculation (Jaccard similarity)
  const set1 = new Set(interests1.map(i => i.toLowerCase().trim()))
  const set2 = new Set(interests2.map(i => i.toLowerCase().trim()))

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  const exactMatchScore = union.size > 0 ? intersection.size / union.size : 0

  // Semantic similarity score using embeddings
  let semanticScore = 0
  if (profile1.interests_embedding && profile2.interests_embedding) {
    semanticScore = cosineSimilarity(
      profile1.interests_embedding,
      profile2.interests_embedding
    )
  }

  // Combine exact and semantic scores (favor exact matches)
  const combinedScore = Math.max(exactMatchScore, semanticScore * 0.7)

  return combinedScore * 40
}

/**
 * Calculate age proximity score (20% of total)
 * Uses Gaussian distribution with optimal range of ±5 years
 */
export function calculateAgeProximity(
  profile1: Profile,
  profile2: Profile
): number {
  if (!profile1.age || !profile2.age) {
    return 0
  }

  const ageDiff = Math.abs(profile1.age - profile2.age)

  // Gaussian function: e^(-0.5 * (x/σ)^2) where σ = 5 years
  const sigma = 5
  const proximity = Math.exp(-0.5 * Math.pow(ageDiff / sigma, 2))

  return proximity * 20
}

/**
 * Calculate location bonus (10% of total)
 */
export function calculateLocationBonus(
  profile1: Profile,
  profile2: Profile
): number {
  if (!profile1.location || !profile2.location) {
    return 0
  }

  // Simple exact match for now - could be enhanced with geographic distance
  if (
    profile1.location.toLowerCase().trim() ===
    profile2.location.toLowerCase().trim()
  ) {
    return 10
  }

  return 0
}

/**
 * Calculate overall match score with detailed breakdown
 */
export function calculateMatchScore(
  profile1: Profile,
  profile2: Profile
): MatchBreakdown {
  const bioSimilarity = calculateBioSimilarity(profile1, profile2)
  const interestOverlap = calculateInterestOverlap(profile1, profile2)
  const ageProximity = calculateAgeProximity(profile1, profile2)
  const locationBonus = calculateLocationBonus(profile1, profile2)

  const total = Math.min(
    100,
    Math.max(0, bioSimilarity + interestOverlap + ageProximity + locationBonus)
  )

  return {
    bioSimilarity,
    interestOverlap,
    ageProximity,
    locationBonus,
    total,
  }
}

/**
 * Normalize score to 0-100 range
 */
export function normalizeScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score * 100) / 100))
}

/**
 * Generate human-readable explanation for a match score
 */
export function explainMatchScore(
  breakdown: MatchBreakdown,
  profile1: Profile,
  profile2: Profile
): string {
  const explanations: string[] = []

  if (breakdown.interestOverlap > 15) {
    const interests1 = profile1.interests || []
    const interests2 = profile2.interests || []
    const commonInterests = interests1.filter(i =>
      interests2.some(j => i.toLowerCase() === j.toLowerCase())
    )

    if (commonInterests.length > 0) {
      explanations.push(
        `You both enjoy ${commonInterests.slice(0, 3).join(', ')}`
      )
    }
  }

  if (breakdown.ageProximity > 15) {
    const ageDiff = Math.abs((profile1.age || 0) - (profile2.age || 0))
    if (ageDiff <= 2) {
      explanations.push("You're very close in age")
    } else if (ageDiff <= 5) {
      explanations.push("You're similar in age")
    }
  }

  if (breakdown.locationBonus > 0) {
    explanations.push(`You're both in ${profile1.location}`)
  }

  if (breakdown.bioSimilarity > 10) {
    explanations.push('Your profiles show good compatibility')
  }

  if (explanations.length === 0) {
    explanations.push('This could be an interesting connection')
  }

  return `${explanations.join('. ')}.`
}

/**
 * Privacy-aware matching - only consider fields both users have filled out
 */
export function getVisibleFields(profile1: Profile, profile2: Profile) {
  return {
    bio: !!(profile1.bio && profile2.bio),
    interests: !!(profile1.interests?.length && profile2.interests?.length),
    age: !!(profile1.age && profile2.age),
    location: !!(profile1.location && profile2.location),
  }
}

/**
 * Calculate match score respecting privacy rules
 */
export function calculatePrivacyAwareMatchScore(
  profile1: Profile,
  profile2: Profile
): MatchBreakdown {
  const visibleFields = getVisibleFields(profile1, profile2)

  // Only calculate scores for mutually visible fields
  const bioSimilarity = visibleFields.bio
    ? calculateBioSimilarity(profile1, profile2)
    : 0
  const interestOverlap = visibleFields.interests
    ? calculateInterestOverlap(profile1, profile2)
    : 0
  const ageProximity = visibleFields.age
    ? calculateAgeProximity(profile1, profile2)
    : 0
  const locationBonus = visibleFields.location
    ? calculateLocationBonus(profile1, profile2)
    : 0

  // Normalize total to account for missing fields
  const availableWeights = {
    bio: visibleFields.bio ? 30 : 0,
    interests: visibleFields.interests ? 40 : 0,
    age: visibleFields.age ? 20 : 0,
    location: visibleFields.location ? 10 : 0,
  }

  const totalAvailableWeight = Object.values(availableWeights).reduce(
    (sum, weight) => sum + weight,
    0
  )

  if (totalAvailableWeight === 0) {
    return {
      bioSimilarity: 0,
      interestOverlap: 0,
      ageProximity: 0,
      locationBonus: 0,
      total: 0,
    }
  }

  // Scale scores to account for missing data
  const scalingFactor = 100 / totalAvailableWeight
  const total = Math.min(
    100,
    (bioSimilarity + interestOverlap + ageProximity + locationBonus) *
      scalingFactor
  )

  return {
    bioSimilarity,
    interestOverlap,
    ageProximity,
    locationBonus,
    total: normalizeScore(total),
  }
}
