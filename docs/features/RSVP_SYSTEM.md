# RSVP System Implementation

This document describes the complete RSVP system implementation for HelloEveryone.fun.

## Overview

The RSVP system allows users to register their attendance for events with the following key
features:

- **Optimistic UI Updates**: Immediate visual feedback with rollback on errors
- **Capacity Management**: Strict enforcement of event capacity limits
- **Concurrent Safety**: Handles race conditions and multiple simultaneous RSVPs
- **Real-time Updates**: Live attendance count updates
- **Accessibility**: Full keyboard navigation and screen reader support
- **Mobile-first**: Responsive design optimized for mobile devices

## Architecture

### Components

1. **RSVPButton** (`components/events/RSVPButton.tsx`)
   - Main RSVP interaction component with optimistic updates
   - Handles loading states, error recovery, and accessibility
   - Shows capacity information and warnings

2. **RSVPButtonWithHook** (`components/events/RSVPButtonWithHook.tsx`)
   - Advanced version using custom hooks for better separation of concerns
   - Cleaner code structure and better testability

3. **EventList** (`components/events/EventList.tsx`)
   - Displays list of events with optional RSVP functionality
   - Supports loading states and empty states
   - Integrates with EventCard for individual event display

4. **RSVPDemo** (`components/events/RSVPDemo.tsx`)
   - Demonstration component showcasing all RSVP features
   - Interactive examples of different event states
   - Educational tool for understanding system capabilities

### API Routes

**POST/GET `/api/events/[eventId]/rsvp`**

- Handles RSVP creation, cancellation, and status retrieval
- Atomic capacity checking to prevent overbooking
- Returns updated attendee counts and user status

**GET `/api/events/[eventId]/attendees`**

- Retrieves list of attendees for an event
- Supports pagination
- Returns profile information for each attendee

### Custom Hooks

1. **useRSVP** (`hooks/useRSVP.ts`)
   - Handles API communication for RSVP operations
   - Provides loading states and error handling
   - Toast notifications for user feedback

### Database

**Supabase Function** (`supabase/migrations/20250904_handle_rsvp.sql`)

- PostgreSQL function for atomic RSVP operations
- Handles concurrent requests safely
- Updates attendee counts automatically
- Includes database triggers for consistency

## Features

### Optimistic UI Updates

The system provides immediate visual feedback when users interact with RSVP buttons:

1. Immediate UI update (optimistic)
2. API call in background
3. Sync with server response or rollback on error

### Capacity Management

Events have strict capacity limits enforced at multiple levels:

1. **Client-side Prevention**: UI prevents RSVP when event is full
2. **API-level Validation**: Server validates capacity before creating RSVPs
3. **Database Constraints**: Atomic operations prevent race conditions

### Visual States

The RSVP button shows different states:

- **Available**: "RSVP" button for events with capacity
- **Attending**: "Cancel RSVP" button for user's confirmed events
- **Event Full**: Disabled button when at capacity
- **Past Event**: Disabled button for expired events
- **Loading**: Spinner during API operations

### Capacity Warnings

Users receive visual warnings about event capacity:

- **Few spots left**: Orange text when ≤10 spots remain
- **Very few spots**: Emphasized when ≤5 spots remain
- **Event full**: Red badge when no spots available

## Usage Examples

### Basic RSVP Button

```tsx
import { RSVPButton } from '@/components/events/RSVPButton'

function EventPage({ event }: { event: EventWithRSVP }) {
  const handleRSVPChange = (newCount: number, status: string | null) => {
    // Handle RSVP state changes
  }

  return <RSVPButton event={event} onRSVPChange={handleRSVPChange} />
}
```

### Event List with RSVP

```tsx
import { EventList } from '@/components/events/EventList'

function EventsPage({ events }: { events: EventWithRSVP[] }) {
  return <EventList events={events} showRSVP={true} />
}
```

### Using RSVP Hooks

```tsx
import { useRSVP } from '@/hooks/useRSVP'

function CustomRSVPComponent({ event }: { event: EventWithRSVP }) {
  const { createRSVP, cancelRSVP, isLoading } = useRSVP(event.id)

  const handleRSVP = async () => {
    try {
      await createRSVP()
    } catch (error) {
      // Error handling
    }
  }

  return (
    <button onClick={handleRSVP} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'RSVP'}
    </button>
  )
}
```

## Testing

The RSVP system includes comprehensive tests:

### Unit Tests (`tests/rsvp.test.ts`)

- Component behavior testing
- Hook functionality testing
- Error scenario simulation

### Integration Tests (`tests/rsvp-integration.test.ts`)

- End-to-end RSVP flows
- Database consistency verification
- Race condition handling

### Concurrent Tests (`tests/rsvp-concurrent.test.ts`)

- Multiple users competing for spots
- Capacity limit enforcement
- Data consistency under load

## Security

### Authentication

- All RSVP operations require authentication
- User can only modify their own RSVPs
- Rate limiting on API endpoints

### Data Validation

- Server-side validation of all inputs
- SQL injection prevention
- Proper error handling

## Performance

### Optimistic Updates

- Immediate UI feedback reduces perceived latency
- Background API calls don't block user interaction
- Rollback mechanisms ensure data consistency

### Database Optimization

- Indexed foreign keys for fast lookups
- Atomic operations for consistency
- Database triggers for automatic updates

## Accessibility

The RSVP system follows accessibility best practices:

### Keyboard Navigation

- All buttons accessible via keyboard
- Proper tab order and focus management

### Screen Readers

- Proper ARIA labels and roles
- Status announcements for state changes

### Visual Design

- High contrast colors
- Minimum touch targets
- Clear loading and error states

## Files Created

### Components

- `components/events/RSVPButton.tsx` - Main RSVP button component
- `components/events/RSVPButtonWithHook.tsx` - Hook-based RSVP button
- `components/events/EventList.tsx` - Event list with RSVP support
- `components/events/RSVPDemo.tsx` - Demo showcase component

### API Routes

- `app/api/events/[eventId]/rsvp/route.ts` - RSVP handling endpoint
- `app/api/events/[eventId]/attendees/route.ts` - Attendees listing endpoint
- `app/api/events/rsvp/route.ts` - General RSVP endpoint

### Hooks

- `hooks/useRSVP.ts` - Custom RSVP management hook

### Database

- `supabase/migrations/20250904_handle_rsvp.sql` - Database function and schema

### Tests

- `tests/rsvp.test.ts` - Unit tests for RSVP functionality
- `tests/rsvp-integration.test.ts` - Integration tests
- `tests/rsvp-concurrent.test.ts` - Concurrent operation tests

## Next Steps

1. Test the system thoroughly in development
2. Deploy database migrations to production
3. Monitor RSVP performance and usage
4. Gather user feedback for improvements
5. Consider additional features like waitlists
