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