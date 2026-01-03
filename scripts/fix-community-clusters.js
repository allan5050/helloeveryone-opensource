const SupabaseDBClient = require('../mcp/db-client')
const client = new SupabaseDBClient()

// Define distinct communities with minimal overlap
const communities = {
  // Community 1: Creative Arts & Music (Allan's community)
  creative: [
    {
      display_name: 'Allan',
      interests: [
        'indie-music',
        'live-music',
        'concerts',
        'vinyl-records',
        'photography',
        'creative-writing',
      ],
      location: '94110',
    },
    {
      display_name: 'Demo: Lisa Park',
      interests: [
        'photography',
        'indie-music',
        'concerts',
        'film-photography',
        'art-shows',
        'creative-writing',
      ],
      location: '94110',
    },
    {
      display_name: 'Demo: Patricia Lee',
      interests: [
        'painting',
        'art-galleries',
        'sketching',
        'art-history',
        'museums',
        'poetry',
      ],
      location: '94102',
    },
    {
      display_name: 'Demo: Emily Zhang',
      interests: [
        'indie-music',
        'folk-music',
        'writing',
        'concerts',
        'poetry',
        'zines',
      ],
      location: '94103',
    },
  ],

  // Community 2: Tech & Gaming
  tech: [
    {
      display_name: 'Demo: Tom Anderson',
      interests: [
        'sci-fi',
        'star-wars',
        'board-games',
        'dungeons-dragons',
        'comic-books',
        'video-games',
      ],
      location: '94107',
    },
    {
      display_name: 'Demo: Chris Thompson',
      interests: [
        'devops',
        'home-automation',
        'gaming',
        'technology',
        'robotics',
        'hackathons',
      ],
      location: '94107',
    },
    {
      display_name: 'Demo: Steven Clark',
      interests: [
        'blockchain',
        'cryptocurrency',
        'podcasts',
        'astronomy',
        'technology',
        'futurism',
      ],
      location: '94103',
    },
    {
      display_name: 'Demo: Daniel Harris',
      interests: [
        'qa-testing',
        'automation',
        'board-games',
        'game-design',
        'tabletop-rpg',
        'puzzles',
      ],
      location: '94102',
    },
  ],

  // Community 3: Fitness & Sports
  fitness: [
    {
      display_name: 'Demo: Michelle Lewis',
      interests: [
        'triathlon',
        'cycling',
        'swimming',
        'ironman',
        'sports-medicine',
        'fitness-tracking',
      ],
      location: '94108',
    },
    {
      display_name: 'Demo: Nancy Wilson',
      interests: [
        'crossfit',
        'nutrition',
        'meal-prep',
        'marathons',
        'wellness-blogs',
        'fitbit',
      ],
      location: '94108',
    },
    {
      display_name: 'Demo: David Kim',
      interests: [
        'basketball',
        'sports',
        'coaching',
        'fitness',
        'sports-analytics',
        'warriors',
      ],
      location: '94107',
    },
    {
      display_name: 'Demo: Sarah Johnson',
      interests: [
        'running',
        'hiking',
        'trail-running',
        'outdoor-fitness',
        'marathons',
        'strava',
      ],
      location: '94110',
    },
  ],

  // Community 4: Business & Finance
  business: [
    {
      display_name: 'Demo: Robert Taylor',
      interests: [
        'golf',
        'tennis',
        'country-club',
        'yacht-club',
        'networking',
        'finance',
      ],
      location: '94108',
    },
    {
      display_name: 'Demo: Michael Brown',
      interests: [
        'marketing',
        'ad-tech',
        'golf',
        'wine-tasting',
        'business-strategy',
        'investing',
      ],
      location: '94102',
    },
    {
      display_name: 'Demo: Jennifer Davis',
      interests: [
        'product-management',
        'fintech',
        'venture-capital',
        'startups',
        'networking',
        'ted-talks',
      ],
      location: '94103',
    },
    {
      display_name: 'Demo: Maria Garcia',
      interests: [
        'entrepreneurship',
        'healthtech',
        'angel-investing',
        'pitch-competitions',
        'business-networking',
        'forbes',
      ],
      location: '94110',
    },
  ],

  // Community 5: Foodies & Culinary
  food: [
    {
      display_name: 'Demo: Marcus Williams',
      interests: [
        'farmers-markets',
        'organic-cooking',
        'wine-tasting',
        'cheese-making',
        'slow-food',
        'gardening',
      ],
      location: '94102',
    },
    {
      display_name: 'Demo: Amanda White',
      interests: [
        'baking',
        'cookbook-collecting',
        'food-photography',
        'restaurant-reviews',
        'sourdough',
        'pastry',
      ],
      location: '94102',
    },
    {
      display_name: 'Demo: Jane Doe',
      interests: [
        'coffee-roasting',
        'specialty-coffee',
        'latte-art',
        'cafe-culture',
        'barista',
        'coffee-cupping',
      ],
      location: '94110',
    },
  ],

  // Community 6: Science & Academia
  science: [
    {
      display_name: 'Demo: Dr. Rachel Green',
      interests: [
        'medical-research',
        'biotech',
        'scientific-journals',
        'conferences',
        'grant-writing',
        'peer-review',
      ],
      location: '94107',
    },
    {
      display_name: 'Demo: Sandra Young',
      interests: [
        'philosophy',
        'classical-music',
        'museums',
        'lectures',
        'npr',
        'documentaries',
      ],
      location: '94103',
    },
    {
      display_name: 'Demo: James Miller',
      interests: [
        'healthcare-tech',
        'data-analysis',
        'medical-devices',
        'clinical-trials',
        'research',
        'pubmed',
      ],
      location: '94108',
    },
  ],

  // Isolated/Bridge users (have unique interests that don't strongly connect)
  isolated: [
    {
      display_name: 'Demo: Laura Rodriguez',
      interests: [
        'zero-waste',
        'veganism',
        'climate-action',
        'composting',
        'sustainable-fashion',
        'activism',
      ],
      location: '94110',
    },
    {
      display_name: 'Demo: Kevin Martinez',
      interests: [
        'cybersecurity',
        'privacy',
        'chess',
        'cryptography',
        'infosec',
        'defcon',
      ],
      location: '94103',
    },
    {
      display_name: 'Demo: Paul Walker',
      interests: [
        'cars',
        'diy',
        'woodworking',
        'mechanics',
        'restoration',
        'tools',
      ],
      location: '94102',
    },
    {
      display_name: 'Demo: Alex Chen',
      interests: [
        'machine-learning',
        'ai-research',
        'kaggle',
        'deep-learning',
        'pytorch',
        'arxiv',
      ],
      location: '94107',
    },
  ],
}

