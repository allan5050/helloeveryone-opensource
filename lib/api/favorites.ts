import { createClient } from '@/lib/supabase/server'

interface FavoriteResult {
  success: boolean
  error?: string
  data?: any
  count?: number
  is_mutual?: boolean
}

export async function addToFavorites(
  targetUserId: string
): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    if (user.id === targetUserId) {
      return { success: false, error: 'Cannot add yourself to favorites' }
    }

    // Check if user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .single()

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        target_user_id: targetUserId,
      })
      .select()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'User already in favorites' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function removeFromFavorites(
  targetUserId: string
): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('target_user_id', targetUserId)

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Favorite not found' }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getUserFavorites(
  offset = 0,
  limit = 50
): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*, favorite_user:profiles!target_user_id(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getMutualFavorites(): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase.rpc('get_mutual_favorites', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function checkMutualFavorite(
  targetUserId: string
): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase.rpc('check_mutual_favorite', {
      user1_id: user.id,
      user2_id: targetUserId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, is_mutual: data?.is_mutual || false }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getFavoriteNotifications(): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*, from_user:profiles!from_user_id(*)')
      .eq('user_id', user.id)
      .in('type', ['favorite_added', 'mutual_favorite'])
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getPublicFavorites(
  targetUserId: string
): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_public_favorites', {
      target_user_id: targetUserId,
    })

    if (error) {
      if (error.code === 'BLOCKED_USER') {
        return { success: false, error: 'Access denied' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getFavoritesCount(): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getMutualFavoritesCount(): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data, error } = await supabase.rpc('get_mutual_favorites_count', {
      user_id: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: data?.count || 0 }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

export async function getFavoritedByCount(): Promise<FavoriteResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('target_user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}
