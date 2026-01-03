# Matching System Architecture

## Overview

Multi-dimensional matching system using semantic similarity, structured data, and mutual visibility
rules.

## Matching Dimensions & Weights

### Score Composition (100 points total)

1. **Bio Similarity** (30 points) - Semantic embeddings
2. **Interest Overlap** (40 points) - Exact + category matching
3. **Age Proximity** (20 points) - Gaussian distribution
4. **Activity Level** (10 points) - Engagement bonus

## Technical Implementation

### 1. Embedding Generation Pipeline

```typescript
// app/api/embeddings/route.ts (SERVER ONLY)
// Flow: User bio → OpenAI → Vector → Database

interface EmbeddingPipeline {
  // 1. Clean and prepare text
  preprocessBio(bio: string): string

  // 2. Generate embedding via OpenAI
  generateEmbedding(text: string): Float32Array

  // 3. Store in database
  storeEmbedding(userId: string, embedding: Float32Array): void
}
```

### 2. Database Schema for Matching

```sql
-- Profiles table with vector column
ALTER TABLE profiles ADD COLUMN bio_embedding vector(1536);

-- Structured interests as JSONB
ALTER TABLE profiles ADD COLUMN interests JSONB DEFAULT '{
  "music": [],      -- ["rock", "jazz", "electronic"]
  "food": [],       -- ["italian", "thai", "vegan"]
  "activities": [], -- ["reading", "hiking", "boardgames"]
  "languages": [],  -- ["english", "spanish", "mandarin"]
  "profession": "", -- "software engineer"
  "lifestyle": []   -- ["night-owl", "early-bird", "remote-work"]
}';

-- Materialized view for fast matching
CREATE MATERIALIZED VIEW user_match_cache AS
SELECT
  p1.id as user1_id,
  p2.id as user2_id,
  calculate_match_score(p1.id, p2.id) as score,
  calculate_match_reasons(p1.id, p2.id) as reasons
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.id < p2.id;

-- Refresh every hour
CREATE INDEX ON user_match_cache(user1_id, user2_id);
```

### 3. Matching Algorithm Components

#### A. Bio Similarity (30 points)

```sql
-- PostgreSQL function using pgvector
CREATE FUNCTION calculate_bio_similarity(user1_id UUID, user2_id UUID)
RETURNS FLOAT AS $$
DECLARE
  similarity FLOAT;
BEGIN
  SELECT 1 - (p1.bio_embedding <=> p2.bio_embedding) INTO similarity
  FROM profiles p1, profiles p2
  WHERE p1.id = user1_id AND p2.id = user2_id;

  RETURN similarity * 30; -- Scale to 30 points
END;
$$ LANGUAGE plpgsql;
```

#### B. Interest Overlap (40 points)

```javascript
// Scoring logic (runs in API route)
const interestScoring = {
  exactMatch: 10, // Same specific interest
  categoryMatch: 5, // Same category, different specific
  semanticSimilar: 3, // Related interests
}

// Interest taxonomy for fuzzy matching
const interestTaxonomy = {
  music: {
    rock: ['alternative', 'indie', 'punk'],
    electronic: ['house', 'techno', 'ambient'],
    jazz: ['blues', 'soul', 'funk'],
  },
  food: {
    asian: ['thai', 'japanese', 'korean', 'chinese'],
    european: ['italian', 'french', 'spanish'],
  },
}
```

#### C. Age Proximity (20 points)

```typescript
// Gaussian distribution for age scoring
function ageProximityScore(age1: number, age2: number): number {
  const diff = Math.abs(age1 - age2)
  const sigma = 5 // Standard deviation of 5 years

  // Gaussian formula: e^(-(diff^2)/(2*sigma^2))
  const score = Math.exp(-(diff * diff) / (2 * sigma * sigma))
  return score * 20 // Scale to 20 points
}
```

### 4. Privacy-Aware Matching

```sql
-- Mutual visibility function
CREATE FUNCTION check_mutual_visibility(
  user1_id UUID,
  user2_id UUID,
  field_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT
      p1.visible_fields->>field_name = 'true' AND
      p2.visible_fields->>field_name = 'true'
    FROM profiles p1, profiles p2
    WHERE p1.id = user1_id AND p2.id = user2_id
  );
END;
$$ LANGUAGE plpgsql;

-- Apply mutual visibility to matching
CREATE FUNCTION calculate_match_with_privacy(
  user1_id UUID,
  user2_id UUID
) RETURNS TABLE (
  score FLOAT,
  visible_reasons JSONB
) AS $$
DECLARE
  total_score FLOAT := 0;
  reasons JSONB := '{}';
BEGIN
  -- Only include age score if both show age
  IF check_mutual_visibility(user1_id, user2_id, 'age') THEN
    total_score := total_score + calculate_age_score(user1_id, user2_id);
    reasons := reasons || jsonb_build_object('age', 'similar age range');
  END IF;

  -- Always include bio similarity (public)
  total_score := total_score + calculate_bio_similarity(user1_id, user2_id);

  RETURN QUERY SELECT total_score, reasons;
END;
$$ LANGUAGE plpgsql;
```

### 5. Event-Specific Matching