async function updateCommunities() {
  console.log('Creating distinct community clusters...\n')

  let successCount = 0
  let errorCount = 0

  for (const [communityName, members] of Object.entries(communities)) {
    console.log(`\n=== ${communityName.toUpperCase()} COMMUNITY ===`)

    for (const member of members) {
      try {
        const query = `
          UPDATE profiles
          SET interests = $1::text[],
              location = $2
          WHERE display_name = $3
          RETURNING display_name
        `

        const result = await client.executeSQL(query, [
          member.interests,
          member.location,
          member.display_name,
        ])

        if (result && result.length > 0) {
          console.log(
            `✓ ${member.display_name}: ${member.interests.slice(0, 3).join(', ')}...`
          )
          successCount++
        } else {
          console.log(`⚠ Not found: ${member.display_name}`)
        }
      } catch (error) {
        console.error(`✗ Error updating ${member.display_name}:`, error.message)
        errorCount++
      }
    }
  }

  console.log('\n========================================')
  console.log(`✓ Successfully updated: ${successCount} profiles`)
  if (errorCount > 0) {
    console.log(`✗ Errors: ${errorCount}`)
  }

  console.log('\nExpected communities at different thresholds:')
  console.log('- At 0.30-0.40: Most users connected (1-2 large communities)')
  console.log('- At 0.45-0.55: 4-6 distinct communities emerge')
  console.log('- At 0.60+: Communities fragment, more isolated users')

  console.log('\nDistinct communities created:')
  console.log('1. Creative Arts & Music (Allan + 3 others) - 94110/94102/94103')
  console.log('2. Tech & Gaming (4 users) - 94107/94102/94103')
  console.log('3. Fitness & Sports (4 users) - 94108/94107/94110')
  console.log('4. Business & Finance (4 users) - Various locations')
  console.log('5. Foodies & Culinary (3 users) - 94102/94110')
  console.log('6. Science & Academia (3 users) - 94107/94103/94108')
  console.log('7. Isolated/Bridge users (4 users) - Unique interests')

  process.exit(0)
}

updateCommunities().catch(error => {
  console.error('Failed:', error)
  process.exit(1)
})
