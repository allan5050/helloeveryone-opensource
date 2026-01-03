# CI/CD & Automation Summary

This document provides an overview of all CI/CD pipelines, automation, and workflows configured for HelloEveryone.fun.

## Quick Links

- [GitHub Actions Dashboard](https://github.com/allan5050/helloeveryone/actions)
- [Security Advisories](https://github.com/allan5050/helloeveryone/security)
- [Dependabot Alerts](https://github.com/allan5050/helloeveryone/security/dependabot)

---

## GitHub Actions Workflows

### Core CI/CD (`ci.yml`)

**Triggers**: Push to `main`/`develop`, Pull requests

| Job | Purpose | Blocks Merge |
|-----|---------|--------------|
| `lint-and-type-check` | ESLint, Prettier, TypeScript | Yes |
| `test` | Jest unit tests with coverage | Yes |
| `build` | Production build verification | Yes |
| `e2e-tests` | Playwright end-to-end tests | Yes (on main) |
| `security-scan` | npm audit + secret scanning | Yes |
| `deploy-preview` | Vercel preview deployment | No |
| `deploy-production` | Vercel production deployment | No |

### Security Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `codeql.yml` | Push, PR, Weekly schedule | Static code analysis for vulnerabilities |
| `dependency-review.yml` | PR to main | Check new dependencies for vulnerabilities |
| `security-review.yml` | PR touching auth/security files | Enhanced security review checklist |

### Automation Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `auto-fix.yml` | PR opened/updated | Auto-fix Prettier and ESLint issues |
| `auto-merge-dependabot.yml` | Dependabot PRs | Auto-merge safe dependency updates |
| `labeler.yml` | PR opened/updated | Auto-label PRs by files changed + size |
| `stale.yml` | Daily schedule | Mark and close inactive issues/PRs |
| `pr-comment.yml` | PR opened | Add test results and reviewer checklist |
| `pr-title-check.yml` | PR opened/edited | Enforce conventional commit format |
| `welcome.yml` | First issue/PR | Welcome first-time contributors |
| `release.yml` | Tag push (v*.*.*) | Generate releases with changelog |

---

## Pre-commit Hooks (Husky)

Located in `.husky/`:

### `pre-commit`
1. **Secret scanning** - Blocks commits containing API keys/secrets
2. **lint-staged** - Runs ESLint + Prettier on staged files
3. **Security tests** - Runs critical security test suite

### `commit-msg`
- Validates commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- Format: `type(scope): description`

---

## Automated Labels

### By Files Changed (`.github/labeler.yml`)
| Label | Trigger |
|-------|---------|
| `frontend` | Changes to `app/`, `components/`, `styles/` |
| `backend` | Changes to `app/api/`, `lib/`, `mcp/` |
| `database` | Changes to `supabase/`, database types |
| `documentation` | Changes to `*.md`, `docs/` |
| `testing` | Changes to `tests/`, test configs |
| `ci/cd` | Changes to `.github/`, `.husky/`, `scripts/` |
| `security` | Changes to security-related files |
| `matching` | Changes to matching algorithm |
| `config` | Changes to config files |
| `types` | Changes to TypeScript types |
| `hooks` | Changes to React hooks |

### By PR Size
| Label | Lines Changed |
|-------|---------------|
| `size/XS` | ≤10 lines |
| `size/S` | ≤100 lines |
| `size/M` | ≤500 lines |
| `size/L` | ≤1000 lines |
| `size/XL` | >1000 lines |

### Special Labels
| Label | Meaning |
|-------|---------|
| `first-contribution` | First-time contributor |
| `security-review` | Touches security-sensitive files |
| `major-update` | Major version dependency update |
| `stale` | No activity for 30+ days |

---

## Dependabot Configuration

**File**: `.github/dependabot.yml`

- **NPM updates**: Weekly on Mondays at 6 AM UTC
- **GitHub Actions updates**: Weekly on Mondays
- **Grouping**: Dev dependencies grouped, production patches grouped
- **Limits**: 5 open PRs max
- **Auto-merge**: Patch updates and minor dev dependencies

---

## Code Owners

**File**: `.github/CODEOWNERS`

All PRs require review from `@allan5050`. Specific areas:
- Security files require explicit security review
- API routes require backend review
- All configuration changes require owner review

---

## Recommended Branch Protection Rules

Configure these in **Settings → Branches → Add rule** for `main`:

### Required Settings
- [x] Require a pull request before merging
- [x] Require approvals (1)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require review from Code Owners
- [x] Require status checks to pass before merging
  - `lint-and-type-check`
  - `test`
  - `build`
  - `security-scan`
- [x] Require branches to be up to date before merging
- [x] Require conversation resolution before merging
- [x] Require signed commits (optional, recommended)

### Recommended Settings
- [x] Do not allow bypassing the above settings
- [x] Restrict who can push to matching branches (only maintainers)
- [x] Allow force pushes: Nobody
- [x] Allow deletions: Disabled

---

## Security Features

### Pre-commit Secret Scanning
- Scans for API keys, passwords, tokens
- Blocks commits with detected secrets
- False positive handling via `SAFE_PLACEHOLDERS`

### CI Security Scans
- **npm audit**: Checks dependencies for vulnerabilities
- **CodeQL**: Static analysis for security issues
- **Dependency Review**: Blocks PRs adding vulnerable dependencies
- **Custom secret scanner**: Runs in CI and pre-commit

### Security Review Trigger
PRs modifying these files trigger enhanced security review:
- `lib/api/auth.ts`
- `app/auth/**`
- `supabase/**`
- `app/api/**`
- `.env*` files

---

## Release Process

### Creating a Release
1. Ensure all CI checks pass on `main`
2. Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. The `release.yml` workflow will:
   - Generate changelog from merged PRs
   - Create GitHub release with notes
   - Mark as pre-release if tag contains `-` (e.g., `v1.0.0-beta.1`)

### Changelog Categories
- New Features (`enhancement`, `feature` labels)
- Bug Fixes (`bug`, `fix` labels)
- Security Updates (`security` label)
- Performance Improvements (`performance` label)
- Documentation (`documentation`, `docs` labels)
- CI/CD & Maintenance (`ci/cd`, `dependencies`, `chore` labels)

---

## Stale Issue/PR Management

### Configuration
- **Issues**: Marked stale after 60 days, closed after 14 more days
- **PRs**: Marked stale after 30 days, closed after 14 more days

### Exempt Labels
These labels prevent items from going stale:
- `pinned`
- `security`
- `help wanted`
- `good first issue`
- `in-progress`
- `work-in-progress`
- `do-not-close`

---

## Local Development Setup

### Install Husky Hooks
```bash
npm install  # Automatically runs `husky install`
```

### Skip Hooks (Emergency Only)
```bash
git commit --no-verify -m "emergency fix"
```
⚠️ Use sparingly - hooks exist to prevent issues!

### Run Security Scan Manually
```bash
node scripts/check-secrets.js
npm run test:security
npm audit
```

---

## Troubleshooting

### CI Failing on Lint
```bash
npm run lint:fix
npm run format
git add . && git commit --amend --no-edit
git push --force-with-lease
```

### Secret Scanner False Positive
Add the pattern to `SAFE_PLACEHOLDERS` in `scripts/check-secrets.js`

### Stale Bot Closed My Issue
Reopen it and add a comment explaining why it's still relevant. Add `pinned` label if critical.

### Dependabot PR Failing
1. Check if it's a breaking change
2. Review the changelog
3. Manually test if needed
4. Merge or close with explanation

---

## Maintenance Checklist

### Weekly
- [ ] Review Dependabot PRs
- [ ] Check security alerts in GitHub Security tab
- [ ] Review stale items

### Monthly
- [ ] Review CodeQL findings
- [ ] Check CI/CD workflow run times for optimization
- [ ] Update Node.js version if needed

### Quarterly
- [ ] Rotate API keys (see SECURITY.md)
- [ ] Review and update branch protection rules
- [ ] Audit GitHub Actions for updates

---

**Last Updated**: 2026-01-03
