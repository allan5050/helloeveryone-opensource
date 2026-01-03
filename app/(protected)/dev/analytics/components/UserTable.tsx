'use client'

import { ChevronDown, ChevronUp, User, MapPin, Calendar } from 'lucide-react'
import React, { useState } from 'react'

interface UserData {
  user_id: string
  display_name: string
  age: number
  location: string
  interests: string[]
  bio: string
}

interface MatchScore {
  user1_id: string
  user2_id: string
  score: number
  interest_overlap?: number
  age_compatibility?: number
  location_match?: number
}

interface UserTableProps {
  users: UserData[]
  matchScores: MatchScore[]
  selectedUser: string | null
  onUserSelect: (userId: string | null) => void
}

export default function UserTable({
  users,
  matchScores,
  selectedUser,
  onUserSelect,
}: UserTableProps) {
  const [sortField, setSortField] = useState<
    'name' | 'age' | 'location' | 'interests'
  >('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: any, bVal: any

    switch (sortField) {
      case 'name':
        aVal = a.display_name
        bVal = b.display_name
        break
      case 'age':
        aVal = a.age || 0
        bVal = b.age || 0
        break
      case 'location':
        aVal = a.location || ''
        bVal = b.location || ''
        break
      case 'interests':
        aVal = a.interests?.length || 0
        bVal = b.interests?.length || 0
        break
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const getUserTopMatches = (userId: string) => {
    return matchScores
      .filter(s => s.user1_id === userId || s.user2_id === userId)
      .map(s => {
        const otherUserId = s.user1_id === userId ? s.user2_id : s.user1_id
        const otherUser = users.find(u => u.user_id === otherUserId)
        return {
          ...s,
          otherUser,
          otherUserId,
        }
      })
      .filter(s => s.otherUser)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Name
                {sortField === 'name' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  ))}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <button
                onClick={() => handleSort('age')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Age
                {sortField === 'age' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  ))}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <button
                onClick={() => handleSort('location')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Location
                {sortField === 'location' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  ))}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <button
                onClick={() => handleSort('interests')}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Interests
                {sortField === 'interests' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  ))}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Top Matches
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedUsers.map(user => {
            const topMatches = getUserTopMatches(user.user_id)
            const isSelected = user.user_id === selectedUser
            const isExpanded = user.user_id === expandedUser

            return (
              <React.Fragment key={user.user_id}>
                <tr
                  className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                  onClick={() => onUserSelect(isSelected ? null : user.user_id)}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <User className="mr-2 h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name.replace('Demo: ', '')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.age}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {user.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.interests?.slice(0, 3).map(interest => (
                        <span
                          key={interest}
                          className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {interest}
                        </span>
                      ))}
                      {user.interests?.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{user.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {topMatches.slice(0, 2).map((match, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="font-medium">
                            {match.otherUser?.display_name.replace(
                              'Demo: ',
                              ''
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(match.score * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                      {topMatches.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{topMatches.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setExpandedUser(isExpanded ? null : user.user_id)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="bg-gray-50 px-6 py-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">Bio:</h4>
                          <p className="text-sm text-gray-600">{user.bio}</p>
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">
                            All Interests:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {user.interests?.map(interest => (
                              <span
                                key={interest}
                                className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">
                            Top 5 Matches:
                          </h4>
                          <div className="space-y-1">
                            {topMatches.map((match, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <span>{match.otherUser?.display_name}</span>
                                <div className="flex gap-4 text-xs text-gray-500">
                                  <span>
                                    Overall: {(match.score * 100).toFixed(0)}%
                                  </span>
                                  {match.interest_overlap !== undefined && (
                                    <span>
                                      Interests:{' '}
                                      {(match.interest_overlap * 100).toFixed(
                                        0
                                      )}
                                      %
                                    </span>
                                  )}
                                  {match.age_compatibility !== undefined && (
                                    <span>
                                      Age:{' '}
                                      {(match.age_compatibility * 100).toFixed(
                                        0
                                      )}
                                      %
                                    </span>
                                  )}
                                  {match.location_match !== undefined && (
                                    <span>
                                      Location:{' '}
                                      {(match.location_match * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
