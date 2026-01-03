# Quick Column Reference - HelloEveryone Database

### Note: you can use MCP tools to directly query Supabase to get the latest info because this document might go out of date (see 'C:\Users\Allan\source\repos\helloeveryone\mcp')

## ⚠️ IMPORTANT: Common Mistakes to Avoid

### ❌ THESE COLUMNS DO NOT EXIST:
- `profiles.avatar_url` - Not in database
- `profiles.photo_url` - Not in database  
- `profiles.first_name` - Use `display_name` instead
- `profiles.last_name` - Use `display_name` instead
- `events.date` - Use `start_time` instead
- `events.event_type` - Not in database
- `events.capacity` - Use `max_attendees` instead
- `match_scores.total_score` - Use `combined_score` instead

### ✅ CORRECT COLUMN NAMES:

#### profiles table
```sql
display_name    -- NOT first_name/last_name
bio
age
location
interests       -- TEXT[] array
embedding       -- VECTOR(1536)
role           -- user_role enum
is_active
```

#### events table
```sql
title
description
location
start_time      -- NOT date
end_time
max_attendees   -- NOT capacity
created_by      -- FK to profiles.user_id
is_active
```

#### match_scores table
```sql
user_id_1
user_id_2
combined_score  -- NOT total_score (value 0-1, multiply by 100 for %)
interest_score
bio_similarity
age_compatibility
location_score
common_interests -- TEXT[] array
```

## Example Queries

### ❌ WRONG:
```sql
SELECT first_name, last_name, avatar_url FROM profiles;
SELECT date, event_type FROM events;
SELECT total_score FROM match_scores;
```

### ✅ CORRECT:
```sql
SELECT display_name, bio, location FROM profiles;
SELECT start_time, title, max_attendees FROM events;
SELECT combined_score * 100 as match_percentage FROM match_scores;
```

## TypeScript Interface Fixes

### ❌ WRONG Interface:
```typescript
interface Profile {
  first_name: string
  last_name: string
  avatar_url: string
  // ...
}
```

### ✅ CORRECT Interface:
```typescript
interface Profile {
  display_name: string
  bio?: string
  location?: string
  // NO avatar_url - handle separately
  // ...
}
```

## Handling Missing Columns

### Avatars
Since `avatar_url` doesn't exist:
1. Generate from initials: `display_name.charAt(0)`
2. Use placeholder API: `/api/placeholder/100/100?text=${initial}`
3. Store in Supabase Storage separately

### Names
Since no `first_name`/`last_name`:
1. Use `display_name` for all display purposes
2. If you need to split names, do it in application logic

### Event Types
Since `event_type` doesn't exist:
1. Hardcode options in UI: ['Social', 'Professional', 'Sports', etc.]
2. Could add column later if needed

## Remember
**Always check the actual database schema, not TypeScript interfaces!**
The database is the source of truth, not the TypeScript types.