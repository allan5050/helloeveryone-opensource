# Components Documentation

## Overview

The components directory contains reusable React components organized by feature area. All
components follow React best practices and use TypeScript for type safety.

## Component Structure

```
components/
├── admin/              # Admin panel components
├── calendar/           # Calendar integration components
├── chat/               # Chat/messaging components
├── events/             # Event-related components
├── landing/            # Landing page components
├── matches/            # Match display components
├── matching/           # Matching UI components
├── navigation/         # Navigation components
├── profile/            # Profile components
├── ui/                 # Basic UI components (shadcn/ui style)
├── PWAInstallPrompt.tsx
└── PWAUpdatePrompt.tsx
```

## Admin Components

**Location:** `components/admin/`

- `AdminSidebar.tsx` - Admin panel navigation sidebar
- `AdminStats.tsx` - Statistics dashboard widget
- `AnalyticsDashboard.tsx` - Main analytics display
- `EngagementMetrics.tsx` - User engagement metrics
- `EventForm.tsx` - Event creation/editing form
- `EventsList.tsx` - Admin event management list
- `QuickActions.tsx` - Quick action buttons
- `RecentActivity.tsx` - Recent activity feed
- `UserActions.tsx` - User management actions
- `UsersList.tsx` - User management list
- `UsersSearch.tsx` - User search interface

### Chart Components

- `charts/EventCategoriesChart.tsx` - Event category distribution
- `charts/UserGrowthChart.tsx` - User growth over time

## Calendar Components

**Location:** `components/calendar/`

- `CalendarButton.tsx` - ICS download button for events

## Chat Components

**Location:** `components/chat/`

- `ChatWindow.tsx` - Main chat interface for messaging between users

## Event Components

**Location:** `components/events/`

Contains components for event browsing, display, and interaction.

## Landing Components

**Location:** `components/landing/`

Components specific to the landing page and marketing pages.

## Match Components

**Location:** `components/matches/`

Components for displaying match results and match-related UI.

## Matching Components

**Location:** `components/matching/`

- `MatchCard.tsx` - Individual match display card

## Navigation Components

**Location:** `components/navigation/`

Navigation-related components including headers, menus, and breadcrumbs.

## Profile Components

**Location:** `components/profile/`

User profile related components for viewing and editing profiles.

## UI Components

**Location:** `components/ui/`

Base UI components following the shadcn/ui pattern. These are low-level, reusable components that
other components build upon.

## PWA Components

**Root Level Components:**

- `PWAInstallPrompt.tsx` - Prompts users to install the PWA
- `PWAUpdatePrompt.tsx` - Notifies users when app updates are available

## Component Guidelines

### Client vs Server Components

- **Server Components**: Default for all components, used for data fetching and static rendering
- **Client Components**: Must use `'use client'` directive, used for interactivity, state
  management, and browser APIs

### Naming Conventions

- **PascalCase** for component files and component names
- **Descriptive names** that clearly indicate the component's purpose
- **Feature-based organization** rather than technical organization

### Type Safety

All components use TypeScript with proper typing:

```typescript
interface ComponentProps {
  // Define props with proper types
  userId: string
  onAction?: (id: string) => void
  children?: React.ReactNode
}

export function Component({ userId, onAction, children }: ComponentProps) {
  // Component implementation
}
```

### Styling

- **Tailwind CSS** for styling
- **shadcn/ui** patterns for base components
- **Responsive design** with mobile-first approach
- **Dark mode support** where applicable

### State Management

- **Local state**: `useState` for component-specific state
- **Global state**: Zustand stores for app-wide state
- **Server state**: React Query for API data
- **Auth state**: AuthContext for authentication

### Error Boundaries

Components should handle errors gracefully and provide fallback UI when appropriate.

### Accessibility

All components should follow accessibility best practices:

- Proper semantic HTML
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

## Component Development Workflow

1. **Create component** in appropriate feature directory
2. **Define TypeScript interface** for props
3. **Implement component** with proper error handling
4. **Add styling** using Tailwind CSS
5. **Test component** thoroughly
6. **Export from index** if it's meant to be reused

## Integration with Backend

Components integrate with the backend through:

- **Custom hooks** (`hooks/` directory)
- **API calls** via React Query
- **Server components** for direct database access
- **Form handling** with React Hook Form + Zod validation
