-- Migration: Add missing profile columns and storage bucket
-- Date: 2025-01-13
-- Description: Adds missing columns to profiles table and creates storage bucket for profile photos

-- 1. Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS preferred_age_min INTEGER DEFAULT 18 CHECK (preferred_age_min >= 18),
ADD COLUMN IF NOT EXISTS preferred_age_max INTEGER DEFAULT 99 CHECK (preferred_age_max <= 100),
ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_age": true, "show_location": true, "show_interests": true}'::jsonb,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio_embedding vector(1536);

-- Add constraint to ensure preferred_age_max >= preferred_age_min
ALTER TABLE profiles 
ADD CONSTRAINT check_age_range 
CHECK (preferred_age_max >= preferred_age_min);

-- 2. Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 
  'profile-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Drop existing storage policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly accessible" ON storage.objects;

-- 4. Create storage policies for profile photos
-- Allow authenticated users to upload their own profile photos
CREATE POLICY "Users can upload own profile photo" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own profile photos
CREATE POLICY "Users can update own profile photo" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-photos' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own profile photos
CREATE POLICY "Users can delete own profile photo" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-photos' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow public to view profile photos
CREATE POLICY "Profile photos are publicly accessible" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-photos');

-- 5. Update existing RLS policies for profiles table to ensure they work with new columns
-- These policies should already exist from previous migrations, but we'll recreate them to be safe
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow users to view all profiles (needed for matching)
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create indexes for new columns for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_complete ON profiles(is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON profiles USING GIN(looking_for);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles USING GIN(availability);
CREATE INDEX IF NOT EXISTS idx_profiles_age_range ON profiles(preferred_age_min, preferred_age_max);

-- 7. Update existing profiles to set is_profile_complete based on existing data
UPDATE profiles 
SET is_profile_complete = CASE 
  WHEN display_name IS NOT NULL 
    AND bio IS NOT NULL 
    AND age IS NOT NULL 
    AND location IS NOT NULL 
    AND interests IS NOT NULL 
    AND array_length(interests, 1) > 0
  THEN true
  ELSE false
END
WHERE is_profile_complete IS NULL;

-- 8. Add comment to document the migration
COMMENT ON COLUMN profiles.is_profile_complete IS 'Indicates whether the user has completed their profile setup';
COMMENT ON COLUMN profiles.photo_url IS 'URL to the user profile photo stored in storage bucket';
COMMENT ON COLUMN profiles.preferred_age_min IS 'Minimum age preference for matching';
COMMENT ON COLUMN profiles.preferred_age_max IS 'Maximum age preference for matching';
COMMENT ON COLUMN profiles.looking_for IS 'Array of relationship types user is looking for';
COMMENT ON COLUMN profiles.availability IS 'Array of time slots when user is available';
COMMENT ON COLUMN profiles.privacy_settings IS 'JSON object containing privacy preferences';
COMMENT ON COLUMN profiles.bio_embedding IS 'Vector embedding of user bio for semantic matching';

-- Migration complete!