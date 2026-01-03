import { Users, Calendar, TrendingUp, Activity } from 'lucide-react'

interface AdminStatsProps {
  stats: {
    totalUsers: number
    activeEvents: number
    recentSignups: any[]
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'blue',
    },
    {
      name: 'Active Events',
      value: stats.activeEvents.toLocaleString(),
      icon: Calendar,
      color: 'green',
    },
    {
      name: 'Recent Signups',
      value: stats.recentSignups.length.toLocaleString(),
      icon: TrendingUp,
      color: 'purple',
    },
    {
      name: 'Platform Health',
      value: 'Good',
      icon: Activity,
      color: 'emerald',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      emerald: 'bg-emerald-500 text-emerald-600 bg-emerald-50',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map(stat => {
        const colorClasses = getColorClasses(stat.color).split(' ')
        return (
          <div key={stat.name} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className={`rounded-lg p-3 ${colorClasses[2]}`}>
                <stat.icon className={`h-6 w-6 ${colorClasses[1]}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
