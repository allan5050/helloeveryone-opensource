/**
 * In-Memory Rate Limiting
 * Development-friendly rate limiting using Map storage
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  /**
   * Check if request should be rate limited
   */
  isRateLimited(
    key: string,
    config: RateLimitConfig
  ): {
    isLimited: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const resetTime = now + config.windowMs

    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(key, { count: 1, resetTime })
      return {
        isLimited: false,
        remaining: config.maxRequests - 1,
        resetTime,
      }
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        isLimited: true,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    // Increment counter
    entry.count++
    this.store.set(key, entry)

    return {
      isLimited: false,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Get current store size (for debugging)
   */
  getStoreSize(): number {
    return this.store.size
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Cleanup on process exit
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => rateLimiter.destroy())
  process.on('SIGINT', () => rateLimiter.destroy())
}

/**
 * Rate limiting configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  },

  // Profile updates
  profile: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },

  // Matching and search
  matching: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // General API endpoints
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  // Expensive operations (embeddings, AI)
  expensive: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const

/**
 * Rate limit middleware function
 */
export function rateLimit(
  identifier: string,
  configKey: keyof typeof rateLimitConfigs = 'general'
): {
  isAllowed: boolean
  remaining: number
  resetTime: number
} {
  const config = rateLimitConfigs[configKey]
  const result = rateLimiter.isRateLimited(identifier, config)

  return {
    isAllowed: !result.isLimited,
    remaining: result.remaining,
    resetTime: result.resetTime,
  }
}

/**
 * Get rate limit key from request
 */
export function getRateLimitKey(
  request: Request,
  prefix: string = 'api'
): string {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

  const url = new URL(request.url)
  return `${prefix}:${ip}:${url.pathname}`
}

/**
 * Check rate limit and return 429 response if exceeded
 * Returns null if allowed, Response if rate limited
 */
export function checkRateLimit(
  request: Request,
  configKey: keyof typeof rateLimitConfigs = 'general'
): Response | null {
  const key = getRateLimitKey(request, configKey)
  const result = rateLimit(key, configKey)

  if (!result.isAllowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
    return new Response(
      JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetTime),
        },
      }
    )
  }

  return null
}

export { rateLimiter }
