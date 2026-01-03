import { format } from 'date-fns'
import { Users, MapPin, Calendar, Shield, Ban } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

import { UserActions } from './UserActions'

interface UsersListProps {
  searchParams: {
    search?: string
    page?: string
  }
}

async function getUsers(search?: string, page = 1) {
  const supabase = await createClient()
  const USERS_PER_PAGE = 20
  const from = (page - 1) * USERS_PER_PAGE
  const to = from + USERS_PER_PAGE - 1

  let query = supabase
    .from('profiles')
    .select('*')
    .range(from, to)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%,location.ilike.%${search}%`
    )
  }

  const { data: users, error, count } = await query

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], count: 0 }
  }

  return { users: users || [], count: count || 0 }
}

export async function UsersList({ searchParams }: UsersListProps) {
  const page = parseInt(searchParams.page || '1')
  const { users, count } = await getUsers(searchParams.search, page)

  if (users.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          {searchParams.search ? 'No users found' : 'No users yet'}
        </h3>
        <p className="text-gray-500">
          {searchParams.search
            ? 'Try adjusting your search criteria.'
            : 'Users will appear here once they sign up.'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <p className="text-sm text-gray-700">
          Showing {users.length} of {count} users
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Join Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.photo_url}
                          alt=""
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                          <span className="text-sm font-medium text-gray-700">
                            {user.display_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        {user.display_name}
                        {user.role === 'admin' && (
                          <Shield className="ml-2 h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Age: {user.age}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    {user.location || 'Not specified'}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {user.is_active === false && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        <Ban className="mr-1 h-3 w-3" />
                        Suspended
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                      </span>
                    )}
                    {user.is_active !== false && user.role !== 'admin' && (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <UserActions user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
