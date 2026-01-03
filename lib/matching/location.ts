export function calculateLocationScore(
  location1: string,
  location2: string
): number {
  if (!location1 || !location2) {
    return 0
  }

  const loc1 = location1.toLowerCase().trim()
  const loc2 = location2.toLowerCase().trim()

  if (loc1 === loc2) {
    return 1.0
  }

  // Extract city and state/country
  const parseLocation = (loc: string) => {
    const parts = loc.split(',').map(p => p.trim())
    return {
      city: parts[0] || '',
      state: parts[1] || '',
      full: loc,
    }
  }

  const parsed1 = parseLocation(loc1)
  const parsed2 = parseLocation(loc2)

  // Same city, different formatting
  if (parsed1.city === parsed2.city && parsed1.city) {
    return 0.95
  }

  // Same state/region
  if (parsed1.state === parsed2.state && parsed1.state) {
    // Check if they're nearby cities in same state
    const nearbyCities: Record<string, string[]> = {
      'san francisco': ['oakland', 'berkeley', 'palo alto', 'san jose'],
      oakland: ['san francisco', 'berkeley', 'fremont'],
      berkeley: ['san francisco', 'oakland'],
      'los angeles': ['santa monica', 'beverly hills', 'pasadena'],
      'new york': ['brooklyn', 'queens', 'manhattan'],
      brooklyn: ['new york', 'queens', 'manhattan'],
    }

    const city1 = parsed1.city
    const city2 = parsed2.city

    if (
      nearbyCities[city1]?.includes(city2) ||
      nearbyCities[city2]?.includes(city1)
    ) {
      return 0.7
    }

    // Same state but different cities
    return 0.5
  }

  // Different states/countries
  return 0.2
}
