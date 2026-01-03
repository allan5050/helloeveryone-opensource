import { subDays, format, eachDayOfInterval } from 'date-fns'

import { createClient } from '@/lib/supabase/server'

import { EngagementMetrics } from './EngagementMetrics'
import { EventCategoriesChart } from './charts/EventCategoriesChart'
import { UserGrowthChart } from './charts/UserGrowthChart'

async function getAnalyticsData() {
  const supabase = await createClient()
  const thirtyDaysAgo = subDays(new Date(), 30)

  const { data: userGrowth } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at')

  const { data: events } = await supabase.from('events').select('category')

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('created_at, event_id')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const { data: matches } = await supabase
    .from('match_scores')
    .select('created_at, score')
    .gte('created_at', thirtyDaysAgo.toISOString())

  return {
    userGrowth: userGrowth || [],
    events: events || [],
    rsvps: rsvps || [],
    matches: matches || [],
  }
}

function processUserGrowthData(userGrowth: any[]) {
  const thirtyDaysAgo = subDays(new Date(), 30)
  const days = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: new Date(),
  })

  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const count = userGrowth.filter(
      user => format(new Date(user.created_at), 'yyyy-MM-dd') === dayStr
    ).length

    return {
      date: format(day, 'MMM dd'),
      users: count,
    }
  })
}

function processEventCategoriesData(events: any[]) {
  const categories = events.reduce(
    (acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(categories).map(([category, count]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    count: count as number,
  }))
}

export async function AnalyticsDashboard() {
  const data = await getAnalyticsData()

  const userGrowthData = processUserGrowthData(data.userGrowth)
  const eventCategoriesData = processEventCategoriesData(data.events)

  const engagementData = {
    totalRSVPs: data.rsvps.length,
    avgRSVPsPerEvent:
      data.events.length > 0
        ? Math.round((data.rsvps.length / data.events.length) * 100) / 100
        : 0,
    totalMatches: data.matches.length,
    avgMatchScore:
      data.matches.length > 0
        ? Math.round(
            (data.matches.reduce((sum, match) => sum + match.score, 0) /
              data.matches.length) *
              100
          ) / 100
        : 0,
  }

  return (
    <div className="space-y-6">
      <EngagementMetrics data={engagementData} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            User Growth (Last 30 Days)
          </h3>
          <UserGrowthChart data={userGrowthData} />
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Event Categories
          </h3>
          <EventCategoriesChart data={eventCategoriesData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h4 className="text-sm font-medium text-gray-500">Total Events</h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data.events.length}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h4 className="text-sm font-medium text-gray-500">Total RSVPs</h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data.rsvps.length}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h4 className="text-sm font-medium text-gray-500">New Users (30d)</h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data.userGrowth.length}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h4 className="text-sm font-medium text-gray-500">
            Matches Made (30d)
          </h4>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data.matches.length}
          </p>
        </div>
      </div>
    </div>
  )
}
