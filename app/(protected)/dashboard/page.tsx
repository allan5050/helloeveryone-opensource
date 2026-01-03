import {
  Calendar,
  Users,
  Settings,
  Heart,
  MessageCircle,
  TrendingUp,
} from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import MatchCard from '@/components/matching/MatchCard'
import { getCurrentUser } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard - HelloEveryone.fun',
  description:
    'Your personal dashboard showing upcoming events, recent matches, and quick actions for finding meaningful connections.',
  openGraph: {
    title: 'Dashboard - HelloEveryone.fun',
    description: 'Your personal dashboard for meaningful connections',
    type: 'website',
  },
}

async function getUpcomingEvents(userId: string) {
  const supabase = await createClient()

  // First get RSVPs for this user
  const { data: rsvps, error: rsvpError } = await supabase
    .from('rsvps')
    .select('event_id')
    .eq('user_id', userId)

  if (rsvpError || !rsvps || rsvps.length === 0) {
    return []
  }

  // Then get the events for those RSVPs
  const eventIds = rsvps.map(r => r.event_id)
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(3)

  if (error) {
    console.error('Error fetching upcoming events:', error)
    return []
  }

  return events || []
}

async function getRecentMatches(userId: string) {
  const supabase = await createClient()

  const { data: matches, error } = await supabase
    .from('match_scores')
    .select(
      `
      *,
      profiles!match_scores_user_id_2_fkey(
        id,
        user_id,
        display_name,
        bio,
        age,
        interests
      )
    `
    )
    .eq('user_id_1', userId)
    .gte('combined_score', 0.7)
    .order('combined_score', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching recent matches:', error)
    return []
  }

  return matches || []
}

async function getMatchStats(userId: string) {
  const supabase = await createClient()

  const [totalMatches, favorites, messages] = await Promise.all([
    supabase
      .from('match_scores')
      .select('id', { count: 'exact' })
      .eq('user_id_1', userId)
      .gte('combined_score', 0.7),

    supabase
      .from('favorites')
      .select('id', { count: 'exact' })
      .eq('user_id', userId),

    supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('sender_id', userId),
  ])

  return {
    totalMatches: totalMatches.count || 0,
    favorites: favorites.count || 0,
    messages: messages.count || 0,
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Header Skeleton */}
      <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-6">
        <div className="animate-pulse">
          <div className="mb-2 h-8 w-64 rounded bg-purple-300"></div>
          <div className="h-4 w-48 rounded bg-purple-300"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="animate-pulse">
              <div className="mb-2 h-6 w-20 rounded bg-gray-200"></div>
              <div className="h-8 w-12 rounded bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Sections Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map(i => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <div className="animate-pulse">
              <div className="mb-4 h-6 w-32 rounded bg-gray-200"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-16 rounded bg-gray-100"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

async function DashboardContent() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Please log in to view your dashboard.</div>
  }

  const [upcomingEvents, recentMatches, matchStats] = await Promise.all([
    getUpcomingEvents(user.id),
    getRecentMatches(user.id),
    getMatchStats(user.id),
  ])

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">
          Welcome back, {user.user_metadata?.first_name || 'there'}! 👋
        </h1>
        <p className="text-purple-100">
          Ready to make some meaningful connections today?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">
                {matchStats.totalMatches}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">
                {matchStats.favorites}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {matchStats.messages}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-xl font-semibold text-gray-900">
              <Calendar className="mr-2 h-5 w-5 text-purple-600" />
              Upcoming Events
            </h2>
            <Link
              href="/events"
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              View all
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="mb-3 text-gray-600">No upcoming events yet</p>
              <Link
                href="/events"
                className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
              >
                Find Events
              </Link>
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-xl font-semibold text-gray-900">
              <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
              Top Matches
            </h2>
            <Link
              href="/matches"
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              View all
            </Link>
          </div>

          {recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.map(match => (
                <MatchCard
                  key={match.id}
                  profile={match.profiles}
                  matchScore={match.combined_score * 100}
                  sharedInterests={[]}
                  className="border-0 shadow-sm hover:shadow-md"
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="mb-3 text-gray-600">No matches found yet</p>
              <Link
                href="/matches"
                className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
              >
                Discover Matches
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/events"
          className="group flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-md"
        >
          <div className="text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-purple-600 transition-transform group-hover:scale-110" />
            <h3 className="font-semibold text-gray-900">Find Events</h3>
            <p className="mt-1 text-sm text-gray-600">Discover local meetups</p>
          </div>
        </Link>

        <Link
          href="/matches"
          className="group flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-md"
        >
          <div className="text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-purple-600 transition-transform group-hover:scale-110" />
            <h3 className="font-semibold text-gray-900">View Matches</h3>
            <p className="mt-1 text-sm text-gray-600">See your compatibility</p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="group flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-md"
        >
          <div className="text-center">
            <Settings className="mx-auto mb-2 h-8 w-8 text-purple-600 transition-transform group-hover:scale-110" />
            <h3 className="font-semibold text-gray-900">Update Profile</h3>
            <p className="mt-1 text-sm text-gray-600">Improve your matches</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
