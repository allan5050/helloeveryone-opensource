interface InterestScore {
  exact_matches: number
  fuzzy_matches: number
  total_score: number
}

export function calculateInterestScore(
  userInterests: string[],
  targetInterests: string[]
): InterestScore {
  if (!userInterests?.length || !targetInterests?.length) {
    return {
      exact_matches: 0,
      fuzzy_matches: 0,
      total_score: 0,
    }
  }

  // Calculate exact matches
  const exactMatches = userInterests.filter(interest =>
    targetInterests.includes(interest)
  ).length

  // Calculate fuzzy matches (simple similarity check)
  let fuzzyMatches = 0
  const fuzzyMap: Record<string, string[]> = {
    hiking: ['trekking', 'walking', 'outdoor'],
    trekking: ['hiking', 'walking', 'outdoor'],
    walking: ['hiking', 'trekking', 'running'],
    running: ['walking', 'fitness', 'jogging'],
    fitness: ['running', 'gym', 'exercise'],
    cooking: ['baking', 'food', 'culinary'],
    baking: ['cooking', 'food', 'culinary'],
    reading: ['books', 'literature', 'writing'],
    books: ['reading', 'literature', 'writing'],
    music: ['singing', 'instruments', 'concerts'],
    art: ['painting', 'drawing', 'creative'],
    photography: ['art', 'creative', 'visual'],
    travel: ['adventure', 'exploration', 'wanderlust'],
  }

  userInterests.forEach(userInt => {
    targetInterests.forEach(targetInt => {
      if (userInt !== targetInt) {
        // Not an exact match
        const similar =
          fuzzyMap[userInt.toLowerCase()]?.includes(targetInt.toLowerCase()) ||
          fuzzyMap[targetInt.toLowerCase()]?.includes(userInt.toLowerCase())
        if (similar) {
          fuzzyMatches += 0.5 // Partial credit for fuzzy matches
        }
      }
    })
  })

  // Calculate total score (exact matches weighted higher)
  const totalPossible = Math.max(userInterests.length, targetInterests.length)
  const totalScore =
    totalPossible > 0
      ? Math.min((exactMatches + fuzzyMatches * 0.5) / totalPossible, 1.0)
      : 0

  return {
    exact_matches: exactMatches,
    fuzzy_matches: Math.floor(fuzzyMatches),
    total_score: totalScore,
  }
}
