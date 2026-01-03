export function calculateCosineSimilarity(
  vec1: number[],
  vec2: number[]
): number {
  if (!vec1?.length || !vec2?.length) {
    throw new Error('Vectors cannot be empty')
  }

  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length')
  }

  // Calculate dot product
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }

  // Handle zero vectors
  if (norm1 === 0 || norm2 === 0) {
    return 0
  }

  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))

  // Clamp to [-1, 1] to handle floating point precision issues
  return Math.max(-1, Math.min(1, similarity))
}

export function normalizeSimilarityScore(cosineSimilarity: number): number {
  // Convert from [-1, 1] to [0, 1]
  return (cosineSimilarity + 1) / 2
}
