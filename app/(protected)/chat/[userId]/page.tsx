'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import ChatWindow from '@/components/chat/ChatWindow'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  receiver_id: string
  read_at: string | null
  sender: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface OtherUser {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export default function IndividualChatPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (!authLoading && user && userId) {
      fetchMessages()
    }
  }, [user, authLoading, userId])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      setMessages(data.messages)
      setOtherUser(data.other_user)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center border-b p-4">
          <div className="mr-4 h-8 w-8 animate-pulse rounded bg-gray-200"></div>
          <div className="mr-3 h-12 w-12 animate-pulse rounded-full bg-gray-200"></div>
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="flex-1 bg-gray-50"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to conversations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center border-b bg-white p-4 shadow-sm">
        <Link
          href="/chat"
          className="mr-4 rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {otherUser && (
          <div className="flex items-center">
            {otherUser.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt={otherUser.full_name || 'User'}
                width={40}
                height={40}
                className="mr-3 rounded-full object-cover"
              />
            ) : (
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                <span className="font-medium text-gray-500">
                  {otherUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {otherUser.full_name || 'Anonymous User'}
              </h1>
            </div>
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-hidden">
        {user && otherUser && (
          <ChatWindow
            currentUser={user}
            otherUser={otherUser}
            initialMessages={messages}
            onNewMessage={handleNewMessage}
          />
        )}
      </div>
    </div>
  )
}
