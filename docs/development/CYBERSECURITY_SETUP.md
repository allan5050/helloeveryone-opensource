# Cybersecurity Setup - HelloEveryone.fun

This document summarizes the cybersecurity infrastructure added to the HelloEveryone.fun repository.

## 🎯 Overview

The repository now includes comprehensive security measures to prevent common vulnerabilities and
ensure safe code contributions.

**Date Implemented**: January 3, 2026  
**Security Level**: Production-Ready

---

## 🛡️ What We've Implemented

### 1. Cybersecurity Engineer Agent

**File**: `.claude/agents/cybersecurity_engineer.md`

A specialized AI agent focused on:

- OWASP Top 10 vulnerability prevention
- Secret scanning and API key protection
- Authentication and authorization reviews
- Injection attack prevention
- Security code reviews

**When to Use**:

- Security audits
- Reviewing sensitive code changes
- Implementing authentication features
- Analyzing potential vulnerabilities

### 2. Pre-Commit Secret Scanner

**Files**:

- `scripts/check-secrets.js` - Custom secret detection tool
- `.husky/pre-commit` - Automated git hook

**What It Does**:

- Scans all staged files before commit
- Blocks commits containing API keys, passwords, or secrets
- Detects patterns like:
  - Supabase Service Role Keys
  - OpenAI API Keys (`sk-...`)
  - Anthropic API Keys (`sk-ant-...`)
  - Database passwords
  - Private keys (PEM files)
  - Hardcoded credentials

**Usage**:

```bash
# Runs automatically on every git commit

# Run manually:
npm run security:scan

# Direct execution:
node scripts/check-secrets.js
```

**Protection Level**: CRITICAL - Blocks commits entirely if secrets detected

### 3. Automated Security Tests

**Directory**: `tests/security/`

Three comprehensive test suites:

#### 3a. API Key Exposure Tests

**File**: `tests/security/api-keys.test.ts`

Tests for:

- No real API keys in `.env.example`
- Environment files in `.gitignore`
- No hardcoded credentials in source code
- No secrets in configuration files
- Proper environment variable usage

#### 3b. Authentication & Authorization Tests

**File**: `tests/security/authentication.test.ts`

Tests for:

- API routes have authentication checks
- Protected pages require auth
- No tokens in localStorage
- RLS (Row Level Security) enabled
- Service role key not exposed to clients
- Proper session management

#### 3c. Injection Attack Prevention Tests

**File**: `tests/security/injection.test.ts`

Tests for:

- SQL Injection protection (Supabase client usage)
- XSS prevention (no eval, dangerouslySetInnerHTML)
- Command injection protection
- Input validation with Zod
- File upload sanitization

**Usage**:

```bash
# Run all security tests
npm run test:security

# Run specific test
jest tests/security/api-keys.test.ts
```

**Protection Level**: HIGH - Runs in pre-commit hook

---

## 🔒 Pre-Commit Hook Workflow

Every `git commit` now runs:

1. **🔒 Secret Scanning** (CRITICAL)
   - Scans for API keys and credentials
   - **BLOCKS** commit if secrets found
2. **📝 Lint-Staged**
   - Formats and lints staged files
   - Auto-fixes simple issues

3. **🛡️ Security Tests**
   - Runs critical security checks
   - **BLOCKS** commit if critical issues found

4. **✅ Type Check** (Currently disabled)
   - Will be enabled when TS errors are fixed

**Example Output**:

```
Running pre-commit checks...
🔒 Scanning for secrets and API keys...
✓ No secrets detected!

Running lint-staged...
✓ Code formatted

🛡️ Running critical security tests...
⚠️ Potential missing auth check: app/api/dev/analytics/route.ts
✓ Security tests passed

✅ All pre-commit checks passed!
```

---

## 📊 Security Test Coverage

| Category              | Tests        | Coverage                            |
| --------------------- | ------------ | ----------------------------------- |
| **API Key Exposure**  | 8 tests      | Source code, config files, env vars |
| **Authentication**    | 5 tests      | API routes, protected pages, RLS    |
| **Injection Attacks** | 7 tests      | SQL, XSS, Command, Input validation |
| **Total**             | **20 tests** | **Comprehensive**                   |

