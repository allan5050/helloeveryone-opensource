'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSetupSchema, ProfileSetupData } from '@/lib/validations/profile'
import { InterestSelector } from '@/components/profile/InterestSelector'
import { PhotoUpload } from '@/components/profile/PhotoUpload'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/contexts/AuthContext'

const STEPS = [
  { title: 'Basic Info', description: 'Tell us about yourself' },
  { title: 'Interests', description: 'What do you enjoy?' },
  { title: 'Bio & Photo', description: 'Complete your profile' },
]

export default function ProfileSetup() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const lastNavigationTime = useRef(0)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const form = useForm<ProfileSetupData>({
    resolver: zodResolver(profileSetupSchema),
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
    },
  })

  // Debug currentStep changes
  useEffect(() => {
    console.log('currentStep changed to:', currentStep)
    if (currentStep === 2) {
      console.log('Now on step 2 (Bio & Photo)')
      console.log('Form values at step 2:', form.getValues())
      console.log('Form isValid:', form.formState.isValid)
    }
  }, [currentStep, form])

  const nextStep = async () => {
    // Debounce rapid clicks
    const now = Date.now()
    if (now - lastNavigationTime.current < 300) {
      console.log('Ignoring rapid click')
      return
    }
    lastNavigationTime.current = now
    
    // Prevent double-clicking
    if (isNavigating) {
      console.log('Navigation already in progress, ignoring')
      return
    }
    
    console.log('nextStep called, currentStep:', currentStep)
    setIsNavigating(true)
    
    try {
      // Validate current step's fields
      const fieldsToValidate = getFieldsForStep(currentStep)
      const isValid = await form.trigger(fieldsToValidate)
      
      console.log('Validation result for step', currentStep, ':', isValid)
      
      if (isValid && currentStep < STEPS.length - 1) {
        console.log('Moving from step', currentStep, 'to step', currentStep + 1)
        setCurrentStep(currentStep + 1)
      } else if (!isValid) {
        console.log('Validation failed for step', currentStep, ', staying on current step')
        // Show validation errors
        const errors = form.formState.errors
        console.log('Validation errors:', errors)
      }
    } finally {
      // Reset navigation flag after a short delay
      setTimeout(() => setIsNavigating(false), 500)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 0:
        return ['display_name', 'age', 'location'] as const
      case 1:
        return ['interests'] as const
      case 2:
        return ['bio'] as const
      default:
        return []
    }
  }

  const onSubmit = async (data: ProfileSetupData) => {
    console.log('onSubmit handler called, currentStep:', currentStep)
    
    if (!user) {
      console.error('No user found')
      return
    }
    
    // This should only be called when we're on the last step
    // If we're here from another step, something is wrong
    if (currentStep !== STEPS.length - 1) {
      console.error('ERROR: Form submitted from wrong step:', currentStep, 'Expected step:', STEPS.length - 1)
      return
    }

    setIsSubmitting(true)
    try {
      // Flatten the interests object into a single array
      const flattenedInterests = [
        ...(data.interests.music_genres || []),
        ...(data.interests.food_preferences || []),
        ...(data.interests.activities || [])
      ]

      // Prepare profile data - match the actual database columns
      const profileData = {
        display_name: data.display_name,
        full_name: data.display_name, // Use display_name as full_name for now
        age: data.age,
        location: data.location || null,
        interests: flattenedInterests, // Use flattened array
        bio: data.bio || null,
        photo_url: photoUrl,
        is_profile_complete: true,
        // These are the new columns we added
        looking_for: ['friends', 'networking'], // Default values for now
        availability: ['weekends', 'evenings'], // Default values for now
        preferred_age_min: 25,
        preferred_age_max: 50,
        privacy_settings: {
          show_age: true,
          show_location: true,
          show_interests: true,
        },
        updated_at: new Date().toISOString()
      }

      console.log('Saving profile data:', profileData)

      // Update the profile (it should already exist from the auth trigger)
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
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
                placeholder="How should others see your name?"
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
        )

      case 1:
        return (
          <div className="space-y-8">
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
        )

      case 2:
        return (
          <div className="space-y-6">
            <PhotoUpload
              currentPhotoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
            />

            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Bio
              </label>
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
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">Help others get to know you better</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {step.title}
                  </div>
                  <div className="hidden text-xs text-gray-500 sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form 
            onSubmit={(e) => {
              console.log('Form onSubmit event triggered')
              console.log('Current step:', currentStep)
              console.log('Event target:', e.target)
              console.log('Event submitter:', (e as any).submitter)
              
              e.preventDefault()
              e.stopPropagation()
              
              // Only allow submission from the last step via the Complete Profile button
              if (currentStep === STEPS.length - 1 && !isNavigating) {
                console.log('Processing form submission on last step')
                form.handleSubmit(onSubmit)(e)
              } else {
                console.log('Blocking form submission - step:', currentStep, 'isNavigating:', isNavigating)
                return false
              }
            }}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key except for the submit button
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault()
              }
            }}
          >
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="min-h-[44px] rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isNavigating}
                  className="min-h-[44px] rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isNavigating ? 'Validating...' : 'Next'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
