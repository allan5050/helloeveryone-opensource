# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source preparation: CI/CD workflows, security scanning, contribution guidelines
- All-contributors bot configuration for recognizing contributors
- Comprehensive GitHub issue templates (bug report, feature request, questions)
- Pull request template with quality checklists
- Secret scanner pre-commit hook to prevent API key leaks
- Security test suite (API key protection, authentication, injection prevention)
- CodeQL security analysis workflow
- Dependency review and automated updates (Dependabot)
- Auto-fix workflow for code formatting and linting

### Changed
- Project license set to MIT (open source)
- Made package public in package.json
- Improved documentation structure and contributor guidelines
- Enhanced README with badges, better Quick Start section

### Security
- Added secret scanning to prevent credential leaks
- Implemented comprehensive security tests
- Set up CodeQL for automated vulnerability detection
- Added dependency vulnerability scanning

## [0.1.0] - 2026-01-03

### Added
- Initial project setup with Next.js 15 and TypeScript
- Supabase authentication (email/password + Google OAuth)
- User profile creation and management
- Smart matching algorithm with semantic search (pgvector)
- Event creation and RSVP system
- Real-time chat functionality
- Progressive Web App (PWA) support
- Calendar export functionality (ICS format)
- Favorites system for saving potential matches
- Admin dashboard for event and user management
- Privacy-first mutual visibility system
- Database migrations and Row Level Security (RLS) policies

### Features
- AI-powered matching (40% interests, 30% bio similarity, 20% age, 10% location)
- Match scores displayed as percentages (0-100%)
- "People to Meet" recommendations at events
- Mobile-first responsive design with Tailwind CSS
- Development analytics dashboard for match algorithm tuning

### Infrastructure
- Deployed on Vercel Edge Network
- Supabase PostgreSQL database with pgvector extension
- OpenAI embeddings for semantic matching
- Automated testing with Jest and Playwright
- TypeScript for type safety
- ESLint and Prettier for code quality

---

## Release Guidelines

### Version Numbering (Semantic Versioning)

- **MAJOR** (1.0.0): Breaking changes that require user action
- **MINOR** (0.1.0): New features, backwards-compatible
- **PATCH** (0.0.1): Bug fixes, backwards-compatible

### Release Process

1. **Update CHANGELOG.md**:
   - Move items from "Unreleased" to new version section
   - Add release date
   - Group changes by type (Added, Changed, Deprecated, Removed, Fixed, Security)

2. **Version Bump**:
   ```bash
   npm version [major|minor|patch]
   ```

3. **Create Release**:
   - Tag commit with version number (e.g., `v0.1.0`)
   - Create GitHub Release with changelog content
   - Publish to npm (if applicable)

4. **Announce**:
   - Post in GitHub Discussions
   - Update production deployment

### Change Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes and improvements

### Example Entry

```markdown
## [1.2.0] - 2026-02-15

### Added
- Dark mode toggle in user settings (#123)
- Export matches to CSV feature (#145)

### Fixed
- Matching algorithm not considering age preferences (#156)
- Mobile navigation menu not closing on route change (#167)

### Security
- Updated dependencies to patch CVE-2024-12345
```

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [GitHub Releases](https://github.com/allan5050/helloeveryone/releases)

[Unreleased]: https://github.com/allan5050/helloeveryone/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/allan5050/helloeveryone/releases/tag/v0.1.0
