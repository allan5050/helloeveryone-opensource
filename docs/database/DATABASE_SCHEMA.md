# Database Schema Documentation

NOTE: you can use MCP tools to directly query Supabase to get the latest info because this document might go out of date (see 'C:\Users\Allan\source\repos\helloeveryone\mcp')

## Supabase PostgreSQL Setup

### 1. Enable Required Extensions

```sql
-- Run these first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
```

### 2. Core Tables

#### Profiles Table

```sql
CREATE TABLE profiles (
  -- Identity
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  age INTEGER CHECK (age >= 18 AND age <= 100),

  -- Profile content
  bio TEXT CHECK (LENGTH(bio) <= 500),
  bio_embedding vector(1536), -- OpenAI text-embedding-3-small
  photo_url TEXT,

  -- Structured data for matching
  interests JSONB DEFAULT '{}' CHECK (jsonb_typeof(interests) = 'object'),
  /* Example interests structure:
  {
    "music": ["rock", "jazz"],
    "food": ["italian", "thai"],
    "activities": ["hiking", "reading"],
    "languages": ["english", "spanish"],
    "profession": "software engineer",
    "lifestyle": ["night-owl", "remote-work"],
    "new_in_town": true,
    "looking_for": ["friends", "activity-partners"]
  }
  */

  -- Privacy controls
  visible_fields JSONB DEFAULT '{
    "age": true,
    "bio": true,
    "photo": true,
    "interests": true,
    "profession": true
  }'::jsonb,

  -- Metadata
  city TEXT DEFAULT 'Helsinki',
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  -- Indexes
  CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 18 AND age <= 100))
);

-- Indexes for performance
CREATE INDEX idx_profiles_active ON profiles(id) WHERE is_active = true;
CREATE INDEX idx_profiles_embedding ON profiles USING ivfflat (bio_embedding vector_cosine_ops);
CREATE INDEX idx_profiles_interests ON profiles USING gin (interests);
CREATE INDEX idx_profiles_last_active ON profiles(last_active DESC);
```

#### Events Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event details
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  description TEXT CHECK (LENGTH(description) <= 1000),

  -- Location (public venues only)
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  venue_url TEXT, -- Google Maps or venue website

  -- Timing
  event_date TIMESTAMP NOT NULL CHECK (event_date > NOW()),
  duration_hours DECIMAL(3,1) DEFAULT 2.0,

  -- Capacity
  min_attendees INTEGER DEFAULT 4,
  max_attendees INTEGER DEFAULT 15,

  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,

  -- Event tags for filtering
  tags TEXT[] DEFAULT '{}',

  CONSTRAINT valid_capacity CHECK (min_attendees < max_attendees),
  CONSTRAINT future_event CHECK (event_date > NOW())
);

-- Indexes
CREATE INDEX idx_events_date ON events(event_date) WHERE is_cancelled = false;
CREATE INDEX idx_events_tags ON events USING gin(tags);
```

#### RSVPs Table

```sql
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'going'
    CHECK (status IN ('going', 'interested', 'cancelled')),

  -- Track when they decided
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(event_id, user_id)
);

-- Indexes
CREATE INDEX idx_rsvps_event ON rsvps(event_id) WHERE status = 'going';
CREATE INDEX idx_rsvps_user ON rsvps(user_id) WHERE status = 'going';
```

#### Match Scores Table (Cached)

```sql
CREATE TABLE match_scores (
  -- Composite primary key
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Match data
  total_score DECIMAL(5,2) CHECK (total_score >= 0 AND total_score <= 100),

  -- Score breakdown
  score_components JSONB DEFAULT '{}',
  /* Example:
  {
    "bio_similarity": 25.5,
    "interest_overlap": 35.0,
    "age_proximity": 18.0,
    "activity_bonus": 5.0
  }
  */

  -- Explanation for users
  match_reasons JSONB DEFAULT '[]',
  /* Example:
  [
    {"type": "interest", "text": "You both love Italian food"},
    {"type": "bio", "text": "Similar interests in tech"},
    {"type": "age", "text": "Similar age range"}
  ]
  */

  -- Metadata
  computed_at TIMESTAMP DEFAULT NOW(),
  algorithm_version TEXT DEFAULT 'v1',

  -- Ensure user1_id < user2_id for consistency
  PRIMARY KEY (user1_id, user2_id),
  CONSTRAINT ordered_users CHECK (user1_id < user2_id)
);

-- Index for fast lookups
CREATE INDEX idx_match_scores_user ON match_scores(user1_id, total_score DESC);
CREATE INDEX idx_match_scores_high ON match_scores(total_score DESC)
  WHERE total_score > 70;
```

#### Messages Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_deleted_by_sender BOOLEAN DEFAULT false,
  is_deleted_by_recipient BOOLEAN DEFAULT false,

  -- Timestamps
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,

  -- Thread management
  thread_id UUID DEFAULT gen_random_uuid(),

  CONSTRAINT not_self_message CHECK (sender_id != recipient_id)
);

-- Indexes for chat queries
CREATE INDEX idx_messages_thread ON messages(thread_id, sent_at DESC);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read)
  WHERE is_deleted_by_recipient = false;
```

#### Favorites Table

```sql
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT NOW(),

  -- Categories for organization
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'met', 'want_to_meet')),

  notes TEXT, -- Private notes about this person

  PRIMARY KEY (user_id, favorited_user_id),
  CONSTRAINT not_self_favorite CHECK (user_id != favorited_user_id)
);

-- Index for queries
CREATE INDEX idx_favorites_user ON favorites(user_id);
```

