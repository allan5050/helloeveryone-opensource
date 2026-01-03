# HelloEveryone Documentation Index

## Quick Start

For immediate development setup, see:
1. **[CLAUDE.md](../CLAUDE.md)** - Main project overview and development commands
2. **[DATABASE_SETUP.md](database/DATABASE_SETUP.md)** - Database initialization
3. **[.env.example](../.env.example)** - Environment configuration

## Documentation Structure

```
docs/
├── INDEX.md                    # This file - documentation navigation
├── architecture/               # System design & API docs
│   ├── ARCHITECTURE.md        # System architecture overview
│   └── API_ROUTES.md          # API endpoint documentation
├── database/                   # Database documentation
│   ├── DATABASE_SCHEMA.md     # Tables, relationships, policies
│   ├── DATABASE_SETUP.md      # Setup and initialization
│   └── rls-policies.md        # Row Level Security docs
├── development/                # Development guides
│   ├── AUTHENTICATION.md      # Auth system documentation
│   ├── COMPONENTS.md          # React component patterns
│   ├── HOOKS.md               # Custom React hooks
│   ├── TESTING.md             # Testing strategy
│   ├── PWA.md                 # Progressive Web App
│   ├── DEPLOYMENT.md          # Deployment guide
│   ├── CI_CD_SUMMARY.md       # CI/CD pipeline docs
│   ├── CYBERSECURITY_SETUP.md # Security configuration
│   ├── MCP_DATABASE_TOOLS.md  # MCP tools documentation
│   └── DESIGN_MARKETING_GUIDE.md # Design guidelines
├── features/                   # Feature-specific documentation
│   ├── MATCHING_SYSTEM.md     # Matching algorithm details
│   └── RSVP_SYSTEM.md         # Event RSVP system
└── working_docs/              # Working documents (gitignored)
    ├── PROJECT_STATUS.md      # Current project status
    ├── planning/              # Implementation plans
    ├── issues/                # Known issues & fixes
    ├── checklists/            # Testing & deployment checklists
    ├── demo/                  # Demo scripts & narratives
    └── setup/                 # Setup troubleshooting
```

## Core Documentation

### Architecture & Design

| Document | Purpose |
|----------|---------|
| **[ARCHITECTURE.md](architecture/ARCHITECTURE.md)** | System architecture, tech stack, directory structure |
| **[API_ROUTES.md](architecture/API_ROUTES.md)** | Complete API documentation with examples |

### Database

| Document | Purpose |
|----------|---------|
| **[DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md)** | Tables, relationships, RLS policies |
| **[DATABASE_SETUP.md](database/DATABASE_SETUP.md)** | Database initialization and configuration |
| **[rls-policies.md](database/rls-policies.md)** | Row Level Security documentation |

### Development Guides

| Document | Purpose |
|----------|---------|
| **[AUTHENTICATION.md](development/AUTHENTICATION.md)** | Auth system, server/client auth, OAuth |
| **[COMPONENTS.md](development/COMPONENTS.md)** | Component structure, guidelines, patterns |
| **[HOOKS.md](development/HOOKS.md)** | Custom React hooks documentation |
| **[TESTING.md](development/TESTING.md)** | Testing strategy and examples |
| **[PWA.md](development/PWA.md)** | Progressive Web App features |
| **[DEPLOYMENT.md](development/DEPLOYMENT.md)** | Deployment configuration |
| **[CI_CD_SUMMARY.md](development/CI_CD_SUMMARY.md)** | CI/CD pipeline documentation |
| **[CYBERSECURITY_SETUP.md](development/CYBERSECURITY_SETUP.md)** | Security setup guide |
| **[MCP_DATABASE_TOOLS.md](development/MCP_DATABASE_TOOLS.md)** | MCP tools for database access |

### Features

| Document | Purpose |
|----------|---------|
| **[MATCHING_SYSTEM.md](features/MATCHING_SYSTEM.md)** | Matching algorithms and scoring logic |
| **[RSVP_SYSTEM.md](features/RSVP_SYSTEM.md)** | Event RSVP functionality |

## Documentation by Use Case

### New Developer Onboarding

1. **Start Here**: [CLAUDE.md](../CLAUDE.md)
2. **Environment Setup**: [.env.example](../.env.example) → [DATABASE_SETUP.md](database/DATABASE_SETUP.md)
3. **Architecture Understanding**: [ARCHITECTURE.md](architecture/ARCHITECTURE.md)
4. **Development Flow**: [COMPONENTS.md](development/COMPONENTS.md) + [HOOKS.md](development/HOOKS.md)

### API Development

1. **API Overview**: [API_ROUTES.md](architecture/API_ROUTES.md)
2. **Authentication**: [AUTHENTICATION.md](development/AUTHENTICATION.md)
3. **Database Schema**: [DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md)
4. **Business Logic**: [MATCHING_SYSTEM.md](features/MATCHING_SYSTEM.md)

### Frontend Development

1. **Component Structure**: [COMPONENTS.md](development/COMPONENTS.md)
2. **State Management**: [HOOKS.md](development/HOOKS.md)
3. **Authentication**: [AUTHENTICATION.md](development/AUTHENTICATION.md)
4. **PWA Features**: [PWA.md](development/PWA.md)

### Database Development

1. **Schema Overview**: [DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md)
2. **Setup Guide**: [DATABASE_SETUP.md](database/DATABASE_SETUP.md)
3. **RLS Policies**: [rls-policies.md](database/rls-policies.md)
4. **Matching Logic**: [MATCHING_SYSTEM.md](features/MATCHING_SYSTEM.md)

### Testing & QA

1. **Testing Strategy**: [TESTING.md](development/TESTING.md)
2. **API Testing**: [API_ROUTES.md](architecture/API_ROUTES.md)
3. **CI/CD Pipeline**: [CI_CD_SUMMARY.md](development/CI_CD_SUMMARY.md)

### DevOps & Deployment

1. **Deployment Guide**: [DEPLOYMENT.md](development/DEPLOYMENT.md)
2. **CI/CD Setup**: [CI_CD_SUMMARY.md](development/CI_CD_SUMMARY.md)
3. **Security**: [CYBERSECURITY_SETUP.md](development/CYBERSECURITY_SETUP.md)
4. **Database Setup**: [DATABASE_SETUP.md](database/DATABASE_SETUP.md)

## Quick Reference

### Key Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript checking
npm run lint         # Code linting

# Database
npm run db:setup     # Initialize database
npm run db:seed      # Populate sample data

# Testing
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:coverage # Coverage report
npm run test:security # Security tests
```

### Environment Variables

**Required for Basic Functionality:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_API_KEY`

**Required for Full Features:**
- `OPENAI_API_KEY` (matching system)
- `DB_PASSWORD` (database setup)

**Optional Enhancements:**
- `GOOGLE_CLIENT_ID` (OAuth)
- `NEXT_PUBLIC_SENTRY_DSN` (monitoring)

## Working Documents

The `working_docs/` folder contains internal working documents that are not part of the public documentation:

- **planning/** - Implementation plans and roadmaps
- **issues/** - Known issues and fix documentation
- **checklists/** - Testing and deployment checklists
- **demo/** - Demo scripts and narratives
- **setup/** - Setup troubleshooting guides

These documents are for internal use and may be gitignored.

---

**Last Updated**: January 2026
**Documentation Version**: 2.0
