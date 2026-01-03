'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function UsersSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <form onSubmit={handleSubmit} className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Search
        </button>
        {searchParams.get('search') && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              router.push('/admin/users')
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  )
}
