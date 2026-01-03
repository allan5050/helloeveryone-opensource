import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { EventsList } from '@/components/admin/EventsList'

export default function AdminEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Events Management
          </h1>
          <p className="mt-2 text-gray-600">
            Create and manage all platform events.
          </p>
        </div>
        <Link
          href="/admin/events/create"
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded bg-gray-200"></div>
              ))}
            </div>
          </div>
        }
      >
        <EventsList />
      </Suspense>
    </div>
  )
}
