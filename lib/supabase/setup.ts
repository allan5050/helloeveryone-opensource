import { createClient } from '@/lib/supabase/client'

export async function ensureStorageBucket() {
  const supabase = createClient()

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets()

    if (listError) {
      console.error('Error listing buckets:', listError)
      return false
    }

    const bucketExists = buckets.some(
      bucket => bucket.name === 'profile-photos'
    )

    if (!bucketExists) {
      // Create bucket with public access for profile photos
      const { error: createError } = await supabase.storage.createBucket(
        'profile-photos',
        {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880, // 5MB
        }
      )

      if (createError) {
        console.error('Error creating bucket:', createError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Storage setup error:', error)
    return false
  }
}

// Call this during app initialization
export async function initializeStorage() {
  const success = await ensureStorageBucket()
  if (!success) {
    console.warn('Storage bucket setup failed - photo uploads may not work')
  }
}
