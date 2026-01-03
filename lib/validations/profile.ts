import { z } from 'zod'

// Interest categories based on database schema
export const MUSIC_GENRES = [
  'rock',
  'pop',
  'jazz',
  'classical',
  'electronic',
  'hip-hop',
  'country',
  'indie',
  'blues',
  'reggae',
  'folk',
  'metal',
  'r&b',
  'punk',
  'alternative',
] as const

export const FOOD_PREFERENCES = [
  'italian',
  'mexican',
  'asian',
  'mediterranean',
  'american',
  'indian',
  'thai',
  'japanese',
  'vegetarian',
  'vegan',
  'seafood',
  'bbq',
  'desserts',
  'coffee',
  'wine',
  'craft-beer',
] as const

export const ACTIVITIES = [
  'hiking',
  'reading',
  'cooking',
  'photography',
  'travel',
  'fitness',
  'yoga',
  'dancing',
  'gaming',
  'art',
  'writing',
  'volunteering',
  'gardening',
  'sports',
  'movies',
  'theater',
  'concerts',
  'museums',
] as const

export const profileSetupSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  age: z
    .number()
    .min(25, 'Age must be between 25-50')
    .max(50, 'Age must be between 25-50'),
  location: z.string().optional(),
  interests: z
    .object({
      music_genres: z
        .array(z.enum(MUSIC_GENRES))
        .max(5, 'Select up to 5 music genres')
        .optional()
        .default([]),
      food_preferences: z
        .array(z.enum(FOOD_PREFERENCES))
        .max(5, 'Select up to 5 food preferences')
        .optional()
        .default([]),
      activities: z
        .array(z.enum(ACTIVITIES))
        .max(8, 'Select up to 8 activities')
        .optional()
        .default([]),
    })
    .optional()
    .default({
      music_genres: [],
      food_preferences: [],
      activities: [],
    }),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

export const profileEditSchema = profileSetupSchema.extend({
  privacy_settings: z
    .object({
      show_age: z.boolean().default(true),
      show_location: z.boolean().default(true),
      show_interests: z.boolean().default(true),
    })
    .optional(),
})

export type ProfileSetupData = z.infer<typeof profileSetupSchema>
export type ProfileEditData = z.infer<typeof profileEditSchema>
