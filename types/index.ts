// User & Auth types
export interface User {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Message & Chat types
export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at: string | null
  updated_at?: string
  sender?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  receiver?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface Conversation {
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

// Re-export from other files
export * from './profile'
export * from './event'