#### Blocks Table

```sql
CREATE TABLE blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  reason TEXT CHECK (reason IN ('spam', 'inappropriate', 'other')),
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (blocker_id, blocked_id)
);

-- Indexes for filtering
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);
```

#### Meeting Slots Table

```sql
CREATE TABLE meeting_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event context
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Participants
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requestee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Time slot (15-min increments)
  slot_time TIMESTAMP NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'declined', 'completed')),

  -- Messages
  request_message TEXT,
  response_message TEXT,

  -- Timestamps
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,

  UNIQUE(event_id, slot_time, requester_id),
  UNIQUE(event_id, slot_time, requestee_id)
);

-- Indexes
CREATE INDEX idx_meeting_slots_event ON meeting_slots(event_id, slot_time);
CREATE INDEX idx_meeting_slots_user ON meeting_slots(requester_id, status);
```

### 3. Database Functions

#### Calculate Match Score

```sql
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS TABLE (
  score DECIMAL(5,2),
  components JSONB,
  reasons JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_bio_score DECIMAL(5,2) := 0;
  v_interest_score DECIMAL(5,2) := 0;
  v_age_score DECIMAL(5,2) := 0;
  v_total_score DECIMAL(5,2) := 0;
  v_components JSONB := '{}';
  v_reasons JSONB := '[]';
BEGIN
  -- This function contains proprietary matching logic
  -- Hidden from client-side code

  -- Calculate each component
  -- Implementation details here...

  RETURN QUERY
  SELECT v_total_score, v_components, v_reasons;
END;
$$;
```

#### Get Event Matches

```sql
CREATE OR REPLACE FUNCTION get_event_matches(
  p_user_id UUID,
  p_event_id UUID,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  matched_user_id UUID,
  first_name TEXT,
  photo_url TEXT,
  match_score DECIMAL(5,2),
  match_reasons JSONB
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH event_attendees AS (
    SELECT user_id
    FROM rsvps
    WHERE event_id = p_event_id
      AND status = 'going'
      AND user_id != p_user_id
  ),
  matches AS (
    SELECT
      ea.user_id,
      COALESCE(
        ms.total_score,
        (calculate_match_score(p_user_id, ea.user_id)).score
      ) AS score,
      COALESCE(
        ms.match_reasons,
        (calculate_match_score(p_user_id, ea.user_id)).reasons
      ) AS reasons
    FROM event_attendees ea
    LEFT JOIN match_scores ms ON
      (ms.user1_id = LEAST(p_user_id, ea.user_id) AND
       ms.user2_id = GREATEST(p_user_id, ea.user_id))
  )
  SELECT
    m.user_id,
    p.first_name,
    p.photo_url,
    m.score,
    m.reasons
  FROM matches m
  JOIN profiles p ON p.id = m.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = p_user_id AND blocked_id = m.user_id)
       OR (blocker_id = m.user_id AND blocked_id = p_user_id)
  )
  ORDER BY m.score DESC
  LIMIT p_limit;
END;
$$;
```

### 4. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view non-blocked profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = id)
         OR (blocker_id = id AND blocked_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (NOT is_cancelled);

CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- RSVP policies
CREATE POLICY "Users can view RSVPs for events they attend"
  ON rsvps FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM rsvps WHERE event_id = rsvps.event_id
    )
  );

CREATE POLICY "Users can manage own RSVPs"
  ON rsvps FOR ALL
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() IN (sender_id, recipient_id)
    AND NOT (
      (auth.uid() = sender_id AND is_deleted_by_sender) OR
      (auth.uid() = recipient_id AND is_deleted_by_recipient)
    )
  );

CREATE POLICY "Users can send messages to non-blocked users"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = sender_id AND blocked_id = recipient_id)
         OR (blocker_id = recipient_id AND blocked_id = sender_id)
    )
  );
```

### 5. Triggers

```sql
-- Update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_active
AFTER INSERT ON rsvps
FOR EACH ROW
EXECUTE FUNCTION update_last_active();

-- Refresh match cache periodically
CREATE OR REPLACE FUNCTION refresh_match_cache()
RETURNS void AS $$
BEGIN
  -- Clear old matches
  DELETE FROM match_scores
  WHERE computed_at < NOW() - INTERVAL '7 days';

  -- Recompute for active users
  INSERT INTO match_scores (user1_id, user2_id, total_score, score_components, match_reasons)
  SELECT
    LEAST(p1.id, p2.id),
    GREATEST(p1.id, p2.id),
    (calculate_match_score(p1.id, p2.id)).*
  FROM profiles p1
  CROSS JOIN profiles p2
  WHERE p1.id < p2.id
    AND p1.last_active > NOW() - INTERVAL '30 days'
    AND p2.last_active > NOW() - INTERVAL '30 days'
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET
    total_score = EXCLUDED.total_score,
    score_components = EXCLUDED.score_components,
    match_reasons = EXCLUDED.match_reasons,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 6. Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_rsvps_event_status ON rsvps(event_id, status, user_id);
CREATE INDEX idx_messages_conversation ON messages(
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id),
  sent_at DESC
);

-- Partial indexes for active data
CREATE INDEX idx_events_upcoming ON events(event_date)
  WHERE event_date > NOW() AND NOT is_cancelled;

CREATE INDEX idx_profiles_active_with_bio ON profiles(id)
  WHERE is_active = true AND bio_embedding IS NOT NULL;

-- Text search indexes
CREATE INDEX idx_profiles_bio_search ON profiles
  USING gin(to_tsvector('english', bio));
```
