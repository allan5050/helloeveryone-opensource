import { Heart, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

import FavoriteButton from '@/components/profile/FavoriteButton'
import { getCurrentUser } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'
import { shouldSkipImageOptimization } from '@/lib/utils/url-validation'

interface FavoriteProfile {
  id: string
  display_name: string
  bio: string | null
  photo_url: string | null
  age: number | null
  location: string | null
}

async function getFavorites(): Promise<FavoriteProfile[]> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('favorites')
    .select(
      `
      favorited_user_id,
      profiles!favorites_favorited_user_id_fkey (
        id,
        display_name,
        bio,
        photo_url,
        age,
        location
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites:', error)
    throw error
  }

  return data?.map(fav => fav.profiles as FavoriteProfile).filter(Boolean) || []
}

function FavoriteCard({ profile }: { profile: FavoriteProfile }) {
  // Check if URL is an SVG (like dicebear avatars) - use unoptimized for these
  const isSvgUrl = shouldSkipImageOptimization(profile.photo_url)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="relative">
        <div className="relative aspect-[4/3]">
          {profile.photo_url ? (
            <Image
              src={profile.photo_url}
              alt={profile.display_name}
              fill
              className="object-cover"
              unoptimized={isSvgUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
              <Heart className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="absolute right-2 top-2">
          <FavoriteButton profileId={profile.id} />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {profile.display_name}
            {profile.age && (
              <span className="font-normal text-gray-600">, {profile.age}</span>
            )}
          </h3>
        </div>

        {profile.location && (
          <div className="mb-3 flex items-center text-sm text-gray-600">
            <MapPin className="mr-1 h-4 w-4" />
            {profile.location}
          </div>
        )}

        {profile.bio && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
            {profile.bio}
          </p>
        )}

        <Link
          href={`/profile/${profile.id}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <Heart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        No favorites yet
      </h3>
      <p className="mx-auto mb-6 max-w-md text-gray-600">
        Start exploring profiles and add people to your favorites to see them
        here.
      </p>
      <Link
        href="/matches"
        className="inline-flex items-center rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
      >
        Browse Matches
      </Link>
    </div>
  )
}

async function FavoritesList() {
  const favorites = await getFavorites()

  if (favorites.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map(profile => (
        <FavoriteCard key={profile.id} profile={profile} />
      ))}
    </div>
  )
}

function FavoritesLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="aspect-[4/3] animate-pulse bg-gray-200" />
          <div className="space-y-3 p-4">
            <div className="h-6 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-4 animate-pulse rounded bg-gray-200" />
            <div className="h-10 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Your Favorites
        </h1>
        <p className="text-gray-600">
          People you've bookmarked to connect with later
        </p>
      </div>

      <Suspense fallback={<FavoritesLoading />}>
        <FavoritesList />
      </Suspense>
    </div>
  )
}
