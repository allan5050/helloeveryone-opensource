import { Suspense } from 'react'
import { Metadata } from 'next'
import { getAdminStats } from '@/lib/api/admin'
import { AdminStats } from '@/components/admin/AdminStats'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { QuickActions } from '@/components/admin/QuickActions'

export const metadata: Metadata = {
  title: 'Admin Dashboard - HelloEveryone.fun',
  description: 'Administrative dashboard for managing the HelloEveryone platform, users, and events.',
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your HelloEveryone platform from here.
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <AdminStats stats={stats} />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions />
        <Suspense fallback={<div>Loading recent activity...</div>}>
          <RecentActivity recentSignups={stats.recentSignups} />
        </Suspense>
      </div>
    </div>
  )
}
