-- Combined Supabase Migrations for HelloEveryone
-- Generated: 2025-09-06T07:53:41.760Z


-- ========================================
-- Migration: 001_initial_schema.sql
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going');
CREATE TYPE meeting_status AS ENUM ('proposed', 'confirmed', 'completed', 'cancelled');

-- Profiles table with vector embeddings
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    location TEXT,
    interests TEXT[], -- Array of interest keywords
    embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_attendees INTEGER CHECK (max_attendees > 0),
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    CONSTRAINT events_end_after_start CHECK (end_time > start_time)
);

-- RSVPs table
CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status rsvp_status NOT NULL DEFAULT 'going',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id),
    CONSTRAINT rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Match scores table with caching
CREATE TABLE match_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_1 UUID NOT NULL,
    user_id_2 UUID NOT NULL,
    event_id UUID,
    semantic_score FLOAT NOT NULL CHECK (semantic_score >= 0 AND semantic_score <= 1),
    interest_score FLOAT NOT NULL CHECK (interest_score >= 0 AND interest_score <= 1),
    combined_score FLOAT NOT NULL CHECK (combined_score >= 0 AND combined_score <= 1),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id_1, user_id_2, event_id),
    CONSTRAINT match_scores_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT match_scores_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT match_scores_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT match_scores_different_users CHECK (user_id_1 != user_id_2),
    CONSTRAINT match_scores_user_order CHECK (user_id_1 < user_id_2) -- Ensure consistent ordering
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    event_id UUID,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT messages_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT messages_different_users CHECK (sender_id != recipient_id)
);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    favorited_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, favorited_user_id),
    CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT favorites_favorited_user_id_fkey FOREIGN KEY (favorited_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT favorites_different_users CHECK (user_id != favorited_user_id)
);

-- Blocks table
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL,
    blocked_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(blocker_id, blocked_id),
    CONSTRAINT blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT blocks_different_users CHECK (blocker_id != blocked_id)
);

-- Meeting slots table
CREATE TABLE meeting_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    user_id_1 UUID NOT NULL,
    user_id_2 UUID NOT NULL,
    proposed_time TIMESTAMPTZ NOT NULL,
    status meeting_status DEFAULT 'proposed',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT meeting_slots_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT meeting_slots_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT meeting_slots_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT meeting_slots_different_users CHECK (user_id_1 != user_id_2)
);

-- Create indexes for performance optimization
CREATE INDEX profiles_user_id_idx ON profiles(user_id);
CREATE INDEX profiles_location_idx ON profiles(location);
CREATE INDEX profiles_interests_gin_idx ON profiles USING GIN(interests);
CREATE INDEX profiles_display_name_trgm_idx ON profiles USING GIN(display_name gin_trgm_ops);

-- Vector similarity search index (IVFFlat)
CREATE INDEX profiles_embedding_ivfflat_idx ON profiles 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX events_start_time_idx ON events(start_time);
CREATE INDEX events_location_idx ON events(location);
CREATE INDEX events_created_by_idx ON events(created_by);
CREATE INDEX events_active_start_time_idx ON events(is_active, start_time) WHERE is_active = true;

CREATE INDEX rsvps_event_id_idx ON rsvps(event_id);
CREATE INDEX rsvps_user_id_idx ON rsvps(user_id);
CREATE INDEX rsvps_status_idx ON rsvps(status);

CREATE INDEX match_scores_event_id_idx ON match_scores(event_id);
CREATE INDEX match_scores_combined_score_idx ON match_scores(combined_score DESC);
CREATE INDEX match_scores_calculated_at_idx ON match_scores(calculated_at);

CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_recipient_id_idx ON messages(recipient_id);
CREATE INDEX messages_event_id_idx ON messages(event_id);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX messages_conversation_idx ON messages(sender_id, recipient_id, created_at DESC);

CREATE INDEX favorites_user_id_idx ON favorites(user_id);
CREATE INDEX favorites_favorited_user_id_idx ON favorites(favorited_user_id);

CREATE INDEX blocks_blocker_id_idx ON blocks(blocker_id);
CREATE INDEX blocks_blocked_id_idx ON blocks(blocked_id);

CREATE INDEX meeting_slots_event_id_idx ON meeting_slots(event_id);
CREATE INDEX meeting_slots_users_idx ON meeting_slots(user_id_1, user_id_2);
CREATE INDEX meeting_slots_proposed_time_idx ON meeting_slots(proposed_time);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_slots_updated_at BEFORE UPDATE ON meeting_slots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate match score function
CREATE OR REPLACE FUNCTION calculate_match_score(
    user1_id UUID,
    user2_id UUID,
    target_event_id UUID DEFAULT NULL
)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user1_embedding VECTOR(1536);
    user2_embedding VECTOR(1536);
    user1_interests TEXT[];
    user2_interests TEXT[];
    semantic_similarity FLOAT := 0.0;
    interest_similarity FLOAT := 0.0;
    combined_score FLOAT := 0.0;
    common_interests INT := 0;
    total_interests INT := 0;
    ordered_user1_id UUID;
    ordered_user2_id UUID;
