# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

HelloEveryone.fun is a smart social matching platform that helps busy adults (25-50) find meaningful
connections through intelligent matching at local events. Built with Next.js 14, Supabase, and
TypeScript.

**Production URL**: https://helloeveryone.vercel.app  
**GitHub**: allan5050/helloeveryone

## Key Development Commands

### Development

```bash
npm run dev          # Start Next.js dev server on http://localhost:3000
npm run build        # Build production application
npm run start        # Start production server
```

### Testing & Quality

```bash
npm run test         # Run Jest unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run Playwright end-to-end tests
npm run test:integration  # Run integration tests
npm run test:security # Run security tests
npm run lint         # Run Next.js linter
npm run lint:fix     # Auto-fix linting errors
npm run type-check   # Run TypeScript type checking (tsc --noEmit)
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
```

### Database

```bash
npm run db:setup     # Initialize database tables and enable pgvector
npm run db:seed      # Populate database with sample data
npm run export-demo  # Export demo data for testing
```

### Security

```bash
npm run security:audit # Check for vulnerabilities (npm audit)
npm run security:fix   # Auto-fix vulnerabilities
npm run security:scan  # Run secret detection scan
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, PWA-enabled
- **Database**: Supabase (PostgreSQL with pgvector for semantic matching)
- **Matching Engine**: pgvector for semantic search with OpenAI embeddings
- **Auth**: Supabase Auth with AuthContext provider (email/password + Google OAuth)
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form with Zod validation
- **Typography**: Inter font (Google Fonts)
- **Deployment**: Vercel (automatic deployments from GitHub)

### Project Structure

```
app/                 # Next.js App Router pages
├── (public)/       # Public pages (login, signup, reset-password)
├── (dashboard)/    # Protected pages (events, profile, matches, chat)
├── api/           # API routes for matching, calendar, webhooks
├── auth/callback/ # OAuth callback handler
├── contexts/      # React contexts (AuthContext)
├── components/    # App-specific components (LogoutButton, ProtectedRoute)
components/         # Shared React components organized by feature
lib/               # Core business logic
├── supabase/      # Database client & queries
├── api/auth.ts    # Server-side auth helpers (requireAuth, getCurrentUser)
├── matching/      # Matching algorithms
├── calendar/      # ICS generation
hooks/             # Custom React hooks
types/             # TypeScript type definitions
```

### Path Aliases

- `@/*` maps to root directory
- `@/components/*`, `@/lib/*`, `@/hooks/*`, `@/types/*` for clean imports

## Core Features & Implementation

### Matching Algorithm

The matching system uses a sophisticated scoring algorithm:

- 40% common interests (exact and fuzzy matching)
- 30% bio semantic similarity (using pgvector cosine distance)
- 20% age proximity (±5 years optimal)
- 10% location and availability

Match scores must compute in <100ms. Uses materialized views for caching.

### Privacy-First Design

- **Mutual Visibility**: Users can only filter by fields they share
- **Progressive Disclosure**: Information revealed gradually as trust builds
- All tables have Row Level Security (RLS) policies
- Never expose raw embeddings or internal scores

### Database Schema

Key tables: `profiles`, `events`, `rsvps`, `favorites`, `messages`, `match_scores`

- Uses pgvector extension for semantic search
- JSONB for flexible profile fields and interests
- Materialized views for performance optimization

### PWA Requirements

- Manifest at `/public/manifest.json`
- Service worker via next-pwa
- Mobile-first responsive design
- Offline capability for critical features

## Development Guidelines

### Code Conventions

- Strict TypeScript (`strict: true` in tsconfig.json)
- Path aliases for clean imports
- Component-based architecture with feature organization
- Server components by default, client components when needed

### Testing Strategy

- Unit tests with Jest for business logic
- Integration tests for API endpoints
- E2E tests with Playwright for critical user flows
- Test coverage target: >80%

### Performance Targets

- Page load: <2s on 3G
- Match computation: <100ms
- PWA score: >90
- Bundle size optimization with code splitting

### Specialized Agents

The `.claude/agents/` directory contains specialized agent configurations:

- **db-architect**: Database schema, migrations, pgvector optimization
- **api-engineer**: Next.js API routes, Supabase queries, OpenAI integration
- **frontend-builder**: React/Next.js UI, Tailwind CSS, PWA features
- **match-engineer**: Matching algorithms, scoring, recommendations
- **privacy-guardian**: Privacy controls, GDPR compliance, RLS policies
- **test-engineer**: Testing strategy, Jest, Playwright
- **devops-engineer**: Vercel deployment, environment management
- **integration-specialist**: Calendar systems, file uploads, third-party services

## Important Notes

- **Never commit secrets or API keys** - use environment variables (`.env.local`, never `.env`)
- **All database changes require proper migrations** - create migration files in `supabase/migrations/`
- **Follow mutual visibility rules** for all matching features - users can only filter by fields they share
- **Prioritize mobile experience** - PWA-first approach, test on mobile viewports
- **Use ICS files for calendar integration** - no OAuth complexity, universal compatibility
- **Current Status**: ~80% complete with 68 TypeScript errors and test suite improvements needed (see `docs/working_docs/PROJECT_STATUS.md`)

## Authentication Implementation

- **Auth Provider**: `app/contexts/AuthContext.tsx` - Client-side auth state management
- **Server Auth**: `lib/api/auth.ts` - Server-side auth helpers (requireAuth, getCurrentUser)
- **Auth Routes**: `/login`, `/signup`, `/auth/reset-password`
- **Protected Routes**: Use `ProtectedRoute` component or `requireAuth()` helper
- **Session Management**: Automatic via Supabase Auth with cookie-based sessions
- **OAuth**: Google OAuth ready (requires Google Client ID configuration)

## Database Access (MCP Tools)

The `mcp/` folder contains Model Context Protocol tools for direct database access:

```bash
# Quick database context for LLMs
node mcp/quick-start.js

# Interactive query mode
node mcp/query.js

# Export complete schema
node mcp/get-schema.js json      # Machine-readable JSON
node mcp/get-schema.js markdown  # Human-readable documentation

# Database inspection
node mcp/inspect-db.js

# Query shortcuts
node mcp/query.js :tables        # List all tables
node mcp/query.js :count profiles  # Get row count
node mcp/query.js :sample events 3 # Sample data
```

**Key Files:**
- `mcp/db-client.js` - Database connection and utility methods
- `mcp/schema.json` - Auto-generated complete database schema
- `mcp/README.md` - Full documentation for MCP tools

Use these tools to autonomously query and understand the database without manual schema sharing.

## Documentation

The `docs/` folder contains comprehensive project documentation organized by category:

```
docs/
├── INDEX.md                    # Start here - documentation navigation
├── architecture/               # System design docs
│   ├── ARCHITECTURE.md        # System architecture and design patterns
│   └── API_ROUTES.md          # API endpoint documentation
├── database/                   # Database documentation
│   ├── DATABASE_SCHEMA.md     # Tables, relationships, RLS policies
│   ├── DATABASE_SETUP.md      # Database initialization guide
│   └── rls-policies.md        # Row Level Security documentation
├── development/                # Development guides
│   ├── AUTHENTICATION.md      # Auth flow and session management
│   ├── COMPONENTS.md          # React component hierarchy
│   ├── HOOKS.md               # Custom React hooks documentation
│   ├── TESTING.md             # Testing strategy and guidelines
│   ├── PWA.md                 # Progressive Web App implementation
│   ├── DEPLOYMENT.md          # Deployment process and configuration
│   ├── CI_CD_SUMMARY.md       # CI/CD pipeline documentation
│   ├── CYBERSECURITY_SETUP.md # Security configuration
│   └── MCP_DATABASE_TOOLS.md  # MCP tools for database access
├── features/                   # Feature-specific documentation
│   ├── MATCHING_SYSTEM.md     # AI-powered matching algorithm
│   └── RSVP_SYSTEM.md         # Event RSVP functionality
└── working_docs/              # Internal working documents (gitignored)
    ├── PROJECT_STATUS.md      # Current project status
    ├── planning/              # Implementation plans and roadmaps
    ├── issues/                # Known issues and fix documentation
    ├── checklists/            # Testing and deployment checklists
    ├── demo/                  # Demo scripts and narratives
    └── setup/                 # Setup troubleshooting guides
```

### Documentation Maintenance

**Before committing changes**, update relevant documentation in `docs/` if you've:
- Added or modified API endpoints → update `docs/architecture/API_ROUTES.md`
- Changed database schema → update `docs/database/DATABASE_SCHEMA.md`
- Added new components or hooks → update `docs/development/COMPONENTS.md` or `HOOKS.md`
- Modified authentication flow → update `docs/development/AUTHENTICATION.md`
- Changed matching algorithm → update `docs/features/MATCHING_SYSTEM.md`
- Added new features → consider adding to relevant docs or creating new ones

This keeps documentation in sync with code and helps future contributors understand the system.

## Environment Variables

Required in `.env.local` and Vercel:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For admin operations
DB_PASSWORD=your-database-password  # Required for MCP tools

# AI APIs (Required for matching)
OPENAI_API_KEY=sk-your-key  # For semantic embeddings
ANTHROPIC_API_KEY=sk-ant-your-key  # For AI match explanations (optional)

# Demo Mode (Optional - for development without API keys)
NEXT_PUBLIC_ENABLE_DEMO_MODE=true  # Use mock data instead of real database
```

**See `env.example` for complete environment variable documentation.**

**Note**: `.env` files are gitignored. Never commit API keys to the repository.

## Known Issues & Current Limitations

Before making changes, be aware of these current issues (see `docs/working_docs/PROJECT_STATUS.md` for details):

### TypeScript Errors (68 errors)
- **Photo/Avatar URL mismatches**: Code references `photo_url` vs `avatar_url` inconsistently
- **Event type missing properties**: `date`, `event_type`, `capacity`, `host` not in type definition
- **Profile schema gaps**: `is_profile_complete`, `privacy_settings` missing from TypeScript types
- **Impact**: Production builds succeed but type safety is compromised

### Test Suite (42/126 passing - 33%)
- Test framework configuration mixing vitest and Jest
- Database schema changes not reflected in test fixtures
- Mock structure mismatches with actual implementation
- **Note**: Don't worry if tests fail - we're actively fixing this

### Database Schema
- Recent migrations added columns that TypeScript types haven't caught up with
- Run migrations before testing: `npm run db:setup`
- Check current schema with: `node mcp/inspect-db.js`

When in doubt, consult `docs/working_docs/PROJECT_STATUS.md` for the latest information on blockers and workarounds.

## Github Guidelines
Do not mention Claude or co-authors in commit messages or pushes to github.
Do not include hardcoded API keys, secrets, or sensitive information in code or code comments.