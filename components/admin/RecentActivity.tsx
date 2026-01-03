import { formatDistanceToNow } from 'date-fns'
import { UserPlus } from 'lucide-react'

interface RecentActivityProps {
  recentSignups: Array<{
    display_name: string
    created_at: string
  }>
}

export function RecentActivity({ recentSignups }: RecentActivityProps) {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b p-6">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {recentSignups.length > 0 ? (
          recentSignups.map((signup, index) => (
            <div key={index} className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-green-100 p-2">
                    <UserPlus className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New user: {signup.display_name}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(signup.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No recent activity
          </div>
        )}
      </div>
    </div>
  )
}
