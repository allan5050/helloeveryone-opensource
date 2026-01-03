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