// ZIP code to coordinates mapping (simplified - in production, use a proper geocoding API)
// This includes major US ZIP codes
const ZIP_COORDS: Record<string, { lat: number; lng: number }> = {
  // San Francisco Bay Area
  '94103': { lat: 37.7726, lng: -122.4099 }, // San Francisco - SOMA
  '94102': { lat: 37.7795, lng: -122.4187 }, // San Francisco - Tenderloin
  '94104': { lat: 37.7916, lng: -122.4010 }, // San Francisco - Financial District
  '94105': { lat: 37.7864, lng: -122.3892 }, // San Francisco - Embarcadero
  '94107': { lat: 37.7599, lng: -122.3997 }, // San Francisco - Potrero Hill
  '94108': { lat: 37.7929, lng: -122.4093 }, // San Francisco - Chinatown
  '94109': { lat: 37.7930, lng: -122.4213 }, // San Francisco - Polk Gulch
  '94110': { lat: 37.7484, lng: -122.4156 }, // San Francisco - Mission
  '94111': { lat: 37.7986, lng: -122.3999 }, // San Francisco - Embarcadero
  '94112': { lat: 37.7205, lng: -122.4419 }, // San Francisco - Sunnyside
  '94114': { lat: 37.7583, lng: -122.4353 }, // San Francisco - Castro
  '94115': { lat: 37.7861, lng: -122.4381 }, // San Francisco - Western Addition
  '94116': { lat: 37.7436, lng: -122.4859 }, // San Francisco - Parkside
  '94117': { lat: 37.7706, lng: -122.4477 }, // San Francisco - Haight-Ashbury
  '94118': { lat: 37.7821, lng: -122.4624 }, // San Francisco - Inner Richmond
  '94121': { lat: 37.7764, lng: -122.4941 }, // San Francisco - Outer Richmond
  '94122': { lat: 37.7589, lng: -122.4764 }, // San Francisco - Sunset
  '94123': { lat: 37.8007, lng: -122.4382 }, // San Francisco - Marina
  '94124': { lat: 37.7322, lng: -122.3937 }, // San Francisco - Bayview
  '94127': { lat: 37.7357, lng: -122.4593 }, // San Francisco - West Portal
  '94131': { lat: 37.7417, lng: -122.4371 }, // San Francisco - Twin Peaks
  '94132': { lat: 37.7235, lng: -122.4799 }, // San Francisco - Lake Merced
  '94133': { lat: 37.8019, lng: -122.4108 }, // San Francisco - North Beach
  '94134': { lat: 37.7193, lng: -122.4129 }, // San Francisco - Visitacion Valley

  // Oakland
  '94601': { lat: 37.7786, lng: -122.2157 }, // Oakland - Fruitvale
  '94602': { lat: 37.7717, lng: -122.2119 }, // Oakland
  '94606': { lat: 37.7908, lng: -122.2411 }, // Oakland
  '94607': { lat: 37.8054, lng: -122.2724 }, // Oakland - West Oakland
  '94608': { lat: 37.8307, lng: -122.2524 }, // Oakland - Emeryville border
  '94609': { lat: 37.8319, lng: -122.2577 }, // Oakland - Temescal
  '94610': { lat: 37.8114, lng: -122.2372 }, // Oakland - Lake Merritt
  '94611': { lat: 37.8331, lng: -122.1987 }, // Oakland - Piedmont
  '94612': { lat: 37.8109, lng: -122.2710 }, // Oakland - Downtown

  // San Jose
  '95110': { lat: 37.3382, lng: -121.8863 }, // San Jose - Downtown
  '95112': { lat: 37.3541, lng: -121.8833 }, // San Jose - Downtown
  '95113': { lat: 37.3339, lng: -121.8895 }, // San Jose - Downtown
  '95116': { lat: 37.3528, lng: -121.8542 }, // San Jose - Alum Rock
  '95117': { lat: 37.3086, lng: -121.9509 }, // San Jose - West San Jose
  '95118': { lat: 37.2484, lng: -121.8842 }, // San Jose - Almaden
  '95119': { lat: 37.2292, lng: -121.7821 }, // San Jose
  '95120': { lat: 37.2096, lng: -121.8356 }, // San Jose - Almaden Valley
  '95121': { lat: 37.3037, lng: -121.8167 }, // San Jose - Evergreen
  '95122': { lat: 37.3266, lng: -121.8268 }, // San Jose - East San Jose
  '95123': { lat: 37.2445, lng: -121.8305 }, // San Jose - Blossom Valley
  '95124': { lat: 37.2593, lng: -121.9024 }, // San Jose - Cambrian
  '95125': { lat: 37.2939, lng: -121.8968 }, // San Jose - Willow Glen
  '95126': { lat: 37.3241, lng: -121.9121 }, // San Jose - West San Jose
  '95127': { lat: 37.3661, lng: -121.8277 }, // San Jose - Alum Rock
  '95128': { lat: 37.3152, lng: -121.9316 }, // San Jose - Santana Row

  // Berkeley
  '94702': { lat: 37.8652, lng: -122.2859 }, // Berkeley - South
  '94703': { lat: 37.8578, lng: -122.2769 }, // Berkeley - West
  '94704': { lat: 37.8673, lng: -122.2567 }, // Berkeley - Central
  '94705': { lat: 37.8580, lng: -122.2404 }, // Berkeley - Claremont
  '94707': { lat: 37.8896, lng: -122.2994 }, // Berkeley - Hills
  '94708': { lat: 37.8895, lng: -122.2643 }, // Berkeley - North
  '94709': { lat: 37.8761, lng: -122.2677 }, // Berkeley - North
  '94710': { lat: 37.8680, lng: -122.2990 }, // Berkeley - West
  '94720': { lat: 37.8719, lng: -122.2585 }, // Berkeley - UC Berkeley

  // Palo Alto
  '94301': { lat: 37.4436, lng: -122.1495 }, // Palo Alto - Downtown
  '94303': { lat: 37.4179, lng: -122.1228 }, // Palo Alto - Midtown
  '94304': { lat: 37.4335, lng: -122.1163 }, // Palo Alto - Stanford
  '94305': { lat: 37.4291, lng: -122.1714 }, // Palo Alto - Stanford Campus
  '94306': { lat: 37.4276, lng: -122.1472 }, // Palo Alto - South

  // Add more ZIP codes as needed...
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in miles
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two ZIP codes
 * @param zip1 First ZIP code
 * @param zip2 Second ZIP code
 * @returns Distance in miles or null if ZIP codes not found
 */
export function calculateDistanceBetweenZips(zip1: string | null | undefined, zip2: string | null | undefined): number | null {
  if (!zip1 || !zip2) return null;

  // Clean ZIP codes (remove any non-numeric characters and trim to 5 digits)
  const cleanZip1 = zip1.toString().replace(/\D/g, '').slice(0, 5);
  const cleanZip2 = zip2.toString().replace(/\D/g, '').slice(0, 5);

  const coords1 = ZIP_COORDS[cleanZip1];
  const coords2 = ZIP_COORDS[cleanZip2];

  if (!coords1 || !coords2) return null;

  return Math.round(haversineDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng));
}

/**
 * Format distance for display
 * @param miles Distance in miles
 * @returns Formatted string
 */
export function formatDistance(miles: number | null): string {
  if (miles === null) return '';
  if (miles === 0) return 'Same area';
  if (miles === 1) return '1 mile away';
  return `${miles} miles away`;
}