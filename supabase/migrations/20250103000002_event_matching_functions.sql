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