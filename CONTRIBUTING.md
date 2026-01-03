# Contributing to HelloEveryone.fun

Thank you for your interest in contributing to HelloEveryone.fun! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Requirements](#testing-requirements)
- [Getting Help](#getting-help)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Git**: Latest version

### Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/helloeveryone.git
   cd helloeveryone
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/allan5050/helloeveryone-opensource.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment** (see [Development Setup](#development-setup))

---

## Development Setup

### 1. Environment Configuration

Copy the example environment file:
```bash
cp env.example .env.local
```

### 2. API Keys & Services

You'll need to set up the following services to run the app locally:

#### Required Services

**A. Supabase (Database & Auth)**
1. Create a free account at https://app.supabase.com
2. Create a new project (choose a region close to you)
3. Go to Settings > API
4. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings > API > service_role)
   - `DB_PASSWORD` (Settings > Database > Connection String)

5. Set up the database:
   ```bash
   npm run db:setup    # Creates tables and enables pgvector
   npm run db:seed     # Adds sample data
   ```

**B. OpenAI API (Semantic Matching)**
1. Create account at https://platform.openai.com
2. Go to API Keys section
3. Create a new API key
4. Add to `.env.local` as `OPENAI_API_KEY`
5. **Cost**: ~$0.50-$1.00/month for development (free $5 credit available)

**C. Anthropic API (Optional - AI Match Explanations)**
1. Create account at https://console.anthropic.com
2. Go to API Keys
3. Create a new key
4. Add to `.env.local` as `ANTHROPIC_API_KEY`
5. **Cost**: <$1/month for development (free $5 credit available)
6. **Can skip if**: You're working on UI, database, or non-AI features

#### Alternative: Demo Mode (No API Keys Required)

If you don't want to set up API keys right away:

1. Set in `.env.local`:
   ```bash
   NEXT_PUBLIC_ENABLE_DEMO_MODE=true
   ```
2. The app will use 25 mock profiles with pre-generated data
3. **Great for**: UI work, learning the codebase, testing non-matching features
4. **Limitations**: Can't test matching algorithm or AI features

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see the login page.

### 4. Verify Setup

Run these commands to verify everything is working:

```bash
npm run lint          # Should pass or show minor warnings
npm run type-check    # May show known errors (see PROJECT_STATUS.md)
npm run test          # May show some failing tests (we're working on it!)
```

Don't worry if some tests fail - we're actively improving the test suite.

---

## How to Contribute

### Finding Something to Work On

1. **Check Issues**: Browse [GitHub Issues](https://github.com/allan5050/helloeveryone-opensource/issues)
2. **Look for Labels**:
   - `good first issue` - Great for newcomers
   - `help wanted` - We'd love your help on these
   - `bug` - Something isn't working
   - `enhancement` - New feature or improvement
   - `documentation` - Documentation improvements

3. **Comment on the Issue**: Let us know you're working on it to avoid duplicate work

### Types of Contributions We Welcome

- **Bug fixes**: Fix broken functionality
- **Feature additions**: Implement new features from issues
- **UI/UX improvements**: Better design, accessibility, mobile experience
- **Performance optimizations**: Make the app faster
- **Tests**: Add or fix unit, integration, or E2E tests
- **Documentation**: Improve README, docs, code comments
- **Refactoring**: Improve code quality without changing behavior
- **Database improvements**: Schema optimizations, query performance
- **Security**: Fix vulnerabilities, improve auth/privacy

### Before You Start

1. **Open an issue first** for major changes (discuss approach)
2. **For minor fixes**: Feel free to just submit a PR
3. **Check PROJECT_STATUS.md**: Understand current state and known issues

---

## Pull Request Process

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/fixes

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style and patterns
- Add comments for complex logic
- Update documentation if needed
- Add tests for new features (if possible)

### 3. Test Your Changes

Before committing:

```bash
npm run lint          # Check for linting errors
npm run type-check    # Check TypeScript types
npm run test          # Run tests (some may fail - that's ok)
npm run build         # Ensure production build works
```

### 4. Commit Your Changes

Follow our [commit message guidelines](#commit-message-guidelines):

```bash
git add .
git commit -m "feat: add user profile photo upload"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

1. Go to https://github.com/allan5050/helloeveryone
2. Click "Pull Requests" > "New Pull Request"
3. Click "compare across forks"
4. Select your fork and branch
5. Fill out the PR template (auto-populated)
6. Submit the PR

### 7. PR Review Process

- **Primary Reviewer**: Allan (project owner)
- **Review SLA**: Acknowledgment within 48 hours, full review within 1 week
- **Approval Required**: All PRs require Allan's approval before merging
- **CI Must Pass**: Linting and type-check must pass
- **Changes Requested**: Address feedback and push updates
- **Merge**: Allan will merge approved PRs (squash merge to keep history clean)

### 8. After Your PR is Merged

1. Pull the latest changes:
   ```bash
   git checkout main
   git pull upstream main
   ```
2. Delete your feature branch:
   ```bash
   git branch -d feature/your-feature-name
   ```
3. Celebrate! You're now a contributor!

---

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define types** explicitly (avoid `any`)
- **Use interfaces** for object shapes
- **Prefer type safety** over shortcuts

```typescript
// Good
interface Profile {
  id: string;
  full_name: string;
  age: number;
}

function getProfile(id: string): Promise<Profile> {
  // ...
}

// Avoid
function getProfile(id: any): any {
  // ...
}
```

### Code Style

- **Formatting**: Use Prettier (runs automatically on save)
- **Linting**: Follow ESLint rules
- **Indentation**: 2 spaces (configured in `.editorconfig`)
- **Quotes**: Single quotes for strings (except JSX)
- **Semicolons**: Required

### File Organization

```
app/                    # Next.js pages (App Router)
components/            # Reusable React components
  ├── ui/             # Base UI components (buttons, inputs)
  └── features/       # Feature-specific components
lib/                   # Business logic, utilities
  ├── supabase/       # Database queries
  ├── matching/       # Matching algorithm
  └── api/            # API helpers
hooks/                 # Custom React hooks
types/                 # TypeScript type definitions
```

### React Components

- **Prefer functional components** with hooks
- **Use Server Components** by default (Next.js 15)
- **Mark Client Components** with `"use client"` when needed
- **Keep components small** and focused
- **Extract logic** into custom hooks when possible

```typescript
// Good - Server Component (default)
export default async function ProfilePage({ params }: Props) {
  const profile = await getProfile(params.id);
  return <ProfileView profile={profile} />;
}

// Good - Client Component (when needed)
"use client";
import { useState } from "react";

export default function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Database Queries

- **Use Supabase client** from `lib/supabase/client.ts`
- **Server-side**: Use `createClient()` from `@supabase/ssr`
- **Client-side**: Use `createBrowserClient()`
- **Parameterize queries** to prevent SQL injection
- **Use RLS policies** for security

### API Routes

- **File location**: `app/api/[route]/route.ts`
- **Export handlers**: `GET`, `POST`, `PUT`, `DELETE`
- **Validate input**: Use Zod schemas
- **Handle errors**: Return proper HTTP status codes
- **Require auth**: Use `requireAuth()` helper for protected routes

```typescript
// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(1),
  age: z.number().min(18),
});

export async function PUT(req: NextRequest) {
  const user = await requireAuth(req);

  const body = await req.json();
  const data = profileSchema.parse(body);

  // Update profile...

  return NextResponse.json({ success: true });
}
```

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or fixing tests
- `chore`: Maintenance tasks, dependencies
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
# Good commit messages
feat: add profile photo upload to settings page
fix: resolve infinite loop in RLS policy for profiles table
docs: update setup instructions in CONTRIBUTING.md
refactor: extract matching logic into separate service
test: add unit tests for interest matching algorithm
chore: update dependencies to latest versions

# Bad commit messages (avoid these)
fixed stuff
update
WIP
asdf
changed some files
```

### Scope (Optional)

Add scope for clarity:

```bash
feat(auth): add Google OAuth integration
fix(matching): correct age proximity calculation
docs(api): document all matching endpoints
```

---

## Testing Requirements

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests
```

### Test Guidelines

- **Write tests** for new features when possible
- **Update tests** when changing existing features
- **Don't worry** if some existing tests fail (we're fixing them!)
- **Test coverage**: Aim for >70% but not required for all PRs

### What to Test

**Unit Tests** (Jest):
- Business logic in `lib/`
- Utility functions
- Custom hooks
- API route handlers

**Integration Tests**:
- Database queries
- API endpoints
- Authentication flows

**E2E Tests** (Playwright):
- Critical user flows (signup, login, matching)
- Multi-step processes

### Test File Locations

```
tests/
  ├── unit/              # Unit tests
  ├── integration/       # Integration tests
  └── e2e/              # Playwright tests
```

---

## Getting Help

### Documentation

- **README.md**: Quick start and overview
- **docs/**: Comprehensive documentation (30+ docs)
- **CLAUDE.md**: AI/LLM development guide
- **PROJECT_STATUS.md**: Current status, known issues

### Community Support

- **GitHub Issues**: Ask questions, report bugs
- **GitHub Discussions**: General discussions (if enabled)
- **Discord**: Real-time chat with contributors (if shared)

### Common Questions

**Q: Tests are failing. Is that ok?**
A: Yes! We're actively improving the test suite. As long as your changes don't break additional tests, you're good.

**Q: TypeScript shows errors. Should I fix them?**
A: Check `PROJECT_STATUS.md` for known type errors. Don't need to fix existing errors, but don't add new ones.

**Q: Do I need all the API keys?**
A: No! Use `NEXT_PUBLIC_ENABLE_DEMO_MODE=true` to develop without keys. Only need real keys for matching algorithm work.

**Q: How long before my PR is reviewed?**
A: Allan aims to acknowledge within 48 hours and provide full review within 1 week.

**Q: Can I work on multiple PRs at once?**
A: Yes! Just use separate branches for each PR.

**Q: What if I disagree with a review decision?**
A: Discuss respectfully in the PR. Allan makes final decisions as project owner.

---

## Project Vision & Architecture

### Vision

HelloEveryone.fun helps busy adults (25-50) find meaningful friendships through intelligent matching at local events. We solve the problem of wasting time talking to incompatible people by showing you exactly who to meet.

### Core Principles

1. **Privacy First**: Mutual visibility - you can't filter by what you don't share
2. **Simple & Fast**: Match computation <100ms, page load <2s
3. **AI-Powered**: Smart matching using semantic embeddings
4. **Universal Access**: PWA works on all devices, no app store needed
5. **Real Connections**: Focus on in-person events, not endless chatting

### Architecture Decisions

- **Next.js 15**: App Router for better performance
- **Supabase**: PostgreSQL + pgvector for semantic search
- **Vercel**: Edge deployment, automatic CI/CD
- **TypeScript**: Type safety prevents bugs
- **Tailwind CSS**: Rapid UI development

For detailed architecture info, see `docs/ARCHITECTURE.md`.

---

## Recognition

All contributors will be:
- Listed in GitHub contributors
- Mentioned in release notes (for significant contributions)
- Part of an amazing community building something meaningful!

Your GitHub contribution graph will reflect your work, which is great for your portfolio and job applications.

---

## License

By contributing to HelloEveryone.fun, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

## Questions or Concerns?

If something in this guide is unclear or you have suggestions for improvement:

1. Open an issue with `documentation` label
2. Submit a PR to improve this document
3. Reach out to Allan on LinkedIn

Thank you for contributing to HelloEveryone.fun! Together we're helping people make real friends. 🤝

---

**Last Updated**: 2026-01-03
