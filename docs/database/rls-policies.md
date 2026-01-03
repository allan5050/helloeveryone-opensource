# Row Level Security (RLS) Policies Documentation

## Overview
This document describes the Row Level Security policies implemented for the HelloEveryone application. These policies control data access at the database level, ensuring users can only access and modify their own data.

## Policy Design Principles

### 1. Prevent Infinite Recursion
- **Profiles table has open SELECT access** for all authenticated users
- Policies use direct `auth.uid()` checks without cross-table joins
- Each table has exactly one policy per operation (SELECT, INSERT, UPDATE, DELETE)
- No duplicate policies that could create OR conditions leading to recursion

### 2. Security by Default
- All tables have RLS enabled
- Users can only modify their own data
- Read access is controlled based on relationships

## Table-by-Table Policy Breakdown

### profiles
- **SELECT**: All authenticated users can view all profiles (prevents recursion)
- **INSERT**: Users can only insert their own profile (user_id = auth.uid())
- **UPDATE**: Users can only update their own profile
- **DELETE**: Users can only delete their own profile

### events
- **SELECT**: All authenticated users can view active events (is_active = true)
- **INSERT**: Users can create events (created_by = auth.uid())
- **UPDATE**: Only event creators can update their events
- **DELETE**: Only event creators can delete their events

### rsvps
- **SELECT**: Users can view their own RSVPs or RSVPs for events they created
- **INSERT**: Users can create RSVPs for themselves
- **UPDATE**: Users can update their own RSVPs
- **DELETE**: Users can delete their own RSVPs

### match_scores
- **SELECT**: Users can view matches where they are involved (user_id_1 or user_id_2)
- **INSERT**: Disabled for users (false) - only service role can insert
- **UPDATE**: Disabled for users (false) - only service role can update

### messages
- **SELECT**: Users can view messages they sent or received
- **INSERT**: Users can send messages (sender_id = auth.uid())
- **UPDATE**: Users can edit their messages within 5 minutes of sending

### favorites
- **SELECT**: Users can view their own favorites
- **INSERT**: Users can add favorites for themselves
- **DELETE**: Users can remove their own favorites

### blocks
- **SELECT**: Users can view their own block list
- **INSERT**: Users can block other users
- **DELETE**: Users can unblock users

### meeting_slots
- **SELECT**: Participants can view their meeting slots
- **INSERT**: Participants can create meeting slots
- **UPDATE**: Participants can update meeting slots
- **DELETE**: Participants can delete meeting slots

## Migration History

### 2025-01-06: Fixed RLS Infinite Recursion
**Problem**: Multiple duplicate policies with different naming conventions caused infinite recursion when events table tried to join profiles table.

**Solution**: 
1. Dropped all 63 existing policies by exact name
2. Created single, clean policies with consistent naming (allow_[operation]_[table])
3. Made profiles universally readable to break recursion chains
4. Used only direct auth.uid() checks without cross-table profile lookups

**Migration file**: `supabase/migrations/20250106_fix_rls_infinite_recursion.sql`

## Testing RLS Policies

To verify policies are working correctly:

```sql
-- Check current policies
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

Expected: Each table should have at most 4 policies (one per operation).

## Troubleshooting

### Infinite Recursion Errors
If you encounter "infinite recursion detected in policy for relation" errors:
1. Check for duplicate policies on the same table
2. Ensure profiles table has open SELECT access
3. Avoid policies that reference other tables with their own complex policies
4. Use the migration script to reset all policies

### Permission Denied Errors
If users can't access data they should be able to:
1. Verify RLS is enabled on the table
2. Check that appropriate policies exist
3. Ensure auth.uid() is properly set in the session
4. Review policy conditions match your business logic

## Best Practices

1. **Keep policies simple** - Complex policies are harder to debug and can cause performance issues
2. **Use service role for system operations** - Match score calculations, admin operations
3. **Test with different user roles** - Ensure policies work for all user types
4. **Monitor query performance** - RLS policies add overhead to queries
5. **Document policy changes** - Keep this file updated with any policy modifications