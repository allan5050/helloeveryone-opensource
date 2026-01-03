/**
 * Authentication Validation Schemas
 * Validates login, signup, and password reset requests
 */

import { z } from 'zod'
import { emailSchema, passwordSchema, nameSchema } from './common'

/**
 * Login request validation
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginRequest = z.infer<typeof loginSchema>

/**
 * Signup request validation
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

export type SignupRequest = z.infer<typeof signupSchema>

/**
 * Password reset request validation
 */
export const passwordResetSchema = z.object({
  email: emailSchema,
})

export type PasswordResetRequest = z.infer<typeof passwordResetSchema>

/**
 * Password update validation (for reset password)
 */
export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PasswordUpdateRequest = z.infer<typeof passwordUpdateSchema>

/**
 * Change password validation (for authenticated users)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>

/**
 * Email verification validation
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export type EmailVerificationRequest = z.infer<typeof emailVerificationSchema>

/**
 * OAuth callback validation
 */
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
})

export type OAuthCallbackRequest = z.infer<typeof oauthCallbackSchema>

/**
 * Refresh token validation
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>

/**
 * Magic link request validation
 */
export const magicLinkSchema = z.object({
  email: emailSchema,
  redirectTo: z.string().url('Invalid redirect URL').optional(),
})

export type MagicLinkRequest = z.infer<typeof magicLinkSchema>
