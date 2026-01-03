const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_API_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateProfileImages() {
  const profileImageMappings = [
    { user_id: 'a7984207-d812-47a1-8f13-ad39d7541649', image: '/images/emily_zhang.jpg', name: 'Emily Zhang' },
    { user_id: 'a2d67d17-8b7c-469b-91bc-2575ad58bc4a', image: '/images/michael_brown.jpg', name: 'Michael Brown' },
    { user_id: '3de4e2c9-af58-42bd-9f72-fe2675313ec1', image: '/images/lisa_park.jpg', name: 'Lisa Park' },
    { user_id: '3b22edec-c97d-4ac7-93b7-c49aa8e41001', image: '/images/tom_anderson.jpg', name: 'Tom Anderson' },
    { user_id: '6d43b482-db41-43b7-99ef-c02700e520b1', image: '/images/james_miller.jpg', name: 'James Miller' },
  ];

  console.log('Updating profile images for demo users...');

  for (const mapping of profileImageMappings) {
    try {
      // Update the photo_url field in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update({ photo_url: mapping.image })
        .eq('user_id', mapping.user_id);

      if (error) {
        console.error(`Error updating ${mapping.name}:`, error);
      } else {
        console.log(`✓ Updated profile image for ${mapping.name}`);
      }
    } catch (err) {
      console.error(`Failed to update ${mapping.name}:`, err);
    }
  }

  console.log('\nProfile images update complete!');
  console.log('The images are now set to use local files from /public/images/');

  // Verify the updates
  console.log('\nVerifying updates...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('display_name, photo_url')
    .in('user_id', profileImageMappings.map(m => m.user_id));

  if (profiles) {
    console.log('\nCurrent profile images:');
    profiles.forEach(profile => {
      console.log(`  ${profile.display_name}: ${profile.photo_url || 'No image'}`);
    });
  }
}

updateProfileImages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });