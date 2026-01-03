# Supabase Migration Guide for HelloEveryone

## Quick Start

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/amarmxbvuzxakjzvntzv/sql/new
   - Sign in with your Supabase account

2. **Run Migrations**
   - Open the file: `combined-migrations.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" button

## Migration Order

The combined file includes these migrations in order:

1. Initial schema setup (tables, basic functions)
2. Match score function fixes
3. Constraint and function fixes
4. pgvector embeddings support
5. Event matching functions
6. Favorites table
7. RSVP handling
8. Performance indexes
9. Enhanced RLS policies

## Verification

After running migrations, verify:

- All tables exist (profiles, events, rsvps, etc.)
- pgvector extension is enabled
- Functions are created (calculate_match_score, etc.)
- Indexes are applied
- RLS policies are active

## Troubleshooting

If you get errors about:

- "already exists" - That's OK, the item was already created
- "permission denied" - Contact Supabase support to enable extensions
- "syntax error" - Check if you copied the entire file

## Alternative Method

Use the Supabase CLI:

```bash
# First, get an access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=your-token-here

# Link project
npx supabase link --project-ref amarmxbvuzxakjzvntzv

# Push migrations
npx supabase db push
```
