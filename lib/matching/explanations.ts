interface MatchExplanationData {
  interestOverlap: string[]
  ageCompatibility: 'excellent' | 'good' | 'fair'
  locationMatch: 'same_city' | 'different_location'
  bioSimilarity: number
  sharedInterests: string[]
  age1?: number
  age2?: number
  location1?: string
  location2?: string
}

export interface DetailedExplanation {
  summary: string
  details: {
    interests: {
      score: number
      description: string
      shared: string[]
    }
    age: {
      score: number
      description: string
      compatibility: 'excellent' | 'good' | 'fair'
    }
    location: {
      score: number
      description: string
      match: boolean
    }
    bio: {
      score: number
      description: string
      similarity: number
    }
  }
  overallScore: number
  keyStrengths: string[]
}

export class MatchExplainer {
  static generateDetailedExplanation(
    data: MatchExplanationData
  ): DetailedExplanation {
    const interests = this.analyzeInterests(data)
    const age = this.analyzeAge(data)
    const location = this.analyzeLocation(data)
    const bio = this.analyzeBio(data)

    const overallScore = Math.round(
      interests.score * 0.4 +
        age.score * 0.2 +
        location.score * 0.1 +
        bio.score * 0.3
    )

    const keyStrengths = this.identifyKeyStrengths({
      interests,
      age,
      location,
      bio,
    })

    return {
      summary: this.generateSummary(data, keyStrengths),
      details: { interests, age, location, bio },
      overallScore,
      keyStrengths,
    }
  }

  private static analyzeInterests(data: MatchExplanationData) {
    const shared = data.sharedInterests || []
    const sharedCount = shared.length

    let score = 0
    let description = ''

    if (sharedCount === 0) {
      score = 0
      description = 'No shared interests discovered yet'
    } else if (sharedCount === 1) {
      score = 60
      description = `You both enjoy ${shared[0]}`
    } else if (sharedCount === 2) {
      score = 75
      description = `You both enjoy ${shared.slice(0, 2).join(' and ')}`
    } else if (sharedCount <= 4) {
      score = 85
      description = `You share ${sharedCount} interests: ${shared.slice(0, 2).join(', ')} and more`
    } else {
      score = 95
      description = `You have ${sharedCount} shared interests!`
    }

    return {
      score,
      description,
      shared: shared.slice(0, 5),
    }
  }

  private static analyzeAge(data: MatchExplanationData) {
    const { age1, age2, ageCompatibility } = data
    let score = 0
    let description = ''

    if (!age1 || !age2) {
      return {
        score: 50,
        description: 'Age information not available',
        compatibility: 'fair' as const,
      }
    }

    const ageDiff = Math.abs(age1 - age2)

    if (ageDiff <= 2) {
      score = 100
      description = "You're very close in age"
    } else if (ageDiff <= 5) {
      score = 90
      description = "You're in a similar age range"
    } else if (ageDiff <= 8) {
      score = 75
      description = 'Good age compatibility'
    } else {
      score = 50
      description = 'Different age groups'
    }

    return {
      score,
      description,
      compatibility: ageCompatibility || 'fair',
    }
  }

  private static analyzeLocation(data: MatchExplanationData) {
    const sameLocation = data.locationMatch === 'same_city'

    return {
      score: sameLocation ? 100 : 50,
      description: sameLocation
        ? `You're both in ${data.location1 || 'the same city'}`
        : 'Different locations',
      match: sameLocation,
    }
  }

  private static analyzeBio(data: MatchExplanationData) {
    const similarity = data.bioSimilarity || 0
    let score = Math.round(similarity * 100)
    let description = ''

    if (similarity >= 0.8) {
      score = 95
      description = 'Strong profile compatibility'
    } else if (similarity >= 0.6) {
      score = 80
      description = 'Good profile alignment'
    } else if (similarity >= 0.4) {
      score = 65
      description = 'Some common ground'
    } else {
      score = 30
      description = 'Unique perspectives'
    }

    return {
      score,
      description,
      similarity: Math.round(similarity * 100) / 100,
    }
  }

  private static identifyKeyStrengths(analysis: any): string[] {
    const strengths: string[] = []

    if (analysis.interests.score >= 75) {
      strengths.push('Strong shared interests')
    }

    if (analysis.age.score >= 85) {
      strengths.push('Excellent age compatibility')
    }

    if (analysis.location.match) {
      strengths.push('Same location')
    }

    if (analysis.bio.score >= 70) {
      strengths.push('High profile compatibility')
    }

    if (strengths.length === 0) {
      strengths.push('Meeting at the same event')
    }

    return strengths
  }

  private static generateSummary(
    data: MatchExplanationData,
    strengths: string[]
  ): string {
    const parts: string[] = []
    const sharedCount = data.sharedInterests?.length || 0

    if (sharedCount > 0) {
      if (sharedCount === 1) {
        parts.push(`You both enjoy ${data.sharedInterests[0]}`)
      } else if (sharedCount === 2) {
        parts.push(`You both enjoy ${data.sharedInterests.join(' and ')}`)
      } else {
        parts.push(`You share ${sharedCount} interests`)
      }
    }

    if (data.locationMatch === 'same_city') {
      parts.push("you're both local")
    }

    if (parts.length === 0) {
      return "You'll both be at this event!"
    }

    const summary = parts.join(', ')
    return summary.charAt(0).toUpperCase() + summary.slice(1) + '.'
  }

  static getMatchStrength(overallScore: number): {
    level: 'excellent' | 'great' | 'good' | 'fair' | 'potential'
    color: string
    description: string
  } {
    if (overallScore >= 85) {
      return {
        level: 'excellent',
        color: 'text-green-600 bg-green-50',
        description: 'Excellent Match',
      }
    } else if (overallScore >= 70) {
      return {
        level: 'great',
        color: 'text-blue-600 bg-blue-50',
        description: 'Great Match',
      }
    } else if (overallScore >= 55) {
      return {
        level: 'good',
        color: 'text-indigo-600 bg-indigo-50',
        description: 'Good Match',
      }
    } else if (overallScore >= 35) {
      return {
        level: 'fair',
        color: 'text-yellow-600 bg-yellow-50',
        description: 'Fair Match',
      }
    } else {
      return {
        level: 'potential',
        color: 'text-gray-600 bg-gray-50',
        description: 'Potential Match',
      }
    }
  }
}
