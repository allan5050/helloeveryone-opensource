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