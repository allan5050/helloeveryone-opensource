import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    persistSession: false,
  },
})

// More diverse and realistic interest combinations
const demoUserUpdates = [
  {
    display_name: 'Demo: Patricia Lee',
    interests: [
      'boardgames',
      'sci-fi',
      'meditation',
      'art',
      'sketching',
      'mindfulness',
      'dungeons-dragons',
    ],
    location: '94102',
  },
  {
    display_name: 'Demo: Nancy Wilson',
    interests: [
      'sports',
      'basketball',
      'pilates',
      'wine',
      'dogs',
      'fitness',
      'watching-nba',
    ],
    location: '94108',
  },
  {
    display_name: 'Demo: Laura Rodriguez',
    interests: [
      'boardgames',
      'digital-marketing',
      'yoga',
      'vegan-cooking',
      'sustainability',
      'settlers-catan',
    ],
    location: '94110',
  },
  {
    display_name: 'Demo: Michelle Lewis',
    interests: [
      'sports',
      'soccer',
      'triathlon',
      'nutrition',
      'parenting',
      'fitness',
      'watching-world-cup',
    ],
    location: '94108',
  },
  {
    display_name: 'Demo: Tom Anderson',
    interests: [
      'sci-fi',
      'star-wars',
      'photography',
      'craft-beer',
      'dogs',
      'art',
      'comic-books',
    ],
    location: '94107',
  },
  {
    display_name: 'Demo: Lisa Park',
    interests: [
      'coffee',
      'cooking',
      'yoga',
      'dancing',
      'travel',
      'photography',
      'concerts',
      'indie-music',
    ],
    location: '94110',
  },
  {
    display_name: 'Demo: Robert Taylor',
    interests: [
      'boardgames',
      'finance',
      'cycling',
      'cocktails',
      'entertaining',
      'poker',
      'chess',
    ],
    location: '94102', // Changed from 94108 to create more geographic diversity
  },
  {
    display_name: 'Demo: Sandra Young',
    interests: [
      'sci-fi',
      'fantasy',
      'classical-music',
      'museums',
      'cats',
      'culture',
      'book-clubs',
    ],
    location: '94103',
  },
  {
    display_name: 'Demo: Marcus Williams',
    interests: [
      'coffee',
      'cooking',
      'gardening',
      'travel',
      'volunteering',
      'parenting',
      'farmers-markets',
    ],
    location: '94102',
  },
  {
    display_name: 'Demo: Amanda White',
    interests: [
      'boardgames',
      'education',
      'reading',
      'baking',
      'gardening',
      'books',
      'trivia-nights',
    ],
    location: '94102',
  },
  {
    display_name: 'Demo: Jennifer Chen',
    interests: [
      'sci-fi',
      'anime',
      'hiking',
      'camping',
      'rock-climbing',
      'outdoor-adventures',
      'star-trek',
    ],
    location: '94117',
  },
  {
    display_name: 'Demo: Kevin Wang',
    interests: [
      'sports',
      'football',
      'bbq',
      'home-brewing',
      'woodworking',
      'fantasy-football',
      'tailgating',
    ],
    location: '94103',
  },
  {
    display_name: 'Demo: Sarah Davis',
    interests: [
      'boardgames',
      'escape-rooms',
      'puzzles',
      'mystery-novels',
      'true-crime',
      'game-nights',
    ],
    location: '94110',
  },
  {
    display_name: 'Demo: Michael Johnson',
    interests: [
      'sci-fi',
      'video-games',
      'esports',
      'streaming',
      'tech',
      'virtual-reality',
      'cyberpunk',
    ],
    location: '94107',
  },
  {
    display_name: 'Demo: Emily Brown',
    interests: [
      'sports',
      'tennis',
      'swimming',
      'marathons',
      'nutrition',
      'crossfit',
      'obstacle-races',
    ],
    location: '94114',
  },
  {
    display_name: 'Demo: David Martinez',
    interests: [
      'coffee',
      'jazz',
      'vinyl-records',
      'live-music',
      'poetry',
      'open-mic',
      'beatnik-culture',
    ],
    location: '94103',
  },
  {
    display_name: 'Demo: Jessica Thompson',
    interests: [
      'boardgames',
      'crafts',
      'knitting',
      'quilting',
      'etsy',
      'diy-projects',
      'maker-spaces',
    ],
    location: '94117',
  },
  {
    display_name: 'Demo: Christopher Lee',
    interests: [
      'sports',
      'baseball',
      'statistics',
      'sabermetrics',
      'history',
      'documentary-films',
      'giants-fan',
    ],
    location: '94107',
  },
  {
    display_name: 'Demo: Ashley Garcia',
    interests: [
      'sci-fi',
      'astronomy',
      'planetarium',
      'nasa',
      'space-exploration',
      'carl-sagan',
      'cosmos',
    ],
    location: '94114',
  },
  {
    display_name: 'Demo: Matthew Wilson',
    interests: [
      'coffee',
      'specialty-coffee',
      'roasting',
      'barista',
      'latte-art',
      'coffee-cupping',
      'third-wave',
    ],
    location: '94110',
  },
]

async function updateDemoUsers() {
  console.log('Updating demo user interests...')

  for (const update of demoUserUpdates) {
    const { error } = await supabase
      .from('profiles')
      .update({
        interests: update.interests,
        location: update.location,
      })
      .eq('display_name', update.display_name)

    if (error) {
      console.error(`Error updating ${update.display_name}:`, error)
    } else {
      console.log(`✓ Updated ${update.display_name}`)
    }
  }

  console.log('Demo user update complete!')
}

updateDemoUsers().catch(console.error)
