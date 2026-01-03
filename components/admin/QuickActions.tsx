import Link from 'next/link'
import { Plus, Users, BarChart3, Calendar } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      name: 'Create Event',
      description: 'Add a new event to the platform',
      href: '/admin/events/create',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Manage Users',
      description: 'View and manage user accounts',
      href: '/admin/users',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'View Analytics',
      description: 'Check platform performance metrics',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'All Events',
      description: 'Manage existing events',
      href: '/admin/events',
      icon: Calendar,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ]

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b p-6">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actions.map(action => (
            <Link
              key={action.name}
              href={action.href}
              className="group relative rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start">
                <div className={`rounded-md p-2 text-white ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {action.name}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
