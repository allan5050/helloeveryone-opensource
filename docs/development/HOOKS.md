# Custom Hooks Documentation

## Overview

The `hooks/` directory contains custom React hooks that encapsulate business logic, API calls, and common functionality used across the application.

## Available Hooks

```
hooks/
├── useCalendar.ts      # Calendar/ICS file operations
├── useEventMatches.ts  # Event-specific matching logic
├── useFavorites.ts     # User favorites management
├── useIsMobile.ts      # Mobile device detection
├── useMatching.ts      # Main matching functionality
└── useRSVP.ts         # Event RSVP operations
```

## useCalendar Hook

**Location:** `hooks/useCalendar.ts`

Handles calendar integration and ICS file generation for events.

### Interface

```typescript
interface UseCalendarReturn {
  downloadICS: (eventId: string) => Promise<void>
  isDownloading: boolean
  error: string | null
}

export function useCalendar(): UseCalendarReturn
```

### Usage

```typescript
import { useCalendar } from '@/hooks/useCalendar'

function EventCard({ eventId }: { eventId: string }) {
  const { downloadICS, isDownloading, error } = useCalendar()
  
  const handleDownload = () => {
    downloadICS(eventId)
  }
  
  return (
    <button 
      onClick={handleDownload} 
      disabled={isDownloading}
    >
      {isDownloading ? 'Downloading...' : 'Add to Calendar'}
    </button>
  )
}
```

### Features

- Downloads ICS files for events
- Includes event details and location
- Adds user's match information to event description
- Error handling for failed downloads
- Loading state management

## useEventMatches Hook

**Location:** `hooks/useEventMatches.ts`

Manages matches specific to event attendees.

### Interface

```typescript
interface EventMatch {
  id: string
  first_name: string
  age: number
  match_score: number
  shared_interests: string[]
  is_attending: boolean
}

interface UseEventMatchesReturn {
  matches: EventMatch[]
  isLoading: boolean
  error: string | null
  refreshMatches: () => Promise<void>
}

export function useEventMatches(eventId: string): UseEventMatchesReturn
```

### Usage

```typescript
import { useEventMatches } from '@/hooks/useEventMatches'

function EventPage({ eventId }: { eventId: string }) {
  const { matches, isLoading, error, refreshMatches } = useEventMatches(eventId)
  
  if (isLoading) return <div>Loading matches...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      <h2>People you might connect with:</h2>
      {matches.map(match => (
        <div key={match.id}>
          {match.first_name} - {match.match_score}% match
        </div>
      ))}
      <button onClick={refreshMatches}>Refresh Matches</button>
    </div>
  )
}
```

### Features

- Real-time match updates for events
- Filtering by event attendance
- Match score calculations
- Shared interests display
- Manual refresh capability

## useFavorites Hook

**Location:** `hooks/useFavorites.ts`

Manages user favorites (liked profiles).

### Interface

```typescript
interface UseFavoritesReturn {
  favorites: string[] // Array of user IDs
  isLoading: boolean
  error: string | null
  toggleFavorite: (userId: string) => Promise<void>
  isFavorite: (userId: string) => boolean
  removeFavorite: (userId: string) => Promise<void>
}

export function useFavorites(): UseFavoritesReturn
```

### Usage

```typescript
import { useFavorites } from '@/hooks/useFavorites'

function ProfileCard({ userId }: { userId: string }) {
  const { toggleFavorite, isFavorite, isLoading } = useFavorites()
  
  const handleToggle = () => {
    toggleFavorite(userId)
  }
  
  return (
    <button 
      onClick={handleToggle} 
      disabled={isLoading}
      className={isFavorite(userId) ? 'favorited' : ''}
    >
      {isFavorite(userId) ? '❤️' : '🤍'}
    </button>
  )
}
```

### Features

- Optimistic updates for better UX
- Persistent favorites storage
- Bulk operations support
- Error handling and rollback
- Real-time synchronization

## useIsMobile Hook

**Location:** `hooks/useIsMobile.ts`

Detects mobile devices and handles responsive behavior.

### Interface

```typescript
interface UseIsMobileReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export function useIsMobile(): UseIsMobileReturn
```

### Usage

```typescript
import { useIsMobile } from '@/hooks/useIsMobile'

function ResponsiveComponent() {
  const { isMobile, isTablet, isDesktop } = useIsMobile()
  
  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  )
}
```

### Features

- Window resize handling
- SSR-safe implementation
- Performance optimized
- Multiple breakpoint detection
- No layout shift during hydration

## useMatching Hook

**Location:** `hooks/useMatching.ts`

Main matching functionality for finding compatible users.

### Interface

