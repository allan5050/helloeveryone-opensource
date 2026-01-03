const SupabaseDBClient = require('../mcp/db-client');
const client = new SupabaseDBClient();

const personas = [
  // The Tech Nerds / Geek Culture cluster
  {
    name: 'Demo: Tom Anderson',
    interests: ['sci-fi', 'star-wars', 'board-games', 'dungeons-dragons', 'comic-books', 'anime', 'video-games'],
    age: 34, location: '94107'
  },
  {
    name: 'Demo: Michael Johnson',
    interests: ['programming', 'video-games', 'esports', 'anime', 'sci-fi', 'virtual-reality', 'tech-meetups'],
    age: 29, location: '94107'
  },
  {
    name: 'Demo: Jennifer Chen',
    interests: ['sci-fi', 'fantasy-novels', 'board-games', 'cosplay', 'comic-con', 'star-trek', 'tabletop-rpg'],
    age: 31, location: '94103'
  },

  // The Fitness Enthusiasts cluster
  {
    name: 'Demo: Nancy Wilson',
    interests: ['crossfit', 'nutrition', 'meal-prep', 'marathons', 'yoga', 'wellness-blogs', 'fitbit'],
    age: 38, location: '94108'
  },
  {
    name: 'Demo: Michelle Lewis',
    interests: ['triathlon', 'cycling', 'swimming', 'nutrition', 'sports-medicine', 'fitness-tracking', 'ironman'],
    age: 43, location: '94108'
  },
  {
    name: 'Demo: Emily Brown',
    interests: ['rock-climbing', 'hiking', 'trail-running', 'camping', 'outdoor-fitness', 'rei-member', 'national-parks'],
    age: 35, location: '94114'
  },

  // The Creative Artists cluster
  {
    name: 'Demo: Patricia Lee',
    interests: ['painting', 'art-galleries', 'sketching', 'art-history', 'museums', 'creative-writing', 'poetry'],
    age: 35, location: '94102'
  },
  {
    name: 'Demo: Lisa Park',
    interests: ['photography', 'indie-music', 'concerts', 'film-photography', 'art-shows', 'creative-writing', 'zines'],
    age: 31, location: '94110'
  },
  {
    name: 'Demo: David Martinez',
    interests: ['jazz', 'vinyl-records', 'live-music', 'poetry-slams', 'open-mic', 'beatnik-culture', 'small-venues'],
    age: 42, location: '94103'
  },

  // The Foodies / Lifestyle cluster
  {
    name: 'Demo: Marcus Williams',
    interests: ['farmers-markets', 'organic-cooking', 'wine-tasting', 'cheese-making', 'food-blogs', 'slow-food', 'gardening'],
    age: 38, location: '94102'
  },
  {
    name: 'Demo: Amanda White',
    interests: ['baking', 'cookbook-collecting', 'food-photography', 'restaurant-reviews', 'cooking-classes', 'sourdough', 'pastry'],
    age: 37, location: '94102'
  },
  {
    name: 'Demo: Matthew Wilson',
    interests: ['coffee-roasting', 'specialty-coffee', 'craft-beer', 'whiskey', 'cocktail-making', 'sommelier', 'gastropubs'],
    age: 40, location: '94110'
  },

  // The Environmentalists / Conscious Living cluster
  {
    name: 'Demo: Laura Rodriguez',
    interests: ['zero-waste', 'veganism', 'climate-action', 'composting', 'sustainable-fashion', 'farmers-markets', 'activism'],
    age: 29, location: '94110'
  },
  {
    name: 'Demo: Ashley Garcia',
    interests: ['permaculture', 'solar-energy', 'electric-vehicles', 'environmental-science', 'documentaries', 'sierra-club', 'conservation'],
    age: 33, location: '94114'
  },

  // The Intellectuals / Academics cluster
  {
    name: 'Demo: Sandra Young',
    interests: ['book-clubs', 'philosophy', 'classical-music', 'museums', 'lectures', 'npr', 'documentaries'],
    age: 44, location: '94103'
  },
  {
    name: 'Demo: Christopher Lee',
    interests: ['history', 'economics', 'politics', 'debate', 'ted-talks', 'podcasts', 'non-fiction'],
    age: 46, location: '94107'
  },

  // The Social Sports fans cluster
  {
    name: 'Demo: Kevin Wang',
    interests: ['warriors', 'giants', 'fantasy-football', 'sports-bars', 'tailgating', 'march-madness', 'espn'],
    age: 36, location: '94103'
  },
  {
    name: 'Demo: Robert Taylor',
    interests: ['golf', 'tennis', 'country-club', 'yacht-club', 'wine-tasting', 'networking', 'finance'],
    age: 41, location: '94108'
  },

  // The Parents / Family-focused cluster
  {
    name: 'Demo: Sarah Davis',
    interests: ['parenting', 'pta', 'kids-activities', 'family-camping', 'disney', 'meal-planning', 'education'],
    age: 39, location: '94110'
  },
  {
    name: 'Demo: Jessica Thompson',
    interests: ['mommy-groups', 'kids-crafts', 'family-yoga', 'organic-parenting', 'montessori', 'child-development', 'playdates'],
    age: 36, location: '94117'
  }
];

async function updateDemoPersonas() {
  console.log('Updating demo user personas with realistic clustered interests...\n');

  for (const persona of personas) {
    try {
      const updateQuery = `
        UPDATE profiles
        SET interests = $1::text[],
            age = $2,
            location = $3
        WHERE display_name = $4
        RETURNING user_id, display_name
      `;

      const result = await client.executeSQL(updateQuery, [
        persona.interests,
        persona.age,
        persona.location,
        persona.name
      ]);

      if (result && result.length > 0) {
        console.log(`✓ Updated ${persona.name}:`);
        console.log(`  Interests: ${persona.interests.slice(0, 3).join(', ')}...`);
        console.log(`  Location: ${persona.location}, Age: ${persona.age}`);
      } else {
        console.log(`⚠ User not found: ${persona.name}`);
      }
    } catch (error) {
      console.error(`✗ Error updating ${persona.name}:`, error.message);
    }
  }

  console.log('\n✓ Persona update complete!');
  console.log('\nPersona clusters created:');
  console.log('- Tech Nerds (3 users): sci-fi, gaming, anime');
  console.log('- Fitness Enthusiasts (3 users): sports, nutrition, outdoor');
  console.log('- Creative Artists (3 users): art, music, photography');
  console.log('- Foodies (3 users): cooking, wine, coffee');
  console.log('- Environmentalists (2 users): sustainability, climate');
  console.log('- Intellectuals (2 users): philosophy, politics, culture');
  console.log('- Sports Fans (2 users): team sports, fantasy leagues');
  console.log('- Parents (2 users): family activities, education');

  process.exit(0);
}

updateDemoPersonas().catch(error => {
  console.error('Failed to update personas:', error);
  process.exit(1);
});