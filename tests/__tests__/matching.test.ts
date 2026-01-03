// Mock Supabase server client
jest.mock('@/lib/supabase/server')
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
}

// Mock the server createClient function
const mockCreateClient = jest.fn().mockResolvedValue(mockSupabase)
require('@/lib/supabase/server').createClient = mockCreateClient

describe('Matching Algorithm', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    age: 28,
    interests: ['hiking', 'reading', 'travel', 'photography'],
    bio: 'Love exploring new places and meeting interesting people',
    location: 'San Francisco, CA',
    bio_embedding: new Array(1536).fill(0.1), // Mock OpenAI embedding
  }

  const mockPotentialMatches = [
    {
      id: 'user-456',
      name: 'Alice Johnson',
      age: 26,
      interests: ['hiking', 'photography', 'cooking'],
      bio: 'Outdoor enthusiast and food lover',
      location: 'San Francisco, CA',
      bio_embedding: new Array(1536).fill(0.2),
    },
    {
      id: 'user-789',
      name: 'Bob Smith',
      age: 35,
      interests: ['reading', 'travel', 'music'],
      bio: 'Bookworm and traveler seeking adventures',
      location: 'Oakland, CA',
      bio_embedding: new Array(1536).fill(0.3),
    },
    {
      id: 'user-101',
      name: 'Carol Davis',
      age: 22,
      interests: ['dancing', 'art', 'fitness'],
      bio: 'Creative soul who loves to move',
      location: 'Berkeley, CA',
      bio_embedding: new Array(1536).fill(0.4),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  describe('Interest Matching', () => {
    it('should calculate exact interest matches correctly', async () => {
      const { calculateInterestScore } = await import(
        '@/lib/matching/interests'
      )

      // Test exact matches
      const score1 = calculateInterestScore(
        ['hiking', 'reading', 'travel'],
        ['hiking', 'reading', 'photography']
      )
      expect(score1.exact_matches).toBe(2)
      expect(score1.total_score).toBeGreaterThan(0.5)

      // Test no matches
      const score2 = calculateInterestScore(
        ['hiking', 'reading'],
        ['dancing', 'music']
      )
      expect(score2.exact_matches).toBe(0)
      expect(score2.total_score).toBe(0)

      // Test all matches
      const score3 = calculateInterestScore(
        ['hiking', 'reading'],
        ['hiking', 'reading']
      )
      expect(score3.exact_matches).toBe(2)
      expect(score3.total_score).toBe(1.0)
    })

    it('should handle fuzzy interest matching', async () => {
      const { calculateInterestScore } = await import(
        '@/lib/matching/interests'
      )

      // Test similar interests
      const score = calculateInterestScore(
        ['hiking', 'trekking', 'walking'],
        ['walking', 'running', 'fitness']
      )

      expect(score.fuzzy_matches).toBeGreaterThan(0)
      expect(score.total_score).toBeGreaterThan(0)
    })

    it('should weight exact matches higher than fuzzy matches', async () => {
      const { calculateInterestScore } = await import(
        '@/lib/matching/interests'
      )

      const exactScore = calculateInterestScore(
        ['hiking', 'reading'],
        ['hiking', 'reading']
      )

      const fuzzyScore = calculateInterestScore(
        ['hiking', 'walking'],
        ['trekking', 'running']
      )

      expect(exactScore.total_score).toBeGreaterThan(fuzzyScore.total_score)
    })

    it('should handle empty interest arrays', async () => {
      const { calculateInterestScore } = await import(
        '@/lib/matching/interests'
      )

      const score1 = calculateInterestScore([], ['hiking', 'reading'])
      expect(score1.total_score).toBe(0)

      const score2 = calculateInterestScore(['hiking'], [])
      expect(score2.total_score).toBe(0)

      const score3 = calculateInterestScore([], [])
      expect(score3.total_score).toBe(0)
    })
  })

  describe('Bio Semantic Similarity', () => {
    it('should calculate cosine similarity correctly', async () => {
      const { calculateCosineSimilarity } = await import(
        '@/lib/matching/semantic'
      )

      // Test identical vectors
      const vec1 = [1, 0, 0]
      const vec2 = [1, 0, 0]
      const similarity1 = calculateCosineSimilarity(vec1, vec2)
      expect(similarity1).toBeCloseTo(1.0, 2)

      // Test orthogonal vectors
      const vec3 = [1, 0, 0]
      const vec4 = [0, 1, 0]
      const similarity2 = calculateCosineSimilarity(vec3, vec4)
      expect(similarity2).toBeCloseTo(0.0, 2)

      // Test opposite vectors
      const vec5 = [1, 0, 0]
      const vec6 = [-1, 0, 0]
      const similarity3 = calculateCosineSimilarity(vec5, vec6)
      expect(similarity3).toBeCloseTo(-1.0, 2)
    })

    it('should handle zero vectors', async () => {
      const { calculateCosineSimilarity } = await import(
        '@/lib/matching/semantic'
      )

      const zeroVec = [0, 0, 0]
      const nonZeroVec = [1, 2, 3]

      const similarity = calculateCosineSimilarity(zeroVec, nonZeroVec)
      expect(similarity).toBe(0)
    })

    it('should normalize similarity scores to 0-1 range', async () => {
      const { normalizeSimilarityScore } = await import(
        '@/lib/matching/semantic'
      )

      // Cosine similarity ranges from -1 to 1, should normalize to 0-1
      expect(normalizeSimilarityScore(-1)).toBeCloseTo(0, 2)
      expect(normalizeSimilarityScore(0)).toBeCloseTo(0.5, 2)
      expect(normalizeSimilarityScore(1)).toBeCloseTo(1, 2)
    })
  })

  describe('Age Proximity Scoring', () => {
    it('should score age proximity correctly', async () => {
      const { calculateAgeScore } = await import('@/lib/matching/demographics')

      // Same age should score 1.0
      expect(calculateAgeScore(28, 28)).toBe(1.0)

      // Within optimal range (±5 years) should score high
      expect(calculateAgeScore(28, 30)).toBeGreaterThan(0.8)
      expect(calculateAgeScore(28, 25)).toBeGreaterThan(0.8)

      // Outside optimal range should score lower
      expect(calculateAgeScore(28, 35)).toBeLessThan(0.8)
      expect(calculateAgeScore(28, 20)).toBeLessThan(0.8)

      // Very large age gaps should score very low
      expect(calculateAgeScore(28, 50)).toBeLessThan(0.2)
      expect(calculateAgeScore(28, 18)).toBeLessThan(0.2)
    })

    it('should handle edge cases for age scoring', async () => {
      const { calculateAgeScore } = await import('@/lib/matching/demographics')

      // Handle minimum ages
      expect(calculateAgeScore(18, 18)).toBe(1.0)
      expect(calculateAgeScore(18, 25)).toBeGreaterThan(0.5)

      // Handle maximum reasonable ages
      expect(calculateAgeScore(65, 65)).toBe(1.0)
      expect(calculateAgeScore(65, 60)).toBeGreaterThan(0.8)
    })
  })

  describe('Location and Availability Matching', () => {
    it('should score location proximity', async () => {
      const { calculateLocationScore } = await import('@/lib/matching/location')

      // Same city should score high
      const score1 = calculateLocationScore(
        'San Francisco, CA',
        'San Francisco, CA'
      )
      expect(score1).toBeGreaterThan(0.8)

      // Nearby cities should score moderately
      const score2 = calculateLocationScore('San Francisco, CA', 'Oakland, CA')
      expect(score2).toBeGreaterThan(0.5)
      expect(score2).toBeLessThan(0.8)

      // Different states should score low
      const score3 = calculateLocationScore('San Francisco, CA', 'New York, NY')
      expect(score3).toBeLessThan(0.3)
    })

    it('should calculate availability overlap', async () => {
      const { calculateAvailabilityScore } = await import(
        '@/lib/matching/availability'
      )

      const availability1 = {
        weekdays: ['monday', 'tuesday', 'wednesday'],
        weekends: true,
        evenings: true,
      }

      const availability2 = {
        weekdays: ['tuesday', 'wednesday', 'thursday'],
        weekends: true,
        evenings: false,
      }

      const score = calculateAvailabilityScore(availability1, availability2)
      expect(score).toBeGreaterThan(0.5) // Some overlap exists
      expect(score).toBeLessThan(1.0) // Not perfect overlap
    })
  })

  describe('Overall Match Score Calculation', () => {
    it('should calculate weighted match scores correctly', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          {
            user_id: 'user-456',
            match_score: 0.85,
            interest_score: 0.8,
            bio_similarity: 0.9,
            age_score: 0.9,
            location_score: 0.8,
          },
          {
            user_id: 'user-789',
            match_score: 0.72,
            interest_score: 0.6,
            bio_similarity: 0.8,
            age_score: 0.7,
            location_score: 0.9,
          },
        ],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { calculateMatches } = await import('@/lib/matching/engine')
      const result = await calculateMatches('user-123')

      expect(result.success).toBe(true)
      expect(result.matches).toHaveLength(2)
      expect(result.matches[0].match_score).toBeCloseTo(0.85, 2)
      expect(mockRpc).toHaveBeenCalledWith('calculate_user_matches', {
        target_user_id: 'user-123',
      })
    })

    it('should apply correct weightings to score components', async () => {
      const { calculateOverallScore } = await import('@/lib/matching/engine')

      const components = {
        interest_score: 0.8, // 40% weight
        bio_similarity: 0.9, // 30% weight
        age_score: 0.7, // 20% weight
        location_score: 0.6, // 10% weight
      }

      const overallScore = calculateOverallScore(components)

      // Manual calculation: 0.8*0.4 + 0.9*0.3 + 0.7*0.2 + 0.6*0.1 = 0.79
      expect(overallScore).toBeCloseTo(0.79, 2)
    })

    it('should handle missing score components gracefully', async () => {
      const { calculateOverallScore } = await import('@/lib/matching/engine')

      const incompleteComponents = {
        interest_score: 0.8,
        bio_similarity: 0.9,
        // Missing age_score and location_score
      }

      const overallScore = calculateOverallScore(incompleteComponents)

      // Should use default values or handle gracefully
      expect(overallScore).toBeGreaterThan(0)
      expect(overallScore).toBeLessThan(1)
    })
  })

  describe('Match Score Thresholds', () => {
    it('should filter matches by minimum threshold', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          { user_id: 'user-456', match_score: 0.85 },
          { user_id: 'user-789', match_score: 0.72 },
          { user_id: 'user-101', match_score: 0.45 },
        ],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getFilteredMatches } = await import('@/lib/matching/engine')
      const result = await getFilteredMatches('user-123', 0.7)

      expect(result.success).toBe(true)
      expect(result.matches).toHaveLength(2) // Only scores >= 0.7
      expect(result.matches[0].match_score).toBeGreaterThanOrEqual(0.7)
      expect(result.matches[1].match_score).toBeGreaterThanOrEqual(0.7)
    })

    it('should sort matches by score descending', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          { user_id: 'user-456', match_score: 0.72 },
          { user_id: 'user-789', match_score: 0.85 },
          { user_id: 'user-101', match_score: 0.91 },
        ],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { calculateMatches } = await import('@/lib/matching/engine')
      const result = await calculateMatches('user-123')

      expect(result.success).toBe(true)
      expect(result.matches[0].match_score).toBeGreaterThanOrEqual(
        result.matches[1].match_score
      )
      expect(result.matches[1].match_score).toBeGreaterThanOrEqual(
        result.matches[2].match_score
      )
    })

    it('should limit number of returned matches', async () => {
      const mockMatches = Array.from({ length: 50 }, (_, i) => ({
        user_id: `user-${i}`,
        match_score: 0.9 - i * 0.01,
      }))

      const mockRpc = jest.fn().mockResolvedValue({
        data: mockMatches,
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { calculateMatches } = await import('@/lib/matching/engine')
      const result = await calculateMatches('user-123', 20) // Limit to 20

      expect(result.success).toBe(true)
      expect(result.matches).toHaveLength(20)
    })
  })

  describe('Performance Requirements', () => {
    it('should complete match calculation within 100ms', async () => {
      const mockRpc = jest.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                data: [{ user_id: 'user-456', match_score: 0.85 }],
                error: null,
              })
            }, 50) // Simulate 50ms database query
          })
      )

      mockSupabase.rpc = mockRpc

      const { calculateMatches } = await import('@/lib/matching/engine')

      const startTime = Date.now()
      const result = await calculateMatches('user-123')
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(100)
    })

    it('should handle large datasets efficiently', async () => {
      // Mock a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        user_id: `user-${i}`,
        match_score: Math.random(),
        interest_score: Math.random(),
        bio_similarity: Math.random(),
        age_score: Math.random(),
        location_score: Math.random(),
      }))

      const mockRpc = jest.fn().mockResolvedValue({
        data: largeDataset,
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { calculateMatches } = await import('@/lib/matching/engine')

      const startTime = Date.now()
      const result = await calculateMatches('user-123')
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(200) // Allow more time for large dataset
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      mockSupabase.rpc = mockRpc

      const { calculateMatches } = await import('@/lib/matching/engine')
      const result = await calculateMatches('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle invalid user IDs', async () => {
      const { calculateMatches } = await import('@/lib/matching/engine')
      const result = await calculateMatches('invalid-user-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid user ID')
    })

    it('should handle empty embedding vectors', async () => {
      const { calculateCosineSimilarity } = await import(
        '@/lib/matching/semantic'
      )

      const emptyVec = []
      const normalVec = [1, 2, 3]

      expect(() => calculateCosineSimilarity(emptyVec, normalVec)).toThrow()
    })
  })
})
