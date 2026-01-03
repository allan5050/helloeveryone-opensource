# Supabase Configuration

This directory contains Supabase-related configuration and scripts for the HelloEveryone application.

## Structure

- `schema.sql` - Database schema definition
- `seed.sql` - Sample data for development
- `functions/` - PostgreSQL functions and triggers
- `migrations/` - Database migration scripts
- `policies/` - Row Level Security policies (deprecated - see migrations)

## Migration Files

### Active Migrations
- `migrations/20250106_fix_rls_infinite_recursion.sql` - Permanent fix for RLS infinite recursion issue

### Backup/Historical
- `migrations/20250106_initial_rls_fix_attempt.sql.bak` - Initial attempt (kept for reference)

## Recent Changes

### 2025-01-06: Fixed RLS Infinite Recursion
**Problem**: Multiple duplicate RLS policies caused infinite recursion when tables referenced each other.

**Solution**: 
- Dropped all 63 existing duplicate policies
- Created single, clean policies per operation
- Made profiles table universally readable to break recursion chains
- Used direct auth.uid() checks only

**Documentation**: See `../docs/rls-policies.md` for complete RLS policy documentation

## How to Apply Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Run the SQL script
5. Verify with the included verification query

## Best Practices

1. Always backup your database before running migrations
2. Test migrations in a development environment first
3. Keep migration files timestamped (YYYYMMDD format)
4. Document what each migration does
5. Never modify applied migrations - create new ones instead