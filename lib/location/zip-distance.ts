/**
 * Utilities for calculating distances between zip codes
 * and determining geographic proximity
 */

// Approximate lat/lng centers for common SF Bay Area zip codes
const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // San Francisco
  '94102': { lat: 37.7795, lng: -122.4187 }, // Tenderloin/Civic Center
  '94103': { lat: 37.7725, lng: -122.4116 }, // SOMA
  '94107': { lat: 37.7599, lng: -122.3997 }, // Potrero Hill
  '94108': { lat: 37.7924, lng: -122.4091 }, // Chinatown/Nob Hill
  '94109': { lat: 37.7930, lng: -122.4215 }, // Russian Hill
  '94110': { lat: 37.7484, lng: -122.4156 }, // Mission
  '94111': { lat: 37.7987, lng: -122.4007 }, // Financial District
  '94112': { lat: 37.7209, lng: -122.4436 }, // Ingleside
  '94114': { lat: 37.7581, lng: -122.4351 }, // Castro
  '94115': { lat: 37.7857, lng: -122.4367 }, // Western Addition
  '94116': { lat: 37.7449, lng: -122.4856 }, // Parkside
  '94117': { lat: 37.7707, lng: -122.4486 }, // Haight-Ashbury
  '94118': { lat: 37.7823, lng: -122.4625 }, // Inner Richmond
  '94121': { lat: 37.7787, lng: -122.4934 }, // Outer Richmond
  '94122': { lat: 37.7585, lng: -122.4757 }, // Sunset
  '94123': { lat: 37.8007, lng: -122.4380 }, // Marina
  '94124': { lat: 37.7324, lng: -122.3937 }, // Bayview
  '94127': { lat: 37.7354, lng: -122.4598 }, // West Portal
  '94131': { lat: 37.7419, lng: -122.4370 }, // Twin Peaks
  '94132': { lat: 37.7238, lng: -122.4839 }, // Lake Merced
  '94133': { lat: 37.8009, lng: -122.4111 }, // North Beach
  '94134': { lat: 37.7191, lng: -122.4135 }, // Visitacion Valley

  // Oakland
  '94601': { lat: 37.7800, lng: -122.2166 }, // Fruitvale
  '94606': { lat: 37.7914, lng: -122.2409 }, // Highland
  '94607': { lat: 37.8072, lng: -122.2981 }, // West Oakland
  '94608': { lat: 37.8335, lng: -122.2630 }, // Emeryville border
  '94609': { lat: 37.8330, lng: -122.2530 }, // Temescal
  '94610': { lat: 37.8119, lng: -122.2413 }, // Piedmont Avenue
  '94611': { lat: 37.8335, lng: -122.2002 }, // Montclair
  '94612': { lat: 37.8044, lng: -122.2712 }, // Downtown Oakland

  // Berkeley
  '94702': { lat: 37.8659, lng: -122.2909 }, // Southwest Berkeley
  '94703': { lat: 37.8710, lng: -122.2761 }, // South Berkeley
  '94704': { lat: 37.8670, lng: -122.2577 }, // Central Berkeley
  '94705': { lat: 37.8591, lng: -122.2420 }, // UC Berkeley South
  '94706': { lat: 37.8805, lng: -122.3041 }, // Northwest Berkeley
  '94707': { lat: 37.8930, lng: -122.2410 }, // Berkeley Hills
  '94708': { lat: 37.8900, lng: -122.2640 }, // North Berkeley
  '94709': { lat: 37.8804, lng: -122.2676 }, // Downtown Berkeley
  '94710': { lat: 37.8670, lng: -122.3020 }, // West Berkeley

  // San Jose
  '95110': { lat: 37.3382, lng: -121.8990 }, // Downtown San Jose
  '95112': { lat: 37.3564, lng: -121.8881 }, // North San Jose
  '95113': { lat: 37.3334, lng: -121.8850 }, // Downtown San Jose
  '95116': { lat: 37.3540, lng: -121.8463 }, // East San Jose
  '95117': { lat: 37.3089, lng: -121.9525 }, // Campbell border
  '95118': { lat: 37.2486, lng: -121.8944 }, // Almaden Valley
  '95119': { lat: 37.2290, lng: -121.7846 }, // South San Jose
  '95120': { lat: 37.2180, lng: -121.8616 }, // Almaden

  // Palo Alto
  '94301': { lat: 37.4435, lng: -122.1495 }, // Palo Alto
  '94303': { lat: 37.4170, lng: -122.1260 }, // East Palo Alto
  '94304': { lat: 37.4080, lng: -122.1170 }, // East Palo Alto
  '94305': { lat: 37.4250, lng: -122.1750 }, // Stanford
  '94306': { lat: 37.3770, lng: -122.1110 }, // South Palo Alto

  // Seattle area (for testing with different prefix)
  '98101': { lat: 47.6113, lng: -122.3305 }, // Downtown Seattle
  '98102': { lat: 47.6306, lng: -122.3215 }, // Capitol Hill
  '98103': { lat: 47.6734, lng: -122.3427 }, // Wallingford
  '98104': { lat: 47.6026, lng: -122.3258 }, // Pioneer Square
  '98105': { lat: 47.6633, lng: -122.3037 }, // University District
  '98109': { lat: 47.6338, lng: -122.3428 }, // South Lake Union
  '98115': { lat: 47.6859, lng: -122.2974 }, // Wedgwood
  '98122': { lat: 47.6097, lng: -122.3032 }, // Central District
}

