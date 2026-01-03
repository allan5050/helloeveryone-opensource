import demoData from '@/data/demo-backup.json'

export interface DemoProfile {
  user_id: string
  display_name: string
  full_name?: string
  bio?: string
  age?: number
  interests?: string[]
  location?: string
  is_active?: boolean
  photo_url?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export interface DemoEvent {
  id: string
  title: string
  description?: string
  date: string
  location?: string
  capacity?: number
}

export interface DemoFavorite {
  id: string
  user_id: string
  favorited_user_id: string
  created_at: string
}

export interface DemoMatchScore {
  id: string
  user_id_1: string
  user_id_2: string
  combined_score: number
  semantic_score?: number
  calculated_at: string
}

class FallbackDataService {
  private profiles: DemoProfile[]
  private events: DemoEvent[]
  private favorites: DemoFavorite[]
  private matchScores: DemoMatchScore[]
  private isUsingFallback: boolean = false

  constructor() {
    this.profiles = demoData.profiles || []
    this.events = demoData.events || []
    this.favorites = demoData.favorites || []
    this.matchScores = demoData.match_scores || []
  }

  enableFallback() {
    this.isUsingFallback = true
    console.warn(
      '🔄 Using local demo data as fallback due to database connection issues'
    )
  }

  disableFallback() {
    this.isUsingFallback = false
  }

  isFallbackActive() {
    return this.isUsingFallback
  }

  // Get all profiles except the current user
  getProfiles(excludeUserId?: string): DemoProfile[] {
    return this.profiles.filter(p => p.user_id !== excludeUserId)
  }

  // Get a single profile by ID
  getProfile(userId: string): DemoProfile | undefined {
    return this.profiles.find(p => p.user_id === userId)
  }

  // Get profiles with pagination
  getProfilesPaginated(
    page: number = 1,
    limit: number = 12,
    excludeUserId?: string
  ): {
    data: DemoProfile[]
    hasMore: boolean
    total: number
  } {
    const filtered = this.getProfiles(excludeUserId)
    const start = (page - 1) * limit
    const end = start + limit

    return {
      data: filtered.slice(start, end),
      hasMore: end < filtered.length,
      total: filtered.length,
    }
  }

  // Search profiles
  searchProfiles(searchTerm: string, excludeUserId?: string): DemoProfile[] {
    const term = searchTerm.toLowerCase()
    return this.getProfiles(excludeUserId).filter(
      p =>
        p.display_name?.toLowerCase().includes(term) ||
        p.full_name?.toLowerCase().includes(term) ||
        p.bio?.toLowerCase().includes(term) ||
        p.interests?.some(i => i.toLowerCase().includes(term))
    )
  }

  // Get match scores for a user
  getMatchScoresForUser(userId: string): DemoMatchScore[] {
    return this.matchScores.filter(
      m => m.user_id_1 === userId || m.user_id_2 === userId
    )
  }

  // Get match score between two users
  getMatchScore(userId1: string, userId2: string): DemoMatchScore | undefined {
    return this.matchScores.find(
      m =>
        (m.user_id_1 === userId1 && m.user_id_2 === userId2) ||
        (m.user_id_1 === userId2 && m.user_id_2 === userId1)
    )
  }

  // Get favorites for a user
  getFavoritesForUser(userId: string): string[] {
    return this.favorites
      .filter(f => f.user_id === userId)
      .map(f => f.favorited_user_id)
  }

  // Check if a profile is favorited
  isFavorited(userId: string, targetUserId: string): boolean {
    return this.favorites.some(
      f => f.user_id === userId && f.favorited_user_id === targetUserId
    )
  }

  // Get all events
  getEvents(): DemoEvent[] {
    return this.events
  }

  // Calculate common interests between users
  calculateCommonInterests(userId1: string, userId2: string): string[] {
    const profile1 = this.getProfile(userId1)
    const profile2 = this.getProfile(userId2)

    if (!profile1?.interests || !profile2?.interests) return []

    return profile1.interests.filter(interest =>
      profile2.interests!.some(i => i.toLowerCase() === interest.toLowerCase())
    )
  }

  // Get demo user for testing (first profile)
  getDemoUser(): DemoProfile | undefined {
    return this.profiles[0]
  }

  // Get random profiles for discovery
  getRandomProfiles(count: number = 6, excludeUserId?: string): DemoProfile[] {
    const available = this.getProfiles(excludeUserId)
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  // Generate match data for profiles without scores
  generateFallbackMatchScore(
    profile1: DemoProfile,
    profile2: DemoProfile
  ): DemoMatchScore {
    const commonInterests = this.calculateCommonInterests(
      profile1.user_id,
      profile2.user_id
    )
    const score = Math.min(
      0.95,
      commonInterests.length * 0.15 + Math.random() * 0.3 + 0.3
    )

    return {
      id: `fallback-${profile1.user_id}-${profile2.user_id}`,
      user_id_1: profile1.user_id,
      user_id_2: profile2.user_id,
      combined_score: score,
      semantic_score: score * 0.8,
      calculated_at: new Date().toISOString(),
    }
  }
}

// Export singleton instance
export const fallbackData = new FallbackDataService()

// Export function to check if we should use fallback
export async function checkAndUseFallback(
  supabaseOperation: () => Promise<any>
): Promise<{
  useFallback: boolean
  error?: any
}> {
  try {
    await supabaseOperation()
    fallbackData.disableFallback()
    return { useFallback: false }
  } catch (error) {
    console.error('Database operation failed:', error)
    fallbackData.enableFallback()
    return { useFallback: true, error }
  }
}
