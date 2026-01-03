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