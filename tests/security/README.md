# Security Tests

This directory contains automated security tests that help prevent common vulnerabilities in the
HelloEveryone.fun codebase.

## 🔐 Test Categories

### 1. API Key Exposure Tests (`api-keys.test.ts`)

**Purpose**: Prevent sensitive credentials from being committed to the repository.

**What it checks**:

- ✅ No real API keys in `.env.example`
- ✅ `.env.local` and `.env` are in `.gitignore`
- ✅ No committed environment files
- ✅ No hardcoded Supabase service role keys
- ✅ No hardcoded OpenAI or Anthropic API keys
- ✅ No hardcoded passwords in source code
- ✅ Sensitive env vars not exposed in public env
- ✅ No secrets in configuration files

**Critical Files Scanned**:

- `app/`, `components/`, `lib/`, `pages/`
- `package.json`, `next.config.js`
- `.env.example`, `env.example`

### 2. Authentication & Authorization Tests (`authentication.test.ts`)

**Purpose**: Ensure all protected routes and API endpoints require proper authentication.

**What it checks**:

- ✅ API routes have authentication checks
- ✅ Service role key not exposed in client code
- ✅ Protected pages have auth guards
- ✅ No tokens stored in localStorage
- ✅ RLS (Row Level Security) enabled in database
- ✅ No RLS bypass with service role in client code
- ✅ No manual password hashing (use Supabase Auth)

**Critical Files Scanned**:

- `app/api/` - All API routes
- `app/(protected)/` - Protected pages
- `app/`, `components/`, `hooks/` - Client-side code
- `supabase/migrations/` - Database migrations

### 3. Injection Attack Prevention Tests (`injection.test.ts`)

**Purpose**: Protect against SQL injection, XSS, and command injection attacks.

**What it checks**:

- ✅ Uses Supabase client (safe by default)
- ✅ No `dangerouslySetInnerHTML` without sanitization
- ✅ No `eval()` or `Function()` constructor
- ✅ No `innerHTML` usage
- ✅ No command injection via `child_process`
- ✅ Input validation with Zod on API routes
- ✅ File upload filename sanitization

**Attack Types Prevented**:

- **SQL Injection**: Parameterized queries via Supabase
- **XSS**: React auto-escaping + DOMPurify for rich text
- **Command Injection**: Avoiding shell execution with user input
- **Input Validation**: Zod schemas on all API endpoints

## 🚀 Running Security Tests

### Run All Security Tests

```bash
npm run test:security
```

### Run Individual Test Suites

```bash
# API key tests only
jest tests/security/api-keys.test.ts

# Authentication tests only
jest tests/security/authentication.test.ts

# Injection tests only
jest tests/security/injection.test.ts
```

### Pre-Commit Automated Checks

Security tests run automatically on every `git commit` via the pre-commit hook:

1. **Secret Scanning** - Blocks commits with API keys
2. **Security Tests** - Runs critical security checks
3. **Lint** - Code quality checks

To bypass (not recommended):

```bash
git commit --no-verify
```

## 🛡️ Secret Scanner

The repository includes a custom secret scanner that runs before every commit:

```bash
# Run manually
npm run security:scan

# Or directly
node scripts/check-secrets.js
```

### What the Scanner Detects

- Supabase Service Role Keys
- OpenAI API Keys (`sk-...`)
- Anthropic API Keys (`sk-ant-...`)
- Database Passwords
- Google OAuth Secrets
- Private Keys (PEM files)
- Hardcoded Passwords
- Generic Secret Patterns

### False Positives

If you get a false positive:

1. **Check if it's a placeholder** - The scanner ignores:
   - `your-key-here`
   - `your-api-key`
   - `sk-your-`
   - Standard JWT header: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

2. **Update the scanner** - Edit `scripts/check-secrets.js`:
   - Add to `IGNORE_PATTERNS` for specific files
   - Add to `SAFE_PLACEHOLDERS` for common placeholders

## 📊 Test Results

Security tests are designed to:

- **FAIL** on critical vulnerabilities (eval, exposed secrets)
- **WARN** on potential issues (missing validation)
- **PASS** when best practices are followed

### Expected Output

```
✅ No secrets detected!
⚠️  Potential missing auth check: app/api/some-route.ts
✅ All security tests passed
```

## 🔧 Fixing Security Issues

### API Key Exposed in Code

1. **Remove the key from the file**
2. **Add to `.env.local`** (never committed)
3. **Use `process.env.YOUR_KEY_NAME`** in code
4. **Revoke the exposed key** immediately
5. **Generate a new key**

### Missing Authentication

1. **Add auth check to API route**:

   ```typescript
   import { requireAuth } from '@/lib/api/auth'

   export async function GET(req: NextRequest) {
     const user = await requireAuth(req) // Throws if not authenticated
     // ... your code
   }
   ```

2. **Protect client pages**:

   ```tsx
   import { ProtectedRoute } from '@/components/ProtectedRoute'

   export default function Page() {
     return <ProtectedRoute>{/* Your protected content */}</ProtectedRoute>
   }
   ```

### Potential Injection Vulnerability

1. **Use Supabase client** (parameterized by default):

   ```typescript
   // ✅ Safe
   const { data } = await supabase.from('profiles').select('*').eq('user_id', userId)

   // ❌ Dangerous (don't do this)
   const query = `SELECT * FROM profiles WHERE user_id='${userId}'`
   ```

2. **Validate input with Zod**:

   ```typescript
   import { z } from 'zod'

   const schema = z.object({
     email: z.string().email(),
     age: z.number().min(18).max(120),
   })

   const data = schema.parse(await req.json())
   ```

## 📝 Adding New Security Tests

1. **Create test file** in `tests/security/`
2. **Follow naming convention**: `{category}.test.ts`
3. **Add to test suite** in `package.json` if needed
4. **Document in this README**

### Example Test Template

```typescript
describe('My Security Category', () => {
  test('should prevent dangerous pattern', () => {
    const files = getAllFiles('app', ['.ts', '.tsx'])

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')

      if (content.includes('dangerous-pattern')) {
        fail(`Found dangerous pattern in ${file}`)
      }
    })
  })
})
```

## 🔗 Related Documentation

- [SECURITY.md](../../SECURITY.md) - Vulnerability reporting
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [.claude/agents/cybersecurity_engineer.md](../../.claude/agents/cybersecurity_engineer.md) -
  Cybersecurity agent guide

## ⚠️ Important Notes

- **These tests are NOT exhaustive** - They catch common mistakes but cannot guarantee security
- **Manual security reviews are still needed** for complex features
- **Keep tests updated** as new patterns emerge
- **Report security issues privately** - See SECURITY.md

## 🎯 Security Checklist for Contributors

Before submitting a PR:

- [ ] No secrets or API keys in code
- [ ] All API routes require authentication
- [ ] User input is validated (Zod schemas)
- [ ] No `eval()`, `dangerouslySetInnerHTML`, or `innerHTML`
- [ ] Database queries use Supabase client
- [ ] File uploads sanitize filenames
- [ ] Security tests pass: `npm run test:security`
- [ ] Pre-commit hooks pass

---

**Questions?** See [SECURITY.md](../../SECURITY.md) or ask in GitHub Discussions.
