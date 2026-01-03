import { TrendingUp, Users, Calendar, Heart } from 'lucide-react'

interface EngagementMetricsProps {
  data: {
    totalRSVPs: number
    avgRSVPsPerEvent: number
    totalMatches: number
    avgMatchScore: number
  }
}

export function EngagementMetrics({ data }: EngagementMetricsProps) {
  const metrics = [
    {
      name: 'Total RSVPs',
      value: data.totalRSVPs.toLocaleString(),
      icon: Calendar,
      color: 'blue',
      trend: '+12%',
    },
    {
      name: 'Avg RSVPs/Event',
      value: data.avgRSVPsPerEvent.toString(),
      icon: Users,
      color: 'green',
      trend: '+8%',
    },
    {
      name: 'Total Matches',
      value: data.totalMatches.toLocaleString(),
      icon: Heart,
      color: 'pink',
      trend: '+15%',
    },
    {
      name: 'Avg Match Score',
      value: `${(data.avgMatchScore * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'purple',
      trend: '+3%',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      pink: 'bg-pink-100 text-pink-600',
      purple: 'bg-purple-100 text-purple-600',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(metric => {
        const colorClasses = getColorClasses(metric.color)
        return (
          <div key={metric.name} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {metric.name}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-green-600">
                  <span className="font-medium">{metric.trend}</span> from last
                  month
                </p>
              </div>
              <div className={`rounded-lg p-3 ${colorClasses}`}>
                <metric.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