```typescript
// app/api/match/event/route.ts
interface EventMatching {
  // Get all attendees
  async getAttendees(eventId: string): Promise<Profile[]>

  // Calculate matches for user at specific event
  async calculateEventMatches(userId: string, eventId: string): Promise<{
    topMatches: Match[]      // Top 5 people to meet
    reasons: MatchReason[]   // Why they match
    suggestedTime: string[]  // When to meet them
  }>

  // Notify about high-value matches
  async notifyHighMatches(threshold: number = 80): Promise<void>
}
```

### 6. Match Caching Strategy

```sql
-- Real-time matching for small sets (event attendees)
CREATE FUNCTION get_event_matches(
  user_id UUID,
  event_id UUID
) RETURNS TABLE (
  matched_user_id UUID,
  score FLOAT,
  reasons JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.user_id as matched_user_id,
    COALESCE(mc.score, calculate_match_score(user_id, r.user_id)) as score,
    mc.reasons
  FROM rsvps r
  LEFT JOIN user_match_cache mc ON
    (mc.user1_id = user_id AND mc.user2_id = r.user_id) OR
    (mc.user2_id = user_id AND mc.user1_id = r.user_id)
  WHERE r.event_id = get_event_matches.event_id
    AND r.user_id != user_id
    AND r.status = 'going'
  ORDER BY score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

### 7. Match Explanation System

```typescript
// Generate human-readable match explanations
interface MatchExplanation {
  percentage: number
  primaryReason: string // "You both love Italian food"
  secondaryReasons: string[] // ["Similar age", "Both new in town"]
  sharedInterests: string[]
  conversationStarters: string[] // Generated topics
}

// API endpoint returns sanitized explanations
// app/api/match/explain/route.ts
export async function GET(request: Request) {
  const { userId, matchedUserId } = parseParams(request)

  // Get match details from database
  const matchData = await getMatchData(userId, matchedUserId)

  // Generate explanations (server-side only)
  const explanation = generateExplanation(matchData)

  // Return only safe, user-friendly data
  return Response.json({
    match: {
      percentage: Math.round(matchData.score),
      reasons: explanation.publicReasons, // Sanitized
      sharedInterests: explanation.visibleInterests, // Mutual only
    },
  })
}
```

### 8. Performance Optimizations

```sql
-- Indexes for vector similarity search
CREATE INDEX ON profiles USING ivfflat (bio_embedding vector_cosine_ops)
WITH (lists = 100);

-- Partial index for active users only
CREATE INDEX idx_active_profiles ON profiles(id)
WHERE last_active > NOW() - INTERVAL '30 days';

-- Composite index for event matches
CREATE INDEX idx_event_attendees ON rsvps(event_id, user_id)
WHERE status = 'going';
```

### 9. Match Quality Metrics

```typescript
// Track match success for algorithm improvement
interface MatchMetrics {
  matchShown: number        // Times match was displayed
  profileViewed: number     // Click-through rate
  messageSent: number       // Engagement rate
  meetingScheduled: number  // Real-world success
  connectionMade: boolean   // Ultimate success metric
}

// Store in analytics table for ML training
CREATE TABLE match_analytics (
  id UUID PRIMARY KEY,
  user1_id UUID,
  user2_id UUID,
  score FLOAT,
  interaction_type TEXT,
  success BOOLEAN,
  created_at TIMESTAMP
);
```

## API Endpoints Design

### Core Matching Endpoints

```typescript
// All run server-side, hidden from users

// 1. Calculate matches for dashboard
POST   /api/match/calculate
Body:  { userId, limit: 10 }
Return: { matches: Match[], generated_at }

// 2. Get event-specific matches
GET    /api/match/event/[eventId]
Return: { topMatches: Match[], attendeeCount }

// 3. Explain specific match
GET    /api/match/explain?user1=[id]&user2=[id]
Return: { percentage, reasons, sharedInterests }

// 4. Update match feedback
POST   /api/match/feedback
Body:  { matchId, action: 'liked'|'met'|'blocked' }

// 5. Get match suggestions for event discovery
GET    /api/match/suggested-events
Return: { events: Event[], matchPotential: number[] }
```

## Security Considerations

1. **Rate Limiting**: Max 10 match calculations per minute
2. **Data Sanitization**: Never return raw embeddings or scores
3. **Mutual Consent**: Both users must be active to match
4. **Blocking**: Blocked users excluded from all matches
5. **Privacy**: Respect field-level visibility settings

## Testing Strategy

```typescript
// Test cases for matching algorithm

describe('Matching Algorithm', () => {
  test('Age proximity scoring', () => {
    expect(ageScore(30, 32)).toBeCloseTo(18, 1) // Close age
    expect(ageScore(25, 45)).toBeCloseTo(2, 1) // Far age
  })

  test('Mutual visibility enforcement', () => {
    // If user hides age, no age-based matching
    const user1 = { age: 30, visible_fields: { age: false } }
    const user2 = { age: 32, visible_fields: { age: true } }
    expect(calculateMatch(user1, user2).reasons).not.toContain('age')
  })

  test('Interest overlap calculation', () => {
    const user1 = { interests: { music: ['rock', 'jazz'] } }
    const user2 = { interests: { music: ['rock', 'blues'] } }
    expect(interestScore(user1, user2)).toBeGreaterThan(20)
  })
})
```
