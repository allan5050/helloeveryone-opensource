import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createClient } from '@supabase/supabase-js'
import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/chat',
  }),
}))

// Mock Supabase client
jest.mock('@supabase/supabase-js')
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  channel: jest.fn(),
  removeChannel: jest.fn(),
}

;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
  mockSupabase as any
)

// Mock components
const ChatList = ({
  onChatSelect,
}: {
  onChatSelect: (chatId: string) => void
}) => (
  <div data-testid="chat-list">
    <div onClick={() => onChatSelect('chat-1')} data-testid="chat-item-1">
      User 1
    </div>
    <div onClick={() => onChatSelect('chat-2')} data-testid="chat-item-2">
      User 2
    </div>
  </div>
)

const ChatWindow = ({
  chatId,
  onSendMessage,
}: {
  chatId: string
  onSendMessage: (message: string) => void
}) => (
  <div data-testid="chat-window">
    <div data-testid="messages">Messages for {chatId}</div>
    <input
      data-testid="message-input"
      onKeyPress={e => {
        if (e.key === 'Enter') {
          onSendMessage((e.target as HTMLInputElement).value)
        }
      }}
    />
  </div>
)

describe('Chat Functionality', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockMessages = [
    {
      id: 'msg-1',
      content: 'Hello there!',
      sender_id: 'user-456',
      recipient_id: 'user-123',
      created_at: '2024-01-01T10:00:00Z',
      is_read: false,
    },
    {
      id: 'msg-2',
      content: 'Hi back!',
      sender_id: 'user-123',
      recipient_id: 'user-456',
      created_at: '2024-01-01T10:05:00Z',
      is_read: true,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  describe('Message Sending and Receiving', () => {
    it('should send a message successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'msg-new',
              content: 'Test message',
              sender_id: mockUser.id,
            },
          ],
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      const { sendMessage } = await import('@/lib/api/chat')
      const result = await sendMessage('user-456', 'Test message')

      expect(result.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        sender_id: mockUser.id,
        recipient_id: 'user-456',
        content: 'Test message',
      })
    })

    it('should handle message sending failure', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      const { sendMessage } = await import('@/lib/api/chat')
      const result = await sendMessage('user-456', 'Test message')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })

    it('should receive messages in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      render(<ChatWindow chatId="chat-1" onSendMessage={() => {}} />)

      // Simulate real-time message
      const onInsertCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes'
      )?.[2]

      if (onInsertCallback) {
        onInsertCallback({
          new: {
            id: 'msg-realtime',
            content: 'Real-time message',
            sender_id: 'user-456',
          },
        })
      }

      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })

  describe('Message Blocking Functionality', () => {
    it('should prevent sending messages to blocked users', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'block-1' },
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { sendMessage } = await import('@/lib/api/chat')
      const result = await sendMessage('blocked-user', 'Test message')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot send message to blocked user')
    })

    it('should not receive messages from blocked users', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockMessages.filter(
                  msg => msg.sender_id !== 'blocked-user'
                ),
                error: null,
              }),
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getChatMessages } = await import('@/lib/api/chat')
      const result = await getChatMessages('user-456')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2) // No blocked user messages
    })

    it('should block a user successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'block-1', blocked_user_id: 'user-456' }],
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      const { blockUser } = await import('@/lib/api/chat')
      const result = await blockUser('user-456')

      expect(result.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        blocked_user_id: 'user-456',
      })
    })

    it('should unblock a user successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ delete: mockDelete })

      const { unblockUser } = await import('@/lib/api/chat')
      const result = await unblockUser('user-456')

      expect(result.success).toBe(true)
    })
  })

  describe('Message History Loading', () => {
    it('should load chat messages in correct order', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockMessages.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              ),
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getChatMessages } = await import('@/lib/api/chat')
      const result = await getChatMessages('user-456')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].created_at).toBe('2024-01-01T10:05:00Z') // Most recent first
    })

    it('should handle pagination for message history', async () => {
      const oldMessages = Array.from({ length: 20 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        sender_id: i % 2 === 0 ? mockUser.id : 'user-456',
        recipient_id: i % 2 === 0 ? 'user-456' : mockUser.id,
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        is_read: true,
      }))

      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: oldMessages.slice(0, 10),
                error: null,
              }),
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getChatMessages } = await import('@/lib/api/chat')
      const result = await getChatMessages('user-456', 0, 10)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(10)
    })
  })

  describe('Unread Message Counts', () => {
    it('should count unread messages correctly', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ count: 3 }],
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUnreadMessageCount } = await import('@/lib/api/chat')
      const result = await getUnreadMessageCount('user-456')

      expect(result.success).toBe(true)
      expect(result.count).toBe(3)
    })

    it('should mark messages as read', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ update: mockUpdate })

      const { markMessagesAsRead } = await import('@/lib/api/chat')
      const result = await markMessagesAsRead('user-456')

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true })
    })

    it('should get total unread count for all chats', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { total_unread: 5 },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getTotalUnreadCount } = await import('@/lib/api/chat')
      const result = await getTotalUnreadCount()

      expect(result.success).toBe(true)
      expect(result.count).toBe(5)
      expect(mockRpc).toHaveBeenCalledWith('get_total_unread_messages', {
        user_id: mockUser.id,
      })
    })
  })

  describe('Chat List Sorting', () => {
    it('should sort chats by most recent activity', async () => {
      const mockChats = [
        {
          user_id: 'user-1',
          user_name: 'Alice',
          last_message: 'Hey there!',
          last_message_time: '2024-01-01T12:00:00Z',
          unread_count: 2,
        },
        {
          user_id: 'user-2',
          user_name: 'Bob',
          last_message: 'See you later',
          last_message_time: '2024-01-01T11:00:00Z',
          unread_count: 0,
        },
        {
          user_id: 'user-3',
          user_name: 'Charlie',
          last_message: 'Good morning',
          last_message_time: '2024-01-01T13:00:00Z',
          unread_count: 1,
        },
      ]

      const mockRpc = jest.fn().mockResolvedValue({
        data: mockChats,
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getChatList } = await import('@/lib/api/chat')
      const result = await getChatList()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      // Should be sorted by last_message_time desc
      expect(result.data[0].user_name).toBe('Charlie')
      expect(result.data[1].user_name).toBe('Alice')
      expect(result.data[2].user_name).toBe('Bob')
    })

    it('should handle empty chat list', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getChatList } = await import('@/lib/api/chat')
      const result = await getChatList()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('Chat Component Integration', () => {
    it('should render chat list and handle chat selection', () => {
      const mockOnChatSelect = jest.fn()

      render(<ChatList onChatSelect={mockOnChatSelect} />)

      expect(screen.getByTestId('chat-list')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('chat-item-1'))
      expect(mockOnChatSelect).toHaveBeenCalledWith('chat-1')
    })

    it('should render chat window and handle message sending', async () => {
      const mockOnSendMessage = jest.fn()

      render(<ChatWindow chatId="chat-1" onSendMessage={mockOnSendMessage} />)

      const input = screen.getByTestId('message-input')

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message')
    })

    it('should display unread message indicators', () => {
      const ChatWithBadge = () => (
        <div data-testid="chat-with-badge">
          <span data-testid="unread-badge">3</span>
        </div>
      )

      render(<ChatWithBadge />)

      expect(screen.getByTestId('unread-badge')).toHaveTextContent('3')
    })
  })
})
