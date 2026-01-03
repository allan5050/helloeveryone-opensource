-- Test data insertion script
-- This script inserts sample data to verify all tables and functions work correctly

-- Insert test profiles with sample embeddings (using random vectors for testing)
INSERT INTO profiles (user_id, display_name, bio, age, location, interests, embedding) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Alice Johnson',
    'Love hiking, photography, and good coffee. Always up for outdoor adventures!',
    28,
    'San Francisco, CA',
    ARRAY['hiking', 'photography', 'coffee', 'outdoors', 'travel'],
    -- Sample embedding vector (1536 dimensions with small random values)
    (SELECT ARRAY_AGG(random() * 0.2 - 0.1)::FLOAT[]::VECTOR(1536) FROM generate_series(1, 1536))
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Bob Smith',
    'Software engineer who loves rock climbing and craft beer. Always learning something new.',
    32,
    'San Francisco, CA',
    ARRAY['climbing', 'beer', 'technology', 'coding', 'music'],
    (SELECT ARRAY_AGG(random() * 0.2 - 0.1)::FLOAT[]::VECTOR(1536) FROM generate_series(1, 1536))
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Charlie Davis',
    'Foodie and yoga enthusiast. Looking to explore the city and meet like-minded people.',
    26,
    'Oakland, CA',
    ARRAY['yoga', 'food', 'meditation', 'cooking', 'health'],
    (SELECT ARRAY_AGG(random() * 0.2 - 0.1)::FLOAT[]::VECTOR(1536) FROM generate_series(1, 1536))
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Diana Wilson',
    'Artist and book lover. Enjoys quiet cafes, art galleries, and deep conversations.',
    30,
    'Berkeley, CA',
    ARRAY['art', 'books', 'painting', 'literature', 'coffee'],
    (SELECT ARRAY_AGG(random() * 0.2 - 0.1)::FLOAT[]::VECTOR(1536) FROM generate_series(1, 1536))
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    'Eve Chen',
    'Marathon runner and fitness coach. Love helping others achieve their health goals.',
    29,
    'San Jose, CA',
    ARRAY['running', 'fitness', 'health', 'coaching', 'nutrition'],
    (SELECT ARRAY_AGG(random() * 0.2 - 0.1)::FLOAT[]::VECTOR(1536) FROM generate_series(1, 1536))
);

-- Insert test events
INSERT INTO events (id, title, description, location, start_time, end_time, max_attendees, created_by) VALUES
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Photography Meetup in Golden Gate Park',
    'Join us for a morning photography walk through Golden Gate Park. All skill levels welcome!',
    'Golden Gate Park, San Francisco',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
    20,
    '550e8400-e29b-41d4-a716-446655440001'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    'Tech Networking Happy Hour',
    'Casual networking event for Bay Area tech professionals. Great craft beer and conversation!',
    'The Social Study, San Francisco',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '10 days' + INTERVAL '4 hours',
    50,
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    'Morning Yoga in the Park',
    'Start your weekend with a peaceful yoga session in beautiful Dolores Park.',
    'Dolores Park, San Francisco',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days' + INTERVAL '90 minutes',
    15,
    '550e8400-e29b-41d4-a716-446655440003'
),
(
    '660e8400-e29b-41d4-a716-446655440004',
    'Book Club: Contemporary Fiction',
    'Monthly book discussion over coffee. This month: "The Seven Husbands of Evelyn Hugo"',
    'Blue Bottle Coffee, Oakland',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days' + INTERVAL '2 hours',
    12,
    '550e8400-e29b-41d4-a716-446655440004'
),
(
    '660e8400-e29b-41d4-a716-446655440005',
    'Bay Area Running Group',
    'Weekly 5K run along the Embarcadero. All paces welcome!',
    'Embarcadero, San Francisco',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days' + INTERVAL '1 hour',
    25,
    '550e8400-e29b-41d4-a716-446655440005'
);

-- Insert RSVPs (create attendance for events)
INSERT INTO rsvps (event_id, user_id, status) VALUES
-- Photography event attendees
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'going'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'going'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'maybe'),

-- Tech networking attendees
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'going'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'going'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'maybe'),

-- Yoga event attendees
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'going'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'going'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'going'),

-- Book club attendees
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'going'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'maybe'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'going'),

