'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useAuth } from '@/app/contexts/AuthContext'
import { InterestSelector } from '@/components/profile/InterestSelector'
import { PhotoUpload } from '@/components/profile/PhotoUpload'
import { createClient } from '@/lib/supabase/client'
import { profileEditSchema, ProfileEditData } from '@/lib/validations/profile'

export default function ProfileEdit() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const form = useForm<ProfileEditData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      display_name: '',
      age: 25,
      location: '',
      interests: {
        music_genres: [],
        food_preferences: [],
        activities: [],
      },
      bio: '',
      privacy_settings: {
        show_age: true,
        show_location: true,
        show_interests: true,
      },
    },
  })

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        if (profile) {
          // Import the interest constants to properly categorize
          const { MUSIC_GENRES, FOOD_PREFERENCES, ACTIVITIES } =
            await import('@/lib/validations/profile')

          // Convert flat interests array back to categorized object
          const categorizedInterests = {
            music_genres: [] as string[],
            food_preferences: [] as string[],
            activities: [] as string[],
          }

          // Properly categorize the interests based on the defined constants
          if (Array.isArray(profile.interests)) {
            profile.interests.forEach((interest: string) => {
              if (MUSIC_GENRES.includes(interest as any)) {
                categorizedInterests.music_genres.push(interest)
              } else if (FOOD_PREFERENCES.includes(interest as any)) {
                categorizedInterests.food_preferences.push(interest)
              } else if (ACTIVITIES.includes(interest as any)) {
                categorizedInterests.activities.push(interest)
              }
            })
          }

          // Cast interests to the expected type since we know they're valid values from the database
          const typedInterests = categorizedInterests as {
            music_genres: typeof import('@/lib/validations/profile').MUSIC_GENRES[number][]
            food_preferences: typeof import('@/lib/validations/profile').FOOD_PREFERENCES[number][]
            activities: typeof import('@/lib/validations/profile').ACTIVITIES[number][]
          }

          // Cast privacy_settings to the expected type
          const typedPrivacySettings = (profile.privacy_settings as {
            show_age?: boolean
            show_location?: boolean
            show_interests?: boolean
          } | null) || {
            show_age: true,
            show_location: true,
            show_interests: true,
          }

          form.reset({
            display_name: profile.display_name || '',
            age: profile.age || 25,
            location: profile.location || '',
            interests: typedInterests,
            bio: profile.bio || '',
            privacy_settings: typedPrivacySettings,
          })
          setPhotoUrl(profile.photo_url)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user, supabase, form])

  const onSubmit = async (data: ProfileEditData) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      // Flatten the interests object into a single array
      const flattenedInterests = [
        ...(data.interests.music_genres || []),
        ...(data.interests.food_preferences || []),
        ...(data.interests.activities || []),
      ]

      const profileData = {
        display_name: data.display_name,
        age: data.age,
        location: data.location || null,
        interests: flattenedInterests, // Use flattened array
        bio: data.bio || null,
        photo_url: photoUrl,
        privacy_settings: data.privacy_settings,
        updated_at: new Date().toISOString(),
      }

      // Use update instead of upsert to avoid RLS policy issues
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)

      if (error) throw error

      // Show success message and keep user on the page
      setShowSuccess(true)

      // Scroll to the bottom to show the success message
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 100)

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="mt-1 text-gray-600">
                Update your information and preferences
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white shadow-sm">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 p-6"
          >
            {/* Photo Upload */}
            <PhotoUpload
              currentPhotoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
            />

            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                Basic Information
              </h2>

              <div>
                <label
                  htmlFor="display_name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Display Name *
                </label>
                <input
                  id="display_name"
                  type="text"
                  {...form.register('display_name')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.formState.errors.display_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.display_name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="age"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Age *
                </label>
                <input
                  id="age"
                  type="number"
                  min="25"
                  max="50"
                  {...form.register('age', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.formState.errors.age && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.age.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  {...form.register('location')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, State (optional)"
                />
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-6">
              <h2 className="border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                Interests
              </h2>

              <InterestSelector
                form={form}
                category="music_genres"
                label="Music Genres"
                maxSelections={5}
              />
              <InterestSelector
                form={form}
                category="food_preferences"
                label="Food Preferences"
                maxSelections={5}
              />
              <InterestSelector
                form={form}
                category="activities"
                label="Activities"
                maxSelections={8}
              />
              {form.formState.errors.interests && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.interests.message}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-4">
              <h2 className="border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                Bio
              </h2>

              <div>
                <textarea
                  id="bio"
                  rows={4}
                  {...form.register('bio')}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell others about yourself, your interests, what you're looking for in connections..."
                />
                <div className="mt-1 flex justify-between">
                  {form.formState.errors.bio && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.bio.message}
                    </p>
                  )}
                  <span className="text-sm text-gray-500">
                    {form.watch('bio')?.length || 0}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h2 className="border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                Privacy Settings
              </h2>
              <p className="text-sm text-gray-600">
                Control what information is visible to potential matches
              </p>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...form.register('privacy_settings.show_age')}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show my age</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...form.register('privacy_settings.show_location')}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show my location
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...form.register('privacy_settings.show_interests')}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show my interests
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              {/* Success Message */}
              {showSuccess && (
                <div className="animate-in slide-in-from-bottom-2 mb-4 rounded-lg bg-green-50 p-4 transition-all duration-300">
                  <div className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Profile saved successfully!
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        Your changes have been saved. You can continue editing
                        or{' '}
                        <button
                          type="button"
                          onClick={() => router.push('/dashboard')}
                          className="font-medium underline hover:text-green-800"
                        >
                          return to dashboard
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
