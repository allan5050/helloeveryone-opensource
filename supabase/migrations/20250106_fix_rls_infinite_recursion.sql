-- PERMANENT FIX FOR RLS INFINITE RECURSION
-- This script completely removes ALL existing policies and creates a clean, non-recursive policy structure

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES BY EXACT NAME
-- ============================================

-- Drop all policies on blocks table
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "admin_full_access_blocks" ON public.blocks;
DROP POLICY IF EXISTS "blocks_delete" ON public.blocks;
DROP POLICY IF EXISTS "blocks_insert" ON public.blocks;
DROP POLICY IF EXISTS "blocks_select" ON public.blocks;

-- Drop all policies on events table
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON public.events;
DROP POLICY IF EXISTS "Event creators can update their events" ON public.events;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "admin_full_access_events" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;

-- Drop all policies on favorites table
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "admin_full_access_favorites" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select" ON public.favorites;

-- Drop all policies on match_scores table
DROP POLICY IF EXISTS "Users can view their own match scores" ON public.match_scores;
DROP POLICY IF EXISTS "admin_view_all_match_scores" ON public.match_scores;
DROP POLICY IF EXISTS "match_scores_insert" ON public.match_scores;
DROP POLICY IF EXISTS "match_scores_select" ON public.match_scores;
DROP POLICY IF EXISTS "match_scores_update" ON public.match_scores;

-- Drop all policies on meeting_slots table
DROP POLICY IF EXISTS "Users can create meeting slots they're part of" ON public.meeting_slots;
DROP POLICY IF EXISTS "Users can delete their meeting slots" ON public.meeting_slots;
DROP POLICY IF EXISTS "Users can update their meeting slots" ON public.meeting_slots;
DROP POLICY IF EXISTS "Users can view their own meeting slots" ON public.meeting_slots;
DROP POLICY IF EXISTS "admin_full_access_meeting_slots" ON public.meeting_slots;
DROP POLICY IF EXISTS "meeting_slots_delete" ON public.meeting_slots;
DROP POLICY IF EXISTS "meeting_slots_insert" ON public.meeting_slots;
DROP POLICY IF EXISTS "meeting_slots_select" ON public.meeting_slots;
DROP POLICY IF EXISTS "meeting_slots_update" ON public.meeting_slots;

-- Drop all policies on messages table
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "admin_view_all_messages" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

-- Drop all policies on profiles table
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_full_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Drop all policies on rsvps table
DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON public.rsvps;
DROP POLICY IF EXISTS "Users can manage their own RSVPs" ON public.rsvps;
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON public.rsvps;
DROP POLICY IF EXISTS "Users can view RSVPs for events they're attending" ON public.rsvps;
DROP POLICY IF EXISTS "admin_full_access_rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_delete" ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_insert" ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_select" ON public.rsvps;
DROP POLICY IF EXISTS "rsvps_update" ON public.rsvps;

-- ============================================
-- STEP 2: VERIFY RLS IS ENABLED
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE CLEAN, NON-RECURSIVE POLICIES
-- ============================================

-- PROFILES: Open read access to prevent recursion
CREATE POLICY "allow_select_profiles" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "allow_insert_own_profile" ON public.profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_own_profile" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_delete_own_profile" ON public.profiles
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- EVENTS: Simple policies without profile checks
CREATE POLICY "allow_select_active_events" ON public.events
    FOR SELECT 
    TO authenticated
    USING (is_active = true);

CREATE POLICY "allow_insert_events" ON public.events
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "allow_update_own_events" ON public.events
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "allow_delete_own_events" ON public.events
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = created_by);

-- RSVPS: Direct auth checks only
CREATE POLICY "allow_select_rsvps" ON public.rsvps
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR 
        event_id IN (
            SELECT id FROM public.events 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "allow_insert_own_rsvp" ON public.rsvps
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_own_rsvp" ON public.rsvps
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_delete_own_rsvp" ON public.rsvps
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- MATCH_SCORES: View only for involved users
CREATE POLICY "allow_select_own_matches" ON public.match_scores
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = user_id_1 
        OR 
        auth.uid() = user_id_2
    );

-- System/admin operations for match_scores should be done via service role
CREATE POLICY "allow_system_insert_matches" ON public.match_scores
    FOR INSERT 
    TO authenticated
    WITH CHECK (false); -- Only service role can insert

CREATE POLICY "allow_system_update_matches" ON public.match_scores
    FOR UPDATE 
    TO authenticated
    USING (false); -- Only service role can update

-- MESSAGES: Simple sender/recipient checks
CREATE POLICY "allow_select_own_messages" ON public.messages
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = sender_id 
        OR 
        auth.uid() = recipient_id
    );

CREATE POLICY "allow_insert_messages" ON public.messages
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "allow_update_recent_messages" ON public.messages
    FOR UPDATE 
    TO authenticated
    USING (
        auth.uid() = sender_id 
        AND 
        created_at > (NOW() - INTERVAL '5 minutes')
    )
    WITH CHECK (auth.uid() = sender_id);

-- FAVORITES: Simple user checks
CREATE POLICY "allow_select_own_favorites" ON public.favorites
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_favorites" ON public.favorites
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_delete_own_favorites" ON public.favorites
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- BLOCKS: Only blocker can see/manage
CREATE POLICY "allow_select_own_blocks" ON public.blocks
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = blocker_id);

CREATE POLICY "allow_insert_own_blocks" ON public.blocks
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "allow_delete_own_blocks" ON public.blocks
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = blocker_id);

-- MEETING_SLOTS: Participants can manage
CREATE POLICY "allow_select_meeting_slots" ON public.meeting_slots
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = user_id_1 
        OR 
        auth.uid() = user_id_2
    );

CREATE POLICY "allow_insert_meeting_slots" ON public.meeting_slots
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id_1 
        OR 
        auth.uid() = user_id_2
    );

CREATE POLICY "allow_update_meeting_slots" ON public.meeting_slots
    FOR UPDATE 
    TO authenticated
    USING (
        auth.uid() = user_id_1 
        OR 
        auth.uid() = user_id_2
    )
    WITH CHECK (
        auth.uid() = user_id_1 
        OR 
        auth.uid() = user_id_2
    );

CREATE POLICY "allow_delete_meeting_slots" ON public.meeting_slots
    FOR DELETE 
    TO authenticated
    USING (
        auth.uid() = user_id_1 
        OR 
        auth.uid() = user_id_2
    );

-- ============================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- STEP 5: VERIFICATION
-- ============================================

-- This query should show ONLY the new policies, one per operation per table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Expected result: Each table should have at most 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- and no duplicate policies with different names for the same operation