export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          full_name: string | null
          first_name: string | null
          last_name: string | null
          bio: string | null
          age: number | null
          location: string | null
          interests: string[] | null
          embedding: string | null // vector type stored as string
          bio_embedding: string | null // vector type for bio semantic search
          role: 'user' | 'admin'
          is_active: boolean
          is_profile_complete: boolean
          photo_url: string | null
          preferred_age_min: number | null
          preferred_age_max: number | null
          looking_for: string[] | null
          availability: string[] | null
          privacy_settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          age?: number | null
          location?: string | null
          interests?: string[] | null
          embedding?: string | null
          bio_embedding?: string | null
          role?: 'user' | 'admin'
          is_active?: boolean
          is_profile_complete?: boolean
          photo_url?: string | null
          preferred_age_min?: number | null
          preferred_age_max?: number | null
          looking_for?: string[] | null
          availability?: string[] | null
          privacy_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          age?: number | null
          location?: string | null
          interests?: string[] | null
          embedding?: string | null
          bio_embedding?: string | null
          role?: 'user' | 'admin'
          is_active?: boolean
          is_profile_complete?: boolean
          photo_url?: string | null
          preferred_age_min?: number | null
          preferred_age_max?: number | null
          looking_for?: string[] | null
          availability?: string[] | null
          privacy_settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string
          start_time: string
          end_time: string
          max_attendees: number | null
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location: string
          start_time: string
          end_time: string
          max_attendees?: number | null
          created_by: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          location?: string
          start_time?: string
          end_time?: string
          max_attendees?: number | null
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'going' | 'maybe' | 'not_going'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'going' | 'maybe' | 'not_going'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'going' | 'maybe' | 'not_going'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rsvps_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rsvps_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      match_scores: {
        Row: {
          id: string
          user_id_1: string
          user_id_2: string
          event_id: string | null
          semantic_score: number
          interest_score: number
          combined_score: number
          calculated_at: string
        }
        Insert: {
          id?: string
          user_id_1: string
          user_id_2: string
          event_id?: string | null
          semantic_score: number
          interest_score: number
          combined_score: number
          calculated_at?: string
        }
        Update: {
          id?: string
          user_id_1?: string
          user_id_2?: string
          event_id?: string | null
          semantic_score?: number
          interest_score?: number
          combined_score?: number
          calculated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'match_scores_user_id_1_fkey'
            columns: ['user_id_1']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'match_scores_user_id_2_fkey'
            columns: ['user_id_2']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'match_scores_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          event_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          event_id?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          event_id?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'messages_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'messages_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          favorited_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          favorited_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          favorited_user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'favorites_favorited_user_id_fkey'
            columns: ['favorited_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blocks_blocker_id_fkey'
            columns: ['blocker_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'blocks_blocked_id_fkey'
            columns: ['blocked_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      meeting_slots: {
        Row: {
          id: string
          event_id: string
          user_id_1: string
          user_id_2: string
          proposed_time: string
          status: 'proposed' | 'confirmed' | 'completed' | 'cancelled'
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id_1: string
          user_id_2: string
          proposed_time: string
          status?: 'proposed' | 'confirmed' | 'completed' | 'cancelled'
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id_1?: string
          user_id_2?: string
          proposed_time?: string
          status?: 'proposed' | 'confirmed' | 'completed' | 'cancelled'
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'meeting_slots_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'meeting_slots_user_id_1_fkey'
            columns: ['user_id_1']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'meeting_slots_user_id_2_fkey'
            columns: ['user_id_2']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          target_user_id: string
          compatibility_reason: string
          conversation_starters: Json
          meeting_suggestions: Json
          shared_interests: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_user_id: string
          compatibility_reason: string
          conversation_starters?: Json
          meeting_suggestions?: Json
          shared_interests?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_user_id?: string
          compatibility_reason?: string
          conversation_starters?: Json
          meeting_suggestions?: Json
          shared_interests?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_insights_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'ai_insights_target_user_id_fkey'
            columns: ['target_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_score: {
        Args: {
          user1_id: string
          user2_id: string
          target_event_id?: string
        }
        Returns: number
      }
      get_event_matches: {
        Args: {
          target_user_id: string
          target_event_id: string
          match_limit?: number
        }
        Returns: {
          user_id: string
          display_name: string
          bio: string | null
          age: number | null
          location: string | null
          interests: string[] | null
          match_score: number
          is_favorited: boolean
        }[]
      }
    }
    Enums: {
      user_role: 'user' | 'admin'
      rsvp_status: 'going' | 'maybe' | 'not_going'
      meeting_status: 'proposed' | 'confirmed' | 'completed' | 'cancelled'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific table types for convenience
export type Profile = Tables<'profiles'>
export type Event = Tables<'events'>
export type RSVP = Tables<'rsvps'>
export type MatchScore = Tables<'match_scores'>
export type Message = Tables<'messages'>
export type Favorite = Tables<'favorites'>
export type Block = Tables<'blocks'>
export type MeetingSlot = Tables<'meeting_slots'>
export type AIInsight = Tables<'ai_insights'>
