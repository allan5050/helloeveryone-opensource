/**
 * Custom API Error Classes
 * Provides structured error handling for API routes
 */

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code || this.constructor.name
    this.name = this.constructor.name
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class ValidationError extends ApiError {
  public readonly details?: any

  constructor(message = 'Invalid request data', details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR')
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR')
  }
}

export class RateLimitError extends ApiError {
  public readonly retryAfter?: number

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.retryAfter = retryAfter
  }
}

/**
 * Handle API errors and format responses
 */
export function handleApiError(error: unknown): {
  status: number
  body: any
  headers?: Record<string, string>
} {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    const headers: Record<string, string> = {}

    if (error instanceof RateLimitError && error.retryAfter) {
      headers['Retry-After'] = error.retryAfter.toString()
    }

    return {
      status: error.statusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError &&
            error.details && { details: error.details }),
        },
      },
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    }
  }

  // Handle unknown errors
  return {
    status: 500,
    body: {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    },
  }
}
