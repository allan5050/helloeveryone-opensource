# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

HelloEveryone.fun is a smart social matching platform that helps busy adults (25-50) find meaningful
connections through intelligent matching at local events. Built with Next.js 15, Supabase, and
TypeScript.

**Production URL**: https://helloeveryone.vercel.app
**GitHub**: allan5050/helloeveryone

## Key Development Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000
npm run build            # Build production (also validates types)
npm run type-check       # TypeScript check without build

# Testing
npm test                 # Run all Jest tests
npm test -- path/to/file.test.ts   # Run single test file
npm test -- --testNamePattern="test name"  # Run specific test
npm run test:watch       # Watch mode
npm run test:e2e         # Playwright E2E tests
npm run test:security    # Security-focused tests

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint errors
npm run format           # Prettier format all files

# Database
npm run db:setup         # Initialize tables + pgvector
npm run db:seed          # Populate sample data
node mcp/query.js :tables    # Quick schema inspection
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, PWA-enabled
- **Database**: Supabase (PostgreSQL + pgvector for semantic matching)
- **Auth**: Supabase Auth with `AuthContext` provider
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel (auto-deploy from GitHub)

### Project Structure

```
app/
├── (public)/           # Unauthenticated routes (login, signup)
├── (protected)/        # Authenticated routes (dashboard, events, matches, profile, chat)
├── api/                # API routes
├── contexts/           # React contexts (AuthContext)
├── components/         # App-specific components
components/             # Shared UI components by feature
lib/
├── supabase/           # Database client & queries
├── api/auth.ts         # Server-side auth (requireAuth, getCurrentUser)
├── matching/           # Match scoring algorithms
├── privacy/            # Mutual visibility logic
hooks/                  # Custom React hooks
types/                  # TypeScript definitions (profile.ts, event.ts, index.ts)
mcp/                    # Database introspection tools for LLMs
```

### Path Aliases

Use `@/*` for imports: `@/components/*`, `@/lib/*`, `@/hooks/*`, `@/types/*`

## Core Features & Implementation

### Matching Algorithm

Located in `lib/matching/`. Scoring breakdown:

- 40% common interests (exact + fuzzy matching)
- 30% bio semantic similarity (pgvector cosine distance)
- 20% age proximity (±5 years optimal)
- 10% location and availability

Performance target: <100ms computation. Uses materialized views for caching.

### Privacy-First Design (Mutual Visibility)

Implemented in `lib/privacy/mutual-visibility.ts`. Key rule: **users can only filter by fields they
share**. All tables have Row Level Security (RLS) policies. Never expose raw embeddings or internal
scores to clients.

### Database Schema

Key tables: `profiles`, `events`, `rsvps`, `favorites`, `messages`, `match_scores`

- pgvector extension for semantic search
- JSONB for flexible interests/preferences
- Inspect schema: `node mcp/inspect-db.js` or `node mcp/get-schema.js markdown`

## Development Guidelines

- Strict TypeScript (`strict: true`)
- Server components by default, `'use client'` when needed
- Database changes require migrations in `supabase/migrations/`
- Follow mutual visibility rules for all matching/filtering features
- PWA-first: mobile-responsive, offline-capable for critical features

## Authentication

- **Client**: `app/contexts/AuthContext.tsx` - auth state provider
- **Server**: `lib/api/auth.ts` - `requireAuth()`, `getCurrentUser()` helpers
- **Routes**: `/login`, `/signup`, `/auth/reset-password`
- **Protection**: Use `ProtectedRoute` component or server-side `requireAuth()`

## Database Access (MCP Tools)

The `mcp/` folder provides database introspection tools:

```bash
node mcp/query.js :tables        # List all tables
node mcp/query.js :count profiles  # Row counts
node mcp/query.js :sample events 3 # Sample data
node mcp/inspect-db.js           # Full inspection
node mcp/get-schema.js markdown  # Export schema docs
```

## Documentation

See `docs/INDEX.md` for full documentation navigation. Key docs:

- `docs/architecture/API_ROUTES.md` - API endpoint reference
- `docs/database/DATABASE_SCHEMA.md` - Tables, relationships, RLS
- `docs/features/MATCHING_SYSTEM.md` - Matching algorithm details
- `docs/working_docs/PROJECT_STATUS.md` - Current status and known issues

## Environment Variables

Required in `.env.local` (see `env.example` for full list):

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-key  # For semantic embeddings

# Optional
ANTHROPIC_API_KEY=sk-ant-...  # For AI match explanations
DB_PASSWORD=...               # For MCP tools
NEXT_PUBLIC_ENABLE_DEMO_MODE=true  # Use mock data (no API keys needed)
```

## Type Definitions

Types are in `types/` directory. Key files:

- `types/profile.ts` - User profile with `Profile`, `ProfileInsert`, `ProfileUpdate`
- `types/event.ts` - Events with `Event`, `EventWithDetails`
- `types/index.ts` - Re-exports and shared types

If you encounter type mismatches with database columns, check `types/database.generated.ts` or
inspect the actual schema with `node mcp/inspect-db.js`.

## GitHub Guidelines

Do not mention Claude Code or AI assistants in commit messages. Do not include hardcoded API keys or
secrets in code or comments.
