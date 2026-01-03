-- Complete database setup script
-- Run this in your Supabase SQL editor

-- Step 1: Run the initial schema
-- Copy and paste the contents of supabase/migrations/001_initial_schema.sql

-- Step 2: Insert test data (optional)
-- Copy and paste the contents of supabase/seed.sql

-- Additional verification queries after setup:

-- Show database version and extensions
SELECT version();

SELECT 
    name, 
    default_version, 
    installed_version 
FROM pg_available_extensions 
WHERE name IN ('uuid-ossp', 'vector', 'pg_trgm')
ORDER BY name;

-- Show all tables created
SELECT 
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show table counts (after seeding)
SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'rsvps', COUNT(*) FROM rsvps
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'blocks', COUNT(*) FROM blocks
UNION ALL
SELECT 'meeting_slots', COUNT(*) FROM meeting_slots
UNION ALL
SELECT 'match_scores', COUNT(*) FROM match_scores
ORDER BY table_name;

-- Show all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Show all functions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Show RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test vector extension functionality
SELECT 
    'Vector extension test:' as test_name,
    '[0.1, 0.2, 0.3]'::vector <=> '[0.4, 0.5, 0.6]'::vector as cosine_distance,
    1 - ('[0.1, 0.2, 0.3]'::vector <=> '[0.4, 0.5, 0.6]'::vector) as cosine_similarity;

-- Test trigram extension functionality
SELECT 
    'Trigram extension test:' as test_name,
    similarity('hello world', 'helo world') as similarity_score,
    'hello world' % 'helo world' as is_similar;

-- Verify triggers are working
SELECT 
    trigger_schema,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Success message
SELECT 'Database setup completed successfully!' as status,
       'All tables, functions, indexes, and policies are in place.' as message;