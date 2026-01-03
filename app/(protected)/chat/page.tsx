'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

interface Conversation {
  other_user_id: string
  other_user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  last_message: {
    id: string
    content: string
    created_at: string
    sender_id: string
    receiver_id: string
    read_at: string | null
    is_from_current_user: boolean
  }
  unread_count: number
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      fetchConversations()
    }
  }, [user, authLoading])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations')
      }

      setConversations(data.conversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">Messages</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-white p-4 shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-1/4 rounded bg-gray-200"></div>
                    <div className="h-3 w-3/4 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">Messages</h1>
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 sm:pb-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Messages</h1>

        {conversations.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-lg text-gray-400">
              No conversations yet
            </div>
            <p className="text-gray-600">
              Start a conversation with someone from your{' '}
              <Link href="/matches" className="text-blue-600 hover:underline">
                matches
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conversation => (
              <Link
                key={conversation.other_user_id}
                href={`/chat/${conversation.other_user_id}`}
                className="block"
              >
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow transition-shadow hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    {conversation.other_user.avatar_url ? (
                      <Image
                        src={conversation.other_user.avatar_url}
                        alt={conversation.other_user.full_name || 'User'}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                        <span className="text-lg font-medium text-gray-500">
                          {conversation.other_user.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between">
                        <h3 className="truncate font-medium text-gray-900">
                          {conversation.other_user.full_name ||
                            'Anonymous User'}
                        </h3>
                        <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(conversation.last_message.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex min-w-0 flex-1 items-center space-x-1">
                          {conversation.last_message.is_from_current_user && (
                            <span className="text-sm text-gray-400">You: </span>
                          )}
                          <p className="truncate text-sm text-gray-600">
                            {conversation.last_message.content}
                          </p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="ml-2 min-w-[20px] rounded-full bg-blue-500 px-2 py-0.5 text-center text-xs text-white">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