```typescript
interface Match {
  id: string
  first_name: string
  age: number
  bio: string
  interests: string[]
  match_score: number
  shared_interests: string[]
  photos: string[]
  distance?: number
}

interface UseMatchingReturn {
  matches: Match[]
  isLoading: boolean
  isCalculating: boolean
  error: string | null
  calculateMatches: (options?: MatchOptions) => Promise<void>
  refreshMatches: () => Promise<void>
  hasMore: boolean
  loadMore: () => Promise<void>
}

export function useMatching(): UseMatchingReturn
```

### Usage

```typescript
import { useMatching } from '@/hooks/useMatching'

function MatchesPage() {
  const { 
    matches, 
    isLoading, 
    isCalculating, 
    calculateMatches, 
    loadMore,
    hasMore 
  } = useMatching()
  
  useEffect(() => {
    calculateMatches()
  }, [])
  
  if (isLoading) return <div>Finding your matches...</div>
  
  return (
    <div>
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={isCalculating}>
          Load More Matches
        </button>
      )}
    </div>
  )
}
```

### Features

- Advanced matching algorithms
- Pagination and infinite scroll
- Real-time match updates
- Filtering and sorting options
- Background calculation
- Cache management

### Match Options

```typescript
interface MatchOptions {
  limit?: number
  ageRange?: [number, number]
  maxDistance?: number
  forceRefresh?: boolean
  interests?: string[]
}
```

## useRSVP Hook

**Location:** `hooks/useRSVP.ts`

Manages event RSVP functionality.

### Interface

```typescript
type RSVPStatus = 'going' | 'maybe' | 'not_going' | null

interface UseRSVPReturn {
  rsvpStatus: RSVPStatus
  isLoading: boolean
  error: string | null
  updateRSVP: (eventId: string, status: RSVPStatus) => Promise<void>
  attendeeCount: number
  canRSVP: boolean
}

export function useRSVP(eventId: string): UseRSVPReturn
```

### Usage

```typescript
import { useRSVP } from '@/hooks/useRSVP'

function EventRSVP({ eventId }: { eventId: string }) {
  const { rsvpStatus, updateRSVP, isLoading, attendeeCount, canRSVP } = useRSVP(eventId)
  
  const handleRSVP = (status: RSVPStatus) => {
    updateRSVP(eventId, status)
  }
  
  if (!canRSVP) return <div>Event is full</div>
  
  return (
    <div>
      <p>{attendeeCount} people attending</p>
      <div>
        <button 
          onClick={() => handleRSVP('going')}
          disabled={isLoading}
          className={rsvpStatus === 'going' ? 'active' : ''}
        >
          Going
        </button>
        <button 
          onClick={() => handleRSVP('maybe')}
          disabled={isLoading}
          className={rsvpStatus === 'maybe' ? 'active' : ''}
        >
          Maybe
        </button>
        <button 
          onClick={() => handleRSVP('not_going')}
          disabled={isLoading}
          className={rsvpStatus === 'not_going' ? 'active' : ''}
        >
          Can't Go
        </button>
      </div>
    </div>
  )
}
```

### Features

- Real-time RSVP updates
- Capacity checking
- Waitlist management
- Social proof display
- Optimistic updates
- Error handling and rollback

## Hook Development Guidelines

### Performance Optimization

- Use `useMemo` for expensive calculations
- Implement proper dependency arrays
- Debounce API calls where appropriate
- Cache results when possible

### Error Handling

```typescript
const [error, setError] = useState<string | null>(null)

try {
  // API call
  setError(null)
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred')
}
```

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(false)

const performAction = async () => {
  setIsLoading(true)
  try {
    // Async operation
  } finally {
    setIsLoading(false)
  }
}
```

### TypeScript Best Practices

- Define proper interfaces for return types
- Use generic types where appropriate
- Provide default values for optional parameters
- Document complex type relationships

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMatching } from '@/hooks/useMatching'

test('should calculate matches', async () => {
  const { result } = renderHook(() => useMatching())
  
  await act(async () => {
    await result.current.calculateMatches()
  })
  
  expect(result.current.matches).toHaveLength(10)
})
```

## Integration with React Query

Many hooks use React Query for server state management:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

export function useMatching() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  const calculateMutation = useMutation({
    mutationFn: calculateMatches,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
  
  return {
    matches,
    isLoading,
    calculateMatches: calculateMutation.mutate,
  }
}
```

## Common Patterns

### Optimistic Updates

```typescript
const toggleFavorite = async (userId: string) => {
  // Optimistic update
  setFavorites(prev => 
    prev.includes(userId) 
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
  )
  
  try {
    await api.toggleFavorite(userId)
  } catch (error) {
    // Rollback on error
    setFavorites(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
    throw error
  }
}
```

### Debounced Operations

```typescript
import { useMemo } from 'react'
import { debounce } from 'lodash'

export function useSearch() {
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      // Perform search
    }, 300),
    []
  )
  
  return { search: debouncedSearch }
}
```