---

## 🚨 What Gets Blocked

### Commits WILL BE BLOCKED For:

✗ **API keys in code**

```javascript
const key = 'sk-1234567890abcdef' // ❌ BLOCKED
```

✗ **Hardcoded passwords**

```javascript
const password = 'MySecretPass123' // ❌ BLOCKED
```

✗ **Private keys**

```
-----BEGIN PRIVATE KEY----- // ❌ BLOCKED
```

✗ **Service role keys**

```
SUPABASE_SERVICE_ROLE_KEY=eyJ... // ❌ BLOCKED
```

✗ **eval() or Function() constructor**

```javascript
eval(userInput) // ❌ BLOCKED
new Function(code)() // ❌ BLOCKED
```

### Commits WILL WARN For:

⚠️ **Missing authentication checks** ⚠️ **Unvalidated input** ⚠️ **dangerouslySetInnerHTML without
sanitization** ⚠️ **Potential command injection**

---

## ✅ Safe Patterns

These are **allowed**:

✓ **Environment variables**

```javascript
const key = process.env.OPENAI_API_KEY // ✅ Safe
```

✓ **Placeholders in documentation**

```javascript
OPENAI_API_KEY = sk - your - key - here // ✅ Safe
```

✓ **Supabase client usage**

```typescript
const { data } = await supabase.from('profiles').eq('id', userId) // ✅ Safe (parameterized)
```

✓ **Zod validation**

```typescript
const schema = z.object({
  email: z.string().email(),
})
const data = schema.parse(input) // ✅ Safe
```

---

## 🔧 Bypassing Checks (Not Recommended)

If you absolutely need to bypass pre-commit hooks:

```bash
git commit --no-verify
```

**⚠️ WARNING**: Only use for emergencies. You're bypassing security!

---

## 🐛 Fixing Security Issues

### Issue: "Secret detected in code"

1. **Remove the secret from the file**
2. **Add to `.env.local`**:
   ```bash
   echo "OPENAI_API_KEY=sk-your-actual-key" >> .env.local
   ```
3. **Use in code**:
   ```javascript
   const key = process.env.OPENAI_API_KEY
   ```
4. **Revoke the exposed key** (if already committed)
5. **Generate new key**

### Issue: "Missing authentication check"

Add auth to your API route:

```typescript
import { requireAuth } from '@/lib/api/auth'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req) // Throws if not authenticated
  // ... your code
}
```

### Issue: "Potential injection vulnerability"

Use Zod validation:

```typescript
import { z } from 'zod'

const inputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

const data = inputSchema.parse(await req.json())
```

---

## 📝 For Contributors

### Before Submitting a PR:

- [ ] No hardcoded secrets or API keys
- [ ] All API routes require authentication
- [ ] User input is validated (Zod)
- [ ] No dangerous patterns (eval, innerHTML)
- [ ] Security tests pass: `npm run test:security`
- [ ] Pre-commit hooks pass

### Security Checklist:

```bash
# 1. Run security audit
npm run security:audit

# 2. Run security tests
npm run test:security

# 3. Scan for secrets
npm run security:scan

# 4. If all pass, commit!
git add .
git commit -m "feat: my secure feature"
```

---

## 🔗 Related Documentation

- **SECURITY.md** - Vulnerability reporting policy
- **tests/security/README.md** - Detailed test documentation
- **.claude/agents/cybersecurity_engineer.md** - Security agent guide
- **CONTRIBUTING.md** - Contribution guidelines

---

## 📞 Questions or Security Concerns?

**Security Issues**: Report privately to allan.nevala@gmail.com  
**Questions**: Open a GitHub issue with `security` label  
**Documentation**: See SECURITY.md

---

## 🎯 Summary

Your repository now has:

✅ **Automated secret scanning** preventing accidental credential commits  
✅ **Comprehensive security tests** covering OWASP Top 10  
✅ **Pre-commit hooks** enforcing security standards  
✅ **Cybersecurity agent** for security reviews  
✅ **Clear documentation** for contributors

**Security Level**: Production-Ready 🛡️

---

**Last Updated**: January 3, 2026  
**Maintained By**: Allan Nevala  
**Security Contact**: allan.nevala@gmail.com
