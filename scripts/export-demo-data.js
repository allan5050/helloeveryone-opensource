const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_API_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function exportDemoData() {
  try {
    console.log('Exporting demo data from Supabase...')

    // Get all demo profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .or('display_name.ilike.Demo:%,display_name.ilike.%Demo%')
      .order('created_at')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    console.log(`Found ${profiles?.length || 0} demo profiles`)

    // Get all profiles if no demo profiles found (for backup purposes)
    let allProfiles = profiles
    if (!profiles || profiles.length === 0) {
      const { data: allProfilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at')
        .limit(20) // Get top 20 profiles as demo data
      allProfiles = allProfilesData || []
      console.log(`Using ${allProfiles.length} regular profiles as demo data`)
    }

    const profileIds = allProfiles.map(p => p.user_id)

    // Get favorites
    let favorites = []
    if (profileIds.length > 0) {
      const { data: favData } = await supabase
        .from('favorites')
        .select('*')
        .in('user_id', profileIds)
      favorites = favData || []
    }

    // Get events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .order('date')
      .limit(50)

    // Get RSVPs
    let rsvps = []
    if (profileIds.length > 0) {
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('*')
        .in('user_id', profileIds)
      rsvps = rsvpData || []
    }

    // Get AI insights
    let aiInsights = []
    if (profileIds.length > 0) {
      const { data: aiData } = await supabase
        .from('ai_insights')
        .select('*')
        .in('user_id', profileIds)
      aiInsights = aiData || []
    }

    // Get match scores
    let matchScores = []
    if (profileIds.length > 0) {
      const { data: matchData } = await supabase
        .from('match_scores')
        .select('*')
        .in('user_id_1', profileIds)
      matchScores = matchData || []
    }

    const demoData = {
      metadata: {
        exported_at: new Date().toISOString(),
        profile_count: allProfiles.length,
        event_count: events?.length || 0,
        favorites_count: favorites.length,
        rsvps_count: rsvps.length,
        ai_insights_count: aiInsights.length,
        match_scores_count: matchScores.length,
      },
      profiles: allProfiles,
      favorites: favorites,
      events: events || [],
      rsvps: rsvps,
      ai_insights: aiInsights,
      match_scores: matchScores,
    }

    // Save to file
    const outputPath = path.join(__dirname, '..', 'data', 'demo-backup.json')
    fs.writeFileSync(outputPath, JSON.stringify(demoData, null, 2))

    console.log(`Demo data exported successfully to ${outputPath}`)
    console.log('Summary:', demoData.metadata)

    // Also create a minimal version for quick loading
    const minimalData = {
      profiles: allProfiles.map(p => ({
        user_id: p.user_id,
        display_name: p.display_name,
        full_name: p.full_name,
        bio: p.bio,
        age: p.age,
        interests: p.interests,
        location: p.location,
        is_active: p.is_active,
      })),
      events: (events || []).map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        location: e.location,
        capacity: e.capacity,
      })),
    }

    const minimalPath = path.join(__dirname, '..', 'data', 'demo-minimal.json')
    fs.writeFileSync(minimalPath, JSON.stringify(minimalData, null, 2))
    console.log(`Minimal demo data saved to ${minimalPath}`)
  } catch (error) {
    console.error('Error exporting demo data:', error)
    process.exit(1)
  }

  process.exit(0)
}

exportDemoData()
