-- Fixed RLS Policies for HelloEveryone
-- Uses the actual schema with 'role' column instead of 'is_admin'

-- First, ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Admin users have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users have full access to events" ON events;
DROP POLICY IF EXISTS "Admin users have full access to rsvps" ON rsvps;
DROP POLICY IF EXISTS "Admin users have full access to match_scores" ON match_scores;
DROP POLICY IF EXISTS "Admin users have full access to messages" ON messages;

-- Profiles policies (keep existing ones, add admin access using role)
-- Admin access for profiles (using role = 'admin')
CREATE POLICY "Admin role can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Events policies with admin access
CREATE POLICY "Admin role can manage all events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RSVPs policies with admin access
CREATE POLICY "Admin role can manage all rsvps" ON rsvps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Match scores - ensure privacy except for admins
DROP POLICY IF EXISTS "Users can view their own match scores" ON match_scores;
CREATE POLICY "Users can view their own match scores" ON match_scores
  FOR SELECT USING (
    profile1_id = auth.uid() 
    OR profile2_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Messages - ensure privacy except for admins
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Favorites - already has good policies, add admin access
CREATE POLICY "Admin role can manage all favorites" ON favorites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Meeting slots - add admin access
CREATE POLICY "Admin role can manage all meeting slots" ON meeting_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Blocks - add admin access
CREATE POLICY "Admin role can manage all blocks" ON blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comment to document the role system
COMMENT ON COLUMN profiles.role IS 'User role: can be "user" (default) or "admin" for administrative access';