BEGIN
    -- Ensure consistent ordering for caching
    IF user1_id < user2_id THEN
        ordered_user1_id := user1_id;
        ordered_user2_id := user2_id;
    ELSE
        ordered_user1_id := user2_id;
        ordered_user2_id := user1_id;
    END IF;
    
    -- Check for existing cached score
    SELECT combined_score INTO combined_score
    FROM match_scores 
    WHERE user_id_1 = ordered_user1_id 
      AND user_id_2 = ordered_user2_id 
      AND (event_id = target_event_id OR (event_id IS NULL AND target_event_id IS NULL))
      AND calculated_at > NOW() - INTERVAL '24 hours';
    
    IF combined_score IS NOT NULL THEN
        RETURN combined_score;
    END IF;
    
    -- Get user data
    SELECT embedding, interests INTO user1_embedding, user1_interests
    FROM profiles WHERE user_id = user1_id AND is_active = true;
    
    SELECT embedding, interests INTO user2_embedding, user2_interests
    FROM profiles WHERE user_id = user2_id AND is_active = true;
    
    -- Check if both users exist and are active
    IF user1_embedding IS NULL OR user2_embedding IS NULL THEN
        RETURN 0.0;
    END IF;
    
    -- Check if users have blocked each other
    IF EXISTS (
        SELECT 1 FROM blocks 
        WHERE (blocker_id = user1_id AND blocked_id = user2_id)
           OR (blocker_id = user2_id AND blocked_id = user1_id)
    ) THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate semantic similarity using cosine distance
    semantic_similarity := 1.0 - (user1_embedding <=> user2_embedding);
    
    -- Calculate interest overlap
    IF user1_interests IS NOT NULL AND user2_interests IS NOT NULL THEN
        SELECT COUNT(DISTINCT unnest) INTO common_interests
        FROM (
            SELECT unnest(user1_interests)
            INTERSECT
            SELECT unnest(user2_interests)
        ) AS common;
        
        SELECT COUNT(DISTINCT unnest) INTO total_interests
        FROM (
            SELECT unnest(user1_interests)
            UNION
            SELECT unnest(user2_interests)
        ) AS total;
        
        IF total_interests > 0 THEN
            interest_similarity := common_interests::FLOAT / total_interests::FLOAT;
        END IF;
    END IF;
    
    -- Combine scores with weighted average
    combined_score := (0.7 * semantic_similarity) + (0.3 * interest_similarity);
    
    -- Cache the result
    INSERT INTO match_scores (
        user_id_1, 
        user_id_2, 
        event_id, 
        semantic_score, 
        interest_score, 
        combined_score
    ) VALUES (
        ordered_user1_id, 
        ordered_user2_id, 
        target_event_id, 
        semantic_similarity, 
        interest_similarity, 
        combined_score
    )
    ON CONFLICT (user_id_1, user_id_2, event_id) 
    DO UPDATE SET 
        semantic_score = EXCLUDED.semantic_score,
        interest_score = EXCLUDED.interest_score,
        combined_score = EXCLUDED.combined_score,
        calculated_at = NOW();
    
    RETURN combined_score;
END;
$$;

-- Get event matches function
CREATE OR REPLACE FUNCTION get_event_matches(
    target_user_id UUID,
    target_event_id UUID,
    match_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    bio TEXT,
    age INTEGER,
    location TEXT,
    interests TEXT[],
    match_score FLOAT,
    is_favorited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH event_attendees AS (
        SELECT DISTINCT r.user_id
        FROM rsvps r
        WHERE r.event_id = target_event_id 
          AND r.status IN ('going', 'maybe')
          AND r.user_id != target_user_id
    ),
    user_matches AS (
        SELECT 
            ea.user_id,
            calculate_match_score(target_user_id, ea.user_id, target_event_id) as score
        FROM event_attendees ea
        WHERE NOT EXISTS (
            SELECT 1 FROM blocks b 
            WHERE (b.blocker_id = target_user_id AND b.blocked_id = ea.user_id)
               OR (b.blocker_id = ea.user_id AND b.blocked_id = target_user_id)
        )
    )
    SELECT 
        p.user_id,
        p.display_name,
        p.bio,
        p.age,
        p.location,
        p.interests,
        um.score as match_score,
        EXISTS(
            SELECT 1 FROM favorites f 
            WHERE f.user_id = target_user_id 
              AND f.favorited_user_id = p.user_id
        ) as is_favorited
    FROM user_matches um
    JOIN profiles p ON p.user_id = um.user_id
    WHERE p.is_active = true
      AND um.score > 0.0
    ORDER BY um.score DESC, p.display_name
    LIMIT match_limit;
END;
$$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events" ON events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Event creators can delete their events" ON events
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for rsvps
CREATE POLICY "Users can view RSVPs for events they're attending" ON rsvps
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM rsvps r2 
            WHERE r2.event_id = rsvps.event_id 
              AND r2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own RSVPs" ON rsvps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs" ON rsvps
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs" ON rsvps
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for match_scores
CREATE POLICY "Users can view their own match scores" ON match_scores
    FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" ON favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blocks
CREATE POLICY "Users can view their own blocks" ON blocks
    FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage their own blocks" ON blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON blocks
    FOR DELETE USING (auth.uid() = blocker_id);

-- RLS Policies for meeting_slots
CREATE POLICY "Users can view their own meeting slots" ON meeting_slots
    FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create meeting slots they're part of" ON meeting_slots
    FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can update their meeting slots" ON meeting_slots
    FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete their meeting slots" ON meeting_slots
    FOR DELETE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);


