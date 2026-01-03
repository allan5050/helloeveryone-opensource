import { Suspense } from 'react'

import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor platform performance and user engagement metrics.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg bg-white p-6 shadow">
                <div className="animate-pulse">
                  <div className="mb-4 h-4 w-1/3 rounded bg-gray-200"></div>
                  <div className="h-32 rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}
