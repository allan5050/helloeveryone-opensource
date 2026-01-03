import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/api/auth'
import { calculateDistanceBetweenZips, formatDistance } from '@/lib/utils/distance'
import MatchExplanation from '@/components/matching/MatchExplanation'
import FavoriteButton from '@/components/profile/FavoriteButton'
import MessageButton from '@/components/profile/MessageButton'
import AIInsightSection from '@/components/matching/AIInsightSection'
import Avatar from '@/components/ui/Avatar'

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

async function getMatchDetails(currentUserId: string, matchUserId: string) {
  const supabase = await createClient()

  // Get both profiles to check locations
  const [profileResult, currentUserProfileResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', matchUserId)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUserId)
      .single()
  ])

  if (profileResult.error) {
    return null
  }

  // Get match score and other data (check both directions)
  const [matchResult, matchResultReverse, commonEventsResult, favoriteResult] =
    await Promise.all([
      supabase
        .from('match_scores')
        .select('*')
        .eq('user_id_1', currentUserId)
        .eq('user_id_2', matchUserId)
        .single(),

      supabase
        .from('match_scores')
        .select('*')
        .eq('user_id_1', matchUserId)
        .eq('user_id_2', currentUserId)
        .single(),

      // Get common events both users have RSVPed to
      supabase
        .from('events')
        .select(
          `
        title,
        date,
        location,
        rsvps!inner(user_id)
      `
        )
        .in('rsvps.user_id', [currentUserId, matchUserId]),

      // Check if user is favorited
      supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('favorite_user_id', matchUserId)
        .single(),
    ])

  // Process common events (events where both users have RSVPs)
  const eventRsvps = commonEventsResult.data || []
  const eventUserCounts = eventRsvps.reduce(
    (acc: Record<string, number>, event: any) => {
      const key = event.title
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {}
  )

  const commonEvents = Object.entries(eventUserCounts)
    .filter(([_, count]) => count >= 2)
    .map(([title]) => title)

  // Calculate common interests between users
  const userInterests = currentUserProfileResult.data?.interests || []
  const matchInterests = profileResult.data.interests || []
  const commonInterests = userInterests.filter((interest: string) =>
    matchInterests.some((mInterest: string) =>
      mInterest.toLowerCase() === interest.toLowerCase()
    )
  )

  // Use match score from either direction
  const dbMatch = matchResult.data || matchResultReverse.data

  // Create a normalized match object with all the fields we need
  const match = {
    combined_score: dbMatch?.combined_score || 0,
    total_score: dbMatch ? dbMatch.combined_score * 100 : 0,
    common_interests: commonInterests,
    bio_similarity: dbMatch?.semantic_score || 0,
    location_score: 0,
    user_id_1: currentUserId,
    user_id_2: matchUserId
  }

  return {
    match,
    profile: profileResult.data,
    currentUserProfile: currentUserProfileResult.data,
    commonEvents,
    isFavorite: !favoriteResult.error,
  }
}

function MatchDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          {/* Header */}
          <div className="mb-8 flex items-center space-x-4">
            <div className="h-8 w-8 rounded bg-gray-200"></div>
            <div className="h-8 w-48 rounded bg-gray-200"></div>
          </div>

          {/* Profile Card */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-start md:space-x-6 md:space-y-0">
              <div className="mx-auto h-32 w-32 rounded-full bg-gray-200 md:mx-0"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 w-48 rounded bg-gray-200"></div>
                <div className="h-4 w-24 rounded bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200"></div>
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                </div>
                <div className="flex space-x-4">
                  <div className="h-10 w-24 rounded bg-gray-200"></div>
                  <div className="h-10 w-24 rounded bg-gray-200"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Explanation */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-6 h-8 w-48 rounded bg-gray-200"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-32 rounded bg-gray-200"></div>
                    <div className="h-6 w-16 rounded bg-gray-200"></div>
                  </div>
                  <div className="h-2 w-full rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function MatchDetailContent({ params }: PageProps) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return <div>Please log in to view match details.</div>
  }

  const { userId } = await params
  const matchDetails = await getMatchDetails(currentUser.id, userId)

  if (!matchDetails) {
    notFound()
  }

  const { match, profile, currentUserProfile, commonEvents, isFavorite } = matchDetails

  // Calculate distance if both users have locations
  const distance = calculateDistanceBetweenZips(currentUserProfile?.location, profile.location)

  // Get current user's interests for comparison
  const currentUserInterests = currentUserProfile?.interests || []

  // Calculate common interests for display
  const profileInterests = profile.interests || []
  const commonInterests = currentUserInterests.filter((interest: string) =>
    profileInterests.some((pInterest: string) =>
      pInterest.toLowerCase() === interest.toLowerCase()
    )
  )

  // Sort interests: shared ones first, then others
  const sortedInterests = profile.interests ? [...profile.interests].sort((a, b) => {
    const aIsShared = currentUserInterests.some(interest =>
      interest.toLowerCase() === a.toLowerCase() ||
      match.common_interests?.includes(a)
    )
    const bIsShared = currentUserInterests.some(interest =>
      interest.toLowerCase() === b.toLowerCase() ||
      match.common_interests?.includes(b)
    )

    if (aIsShared && !bIsShared) return -1
    if (!aIsShared && bIsShared) return 1
    return 0
  }) : []

  const getAvatarSrc = () => {
    // Check for photo_url first (new field for local images)
    const photoUrl = (profile as any).photo_url
    if (photoUrl) {
      // Handle local images from public folder
      if (photoUrl.startsWith('/images/')) {
        return photoUrl
      }
      // Handle full URLs
      if (photoUrl.startsWith('http')) {
        return photoUrl
      }
    }

    // No avatar_url available, proceed to placeholder

    const fullName = (profile as any).full_name
    return `/api/placeholder/200/200?text=${encodeURIComponent((fullName || profile.display_name || 'U').charAt(0))}`
  }

  const calculateAgeCompatibility = () => {
    const ageDiff = Math.abs((profile.age || 30) - 30) // Assume current user is 30 for demo
    return Math.max(0, 100 - ageDiff * 5) // Decrease 5% per year difference
  }

  // Determine match quality based on score or shared interests
  const getMatchQuality = (): 'high' | 'medium' | 'low' => {
    // First try to use the actual combined score from database
    if (match.combined_score > 0) {
      if (match.combined_score >= 0.8) return 'high'
      if (match.combined_score >= 0.6) return 'medium'
      return 'low'
    }

    // If no match score, use shared interests as a fallback
    if (commonInterests.length >= 3) return 'medium'
    if (commonInterests.length >= 1) return 'low'

    // Default to low for profiles with no match data
    return 'low'
  }

  const matchQuality = getMatchQuality()

  const getMatchQualityColor = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <Link
            href="/matches"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Match Details</h1>
        </div>

        {/* Profile Card */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex flex-col space-y-6 md:flex-row md:items-start md:space-x-8 md:space-y-0">
            {/* Avatar */}
            <Avatar
              src={getAvatarSrc()}
              alt={`${(profile as any).full_name || profile.display_name}'s avatar`}
              fallbackText={(profile as any).full_name || profile.display_name || 'User'}
              size="lg"
              className="mx-auto flex-shrink-0 md:mx-0"
            />

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-gray-900">
                    {(profile as any).full_name || profile.display_name || 'User'}
                  </h2>
                  <div className="flex items-center justify-center space-x-4 text-gray-600 md:justify-start">
                    {profile.age && (
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{profile.age} years old</span>
                      </span>
                    )}
                    {profile.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                        {distance !== null && (
                          <span className="text-purple-600 font-medium">
                            ({formatDistance(distance)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Quality Badge - always show */}
                <div className="mt-4 md:mt-0">
                  <div className={`rounded-full px-4 py-2 text-lg font-bold capitalize ${getMatchQualityColor(matchQuality)}`}>
                    {matchQuality} Match
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mb-6 leading-relaxed text-gray-700">
                  {profile.bio}
                </p>
              )}

              {/* Interests */}
              {sortedInterests.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-gray-900">
                    Interests
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                    {sortedInterests.map((interest, index) => {
                      const isShared = currentUserInterests.some(userInterest =>
                        userInterest.toLowerCase() === interest.toLowerCase()
                      ) || match.common_interests?.includes(interest)

                      return (
                        <span
                          key={index}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
                            isShared
                              ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200 shadow-sm'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {interest}
                          {isShared && (
                            <span className="ml-1" aria-label="Shared interest">✨</span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                  {currentUserInterests.length > 0 && sortedInterests.some(interest =>
                    currentUserInterests.some(userInterest =>
                      userInterest.toLowerCase() === interest.toLowerCase()
                    )
                  ) && (
                    <p className="mt-3 text-sm text-purple-600">
                      ✨ Highlighted interests are ones you share
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <MessageButton
                  targetUserId={profile.user_id}
                  className="px-6 py-3"
                  showText={true}
                />
                <FavoriteButton
                  targetUserId={profile.user_id}
                  initialIsFavorite={isFavorite}
                  className="px-6 py-3"
                  showText={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Section - Show button for all profiles */}
        <AIInsightSection
          targetUserId={profile.user_id}
          targetUserBio={profile.bio || undefined}
          targetUserInterests={profile.interests || undefined}
          currentUserBio={currentUserProfile?.bio || undefined}
          currentUserInterests={currentUserInterests}
          currentUserLocation={currentUserProfile?.location || undefined}
          sharedInterests={match.common_interests || commonInterests}
          matchQuality={matchQuality}
          className="mb-8"
        />

        {/* Common Events */}
        {commonEvents.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
              <Calendar className="mr-2 h-5 w-5 text-purple-600" />
              Events You've Both Attended ({commonEvents.length})
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {commonEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 rounded-lg bg-purple-50 p-3"
                >
                  <div className="h-3 w-3 flex-shrink-0 rounded-full bg-purple-400" />
                  <span className="font-medium text-gray-700">{event}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Explanation - only show if we have a match score */}
        {match.total_score > 0 && (
          <MatchExplanation
            matchScore={match.total_score}
            sharedInterests={match.common_interests || []}
            ageCompatibility={calculateAgeCompatibility()}
            bioSimilarity={match.bio_similarity || 75}
            locationScore={match.location_score || 85}
            commonEvents={commonEvents}
          />
        )}
      </div>
    </div>
  )
}

export default function MatchDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<MatchDetailSkeleton />}>
      <MatchDetailContent params={params} />
    </Suspense>
  )
}
