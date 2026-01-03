import { Suspense } from 'react'

import { UsersList } from '@/components/admin/UsersList'
import { UsersSearch } from '@/components/admin/UsersSearch'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="mt-2 text-gray-600">
          View and manage all platform users.
        </p>
      </div>

      <UsersSearch />

      <Suspense
        fallback={
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 rounded bg-gray-200"></div>
              ))}
            </div>
          </div>
        }
      >
        <UsersList searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  )
}
