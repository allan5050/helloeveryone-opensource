# Database Setup Guide

## Complete Supabase Database Setup Instructions

NOTE: you can use MCP tools to directly query Supabase to get the latest info because this document might go out of date (see 'C:\Users\Allan\source\repos\helloeveryone\mcp')

### Prerequisites

- Supabase project created
- Access to Supabase SQL editor

### Setup Order (IMPORTANT - Follow this exact sequence)

#### Step 1: Initial Schema Setup

Run the contents of `/supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

This creates:

- All required extensions (uuid-ossp, vector, pg_trgm)
- All 8 core tables (profiles, events, rsvps, match_scores, messages, favorites, blocks,
  meeting_slots)
- All necessary indexes including IVFFlat for vector search
- Row Level Security policies

#### Step 2: Apply Function Fixes

Run the contents of `/supabase/migrations/002_fix_match_score_function.sql`

This fixes variable naming conflicts in the match score calculation.

#### Step 3: Apply Constraint Updates

Run the contents of `/supabase/migrations/003_fix_constraints_and_function.sql`

This ensures:

- Constraints properly handle the full range of cosine similarity (-1 to 1)
- Functions return normalized scores (0 to 1) for display
- Proper handling of edge cases

#### Step 4: (Optional) Insert Test Data

If you want to test with sample data, run `/supabase/seed_fixed.sql`

This adds:

- 5 test user profiles with normalized embeddings
- 5 sample events
- Test RSVPs, messages, favorites, and blocks
- Verification queries to confirm setup

### Files Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql       # Core database setup
│   ├── 002_fix_match_score_function.sql  # Function fixes
│   └── 003_fix_constraints_and_function.sql  # Constraint updates
└── seed_fixed.sql                   # Test data (optional)

scripts/
└── setup-database.sql               # Verification queries
```

## Why SQL-Side Matching?

### Performance Benefits

1. **Data Locality**
   - Computing 100 matches: SQL = 1 query, TypeScript = 100+ queries
   - No network round trips for vector operations

2. **Vector Operations**
   - pgvector (C implementation) is 10-100x faster than JavaScript
   - Hardware-optimized SIMD instructions for 1536-dimension vectors
   - IVFFlat indexing enables sub-linear search time

3. **Caching**
   - Match scores cached in `match_scores` table for 24 hours
   - Avoids recomputing expensive vector operations
   - Database-level query result caching

4. **Scalability**
   - Leverages PostgreSQL's parallel query execution
   - Connection pooling and prepared statements
   - Can scale vertically with more powerful database instances

5. **Security**
   - RLS policies ensure users only see allowed matches
   - No need to filter blocked users in application code
   - Matching algorithm hidden from client-side inspection

### When to Use TypeScript Instead

- Complex business logic that changes frequently
- Integration with external APIs (OpenAI embeddings)
- UI-specific transformations
- Real-time calculations that don't need persistence
- A/B testing different matching algorithms

## Key Database Features

### Vector Similarity Search

- Uses pgvector extension for efficient cosine similarity
- IVFFlat index with 100 lists for fast approximate nearest neighbor search
- Handles 1536-dimension OpenAI embeddings

### Matching Algorithm

- **70% semantic similarity** from embeddings
- **30% interest overlap** from structured data
- Results cached for 24 hours
- Mutual blocking prevention built-in

### Security

- Row Level Security (RLS) enabled on all tables
- Mutual visibility rules enforced at database level
- SECURITY DEFINER functions for sensitive operations

### Performance Optimizations

- Composite indexes for common query patterns
- Partial indexes for active data only
- GIN indexes for JSON and array operations
- Trigram indexes for fuzzy text search

## Testing the Setup

After running all migrations, you can verify with:

```sql
-- Check extensions
SELECT name, installed_version
FROM pg_available_extensions
WHERE name IN ('uuid-ossp', 'vector', 'pg_trgm');

-- Check tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Test vector operations
SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector as distance;

-- Test match scoring (after seeding)
SELECT calculate_match_score(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    '550e8400-e29b-41d4-a716-446655440004'::UUID
);
```

## Troubleshooting

### Common Issues

1. **"extension vector does not exist"**
   - Enable pgvector in Supabase dashboard under Database > Extensions

2. **Negative match scores**
   - Make sure you've run migration 003 to fix constraints
   - Clear match_scores table: `TRUNCATE match_scores;`

3. **"violates check constraint"**
   - Ensure you're using properly normalized vectors
   - Run seed_fixed.sql instead of original seed.sql

## Next Steps

Once database is set up:

1. Update `.env` with your Supabase credentials
2. Test API routes that interact with the database
3. Implement OpenAI embedding generation for real user profiles
4. Set up periodic match cache refresh (cron job or Edge Function)
