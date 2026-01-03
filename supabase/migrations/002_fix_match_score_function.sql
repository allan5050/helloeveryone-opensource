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