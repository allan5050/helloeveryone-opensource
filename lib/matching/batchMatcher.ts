import { createClient } from '@/lib/supabase/client'

interface BatchMatchRequest {
  userId: string
  eventId?: string
  targetUserIds?: string[]
  includeExplanations?: boolean
}

interface MatchResult {
  userId: string
  targetUserId: string
  score: number
  explanation?: {
    interestOverlap: string[]
    ageCompatibility: 'excellent' | 'good' | 'fair'
    locationMatch: 'same_city' | 'different_location'
    bioSimilarity: number
    summary: string
  }
}

interface BatchMatchResponse {
  matches: MatchResult[]
  processingTime: number
  cached: boolean
}

export class BatchMatcher {
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private static readonly MAX_BATCH_SIZE = 50
  private cache = new Map<string, { data: MatchResult[]; timestamp: number }>()

  async processEventMatches(
    request: BatchMatchRequest
  ): Promise<BatchMatchResponse> {
    const startTime = performance.now()
    const cacheKey = this.getCacheKey(request)

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        matches: cached,
        processingTime: performance.now() - startTime,
        cached: true,
      }
    }

    let matches: MatchResult[]

    if (request.eventId) {
      matches = await this.getEventMatches(request)
    } else if (request.targetUserIds) {
      matches = await this.getDirectMatches(request)
    } else {
      throw new Error('Either eventId or targetUserIds must be provided')
    }

    // Cache results
    this.setCache(cacheKey, matches)

    return {
      matches,
      processingTime: performance.now() - startTime,
      cached: false,
    }
  }

  private async getEventMatches(
    request: BatchMatchRequest
  ): Promise<MatchResult[]> {
    const supabase = createClient()

    const { data: attendees, error } = await supabase
      .from('rsvps')
      .select('profile_id')
      .eq('event_id', request.eventId)
      .neq('profile_id', request.userId)

    if (error) {
      throw new Error(`Failed to get event matches: ${error.message}`)
    }

    const matches: MatchResult[] = []

    for (const attendee of attendees || []) {
      // Get cached match score if available
      const { data: score } = await supabase
        .from('match_scores')
        .select('score')
        .or(
          `and(profile1_id.eq.${request.userId},profile2_id.eq.${attendee.profile_id}),and(profile1_id.eq.${attendee.profile_id},profile2_id.eq.${request.userId})`
        )
        .single()

      matches.push({
        userId: request.userId,
        targetUserId: attendee.profile_id,
        score: score?.score || 50,
        explanation: request.includeExplanations
          ? {
              interestOverlap: [],
              ageCompatibility: 'good',
              locationMatch: 'same_city',
              bioSimilarity: 0,
              summary: 'You will both be at this event',
            }
          : undefined,
      })
    }

    return matches
  }

  private async getDirectMatches(
    request: BatchMatchRequest
  ): Promise<MatchResult[]> {
    if (!request.targetUserIds || request.targetUserIds.length === 0) {
      return []
    }

    const supabase = createClient()
    const batches = this.chunkArray(
      request.targetUserIds,
      BatchMatcher.MAX_BATCH_SIZE
    )
    const allMatches: MatchResult[] = []

    for (const batch of batches) {
      for (const targetId of batch) {
        const { data: score } = await supabase
          .from('match_scores')
          .select('score')
          .or(
            `and(profile1_id.eq.${request.userId},profile2_id.eq.${targetId}),and(profile1_id.eq.${targetId},profile2_id.eq.${request.userId})`
          )
          .single()

        allMatches.push({
          userId: request.userId,
          targetUserId: targetId,
          score: score?.score || 50,
          explanation: request.includeExplanations
            ? {
                interestOverlap: [],
                ageCompatibility: 'good',
                locationMatch: 'same_city',
                bioSimilarity: 0,
                summary: 'Potential match based on profile',
              }
            : undefined,
        })
      }
    }

    return allMatches
  }

  private getCacheKey(request: BatchMatchRequest): string {
    const parts = [
      request.userId,
      request.eventId || 'direct',
      request.targetUserIds?.sort().join(',') || '',
      request.includeExplanations ? 'exp' : 'noexp',
    ]
    return parts.join('|')
  }

  private getFromCache(key: string): MatchResult[] | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > BatchMatcher.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: MatchResult[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })

    // Clean up old cache entries
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      const toRemove = Math.floor(entries.length * 0.2)
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0])
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(userId)
    )

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

export const batchMatcher = new BatchMatcher()
