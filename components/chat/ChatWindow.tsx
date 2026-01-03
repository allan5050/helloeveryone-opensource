'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { Send } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  recipient_id: string
  is_read: boolean
  sender: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface User {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  email?: string
}

interface ChatWindowProps {
  currentUser: User
  otherUser: User
  initialMessages: Message[]
  onNewMessage: (message: Message) => void
}

export default function ChatWindow({
  currentUser,
  otherUser,
  initialMessages,
  onNewMessage,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${currentUser.id}))`,
        },
        async payload => {
          // Fetch the complete message with sender info
          const { data: messageWithSender } = await supabase
            .from('messages')
            .select(
              `
              id,
              content,
              created_at,
              sender_id,
              recipient_id,
              is_read,
              sender:profiles!sender_id(id, full_name, avatar_url)
            `
            )
            .eq('id', (payload.new as any).id)
            .single()

          if (messageWithSender) {
            const typedMessage = messageWithSender as unknown as Message
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              if (prev.some(msg => msg.id === typedMessage.id)) {
                return prev
              }
              const newMessages = [...prev, typedMessage]
              onNewMessage(typedMessage)
              return newMessages
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id, otherUser.id, supabase, onNewMessage])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedMessage = newMessage.trim()
    if (!trimmedMessage || sending) return

    if (trimmedMessage.length > 1000) {
      setInputError('Message is too long (max 1000 characters)')
      return
    }

    setSending(true)
    setInputError(null)

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: otherUser.id,
          content: trimmedMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      setInputError(
        error instanceof Error ? error.message : 'Failed to send message'
      )
    } finally {
      setSending(false)
    }
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`
    } else {
      return format(date, 'MMM d, h:mm a')
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}

    messages.forEach(message => {
      const date = new Date(message.created_at)
      let dateKey: string

      if (isToday(date)) {
        dateKey = 'Today'
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday'
      } else {
        dateKey = format(date, 'MMMM d, yyyy')
      }

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
        {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {dateKey}
              </span>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const isFromCurrentUser = message.sender_id === currentUser.id
              const showAvatar =
                !isFromCurrentUser &&
                (index === 0 ||
                  dateMessages[index - 1]?.sender_id !== message.sender_id)

              return (
                <div
                  key={message.id}
                  className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  {/* Avatar for other user */}
                  {!isFromCurrentUser && (
                    <div className="mr-2 flex-shrink-0">
                      {showAvatar ? (
                        otherUser.avatar_url ? (
                          <Image
                            src={otherUser.avatar_url}
                            alt={otherUser.full_name || 'User'}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                            unoptimized={
                              otherUser.avatar_url.includes('.svg') ||
                              otherUser.avatar_url.includes('dicebear.com')
                            }
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <span className="text-sm font-medium text-gray-500">
                              {otherUser.full_name?.charAt(0)?.toUpperCase() ||
                                '?'}
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="h-8 w-8"></div>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md ${
                      isFromCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.content}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageDate(message.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="border-t p-4">
        {inputError && (
          <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {inputError}
          </div>
        )}

        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value)
              if (inputError) setInputError(null)
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="rounded-lg bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {newMessage.length > 900 && (
          <p className="mt-1 text-xs text-gray-500">
            {1000 - newMessage.length} characters remaining
          </p>
        )}
      </form>
    </div>
  )
}
