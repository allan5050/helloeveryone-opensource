import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// SECURITY: Only allow in development environment
function checkDevelopmentOnly() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }
  return null
}

interface User {
  user_id: string
  display_name: string
  age: number | null
  location: string | null
  interests: string[] | null
  bio: string | null
}

// Calculate Jaccard similarity for interests
function calculateJaccardSimilarity(set1: string[], set2: string[]): number {
  if (!set1?.length || !set2?.length) return 0

  const intersection = set1.filter(x => set2.includes(x)).length
  const union = new Set([...set1, ...set2]).size

  return union === 0 ? 0 : intersection / union
}

// Calculate age compatibility (peaks when ages are within 5 years)
function calculateAgeCompatibility(
  age1: number | null,
  age2: number | null
): number {
  if (age1 == null || age2 == null) return 0.5

  const diff = Math.abs(age1 - age2)
  if (diff <= 5) return 1.0
  if (diff <= 10) return 0.7
  if (diff <= 15) return 0.4
  return 0.2
}

// Calculate location match (simple - same zip = 1, different = 0.3)
function calculateLocationMatch(
  loc1: string | null,
  loc2: string | null
): number {
  if (!loc1 || !loc2) return 0.5
  // Simple matching - same zip gets full score, different gets partial
  return loc1 === loc2 ? 1.0 : 0.3
}

// Calculate overall match score
function calculateMatchScore(user1: User, user2: User) {
  const interestScore = calculateJaccardSimilarity(
    user1.interests || [],
    user2.interests || []
  )
  const ageScore = calculateAgeCompatibility(user1.age, user2.age)
  const locationScore = calculateLocationMatch(user1.location, user2.location)

  // Weighted average: 50% interests, 30% age, 20% location
  const overallScore =
    interestScore * 0.5 + ageScore * 0.3 + locationScore * 0.2

  return {
    score: overallScore,
    interest_overlap: interestScore,
    age_compatibility: ageScore,
    location_match: locationScore,
  }
}

export async function GET() {
  const devCheck = checkDevelopmentOnly()
  if (devCheck) return devCheck

  try {
    const supabase = await createClient()

    // Fetch all demo users plus Allan for match scores
    const { data: users, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, age, location, interests, bio')
      .or('display_name.like.Demo:%,display_name.eq.Allan')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ scores: [] })
    }

    // Calculate pairwise match scores
    const scores = []
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const matchData = calculateMatchScore(users[i], users[j])
        scores.push({
          user1_id: users[i].user_id,
          user2_id: users[j].user_id,
          user1_name: users[i].display_name,
          user2_name: users[j].display_name,
          ...matchData,
        })
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    return NextResponse.json({ scores })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
