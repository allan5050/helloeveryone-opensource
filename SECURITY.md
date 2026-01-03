# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

We recommend always using the latest version of HelloEveryone.fun.

## Reporting a Vulnerability

We take the security of HelloEveryone.fun seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report Privately

Instead, please report security vulnerabilities by emailing:

**Security Contact**: allan.nevala@gmail.com

Include the following information in your report:
- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the manifestation of the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### 3. What to Expect

After you submit a report, we will:

1. **Acknowledge receipt** within 48 hours
2. **Provide an initial assessment** within 5 business days
3. **Work with you** to understand and validate the vulnerability
4. **Develop and test a fix** (timeline depends on severity and complexity)
5. **Release a security patch** and publicly disclose the vulnerability (with your permission)
6. **Credit you** in the security advisory (if you wish)

### 4. Security Update Process

When we release a security patch:

1. We'll create a GitHub Security Advisory
2. Release a new version with the fix
3. Update this SECURITY.md file if needed
4. Notify users through:
   - GitHub release notes
   - Security advisory
   - README update (for critical issues)

## Security Best Practices for Users

### API Key Management

**CRITICAL**: Never commit API keys or secrets to version control.

- Use `.env.local` for local development (already in `.gitignore`)
- Use Vercel environment variables for production
- Rotate API keys quarterly
- Use different keys for development, staging, and production
- Monitor API usage to detect unauthorized access

See `env.example` for detailed API key setup instructions.

### Database Security

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Use Row Level Security (RLS) policies for all tables
- Validate all user input before database queries
- Use parameterized queries to prevent SQL injection
- Review RLS policies in `docs/rls-policies.md`

### Authentication & Session Management

- Password requirements: Minimum 8 characters (enforced by Supabase Auth)
- Sessions expire after 1 week of inactivity
- OAuth tokens are stored securely via Supabase Auth
- Protected routes use server-side auth verification
- See `docs/AUTHENTICATION.md` for implementation details

### Common Security Pitfalls to Avoid

When contributing to HelloEveryone.fun, watch out for:

1. **XSS (Cross-Site Scripting)**
   - Always sanitize user input before rendering
   - React escapes by default, but be careful with `dangerouslySetInnerHTML`
   - Validate and escape data from external sources

2. **SQL Injection**
   - Use Supabase client methods (they're parameterized)
   - Never concatenate user input into SQL queries
   - Always validate input with Zod schemas

3. **Authentication Bypass**
   - Always use `requireAuth()` helper for protected API routes
   - Check user permissions before database operations
   - Verify RLS policies are enabled on all tables

4. **Information Disclosure**
   - Don't expose internal IDs or sensitive data in errors
   - Use generic error messages for authentication failures
   - Don't log sensitive information (passwords, tokens, etc.)

5. **CSRF (Cross-Site Request Forgery)**
   - Next.js 15 includes CSRF protection
   - Use POST/PUT/DELETE for state-changing operations
   - Verify origin header for sensitive requests

## Known Security Considerations

### Current Security Status

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ API keys managed via environment variables
- ✅ Authentication via Supabase Auth (industry standard)
- ✅ HTTPS enforced on production (Vercel)
- ✅ Input validation with Zod schemas
- ✅ CORS configured for production domain only
- ✅ Security headers: CSP, HSTS, X-Frame-Options, X-XSS-Protection
- ✅ Dev endpoints disabled in production
- ✅ Rate limiting applied to all sensitive endpoints
- ⚠️  Email verification optional (can be enforced)

### Dependencies

We regularly monitor dependencies for vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

Critical vulnerabilities are patched within 48 hours of discovery.

## Responsible Disclosure

We believe in responsible disclosure and will:

1. Work with security researchers to validate and fix vulnerabilities
2. Provide credit to researchers who report valid vulnerabilities
3. Not take legal action against researchers who follow this policy
4. Coordinate public disclosure timing with the reporter

## Security Hall of Fame

We'll recognize security researchers who help improve HelloEveryone.fun:

<!-- Contributors who report valid security issues will be listed here -->

_No security vulnerabilities reported yet._

## Contact

For security-related questions or concerns:

- **Email**: allan.nevala@gmail.com
- **Subject Line**: "[SECURITY] Your Issue Title"
- **Response Time**: Within 48 hours

For non-security issues, please use [GitHub Issues](https://github.com/allan5050/helloeveryone/issues).

## License

This security policy is licensed under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

---

**Last Updated**: 2026-01-03
**Next Review**: 2026-04-03 (Quarterly)