-- ========================================
-- Migration: 002_fix_match_score_function.sql
-- ========================================

-- Fix the ambiguous column reference in calculate_match_score function
-- Drop the existing function first
DROP FUNCTION IF EXISTS calculate_match_score(UUID, UUID, UUID);

-- Recreate with fixed variable names
CREATE OR REPLACE FUNCTION calculate_match_score(
    user1_id UUID,
    user2_id UUID,
    target_event_id UUID DEFAULT NULL
)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user1_embedding VECTOR(1536);
    user2_embedding VECTOR(1536);
    user1_interests TEXT[];
    user2_interests TEXT[];
    semantic_similarity FLOAT := 0.0;
    interest_similarity FLOAT := 0.0;
    final_score FLOAT := 0.0;  -- Renamed from combined_score to avoid conflict
    cached_score FLOAT;  -- New variable for cached score lookup
    common_interests INT := 0;
    total_interests INT := 0;
    ordered_user1_id UUID;
    ordered_user2_id UUID;
BEGIN
    -- Ensure consistent ordering for caching
    IF user1_id < user2_id THEN
        ordered_user1_id := user1_id;
        ordered_user2_id := user2_id;
    ELSE
        ordered_user1_id := user2_id;
        ordered_user2_id := user1_id;
    END IF;
    
    -- Check for existing cached score
    SELECT ms.combined_score INTO cached_score
    FROM match_scores ms
    WHERE ms.user_id_1 = ordered_user1_id 
      AND ms.user_id_2 = ordered_user2_id 
      AND (ms.event_id = target_event_id OR (ms.event_id IS NULL AND target_event_id IS NULL))
      AND ms.calculated_at > NOW() - INTERVAL '24 hours';
    
    IF cached_score IS NOT NULL THEN
        RETURN cached_score;
    END IF;
    
    -- Get user data
    SELECT embedding, interests INTO user1_embedding, user1_interests
    FROM profiles WHERE user_id = user1_id AND is_active = true;
    
    SELECT embedding, interests INTO user2_embedding, user2_interests
    FROM profiles WHERE user_id = user2_id AND is_active = true;
    
    -- Check if both users exist and are active
    IF user1_embedding IS NULL OR user2_embedding IS NULL THEN
        RETURN 0.0;
    END IF;
    
    -- Check if users have blocked each other
    IF EXISTS (
        SELECT 1 FROM blocks 
        WHERE (blocker_id = user1_id AND blocked_id = user2_id)
           OR (blocker_id = user2_id AND blocked_id = user1_id)
    ) THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate semantic similarity using cosine distance
    semantic_similarity := 1.0 - (user1_embedding <=> user2_embedding);
    
    -- Calculate interest overlap
    IF user1_interests IS NOT NULL AND user2_interests IS NOT NULL THEN
        SELECT COUNT(DISTINCT unnest) INTO common_interests
        FROM (
            SELECT unnest(user1_interests)
            INTERSECT
            SELECT unnest(user2_interests)
        ) AS common;
        
        SELECT COUNT(DISTINCT unnest) INTO total_interests
        FROM (
            SELECT unnest(user1_interests)
            UNION
            SELECT unnest(user2_interests)
        ) AS total;
        
        IF total_interests > 0 THEN
            interest_similarity := common_interests::FLOAT / total_interests::FLOAT;
        END IF;
    END IF;
    
    -- Combine scores with weighted average
    final_score := (0.7 * semantic_similarity) + (0.3 * interest_similarity);
    
    -- Cache the result
    INSERT INTO match_scores (
        user_id_1, 
        user_id_2, 
        event_id, 
        semantic_score, 
        interest_score, 
        combined_score
    ) VALUES (
        ordered_user1_id, 
        ordered_user2_id, 
        target_event_id, 
        semantic_similarity, 
        interest_similarity, 
        final_score
    )
    ON CONFLICT (user_id_1, user_id_2, event_id) 
    DO UPDATE SET 
        semantic_score = EXCLUDED.semantic_score,
        interest_score = EXCLUDED.interest_score,
        combined_score = EXCLUDED.combined_score,
        calculated_at = NOW();
    
    RETURN final_score;
