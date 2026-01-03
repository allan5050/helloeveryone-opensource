/**
 * Test script for the matching engine
 * This can be run in development to verify the matching algorithms work correctly
 */

import {
  calculateMatchScore,
  calculatePrivacyAwareMatchScore,
  explainMatchScore,
  Profile,
} from './index'

// Sample test profiles
const testProfiles: Profile[] = [
  {
    id: '1',
    bio: 'Love hiking, cooking, and reading books. Always up for outdoor adventures.',
    interests: ['hiking', 'cooking', 'reading', 'travel', 'photography'],
    age: 28,
    location: 'San Francisco',
    bio_embedding: new Array(1536).fill(0.1), // Mock embedding
    interests_embedding: new Array(1536).fill(0.2), // Mock embedding
  },
  {
    id: '2',
    bio: 'Passionate about outdoor activities, love to cook and explore new places.',
    interests: ['hiking', 'cooking', 'travel', 'fitness', 'music'],
    age: 30,
    location: 'San Francisco',
    bio_embedding: new Array(1536).fill(0.1), // Similar mock embedding
    interests_embedding: new Array(1536).fill(0.2), // Similar mock embedding
  },
  {
    id: '3',
    bio: 'Tech enthusiast, love gaming and coding in my free time.',
    interests: ['gaming', 'coding', 'technology', 'movies'],
    age: 45,
    location: 'New York',
    bio_embedding: new Array(1536).fill(0.5), // Different mock embedding
    interests_embedding: new Array(1536).fill(0.6), // Different mock embedding
  },
  {
    id: '4',
    bio: 'Artist and creative person, enjoy painting and visiting museums.',
    interests: ['art', 'painting', 'museums', 'wine', 'travel'],
    age: 26,
    location: 'San Francisco',
    // No embeddings - test missing data case
  },
]

export function runMatchingTests() {
  console.log('🧪 Running Matching Engine Tests\n')

  // Test 1: High compatibility match
  console.log('Test 1: High compatibility profiles')
  const match1 = calculateMatchScore(testProfiles[0], testProfiles[1])
  console.log('Profile 1 vs Profile 2:', match1)
  console.log(
    'Explanation:',
    explainMatchScore(match1, testProfiles[0], testProfiles[1])
  )
  console.log()

  // Test 2: Low compatibility match
  console.log('Test 2: Low compatibility profiles')
  const match2 = calculateMatchScore(testProfiles[0], testProfiles[2])
  console.log('Profile 1 vs Profile 3:', match2)
  console.log(
    'Explanation:',
    explainMatchScore(match2, testProfiles[0], testProfiles[2])
  )
  console.log()

  // Test 3: Missing data handling
  console.log('Test 3: Missing embeddings')
  const match3 = calculateMatchScore(testProfiles[0], testProfiles[3])
  console.log('Profile 1 vs Profile 4 (no embeddings):', match3)
  console.log(
    'Explanation:',
    explainMatchScore(match3, testProfiles[0], testProfiles[3])
  )
  console.log()

  // Test 4: Privacy-aware matching
  console.log('Test 4: Privacy-aware matching')
  const privacyProfile1 = { ...testProfiles[0], age: undefined } // Hide age
  const privacyProfile2 = { ...testProfiles[1], location: undefined } // Hide location

  const normalMatch = calculateMatchScore(testProfiles[0], testProfiles[1])
  const privacyMatch = calculatePrivacyAwareMatchScore(
    privacyProfile1,
    privacyProfile2
  )

  console.log('Normal match:', normalMatch)
  console.log('Privacy-aware match:', privacyMatch)
  console.log()

  // Test 5: Performance test
  console.log('Test 5: Performance test')
  const iterations = 1000
  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    calculateMatchScore(testProfiles[0], testProfiles[1])
  }

  const endTime = performance.now()
  const averageTime = (endTime - startTime) / iterations

  console.log(`Average calculation time: ${averageTime.toFixed(2)}ms`)
  console.log(`Target: < 1ms per calculation`)
  console.log(`Status: ${averageTime < 1 ? '✅ PASS' : '❌ FAIL'}`)
  console.log()

  // Test 6: Score distribution
  console.log('Test 6: Score distribution analysis')
  const scores: number[] = []

  for (let i = 0; i < testProfiles.length; i++) {
    for (let j = i + 1; j < testProfiles.length; j++) {
      const score = calculateMatchScore(testProfiles[i], testProfiles[j]).total
      scores.push(score)
    }
  }

  const avgScore = scores.reduce((a, b) => a + b) / scores.length
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)

  console.log(`Score range: ${minScore.toFixed(1)} - ${maxScore.toFixed(1)}`)
  console.log(`Average score: ${avgScore.toFixed(1)}`)
  console.log(
    `Scores within 0-100: ${scores.every(s => s >= 0 && s <= 100) ? '✅ PASS' : '❌ FAIL'}`
  )
  console.log()

  console.log('✨ Tests completed!\n')

  return {
    averageTime,
    scoreRange: { min: minScore, max: maxScore, avg: avgScore },
    allTestsPassed: averageTime < 1 && scores.every(s => s >= 0 && s <= 100),
  }
}

// Export for use in development
export { testProfiles }
