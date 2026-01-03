import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
jest.mock('@supabase/supabase-js')
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
}

;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(
  mockSupabase as any
)

describe('Favorites Functionality', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockFavoriteUser = {
    id: 'user-456',
    name: 'Jane Doe',
    bio: 'Love hiking and reading',
    profile_picture: 'https://example.com/jane.jpg',
    age: 28,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  describe('Adding Favorites', () => {
    it('should add a user to favorites successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'fav-123',
              user_id: mockUser.id,
              favorite_user_id: 'user-456',
              created_at: '2024-01-01T10:00:00Z',
            },
          ],
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      const { addToFavorites } = await import('@/lib/api/favorites')
      const result = await addToFavorites('user-456')

      expect(result.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        favorite_user_id: 'user-456',
      })
    })

    it('should prevent adding same user to favorites twice', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key value' },
        }),
      })

      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      const { addToFavorites } = await import('@/lib/api/favorites')
      const result = await addToFavorites('user-456')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already in favorites')
    })

    it('should prevent adding self to favorites', async () => {
      const { addToFavorites } = await import('@/lib/api/favorites')
      const result = await addToFavorites(mockUser.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot add yourself to favorites')
    })

    it('should check if user exists before adding to favorites', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { addToFavorites } = await import('@/lib/api/favorites')
      const result = await addToFavorites('non-existent-user')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  describe('Removing Favorites', () => {
    it('should remove a user from favorites successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ delete: mockDelete })

      const { removeFromFavorites } = await import('@/lib/api/favorites')
      const result = await removeFromFavorites('user-456')

      expect(result.success).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
    })

    it('should handle removing non-existent favorite', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ delete: mockDelete })

      const { removeFromFavorites } = await import('@/lib/api/favorites')
      const result = await removeFromFavorites('user-456')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Favorite not found')
    })
  })

  describe('Viewing Favorites List', () => {
    it('should retrieve user favorites with profile data', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          favorite_user: {
            id: 'user-456',
            name: 'Jane Doe',
            bio: 'Love hiking and reading',
            age: 28,
            profile_picture: 'https://example.com/jane.jpg',
          },
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'fav-2',
          favorite_user: {
            id: 'user-789',
            name: 'John Smith',
            bio: 'Photography enthusiast',
            age: 32,
            profile_picture: 'https://example.com/john.jpg',
          },
          created_at: '2024-01-01T11:00:00Z',
        },
      ]

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockFavorites,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserFavorites } = await import('@/lib/api/favorites')
      const result = await getUserFavorites()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].favorite_user.name).toBe('Jane Doe')
      expect(result.data[1].favorite_user.name).toBe('John Smith')
    })

    it('should handle empty favorites list', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserFavorites } = await import('@/lib/api/favorites')
      const result = await getUserFavorites()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should paginate favorites list', async () => {
      const mockFavorites = Array.from({ length: 15 }, (_, i) => ({
        id: `fav-${i}`,
        favorite_user: {
          id: `user-${i}`,
          name: `User ${i}`,
          bio: `Bio for user ${i}`,
          age: 25 + i,
        },
        created_at: new Date(Date.now() - i * 60000).toISOString(),
      }))

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockFavorites.slice(0, 10),
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserFavorites } = await import('@/lib/api/favorites')
      const result = await getUserFavorites(0, 10)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(10)
    })
  })

  describe('Mutual Favorites Detection', () => {
    it('should detect mutual favorites correctly', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          {
            user_id: 'user-456',
            name: 'Jane Doe',
            is_mutual: true,
          },
          {
            user_id: 'user-789',
            name: 'John Smith',
            is_mutual: false,
          },
        ],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getMutualFavorites } = await import('@/lib/api/favorites')
      const result = await getMutualFavorites()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].is_mutual).toBe(true)
      expect(result.data[1].is_mutual).toBe(false)
      expect(mockRpc).toHaveBeenCalledWith('get_mutual_favorites', {
        user_id: mockUser.id,
      })
    })

    it('should check if specific users are mutual favorites', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { is_mutual: true },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { checkMutualFavorite } = await import('@/lib/api/favorites')
      const result = await checkMutualFavorite('user-456')

      expect(result.success).toBe(true)
      expect(result.is_mutual).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('check_mutual_favorite', {
        user1_id: mockUser.id,
        user2_id: 'user-456',
      })
    })

    it('should handle non-mutual favorites', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { is_mutual: false },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { checkMutualFavorite } = await import('@/lib/api/favorites')
      const result = await checkMutualFavorite('user-789')

      expect(result.success).toBe(true)
      expect(result.is_mutual).toBe(false)
    })
  })

  describe('Favorite Notifications', () => {
    it('should create notification when user is added to favorites', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'notif-123',
              type: 'favorite_added',
              user_id: 'user-456',
              from_user_id: mockUser.id,
            },
          ],
          error: null,
        }),
      })

      const mockFrom = jest.fn().mockImplementation(table => {
        if (table === 'favorites') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [{ id: 'fav-123' }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'notifications') {
          return { insert: mockInsert }
        }
        return {}
      })

      mockSupabase.from = mockFrom

      const { addToFavorites } = await import('@/lib/api/favorites')
      const result = await addToFavorites('user-456')

      expect(result.success).toBe(true)
    })

    it('should get favorites-related notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'favorite_added',
          from_user: {
            id: mockUser.id,
            name: 'Test User',
            profile_picture: 'https://example.com/test.jpg',
          },
          created_at: '2024-01-01T10:00:00Z',
          is_read: false,
        },
        {
          id: 'notif-2',
          type: 'mutual_favorite',
          from_user: {
            id: 'user-456',
            name: 'Jane Doe',
            profile_picture: 'https://example.com/jane.jpg',
          },
          created_at: '2024-01-01T11:00:00Z',
          is_read: false,
        },
      ]

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getFavoriteNotifications } = await import('@/lib/api/favorites')
      const result = await getFavoriteNotifications()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].type).toBe('favorite_added')
      expect(result.data[1].type).toBe('mutual_favorite')
    })
  })

  describe('Privacy Rules for Favorites', () => {
    it('should respect privacy settings when showing favorites', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'fav-1',
                  favorite_user: {
                    id: 'user-456',
                    name: 'Jane Doe',
                    bio: 'Love hiking',
                    privacy_settings: {
                      show_favorites: true,
                    },
                  },
                },
              ],
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserFavorites } = await import('@/lib/api/favorites')
      const result = await getUserFavorites()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('should hide favorites from users who disabled visibility', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getPublicFavorites } = await import('@/lib/api/favorites')
      const result = await getPublicFavorites('user-456')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(mockRpc).toHaveBeenCalledWith('get_public_favorites', {
        target_user_id: 'user-456',
      })
    })

    it('should prevent viewing favorites of blocked users', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'BLOCKED_USER', message: 'Access denied' },
      })

      mockSupabase.rpc = mockRpc

      const { getPublicFavorites } = await import('@/lib/api/favorites')
      const result = await getPublicFavorites('blocked-user')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Access denied')
    })
  })

  describe('Favorites Statistics', () => {
    it('should get favorites count for user', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ count: 12 }],
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getFavoritesCount } = await import('@/lib/api/favorites')
      const result = await getFavoritesCount()

      expect(result.success).toBe(true)
      expect(result.count).toBe(12)
    })

    it('should get mutual favorites count', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { count: 3 },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getMutualFavoritesCount } = await import('@/lib/api/favorites')
      const result = await getMutualFavoritesCount()

      expect(result.success).toBe(true)
      expect(result.count).toBe(3)
      expect(mockRpc).toHaveBeenCalledWith('get_mutual_favorites_count', {
        user_id: mockUser.id,
      })
    })

    it('should check if user is favorited by others', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ count: 5 }],
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getFavoritedByCount } = await import('@/lib/api/favorites')
      const result = await getFavoritedByCount()

      expect(result.success).toBe(true)
      expect(result.count).toBe(5)
    })
  })
})
