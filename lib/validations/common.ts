/**
 * Common Validation Schemas
 * Shared validation patterns used across the application
 */

import { z } from 'zod'

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 20))
    .pipe(
      z
        .number()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
    ),
})

/**
 * Search parameters
 */
export const searchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query too long'),
})

/**
 * Date range validation
 */
export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
  })
  .refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

/**
 * Location coordinates
 */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
})

/**
 * Location with optional coordinates
 */
export const locationSchema = z.object({
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(2, 'State is required').max(50, 'State name too long'),
  country: z
    .string()
    .min(2, 'Country is required')
    .max(50, 'Country name too long'),
  coordinates: coordinatesSchema.optional(),
})

/**
 * Age validation
 */
export const ageSchema = z
  .number()
  .min(18, 'Must be at least 18 years old')
  .max(120, 'Invalid age')

/**
 * Name validation
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')

/**
 * Bio/description validation
 */
export const bioSchema = z
  .string()
  .max(500, 'Bio cannot exceed 500 characters')
  .optional()

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL format').optional()

/**
 * Phone number validation (international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number format')
  .optional()

/**
 * Tags/interests validation
 */
export const tagsSchema = z
  .array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag too long'))
  .max(20, 'Too many tags')
  .optional()

/**
 * Sort order validation
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

/**
 * ID parameter validation for URL params
 */
export const idParamSchema = z.object({
  id: uuidSchema,
})

/**
 * File validation schemas
 */
export const fileTypeSchema = z.enum([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export const fileSizeSchema = z
  .number()
  .max(5 * 1024 * 1024, 'File size cannot exceed 5MB') // 5MB

/**
 * Password strength validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  )

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email address too long')

/**
 * Time validation (HH:MM format)
 */
export const timeSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')

/**
 * Color hex code validation
 */
export const colorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format')

/**
 * Validation result type
 */
export type ValidationResult<T> = {
  success: boolean
  data?: T
  error?: {
    message: string
    issues: Array<{
      path: (string | number)[]
      message: string
    }>
  }
}

/**
 * Safe validation helper
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    error: {
      message: 'Validation failed',
      issues: result.error.issues.map(issue => ({
        path: issue.path,
        message: issue.message,
      })),
    },
  }
}
