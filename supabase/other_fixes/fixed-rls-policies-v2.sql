-- Fixed RLS Policies for HelloEveryone
-- Compatible with existing schema using role enum ('user', 'admin')

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Clean up any problematic policies that reference is_admin
DO $$
BEGIN
  -- Drop policies that might reference is_admin
  DROP POLICY IF EXISTS "Admin users have full access to profiles" ON profiles;
  DROP POLICY IF EXISTS "Admin users have full access to events" ON events;
  DROP POLICY IF EXISTS "Admin users have full access to rsvps" ON rsvps;
  DROP POLICY IF EXISTS "Admin users have full access to match_scores" ON match_scores;
  DROP POLICY IF EXISTS "Admin users have full access to messages" ON messages;
  DROP POLICY IF EXISTS "Admin role can manage all profiles" ON profiles;
  DROP POLICY IF EXISTS "Admin role can manage all events" ON events;
  DROP POLICY IF EXISTS "Admin role can manage all rsvps" ON rsvps;
  DROP POLICY IF EXISTS "Admin role can manage all favorites" ON favorites;
  DROP POLICY IF EXISTS "Admin role can manage all meeting slots" ON meeting_slots;
  DROP POLICY IF EXISTS "Admin role can manage all blocks" ON blocks;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if policies don't exist
END $$;

-- Create admin policies using the correct role enum
-- These policies allow admin users to bypass restrictions

-- Profiles: Admin full access
CREATE POLICY "admin_full_access_profiles" ON profiles
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Events: Admin full access
CREATE POLICY "admin_full_access_events" ON events
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- RSVPs: Admin full access
CREATE POLICY "admin_full_access_rsvps" ON rsvps
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Match scores: Admin can view all
CREATE POLICY "admin_view_all_match_scores" ON match_scores
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Messages: Admin can view all
CREATE POLICY "admin_view_all_messages" ON messages
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Favorites: Admin full access  
CREATE POLICY "admin_full_access_favorites" ON favorites
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Meeting slots: Admin full access
CREATE POLICY "admin_full_access_meeting_slots" ON meeting_slots
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Blocks: Admin full access
CREATE POLICY "admin_full_access_blocks" ON blocks
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add helpful comment
COMMENT ON COLUMN profiles.role IS 'User role: "user" (default) or "admin" for administrative access';

-- Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Update one user to admin for testing (optional - comment out if not needed)
-- UPDATE profiles 
-- SET role = 'admin'::user_role 
-- WHERE display_name = 'Alice Johnson' 
-- LIMIT 1;