-- Running group attendees
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'going'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'going'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'maybe');

-- Insert some favorites
INSERT INTO favorites (user_id, favorited_user_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001');

-- Insert test messages
INSERT INTO messages (sender_id, recipient_id, event_id, content) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440004',
    '660e8400-e29b-41d4-a716-446655440001',
    'Hi! I saw you''re interested in the photography meetup. Are you bringing any specific equipment?'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'Hello! Yes, I''ll have my DSLR and a few lenses. Looking forward to meeting you there!'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440005',
    '660e8400-e29b-41d4-a716-446655440002',
    'Hey! Noticed we''re both going to the tech meetup. What area of tech are you in?'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '660e8400-e29b-41d4-a716-446655440003',
    'Looking forward to the yoga session! Have you been to this instructor before?'
);

-- Insert a test block (to verify blocking functionality)
INSERT INTO blocks (blocker_id, blocked_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003');

-- Insert test meeting slots
INSERT INTO meeting_slots (event_id, user_id_1, user_id_2, proposed_time, location, notes) VALUES
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440004',
    NOW() + INTERVAL '7 days' - INTERVAL '30 minutes',
    'Golden Gate Park Entrance',
    'Meet 30 minutes before the main event to scout locations'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440005',
    NOW() + INTERVAL '10 days' + INTERVAL '2 hours',
    'The Social Study Bar Area',
    'Continue conversation over drinks after main networking'
);

-- Test the calculate_match_score function
SELECT 
    'Testing match score calculation:' as test_description,
    calculate_match_score(
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        '550e8400-e29b-41d4-a716-446655440004'::UUID,
        '660e8400-e29b-41d4-a716-446655440001'::UUID
    ) as match_score;

-- Test the get_event_matches function
SELECT 
    'Testing event matches for Alice at Photography Meetup:' as test_description;

SELECT * FROM get_event_matches(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    '660e8400-e29b-41d4-a716-446655440001'::UUID,
    5
);

-- Verify data was inserted correctly
SELECT 
    'Data verification:' as test_section,
    'Total profiles: ' || COUNT(*) as profile_count
FROM profiles;

SELECT 
    'Total events: ' || COUNT(*) as event_count
FROM events;

SELECT 
    'Total RSVPs: ' || COUNT(*) as rsvp_count
FROM rsvps;

SELECT 
    'Total messages: ' || COUNT(*) as message_count
FROM messages;

SELECT 
    'Total favorites: ' || COUNT(*) as favorite_count
FROM favorites;

SELECT 
    'Total blocks: ' || COUNT(*) as block_count
FROM blocks;

SELECT 
    'Total meeting slots: ' || COUNT(*) as meeting_slot_count
FROM meeting_slots;

-- Test vector similarity search
SELECT 
    'Testing vector similarity search:' as test_description,
    p1.display_name as user1,
    p2.display_name as user2,
    1 - (p1.embedding <=> p2.embedding) as cosine_similarity
FROM profiles p1, profiles p2
WHERE p1.user_id = '550e8400-e29b-41d4-a716-446655440001'
  AND p2.user_id != p1.user_id
ORDER BY cosine_similarity DESC
LIMIT 3;

-- Test interest overlap query
SELECT 
    'Testing interest overlap:' as test_description,
    p1.display_name as user1,
    p2.display_name as user2,
    p1.interests as user1_interests,
    p2.interests as user2_interests,
    (
        SELECT COUNT(*)::FLOAT / 
               GREATEST(
                   (SELECT COUNT(DISTINCT unnest) FROM unnest(p1.interests || p2.interests)),
                   1
               )
        FROM (
            SELECT unnest(p1.interests)
            INTERSECT
            SELECT unnest(p2.interests)
        ) as common_interests
    ) as interest_similarity
FROM profiles p1, profiles p2
WHERE p1.user_id = '550e8400-e29b-41d4-a716-446655440001'
  AND p2.user_id != p1.user_id
ORDER BY interest_similarity DESC;

-- Show that blocking prevents matches
SELECT 
    'Testing blocking functionality:' as test_description,
    'Alice should not see Charlie in matches due to block';

SELECT * FROM get_event_matches(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,  -- Alice
    '660e8400-e29b-41d4-a716-446655440003'::UUID,  -- Yoga event (where Charlie is attending)
    10
);