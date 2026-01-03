'use client'

import { Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  full_name?: string
  display_name?: string
  bio?: string
  interests?: string[]
  location?: string
  age?: number
  photo_url?: string
  is_profile_complete?: boolean
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        router.push('/login')
        return
      }

      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error) {
          // Check if it's a "no rows" error - means profile doesn't exist
          if (error.code === 'PGRST116') {
            console.log('No profile found, redirecting to setup...')
            router.push('/profile/setup')
            return
          }
          console.error('Error loading profile:', error)
          router.push('/profile/setup')
          return
        }

        if (!data || !data.is_profile_complete) {
          router.push('/profile/setup')
          return
        }

        setProfile(data)
      } catch (error) {
        console.error('Profile page error:', error)
        router.push('/profile/setup')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl md:max-w-4xl lg:max-w-7xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <Link
              href="/settings"
              className="rounded-full p-2 transition-colors duration-150 hover:bg-gray-100"
              aria-label="Open settings"
            >
              <Settings className="h-6 w-6 text-gray-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl md:max-w-4xl lg:max-w-7xl">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-center sm:flex sm:items-start sm:text-left">
            <div className="mx-auto mb-4 h-20 w-20 sm:mx-0 sm:mb-0 sm:mr-6">
              {profile?.photo_url ? (
                <div className="relative h-20 w-20">
                  <Image
                    src={profile.photo_url}
                    alt="Profile photo"
                    fill
                    sizes="80px"
                    className="rounded-full object-cover"
                    unoptimized={
                      profile.photo_url.includes('.svg') ||
                      profile.photo_url.includes('dicebear.com')
                    }
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-2xl font-semibold text-gray-600">
                    {profile?.display_name?.charAt(0).toUpperCase() ||
                      profile?.full_name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="mb-1 text-xl font-semibold text-gray-900">
                {profile?.display_name || profile?.full_name || 'Your Profile'}
              </h2>
              <p className="mb-4 text-sm text-gray-600">{user?.email}</p>
              <Link
                href="/profile/edit"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="mt-6 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-gray-900">About</h3>
            <p className="text-sm text-gray-600">
              {profile?.bio ||
                'Add a bio to help others get to know you better.'}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-gray-900">
              Interests
            </h3>
            <p className="text-sm text-gray-600">
              {profile?.interests?.length
                ? profile.interests.join(', ')
                : 'Share your hobbies and interests to find like-minded people.'}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-gray-900">Location</h3>
            <p className="text-sm text-gray-600">
              {profile?.location ||
                'Add your location to discover nearby events.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
