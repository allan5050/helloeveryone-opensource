-- Enhanced Row Level Security Policies
-- This migration adds comprehensive RLS policies for all tables

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Enhanced profiles policies
CREATE POLICY "Public profiles viewable by authenticated users" ON profiles
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update user profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

-- Events policies
CREATE POLICY "Published events viewable by authenticated users" ON events
    FOR SELECT TO authenticated
    USING (is_published = true OR created_by = auth.uid());

CREATE POLICY "Admins can view all events" ON events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

CREATE POLICY "Users can create events" ON events
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all events" ON events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

-- RSVPs policies
CREATE POLICY "Users can view RSVPs for events they're attending" ON rsvps
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM rsvps my_rsvp 
            WHERE my_rsvp.event_id = rsvps.event_id 
            AND my_rsvp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own RSVPs" ON rsvps
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all RSVPs" ON rsvps
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.is_admin = true
        )
    );

-- Match scores policies (privacy-sensitive)
CREATE POLICY "Users can view their own match scores" ON match_scores
    FOR SELECT TO authenticated
    USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "System can insert match scores" ON match_scores
    FOR INSERT TO authenticated
    WITH CHECK (true); -- Computed by system functions

CREATE POLICY "System can update match scores" ON match_scores
    FOR UPDATE TO authenticated
    USING (true) -- Computed by system functions
    WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT TO authenticated
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        sender_id != recipient_id AND
        NOT EXISTS (
            SELECT 1 FROM blocks 
            WHERE (blocker_id = recipient_id AND blocked_id = sender_id)
               OR (blocker_id = sender_id AND blocked_id = recipient_id)
        )
    );

CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their messages" ON messages
    FOR DELETE TO authenticated
    USING (sender_id = auth.uid());

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid() AND user_id != favorited_user_id);

-- Meeting slots policies
CREATE POLICY "Users can view their meeting slots" ON meeting_slots
    FOR SELECT TO authenticated
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create meeting slots" ON meeting_slots
    FOR INSERT TO authenticated
    WITH CHECK (
        (user1_id = auth.uid() OR user2_id = auth.uid()) AND
        user1_id != user2_id
    );

CREATE POLICY "Users can update their meeting slots" ON meeting_slots
    FOR UPDATE TO authenticated
    USING (user1_id = auth.uid() OR user2_id = auth.uid())
    WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Blocks policies
CREATE POLICY "Users can view their blocks" ON blocks
    FOR SELECT TO authenticated
    USING (blocker_id = auth.uid());

CREATE POLICY "Users can manage their blocks" ON blocks
    FOR ALL TO authenticated
    USING (blocker_id = auth.uid())
    WITH CHECK (blocker_id = auth.uid() AND blocker_id != blocked_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rsvps TO authenticated;
GRANT SELECT ON match_scores TO authenticated;
GRANT INSERT, UPDATE ON match_scores TO service_role; -- For system functions
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meeting_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blocks TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION calculate_match_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_matches TO authenticated;
GRANT EXECUTE ON FUNCTION handle_rsvp TO authenticated;