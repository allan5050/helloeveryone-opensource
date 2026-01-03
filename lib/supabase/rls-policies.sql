-- RLS Policies for Privacy and Security

-- Enable RLS on blocks table
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see blocks where they are the blocker
CREATE POLICY "Users can view their own blocks" ON blocks
  FOR SELECT USING (auth.uid()::text = blocker_id);

-- Policy: Users can only create blocks where they are the blocker
CREATE POLICY "Users can create their own blocks" ON blocks
  FOR INSERT WITH CHECK (auth.uid()::text = blocker_id);

-- Policy: Users can only delete blocks where they are the blocker
CREATE POLICY "Users can delete their own blocks" ON blocks
  FOR DELETE USING (auth.uid()::text = blocker_id);

-- Enhanced profiles RLS to exclude blocked users
DROP POLICY IF EXISTS "Users can view non-blocked profiles" ON profiles;
CREATE POLICY "Users can view non-blocked profiles" ON profiles
  FOR SELECT USING (
    -- Allow users to see their own profile
    auth.uid()::text = id 
    OR 
    -- Allow viewing profiles if not blocked
    (
      NOT EXISTS (
        SELECT 1 FROM blocks 
        WHERE (blocker_id = auth.uid()::text AND blocked_id = profiles.id)
           OR (blocker_id = profiles.id AND blocked_id = auth.uid()::text)
      )
    )
  );

-- Enhanced match_scores RLS to exclude blocked users
DROP POLICY IF EXISTS "Users can view their own match scores" ON match_scores;
CREATE POLICY "Users can view their own match scores" ON match_scores
  FOR SELECT USING (
    (auth.uid()::text = user1_id OR auth.uid()::text = user2_id)
    AND
    -- Exclude matches with blocked users
    NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = user1_id AND blocked_id = user2_id)
         OR (blocker_id = user2_id AND blocked_id = user1_id)
    )
  );

-- Enhanced messages RLS to exclude blocked users and deleted messages
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id)
    AND is_deleted = false
    AND
    -- Exclude messages with blocked users
    NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = sender_id AND blocked_id = recipient_id)
         OR (blocker_id = recipient_id AND blocked_id = sender_id)
    )
  );

-- Policy: Users cannot send messages to blocked users
CREATE POLICY "Users cannot message blocked users" ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id
    AND
    NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = sender_id AND blocked_id = recipient_id)
         OR (blocker_id = recipient_id AND blocked_id = sender_id)
    )
  );

-- Enhanced favorites RLS to exclude blocked users
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (
    auth.uid()::text = user_id
    AND
    NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = user_id AND blocked_id = target_user_id)
         OR (blocker_id = target_user_id AND blocked_id = user_id)
    )
  );

CREATE POLICY "Users can create their own favorites" ON favorites
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id
    AND
    NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = user_id AND blocked_id = target_user_id)
         OR (blocker_id = target_user_id AND blocked_id = user_id)
    )
  );

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid()::text = user_id);

-- Enhanced RSVPs RLS to handle blocked users at events
DROP POLICY IF EXISTS "Users can view event RSVPs" ON rsvps;
CREATE POLICY "Users can view event RSVPs" ON rsvps
  FOR SELECT USING (
    -- Users can see their own RSVPs
    auth.uid()::text = user_id
    OR
    -- Users can see RSVPs for events they've RSVPed to (excluding blocked users)
    (
      EXISTS (
        SELECT 1 FROM rsvps user_rsvp 
        WHERE user_rsvp.event_id = rsvps.event_id 
        AND user_rsvp.user_id = auth.uid()::text
        AND user_rsvp.status IN ('attending', 'maybe')
      )
      AND
      NOT EXISTS (
        SELECT 1 FROM blocks 
        WHERE (blocker_id = auth.uid()::text AND blocked_id = rsvps.user_id)
           OR (blocker_id = rsvps.user_id AND blocked_id = auth.uid()::text)
      )
    )
  );

-- Function to check mutual visibility for database-level enforcement
CREATE OR REPLACE FUNCTION check_mutual_visibility(
  user1_id TEXT,
  user2_id TEXT,
  field_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user1_visibility BOOLEAN;
  user2_visibility BOOLEAN;
BEGIN
  -- Get visibility settings for both users
  SELECT (visibility_settings->>field_name)::BOOLEAN 
  INTO user1_visibility
  FROM profiles 
  WHERE id = user1_id;
  
  SELECT (visibility_settings->>field_name)::BOOLEAN 
  INTO user2_visibility
  FROM profiles 
  WHERE id = user2_id;
  
  -- Return true only if both users allow visibility for this field
  RETURN COALESCE(user1_visibility, false) AND COALESCE(user2_visibility, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get filtered profile based on mutual visibility
CREATE OR REPLACE FUNCTION get_filtered_profile(
  requesting_user_id TEXT,
  target_user_id TEXT
) RETURNS JSON AS $$
DECLARE
  requesting_visibility JSON;
  target_visibility JSON;
  target_profile JSON;
  filtered_profile JSON;
BEGIN
  -- Check if users are blocked
  IF EXISTS (
    SELECT 1 FROM blocks 
    WHERE (blocker_id = requesting_user_id AND blocked_id = target_user_id)
       OR (blocker_id = target_user_id AND blocked_id = requesting_user_id)
  ) THEN
    RETURN NULL;
  END IF;
  
  -- Get profiles and visibility settings
  SELECT visibility_settings INTO requesting_visibility
  FROM profiles WHERE id = requesting_user_id;
  
  SELECT row_to_json(profiles.*), visibility_settings 
  INTO target_profile, target_visibility
  FROM profiles WHERE id = target_user_id;
  
  -- Start with basic profile info (always visible)
  filtered_profile := json_build_object(
    'id', target_profile->>'id',
    'display_name', target_profile->>'display_name',
    'profile_image_url', target_profile->>'profile_image_url',
    'created_at', target_profile->>'created_at',
    'updated_at', target_profile->>'updated_at'
  );
  
  -- Add fields based on mutual visibility
  IF COALESCE((requesting_visibility->>'age')::BOOLEAN, false) 
     AND COALESCE((target_visibility->>'age')::BOOLEAN, false) THEN
    filtered_profile := filtered_profile || json_build_object(
      'age', target_profile->>'age',
      'birth_date', target_profile->>'birth_date'
    );
  END IF;
  
  IF COALESCE((requesting_visibility->>'location')::BOOLEAN, false) 
     AND COALESCE((target_visibility->>'location')::BOOLEAN, false) THEN
    filtered_profile := filtered_profile || json_build_object(
      'city', target_profile->>'city',
      'state', target_profile->>'state',
      'location_coordinates', target_profile->>'location_coordinates'
    );
  END IF;
  
  -- Add other fields following the same pattern...
  -- (occupation, education, interests, bio, etc.)
  
  RETURN filtered_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_blocker ON blocks(blocked_id, blocker_id);
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles USING GIN(visibility_settings);