/**
 * Calculate the Haversine distance between two coordinates in kilometers
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate distance between two zip codes in kilometers
 * Returns null if either zip code is not in our database
 */
export function getZipDistance(zip1: string, zip2: string): number | null {
  const coord1 = ZIP_COORDINATES[zip1]
  const coord2 = ZIP_COORDINATES[zip2]

  if (!coord1 || !coord2) {
    return null
  }

  return haversineDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng)
}

/**
 * Calculate a proximity score based on zip codes (0 to 1)
 * Uses a combination of actual distance (when available) and prefix matching
 */
export function getZipProximityScore(zip1: string, zip2: string): number {
  if (zip1 === zip2) return 1.0

  // Try to calculate actual distance
  const distance = getZipDistance(zip1, zip2)

  if (distance !== null) {
    // Convert distance to score
    // 0 km = 1.0, 5 km = 0.8, 10 km = 0.5, 20 km = 0.2, 30+ km = 0.1
    if (distance <= 1) return 1.0
    if (distance <= 5) return 0.8 + (0.2 * (5 - distance) / 4)
    if (distance <= 10) return 0.5 + (0.3 * (10 - distance) / 5)
    if (distance <= 20) return 0.2 + (0.3 * (20 - distance) / 10)
    if (distance <= 30) return 0.1 + (0.1 * (30 - distance) / 10)
    return 0.1
  }

  // Fallback to prefix matching for unknown zip codes
  // Give more weight to earlier matching digits
  let score = 0
  const weights = [0.4, 0.3, 0.2, 0.1, 0.05] // Weights for each digit position

  for (let i = 0; i < Math.min(zip1.length, zip2.length, weights.length); i++) {
    if (zip1[i] === zip2[i]) {
      score += weights[i]
    } else {
      break // Stop once digits don't match
    }
  }

  return Math.min(1, score)
}

/**
 * Determine if two zip codes are in the same general area
 * (within reasonable distance for regular social meetups)
 */
export function areZipsNearby(zip1: string, zip2: string, maxDistanceKm: number = 10): boolean {
  const distance = getZipDistance(zip1, zip2)

  if (distance !== null) {
    return distance <= maxDistanceKm
  }

  // Fallback: consider them nearby if they share at least 3 prefix digits
  if (zip1.substring(0, 3) === zip2.substring(0, 3)) {
    return true
  }

  return false
}

/**
 * Get all zip codes within a certain distance of a given zip
 */
export function getNearbyZips(zip: string, maxDistanceKm: number = 10): string[] {
  const nearbyZips: string[] = []

  for (const candidateZip of Object.keys(ZIP_COORDINATES)) {
    if (candidateZip !== zip && areZipsNearby(zip, candidateZip, maxDistanceKm)) {
      nearbyZips.push(candidateZip)
    }
  }

  return nearbyZips
}

/**
 * Group zip codes by geographic clusters
 * Useful for organizing group events
 */
export function clusterZipCodes(zips: string[], maxDistanceKm: number = 5): Map<string, string[]> {
  const clusters = new Map<string, string[]>()
  const assigned = new Set<string>()

  for (const zip of zips) {
    if (assigned.has(zip)) continue

    // Start a new cluster with this zip
    const cluster = [zip]
    assigned.add(zip)

    // Find all other zips within distance
    for (const otherZip of zips) {
      if (!assigned.has(otherZip) && areZipsNearby(zip, otherZip, maxDistanceKm)) {
        cluster.push(otherZip)
        assigned.add(otherZip)
      }
    }

    clusters.set(zip, cluster)
  }

  return clusters
}