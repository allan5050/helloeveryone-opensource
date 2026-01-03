/**
 * Standardized JSON Response Helpers
 * Provides consistent API response formatting
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

/**
 * Format successful API response
 */
export function success<T>(data: T, meta?: { requestId?: string }): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }

  return Response.json(response, { status: 200 })
}

/**
 * Format error API response
 */
export function error(
  code: string,
  message: string,
  status: number = 400,
  details?: any,
  headers?: Record<string, string>
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Format paginated API response
 */
export function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  meta?: { requestId?: string }
): Response {
  const totalPages = Math.ceil(total / limit)

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }

  return Response.json(response, { status: 200 })
}

/**
 * Format created resource response
 */
export function created<T>(data: T, meta?: { requestId?: string }): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }

  return Response.json(response, { status: 201 })
}

/**
 * Format no content response
 */
export function noContent(): Response {
  return new Response(null, { status: 204 })
}
