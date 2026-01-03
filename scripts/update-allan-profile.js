const SupabaseDBClient = require('../mcp/db-client');
const client = new SupabaseDBClient();

async function updateAllanProfile() {
  console.log('Updating Allan\'s profile for better community integration...\n');

  // Allan's profile: Creative Foodie with some tech interests
  // This creates a bridge between the Creative Artists and Foodies clusters
  const allanUpdate = {
    user_id: '1916d3c4-5cf1-494c-8caf-92a1c77d4177',
    display_name: 'Allan',
    bio: 'Creative soul who loves exploring local coffee shops, indie concerts, and experimenting in the kitchen. Always up for yoga, dance, or a good conversation about music and food.',
    interests: [
      // Primary: Music/Creative (connects to Lisa Park, David Martinez)
      'indie-music', 'concerts', 'live-music', 'vinyl-records',
      // Secondary: Food/Coffee (connects to Marcus Williams, Matthew Wilson)
      'coffee', 'specialty-coffee', 'cooking', 'farmers-markets',
      // Wellness (connects to various)
      'yoga', 'dancing', 'mindfulness',
      // Social/Travel
      'travel', 'volunteering', 'writing'
    ],
    age: 32, // Updated to be closer to the creative cluster (31-42)
    location: '94110' // Mission District, same as Lisa Park and Matthew Wilson
  };

  // Update Allan's profile
  try {
    const updateQuery = `
      UPDATE profiles
      SET bio = $1,
          interests = $2::text[],
          age = $3,
          location = $4
      WHERE user_id = $5
      RETURNING display_name
    `;

    const result = await client.executeSQL(updateQuery, [
      allanUpdate.bio,
      allanUpdate.interests,
      allanUpdate.age,
      allanUpdate.location,
      allanUpdate.user_id
    ]);

    if (result && result.length > 0) {
      console.log('✓ Updated Allan\'s profile');
      console.log(`  Bio: Creative soul who loves...`);
      console.log(`  Primary interests: ${allanUpdate.interests.slice(0, 4).join(', ')}`);
      console.log(`  Location: ${allanUpdate.location} (Mission District)`);
      console.log(`  Age: ${allanUpdate.age}`);
    }
  } catch (error) {
    console.error('Error updating Allan:', error.message);
  }

  // Now update a few other users to have overlapping interests with Allan
  // This will create stronger community connections
  const updates = [
    {
      display_name: 'Demo: Lisa Park',
      // Keep her existing interests but add some overlap with Allan
      interests: [
        'photography', 'indie-music', 'concerts', 'film-photography',
        'art-shows', 'creative-writing', 'zines',
        'coffee', 'specialty-coffee', 'yoga', 'mindfulness' // Added overlap
      ]
    },
    {
      display_name: 'Demo: Matthew Wilson',
      // Coffee expert with music interests
      interests: [
        'coffee-roasting', 'specialty-coffee', 'craft-beer', 'whiskey',
        'cocktail-making', 'sommelier', 'gastropubs',
        'vinyl-records', 'indie-music', 'live-music' // Added music overlap
      ]
    },
    {
      display_name: 'Demo: David Martinez',
      // Jazz lover with coffee culture
      interests: [
        'jazz', 'vinyl-records', 'live-music', 'poetry-slams',
        'open-mic', 'beatnik-culture', 'small-venues',
        'coffee', 'specialty-coffee', 'writing' // Added coffee/writing overlap
      ]
    },
    {
      display_name: 'Demo: Marcus Williams',
      // Foodie with creative interests
      interests: [
        'farmers-markets', 'organic-cooking', 'wine-tasting',
        'cheese-making', 'food-blogs', 'slow-food', 'gardening',
        'concerts', 'volunteering', 'mindfulness' // Added overlap
      ]
    }
  ];

  console.log('\nCreating stronger connections with other users...');

  for (const update of updates) {
    try {
      const query = `
        UPDATE profiles
        SET interests = $1::text[]
        WHERE display_name = $2
        RETURNING display_name
      `;

      const result = await client.executeSQL(query, [
        update.interests,
        update.display_name
      ]);

      if (result && result.length > 0) {
        console.log(`✓ Updated ${update.display_name} with overlapping interests`);
      }
    } catch (error) {
      console.error(`Error updating ${update.display_name}:`, error.message);
    }
  }

  // Also create Emily Zhang if she doesn't exist, or update her to be similar to Allan
  const emilyProfile = {
    display_name: 'Emily Zhang',
    bio: 'Tech professional with a creative side. Love discovering new coffee shops, attending indie concerts, and weekend yoga sessions.',
    interests: [
      'tech', 'programming', 'tech-meetups',
      'coffee', 'specialty-coffee', 'indie-music', 'concerts',
      'yoga', 'mindfulness', 'travel', 'photography'
    ],
    age: 30,
    location: '94103' // SOMA, nearby
  };

  try {
    // First check if Emily exists
    const checkQuery = `SELECT user_id FROM profiles WHERE display_name = 'Emily Zhang'`;
    const existing = await client.executeSQL(checkQuery, []);

    if (existing && existing.length > 0) {
      // Update existing Emily
      const updateQuery = `
        UPDATE profiles
        SET bio = $1,
            interests = $2::text[],
            age = $3,
            location = $4
        WHERE display_name = 'Emily Zhang'
        RETURNING display_name
      `;

      await client.executeSQL(updateQuery, [
        emilyProfile.bio,
        emilyProfile.interests,
        emilyProfile.age,
        emilyProfile.location
      ]);

      console.log('✓ Updated Emily Zhang with interests similar to Allan');
    }
  } catch (error) {
    console.error('Note: Emily Zhang update skipped:', error.message);
  }

  console.log('\n✓ Profile updates complete!');
  console.log('\nAllan is now connected to:');
  console.log('- Creative Music Cluster (Lisa Park, David Martinez)');
  console.log('- Coffee Enthusiasts (Matthew Wilson, David Martinez)');
  console.log('- Mindful Foodies (Marcus Williams)');
  console.log('- Tech Creatives (Emily Zhang)');

  process.exit(0);
}

updateAllanProfile().catch(error => {
  console.error('Failed to update profiles:', error);
  process.exit(1);
});