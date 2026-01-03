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

describe('Privacy and Mutual Visibility Rules', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    profile: {
      name: 'Test User',
      age: 28,
      location: 'San Francisco, CA',
      interests: ['hiking', 'reading'],
      bio: 'Love meeting new people',
      privacy_settings: {
        show_age: true,
        show_location: true,
        show_interests: true,
        show_favorites: true,
      },
    },
  }

  const mockOtherUser = {
    id: 'user-456',
    profile: {
      name: 'Other User',
      age: 30,
      location: 'Oakland, CA',
      interests: ['hiking', 'photography'],
      bio: 'Outdoor enthusiast',
      privacy_settings: {
        show_age: false, // Hidden
        show_location: true,
        show_interests: true,
        show_favorites: false, // Hidden
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  describe('Mutual Visibility Rules', () => {
    it('should only allow filtering by fields user has shared', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [mockOtherUser],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { searchProfiles } = await import('@/lib/api/search')

      // User can filter by age since they show their age
      const result1 = await searchProfiles({
        age_min: 25,
        age_max: 35,
      })

      expect(result1.success).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith(
        'search_profiles_with_mutual_visibility',
        expect.objectContaining({
          age_min: 25,
          age_max: 35,
        })
      )
    })

    it('should prevent filtering by fields user has not shared', async () => {
      // Mock user who hides their age
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          ...mockUser,
          profile: {
            ...mockUser.profile,
            privacy_settings: {
              ...mockUser.profile.privacy_settings,
              show_age: false,
            },
          },
        },
      })

      const { searchProfiles } = await import('@/lib/api/search')

      // User should not be able to filter by age if they hide their own age
      const result = await searchProfiles({
        age_min: 25,
        age_max: 35,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Cannot filter by age - you have not shared your age'
      )
    })

    it('should only show shared fields in search results', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'user-456',
            name: 'Other User',
            age: null, // Hidden because user doesn't show age
            location: 'Oakland, CA',
            interests: ['hiking', 'photography'],
            bio: 'Outdoor enthusiast',
          },
        ],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { searchProfiles } = await import('@/lib/api/search')
      const result = await searchProfiles({ location: 'Oakland' })

      expect(result.success).toBe(true)
      expect(result.data[0].age).toBeNull() // Age is hidden
      expect(result.data[0].location).toBe('Oakland, CA') // Location is shown
    })

    it('should apply mutual visibility to interests filtering', async () => {
      const { searchProfiles } = await import('@/lib/api/search')

      // User can search by interests since they show their interests
      const result = await searchProfiles({
        interests: ['hiking', 'photography'],
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_profiles_with_mutual_visibility',
        expect.objectContaining({
          interests: ['hiking', 'photography'],
        })
      )
    })

    it('should prevent interest filtering if user hides interests', async () => {
      // Mock user who hides their interests
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          ...mockUser,
          profile: {
            ...mockUser.profile,
            privacy_settings: {
              ...mockUser.profile.privacy_settings,
              show_interests: false,
            },
          },
        },
      })

      const { searchProfiles } = await import('@/lib/api/search')
      const result = await searchProfiles({
        interests: ['hiking'],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Cannot filter by interests - you have not shared your interests'
      )
    })
  })

  describe('Progressive Information Disclosure', () => {
    it('should show limited info for new connections', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-456',
              name: 'Other User',
              age: 30,
              bio: 'Outdoor enthusiast',
              // Location and other details hidden initially
              connection_level: 'none',
            },
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getProfileWithPrivacy } = await import('@/lib/api/profiles')
      const result = await getProfileWithPrivacy('user-456')

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Other User')
      expect(result.data.location).toBeUndefined() // Hidden for new connections
    })

    it('should show more info after mutual interaction', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-456',
              name: 'Other User',
              age: 30,
              bio: 'Outdoor enthusiast',
              location: 'Oakland, CA',
              interests: ['hiking', 'photography'],
              connection_level: 'mutual_interest', // Higher level
            },
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getProfileWithPrivacy } = await import('@/lib/api/profiles')
      const result = await getProfileWithPrivacy('user-456')

      expect(result.success).toBe(true)
      expect(result.data.location).toBe('Oakland, CA') // Now visible
      expect(result.data.interests).toEqual(['hiking', 'photography'])
    })

    it('should show full profile after direct interaction', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-456',
              name: 'Other User',
              age: 30,
              bio: 'Outdoor enthusiast',
              location: 'Oakland, CA',
              interests: ['hiking', 'photography'],
              contact_info: 'user456@example.com',
              connection_level: 'direct_contact',
            },
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getProfileWithPrivacy } = await import('@/lib/api/profiles')
      const result = await getProfileWithPrivacy('user-456')

      expect(result.success).toBe(true)
      expect(result.data.contact_info).toBe('user456@example.com')
    })
  })

  describe('Profile Visibility Settings', () => {
    it('should respect individual field privacy settings', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: {
          id: 'user-456',
          name: 'Other User',
          age: null, // Hidden by privacy setting
          location: 'Oakland, CA', // Shown
          bio: 'Outdoor enthusiast',
          interests: null, // Hidden by privacy setting
        },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getPublicProfile } = await import('@/lib/api/profiles')
      const result = await getPublicProfile('user-456')

      expect(result.success).toBe(true)
      expect(result.data.age).toBeNull()
      expect(result.data.location).toBe('Oakland, CA')
      expect(result.data.interests).toBeNull()
    })

    it('should allow users to update privacy settings', async () => {
      const newPrivacySettings = {
        show_age: false,
        show_location: true,
        show_interests: false,
        show_favorites: true,
      }

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ privacy_settings: newPrivacySettings }],
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ update: mockUpdate })

      const { updatePrivacySettings } = await import('@/lib/api/privacy')
      const result = await updatePrivacySettings(newPrivacySettings)

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        privacy_settings: newPrivacySettings,
      })
    })
  })

  describe('Blocked Users Functionality', () => {
    it('should prevent blocked users from viewing profile', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'BLOCKED_USER', message: 'Access denied' },
      })

      mockSupabase.rpc = mockRpc

      const { getProfileWithPrivacy } = await import('@/lib/api/profiles')
      const result = await getProfileWithPrivacy('blocked-user-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Access denied')
    })

    it('should prevent blocked users from appearing in search', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [], // Empty results because blocked users are filtered out
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { searchProfiles } = await import('@/lib/api/search')
      const result = await searchProfiles({ interests: ['hiking'] })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should block a user successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'block-123', blocked_user_id: 'user-456' }],
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      const { blockUser } = await import('@/lib/api/blocking')
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

      const { unblockUser } = await import('@/lib/api/blocking')
      const result = await unblockUser('user-456')

      expect(result.success).toBe(true)
    })

    it('should get list of blocked users', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [
              {
                blocked_user: {
                  id: 'user-456',
                  name: 'Blocked User',
                },
                created_at: '2024-01-01T10:00:00Z',
              },
            ],
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getBlockedUsers } = await import('@/lib/api/blocking')
      const result = await getBlockedUsers()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].blocked_user.name).toBe('Blocked User')
    })
  })

  describe('Data Access Restrictions', () => {
    it('should enforce Row Level Security (RLS) policies', async () => {
      // Mock RLS violation
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: '42501', message: 'insufficient_privilege' },
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getProfileWithPrivacy } = await import('@/lib/api/profiles')
      const result = await getProfileWithPrivacy('restricted-user')

      expect(result.success).toBe(false)
      expect(result.error).toContain('insufficient_privilege')
    })

    it('should prevent access to raw embeddings', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'user-456',
                name: 'Other User',
                bio: 'Test bio',
                // bio_embedding should never be exposed
              },
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getPublicProfile } = await import('@/lib/api/profiles')
      const result = await getPublicProfile('user-456')

      expect(result.success).toBe(true)
      expect(result.data.bio_embedding).toBeUndefined()
    })

    it('should prevent access to internal match scores', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          {
            user_id: 'user-456',
            name: 'Matched User',
            match_percentage: 85, // Shown to user
            // Raw score components should not be exposed
          },
        ],
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { getMatches } = await import('@/lib/api/matching')
      const result = await getMatches()

      expect(result.success).toBe(true)
      expect(result.data[0].match_percentage).toBe(85)
      expect(result.data[0].interest_score).toBeUndefined()
      expect(result.data[0].bio_similarity).toBeUndefined()
    })

    it('should prevent users from accessing other users data directly', async () => {
      // Mock attempt to access another user's private data
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'RLS_VIOLATION',
              message: 'Row level security violation',
            },
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserMessages } = await import('@/lib/api/messages')
      const result = await getUserMessages('other-user-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Row level security violation')
    })
  })

  describe('GDPR Compliance', () => {
    it('should allow users to export their data', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: {
          profile: mockUser.profile,
          messages: [],
          favorites: [],
          events: [],
          privacy_settings: mockUser.profile.privacy_settings,
        },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { exportUserData } = await import('@/lib/api/privacy')
      const result = await exportUserData()

      expect(result.success).toBe(true)
      expect(result.data.profile).toBeDefined()
      expect(result.data.privacy_settings).toBeDefined()
      expect(mockRpc).toHaveBeenCalledWith('export_user_data', {
        user_id: mockUser.id,
      })
    })

    it('should allow users to delete their account', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { deleted: true },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { deleteUserAccount } = await import('@/lib/api/privacy')
      const result = await deleteUserAccount()

      expect(result.success).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('delete_user_account', {
        user_id: mockUser.id,
      })
    })

    it('should allow users to request data portability', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { download_url: 'https://example.com/data-export.json' },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { requestDataPortability } = await import('@/lib/api/privacy')
      const result = await requestDataPortability()

      expect(result.success).toBe(true)
      expect(result.data.download_url).toContain('data-export.json')
    })

    it('should handle data anonymization after account deletion', async () => {
      const mockRpc = jest.fn().mockResolvedValue({
        data: { anonymized_records: 5 },
        error: null,
      })

      mockSupabase.rpc = mockRpc

      const { anonymizeUserData } = await import('@/lib/api/privacy')
      const result = await anonymizeUserData('deleted-user-id')

      expect(result.success).toBe(true)
      expect(result.data.anonymized_records).toBe(5)
    })
  })

  describe('Privacy Settings Validation', () => {
    it('should validate privacy setting combinations', async () => {
      const { validatePrivacySettings } = await import('@/lib/api/privacy')

      // Valid settings
      const validSettings = {
        show_age: true,
        show_location: true,
        show_interests: true,
        show_favorites: true,
      }

      expect(validatePrivacySettings(validSettings)).toBe(true)

      // Invalid: cannot hide all fields
      const invalidSettings = {
        show_age: false,
        show_location: false,
        show_interests: false,
        show_favorites: false,
      }

      expect(validatePrivacySettings(invalidSettings)).toBe(false)
    })

    it('should apply default privacy settings for new users', async () => {
      const { getDefaultPrivacySettings } = await import('@/lib/api/privacy')

      const defaults = getDefaultPrivacySettings()

      expect(defaults.show_age).toBe(true)
      expect(defaults.show_location).toBe(true)
      expect(defaults.show_interests).toBe(true)
      expect(defaults.show_favorites).toBe(false) // Conservative default
    })
  })
})
