/**
 * Event Validation Schemas
 * Validates event creation, updates, and RSVP requests
 */

import { z } from 'zod'
import {
  uuidSchema,
  locationSchema,
  tagsSchema,
  urlSchema,
  paginationSchema,
  dateRangeSchema,
} from './common'

/**
 * Event category options
 */
export const eventCategorySchema = z.enum([
  'networking',
  'social',
  'sports',
  'arts-culture',
  'food-drink',
  'outdoor',
  'learning',
  'wellness',
  'technology',
  'business',
  'music',
  'gaming',
  'travel',
  'volunteering',
  'other',
])

/**
 * Event type options
 */
export const eventTypeSchema = z.enum(['public', 'private', 'invite-only'])

/**
 * RSVP status options
 */
export const rsvpStatusSchema = z.enum(['going', 'maybe', 'not-going'])

/**
 * Create event request validation
 */
export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Event title is required')
      .max(100, 'Event title too long'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description too long'),
    category: eventCategorySchema,
    type: eventTypeSchema,
    startTime: z.string().datetime('Invalid start time'),
    endTime: z.string().datetime('Invalid end time'),
    location: locationSchema,
    venue: z
      .string()
      .min(1, 'Venue is required')
      .max(200, 'Venue name too long'),
    maxAttendees: z
      .number()
      .min(2, 'Event must allow at least 2 attendees')
      .max(1000, 'Maximum attendees cannot exceed 1000')
      .optional(),
    price: z
      .number()
      .min(0, 'Price cannot be negative')
      .max(10000, 'Price too high')
      .optional(),
    tags: tagsSchema,
    imageUrl: urlSchema,
    externalUrl: urlSchema,
    requiresApproval: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    recurrenceRule: z.string().max(200, 'Recurrence rule too long').optional(),
  })
  .refine(data => new Date(data.startTime) < new Date(data.endTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(data => new Date(data.startTime) > new Date(), {
    message: 'Event must be scheduled for a future date',
    path: ['startTime'],
  })

export type CreateEventRequest = z.infer<typeof createEventSchema>

/**
 * Update event request validation (all fields optional except those that shouldn't change)
 */
export const updateEventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Event title is required')
      .max(100, 'Event title too long')
      .optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description too long')
      .optional(),
    category: eventCategorySchema.optional(),
    startTime: z.string().datetime('Invalid start time').optional(),
    endTime: z.string().datetime('Invalid end time').optional(),
    location: locationSchema.optional(),
    venue: z
      .string()
      .min(1, 'Venue is required')
      .max(200, 'Venue name too long')
      .optional(),
    maxAttendees: z
      .number()
      .min(2, 'Event must allow at least 2 attendees')
      .max(1000, 'Maximum attendees cannot exceed 1000')
      .optional(),
    price: z
      .number()
      .min(0, 'Price cannot be negative')
      .max(10000, 'Price too high')
      .optional(),
    tags: tagsSchema.optional(),
    imageUrl: urlSchema,
    externalUrl: urlSchema,
    requiresApproval: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    data => {
      if (data.startTime && data.endTime) {
        return new Date(data.startTime) < new Date(data.endTime)
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )

export type UpdateEventRequest = z.infer<typeof updateEventSchema>

/**
 * RSVP request validation
 */
export const rsvpSchema = z.object({
  eventId: uuidSchema,
  status: rsvpStatusSchema,
  note: z.string().max(300, 'Note too long').optional(),
})

export type RSVPRequest = z.infer<typeof rsvpSchema>

/**
 * Event search/filter validation
 */
export const eventSearchSchema = z
  .object({
    q: z.string().max(100, 'Search query too long').optional(),
    category: z
      .array(eventCategorySchema)
      .max(5, 'Too many category filters')
      .optional(),
    type: eventTypeSchema.optional(),
    startDate: z.string().datetime('Invalid start date').optional(),
    endDate: z.string().datetime('Invalid end date').optional(),
    maxDistance: z.number().min(1).max(500).optional(),
    priceMin: z.number().min(0).optional(),
    priceMax: z.number().min(0).optional(),
    tags: z.array(z.string()).max(10, 'Too many tag filters').optional(),
    hasAvailableSpots: z.boolean().optional(),
    sortBy: z
      .enum(['date', 'distance', 'popularity', 'created'])
      .default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    ...paginationSchema.shape,
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate)
      }
      return true
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }
  )
  .refine(
    data => {
      if (data.priceMin !== undefined && data.priceMax !== undefined) {
        return data.priceMin <= data.priceMax
      }
      return true
    },
    {
      message: 'Maximum price must be greater than or equal to minimum price',
      path: ['priceMax'],
    }
  )

export type EventSearchRequest = z.infer<typeof eventSearchSchema>

/**
 * Event invitation validation
 */
export const inviteToEventSchema = z.object({
  eventId: uuidSchema,
  userIds: z
    .array(uuidSchema)
    .min(1, 'Select at least one user to invite')
    .max(50, 'Cannot invite more than 50 users at once'),
  message: z.string().max(300, 'Invitation message too long').optional(),
})

export type InviteToEventRequest = z.infer<typeof inviteToEventSchema>

/**
 * Event invitation response validation
 */
export const invitationResponseSchema = z.object({
  invitationId: uuidSchema,
  response: z.enum(['accept', 'decline']),
})

export type InvitationResponseRequest = z.infer<typeof invitationResponseSchema>

/**
 * Event check-in validation
 */
export const eventCheckInSchema = z.object({
  eventId: uuidSchema,
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
})

export type EventCheckInRequest = z.infer<typeof eventCheckInSchema>

/**
 * Event feedback validation
 */
export const eventFeedbackSchema = z.object({
  eventId: uuidSchema,
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  review: z.string().max(500, 'Review too long').optional(),
  wouldRecommend: z.boolean(),
})

export type EventFeedbackRequest = z.infer<typeof eventFeedbackSchema>

/**
 * Recurring event validation
 */
export const recurringEventSchema = z
  .object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly']),
    interval: z.number().min(1).max(12), // How many intervals between events
    endDate: z.string().datetime('Invalid end date').optional(),
    maxOccurrences: z.number().min(1).max(52).optional(), // Max 52 weekly events
  })
  .refine(
    data => {
      // Must have either endDate or maxOccurrences
      return data.endDate || data.maxOccurrences
    },
    {
      message: 'Must specify either end date or maximum occurrences',
      path: ['endDate'],
    }
  )

export type RecurringEventRequest = z.infer<typeof recurringEventSchema>