END;
$$;


-- ========================================
-- Migration: 003_fix_constraints_and_function.sql
-- ========================================

-- Fix constraints to handle edge cases and update function to ensure valid scores

-- First, drop existing constraints on match_scores
ALTER TABLE match_scores DROP CONSTRAINT IF EXISTS match_scores_semantic_score_check;
ALTER TABLE match_scores DROP CONSTRAINT IF EXISTS match_scores_interest_score_check;
ALTER TABLE match_scores DROP CONSTRAINT IF EXISTS match_scores_combined_score_check;

-- Add back constraints that allow full range of cosine similarity (-1 to 1)
-- Cosine similarity can be negative when vectors point in opposite directions
ALTER TABLE match_scores 
    ADD CONSTRAINT match_scores_semantic_score_check 
    CHECK (semantic_score >= -1 AND semantic_score <= 1);

ALTER TABLE match_scores 
    ADD CONSTRAINT match_scores_interest_score_check 
    CHECK (interest_score >= 0 AND interest_score <= 1);

ALTER TABLE match_scores 
    ADD CONSTRAINT match_scores_combined_score_check 
    CHECK (combined_score >= -1 AND combined_score <= 1);

-- Drop and recreate the function with proper score normalization
DROP FUNCTION IF EXISTS calculate_match_score(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION calculate_match_score(
    user1_id UUID,
    user2_id UUID,
    target_event_id UUID DEFAULT NULL
)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user1_embedding VECTOR(1536);
    user2_embedding VECTOR(1536);
    user1_interests TEXT[];
    user2_interests TEXT[];
    semantic_similarity FLOAT := 0.0;
    interest_similarity FLOAT := 0.0;
    final_score FLOAT := 0.0;
    cached_score FLOAT;
    common_interests INT := 0;
    total_interests INT := 0;
    ordered_user1_id UUID;
    ordered_user2_id UUID;
BEGIN
    -- Ensure consistent ordering for caching
    IF user1_id < user2_id THEN
        ordered_user1_id := user1_id;
        ordered_user2_id := user2_id;
    ELSE
        ordered_user1_id := user2_id;
        ordered_user2_id := user1_id;
    END IF;
    
    -- Check for existing cached score
    SELECT ms.combined_score INTO cached_score
    FROM match_scores ms
    WHERE ms.user_id_1 = ordered_user1_id 
      AND ms.user_id_2 = ordered_user2_id 
      AND (ms.event_id = target_event_id OR (ms.event_id IS NULL AND target_event_id IS NULL))
      AND ms.calculated_at > NOW() - INTERVAL '24 hours';
    
    IF cached_score IS NOT NULL THEN
        -- Return normalized score (ensure it's between 0 and 1)
        RETURN GREATEST(0, cached_score);
    END IF;
    
    -- Get user data
    SELECT embedding, interests INTO user1_embedding, user1_interests
    FROM profiles WHERE user_id = user1_id AND is_active = true;
    
    SELECT embedding, interests INTO user2_embedding, user2_interests
    FROM profiles WHERE user_id = user2_id AND is_active = true;
    
    -- Check if both users exist and are active
    IF user1_embedding IS NULL OR user2_embedding IS NULL THEN
        RETURN 0.0;
    END IF;
    
    -- Check if users have blocked each other
    IF EXISTS (
        SELECT 1 FROM blocks 
        WHERE (blocker_id = user1_id AND blocked_id = user2_id)
           OR (blocker_id = user2_id AND blocked_id = user1_id)
    ) THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate semantic similarity using cosine distance
    -- Cosine similarity ranges from -1 to 1, normalize to 0 to 1
    semantic_similarity := 1.0 - (user1_embedding <=> user2_embedding);
    
    -- Calculate interest overlap
    IF user1_interests IS NOT NULL AND user2_interests IS NOT NULL THEN
        SELECT COUNT(DISTINCT unnest) INTO common_interests
        FROM (
            SELECT unnest(user1_interests)
            INTERSECT
            SELECT unnest(user2_interests)
        ) AS common;
        
        SELECT COUNT(DISTINCT unnest) INTO total_interests
        FROM (
            SELECT unnest(user1_interests)
            UNION
            SELECT unnest(user2_interests)
        ) AS total;
        
        IF total_interests > 0 THEN
            interest_similarity := common_interests::FLOAT / total_interests::FLOAT;
        END IF;
    END IF;
    
    -- Combine scores with weighted average
    final_score := (0.7 * semantic_similarity) + (0.3 * interest_similarity);
    
    -- Cache the result (store raw scores)
    INSERT INTO match_scores (
        user_id_1, 
        user_id_2, 
        event_id, 
        semantic_score, 
        interest_score, 
        combined_score
    ) VALUES (
        ordered_user1_id, 
        ordered_user2_id, 
        target_event_id, 
        semantic_similarity, 
        interest_similarity, 
        final_score
    )
    ON CONFLICT (user_id_1, user_id_2, event_id) 
    DO UPDATE SET 
        semantic_score = EXCLUDED.semantic_score,
        interest_score = EXCLUDED.interest_score,
        combined_score = EXCLUDED.combined_score,
        calculated_at = NOW();
    
    -- Return normalized score for matching (ensure it's between 0 and 1)
    RETURN GREATEST(0, final_score);
END;
$$;

-- Also update the get_event_matches function to handle negative scores properly
DROP FUNCTION IF EXISTS get_event_matches(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_event_matches(
    target_user_id UUID,
    target_event_id UUID,
    match_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    bio TEXT,
    age INTEGER,
    location TEXT,
    interests TEXT[],
    match_score FLOAT,
    is_favorited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH event_attendees AS (
        SELECT DISTINCT r.user_id
        FROM rsvps r
        WHERE r.event_id = target_event_id 
          AND r.status IN ('going', 'maybe')
          AND r.user_id != target_user_id
    ),
    user_matches AS (
        SELECT 
            ea.user_id,
            calculate_match_score(target_user_id, ea.user_id, target_event_id) as score
        FROM event_attendees ea
        WHERE NOT EXISTS (
            SELECT 1 FROM blocks b 
            WHERE (b.blocker_id = target_user_id AND b.blocked_id = ea.user_id)
               OR (b.blocker_id = ea.user_id AND b.blocked_id = target_user_id)
        )
    )
    SELECT 
        p.user_id,
        p.display_name,
        p.bio,
        p.age,
        p.location,
        p.interests,
        GREATEST(0, um.score) as match_score,  -- Ensure displayed score is non-negative
        EXISTS(
            SELECT 1 FROM favorites f 
            WHERE f.user_id = target_user_id 
              AND f.favorited_user_id = p.user_id
        ) as is_favorited
    FROM user_matches um
    JOIN profiles p ON p.user_id = um.user_id
    WHERE p.is_active = true
      AND um.score > 0.0
    ORDER BY um.score DESC, p.display_name
    LIMIT match_limit;
END;
$$;


-- ========================================
-- Migration: 20250103000001_add_embeddings.sql
-- ========================================

-- Add embedding columns to profiles table for semantic matching
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio_embedding VECTOR(1536),
ADD COLUMN IF NOT EXISTS interests_embedding VECTOR(1536);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_profiles_bio_embedding ON profiles USING ivfflat (bio_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_interests_embedding ON profiles USING ivfflat (interests_embedding vector_cosine_ops);

-- Function to calculate match score between two profiles
CREATE OR REPLACE FUNCTION calculate_match_score(
  profile1_id UUID,
  profile2_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  p1 profiles%ROWTYPE;
  p2 profiles%ROWTYPE;
  bio_similarity NUMERIC := 0;
  interest_overlap NUMERIC := 0;
  age_proximity NUMERIC := 0;
  location_bonus NUMERIC := 0;
  total_score NUMERIC := 0;
BEGIN
  -- Get both profiles
  SELECT * INTO p1 FROM profiles WHERE id = profile1_id;
  SELECT * INTO p2 FROM profiles WHERE id = profile2_id;
  
  -- Return 0 if either profile doesn't exist
  IF p1.id IS NULL OR p2.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Bio similarity (30% weight) using cosine similarity
  IF p1.bio_embedding IS NOT NULL AND p2.bio_embedding IS NOT NULL THEN
    bio_similarity := (1 - (p1.bio_embedding <=> p2.bio_embedding)) * 30;
  END IF;
  
  -- Interest overlap (40% weight)
  IF p1.interests IS NOT NULL AND p2.interests IS NOT NULL THEN
    -- Calculate Jaccard similarity for exact matches
    WITH common_interests AS (
      SELECT COUNT(*) as common_count
      FROM jsonb_array_elements_text(p1.interests) i1
      JOIN jsonb_array_elements_text(p2.interests) i2 ON LOWER(i1) = LOWER(i2)
    ),
    total_interests AS (
      SELECT COUNT(DISTINCT LOWER(interest)) as total_count
      FROM (
        SELECT jsonb_array_elements_text(p1.interests) as interest
        UNION
        SELECT jsonb_array_elements_text(p2.interests) as interest
      ) all_interests
    )
    SELECT 
      CASE 
        WHEN total_count = 0 THEN 0
        ELSE (common_count::NUMERIC / total_count::NUMERIC) * 40
      END INTO interest_overlap
    FROM common_interests, total_interests;
  END IF;
  
  -- Age proximity (20% weight) - Gaussian distribution with peak at ±0 years
  IF p1.age IS NOT NULL AND p2.age IS NOT NULL THEN
    age_proximity := EXP(-0.5 * POWER((p1.age - p2.age)::NUMERIC / 5, 2)) * 20;
  END IF;
  
  -- Location bonus (10% weight)
  IF p1.location IS NOT NULL AND p2.location IS NOT NULL THEN
    IF LOWER(p1.location) = LOWER(p2.location) THEN
      location_bonus := 10;
    END IF;
  END IF;
  
  total_score := bio_similarity + interest_overlap + age_proximity + location_bonus;
  
  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, total_score));
END;
$$ LANGUAGE plpgsql;

-- Function to refresh match scores for a specific profile
CREATE OR REPLACE FUNCTION refresh_match_scores_for_profile(target_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  other_profile profiles%ROWTYPE;
  calculated_score NUMERIC;
  updated_count INTEGER := 0;
BEGIN
  -- Calculate scores against all other profiles
  FOR other_profile IN 
    SELECT * FROM profiles 
    WHERE id != target_profile_id 
    AND id IS NOT NULL
  LOOP
    calculated_score := calculate_match_score(target_profile_id, other_profile.id);
    
    -- Upsert the score (ensuring profile1_id < profile2_id for consistency)
    INSERT INTO match_scores (profile1_id, profile2_id, score)
    VALUES (
      LEAST(target_profile_id, other_profile.id),
      GREATEST(target_profile_id, other_profile.id),
      calculated_score
    )
    ON CONFLICT (profile1_id, profile2_id) 
    DO UPDATE SET 
      score = EXCLUDED.score,
      updated_at = timezone('utc'::text, now());
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a materialized view for top matches (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS top_matches AS
SELECT 
  ms.profile1_id,
  ms.profile2_id,
  ms.score,
  p1.first_name as profile1_name,
  p2.first_name as profile2_name
FROM match_scores ms
JOIN profiles p1 ON ms.profile1_id = p1.id
JOIN profiles p2 ON ms.profile2_id = p2.id
WHERE ms.score > 20  -- Only include meaningful matches
ORDER BY ms.score DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_top_matches_profile1 ON top_matches (profile1_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_top_matches_profile2 ON top_matches (profile2_id, score DESC);


-- ========================================
-- Migration: 20250103000002_event_matching_functions.sql
-- ========================================

-- Create function to get event matches
CREATE OR REPLACE FUNCTION get_event_matches(
  p_event_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  profile_id UUID,
  full_name TEXT,
  bio TEXT,
  interests JSONB,
  age INTEGER,
  location TEXT,
  match_score NUMERIC,
  shared_interests JSONB,
  match_explanation JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.id as profile_id,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.bio,
    p.interests,
    p.age,
    p.location,
    COALESCE(ms.score, 50) as match_score,
    p.interests as shared_interests,
    jsonb_build_object(
      'summary', 'You will both be at this event'
    ) as match_explanation
  FROM profiles p
  JOIN rsvps r ON r.profile_id = p.id
  LEFT JOIN match_scores ms ON (
    (ms.profile1_id = p_user_id AND ms.profile2_id = p.id) OR
    (ms.profile1_id = p.id AND ms.profile2_id = p_user_id)
  )
  WHERE r.event_id = p_event_id
    AND p.id != p_user_id
  ORDER BY COALESCE(ms.score, 50) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


-- ========================================
-- Migration: 20240104000000_create_favorites_table.sql
-- ========================================

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, favorited_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favorited_user_id ON favorites(favorited_user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON favorites TO service_role;

-- Create function for favorite RSVP notifications
CREATE OR REPLACE FUNCTION notify_favorite_rsvp()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any users have favorited the new RSVP user
  INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
  SELECT 
    f.user_id,
    'favorite_rsvp',
    'Your favorite is attending!',
    (SELECT name FROM profiles WHERE id = NEW.user_id) || ' is attending ' || 
    (SELECT title FROM events WHERE id = NEW.event_id),
    jsonb_build_object(
      'event_id', NEW.event_id,
      'favorited_user_id', NEW.user_id,
      'rsvp_id', NEW.id
    ),
    NOW()
  FROM favorites f
  WHERE f.favorited_user_id = NEW.user_id
    AND f.user_id != NEW.user_id  -- Don't notify the user about their own RSVP
    AND NEW.status = 'going'
    AND EXISTS (
      -- Check if the notified user is also attending this event
      SELECT 1 FROM rsvps r2 
      WHERE r2.user_id = f.user_id 
      AND r2.event_id = NEW.event_id 
      AND r2.status = 'going'
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorite RSVP notifications
CREATE TRIGGER on_favorite_rsvp
  AFTER INSERT OR UPDATE ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION notify_favorite_rsvp();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions for notifications
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;


-- ========================================
-- Migration: 20250904_handle_rsvp.sql
-- ========================================

-- Create handle_rsvp function for atomic RSVP operations
CREATE OR REPLACE FUNCTION handle_rsvp(
  p_event_id UUID,
  p_user_id UUID,
  p_action TEXT -- 'create' or 'cancel'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_capacity INT;
  v_current_attendees INT;
  v_existing_rsvp UUID;
  v_result JSON;
BEGIN
  -- Lock the event row for update to prevent concurrent modifications
  SELECT capacity INTO v_event_capacity
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;
  
  -- Check if event exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Event not found'
    );
  END IF;
  
  -- Check for existing RSVP
  SELECT id INTO v_existing_rsvp
  FROM rsvps
  WHERE event_id = p_event_id AND user_id = p_user_id;
  
  IF p_action = 'create' THEN
    -- Check if already RSVPd
    IF v_existing_rsvp IS NOT NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Already RSVPd to this event'
      );
    END IF;
    
    -- Count current attendees
    SELECT COUNT(*) INTO v_current_attendees
    FROM rsvps
    WHERE event_id = p_event_id AND status = 'confirmed';
    
    -- Check capacity
    IF v_event_capacity IS NOT NULL AND v_current_attendees >= v_event_capacity THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Event is at full capacity'
      );
    END IF;
    
    -- Create RSVP
    INSERT INTO rsvps (event_id, user_id, status, created_at)
    VALUES (p_event_id, p_user_id, 'confirmed', NOW());
    
    -- Update attendee count
    UPDATE events
    SET attendee_count = v_current_attendees + 1
    WHERE id = p_event_id;
    
    v_result := json_build_object(
      'success', true,
      'message', 'RSVP created successfully',
      'attendee_count', v_current_attendees + 1
    );
    
  ELSIF p_action = 'cancel' THEN
    -- Check if RSVP exists
    IF v_existing_rsvp IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No RSVP found to cancel'
      );
    END IF;
    
    -- Delete RSVP
    DELETE FROM rsvps
    WHERE event_id = p_event_id AND user_id = p_user_id;
    
    -- Update attendee count
    SELECT COUNT(*) INTO v_current_attendees
    FROM rsvps
    WHERE event_id = p_event_id AND status = 'confirmed';
    
    UPDATE events
    SET attendee_count = v_current_attendees
    WHERE id = p_event_id;
    
    v_result := json_build_object(
      'success', true,
      'message', 'RSVP cancelled successfully',
      'attendee_count', v_current_attendees
    );
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid action. Use "create" or "cancel"'
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Add attendee_count column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendee_count INT DEFAULT 0;

-- Create index for faster RSVP lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_event_user ON rsvps(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_status ON rsvps(event_id, status);

-- Create trigger to automatically update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET attendee_count = (
      SELECT COUNT(*)
      FROM rsvps
      WHERE event_id = NEW.event_id AND status = 'confirmed'
    )
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET attendee_count = (
      SELECT COUNT(*)
      FROM rsvps
      WHERE event_id = OLD.event_id AND status = 'confirmed'
    )
    WHERE id = OLD.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      UPDATE events
      SET attendee_count = (
        SELECT COUNT(*)
        FROM rsvps
        WHERE event_id = NEW.event_id AND status = 'confirmed'
      )
      WHERE id = NEW.event_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attendee_count ON rsvps;
CREATE TRIGGER trigger_update_attendee_count
AFTER INSERT OR DELETE OR UPDATE OF status ON rsvps
FOR EACH ROW
EXECUTE FUNCTION update_event_attendee_count();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_rsvp TO authenticated;


-- ========================================
-- Migration: 005_performance_indexes.sql
-- ========================================

-- Performance Indexes for HelloEveryone Database
-- This migration adds critical indexes for query optimization

-- Profiles table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_age ON profiles(age) WHERE age IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location ON profiles(location) WHERE location IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_interests_gin ON profiles USING GIN(interests) WHERE interests IS NOT NULL;

-- Events table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_is_published ON events(is_published) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_category ON events(category) WHERE category IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location ON events(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_published ON events(date, is_published) WHERE is_published = true;

-- RSVPs table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_status ON rsvps(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_event_user ON rsvps(event_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_user_status ON rsvps(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);

-- Match scores table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_scores_user_id_1 ON match_scores(user_id_1);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_scores_user_id_2 ON match_scores(user_id_2);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_scores_event_id ON match_scores(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_scores_combined_score ON match_scores(combined_score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_scores_calculated_at ON match_scores(calculated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_scores_user_pair_event ON match_scores(user_id_1, user_id_2, event_id);

-- Messages table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_event_id ON messages(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at);

-- Favorites table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_favorited_user_id ON favorites(favorited_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- Meeting slots table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meeting_slots_event_id ON meeting_slots(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meeting_slots_user1_id ON meeting_slots(user1_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meeting_slots_user2_id ON meeting_slots(user2_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meeting_slots_slot_time ON meeting_slots(slot_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meeting_slots_confirmed ON meeting_slots(confirmed) WHERE confirmed = true;

-- Blocks table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_created_at ON blocks(created_at);

-- Vector similarity search index for bio embeddings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_embedding_cosine 
ON profiles USING ivfflat (embedding vector_cosine_ops) 
WHERE embedding IS NOT NULL;

-- Text search indexes for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_display_name_trgm 
ON profiles USING gin (display_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_bio_trgm 
ON profiles USING gin (bio gin_trgm_ops) WHERE bio IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_title_trgm 
ON profiles USING gin (display_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_description_trgm 
ON events USING gin (description gin_trgm_ops) WHERE description IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_upcoming_published 
ON events(date, is_published, created_at) 
WHERE is_published = true AND date >= CURRENT_DATE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_active_complete 
ON profiles(is_active, is_profile_complete, created_at) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_scores_high_scores 
ON match_scores(user_id_1, combined_score, calculated_at) 
WHERE combined_score >= 0.7;

-- Statistics for query planner
ANALYZE profiles;
ANALYZE events;
ANALYZE rsvps;
ANALYZE match_scores;
ANALYZE messages;
ANALYZE favorites;
ANALYZE meeting_slots;
ANALYZE blocks;


-- ========================================
-- Migration: 006_enhanced_rls_policies.sql
-- ========================================

-- Enhanced Row Level Security Policies
-- This migration adds comprehensive RLS policies for all tables

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Enhanced profiles policies
CREATE POLICY "Public profiles viewable by authenticated users" ON profiles
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update user profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

-- Events policies
CREATE POLICY "Published events viewable by authenticated users" ON events
    FOR SELECT TO authenticated
    USING (is_published = true OR created_by = auth.uid());

CREATE POLICY "Admins can view all events" ON events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

CREATE POLICY "Users can create events" ON events
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all events" ON events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

-- RSVPs policies
CREATE POLICY "Users can view RSVPs for events they're attending" ON rsvps
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM rsvps my_rsvp 
            WHERE my_rsvp.event_id = rsvps.event_id 
            AND my_rsvp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own RSVPs" ON rsvps
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all RSVPs" ON rsvps
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

-- Match scores policies (privacy-sensitive)
CREATE POLICY "Users can view their own match scores" ON match_scores
    FOR SELECT TO authenticated
    USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "System can insert match scores" ON match_scores
    FOR INSERT TO authenticated
    WITH CHECK (true); -- Computed by system functions

CREATE POLICY "System can update match scores" ON match_scores
    FOR UPDATE TO authenticated
    USING (true) -- Computed by system functions
    WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT TO authenticated
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        sender_id != recipient_id AND
        NOT EXISTS (
            SELECT 1 FROM blocks 
            WHERE (blocker_id = recipient_id AND blocked_id = sender_id)
               OR (blocker_id = sender_id AND blocked_id = recipient_id)
        )
    );

CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their messages" ON messages
    FOR DELETE TO authenticated
    USING (sender_id = auth.uid());

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid() AND user_id != favorited_user_id);

-- Meeting slots policies
CREATE POLICY "Users can view their meeting slots" ON meeting_slots
    FOR SELECT TO authenticated
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create meeting slots" ON meeting_slots
    FOR INSERT TO authenticated
    WITH CHECK (
        (user1_id = auth.uid() OR user2_id = auth.uid()) AND
        user1_id != user2_id
    );

CREATE POLICY "Users can update their meeting slots" ON meeting_slots
    FOR UPDATE TO authenticated
    USING (user1_id = auth.uid() OR user2_id = auth.uid())
    WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Blocks policies
CREATE POLICY "Users can view their blocks" ON blocks
    FOR SELECT TO authenticated
    USING (blocker_id = auth.uid());

CREATE POLICY "Users can manage their blocks" ON blocks
    FOR ALL TO authenticated
    USING (blocker_id = auth.uid())
    WITH CHECK (blocker_id = auth.uid() AND blocker_id != blocked_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rsvps TO authenticated;
GRANT SELECT ON match_scores TO authenticated;
GRANT INSERT, UPDATE ON match_scores TO service_role; -- For system functions
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meeting_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blocks TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION calculate_match_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_matches TO authenticated;
GRANT EXECUTE ON FUNCTION handle_rsvp TO authenticated;

