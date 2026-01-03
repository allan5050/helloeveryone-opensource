# HelloEveryone.fun Production Deployment Guide

## 🚀 Quick Start Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Test locally
npm start

# 4. Deploy to Vercel
vercel --prod
```

## 📋 Pre-Deployment Checklist

### Environment & Configuration

- [ ] Create Supabase project at https://app.supabase.com
- [ ] Copy Supabase URL and anon key
- [ ] Set up environment variables in `.env.local`
- [ ] Configure Vercel project settings
- [ ] Set up custom domain (optional)

### Database Setup

- [ ] Run database migrations: `npm run db:setup`
- [ ] Enable Row Level Security (RLS) policies
- [ ] Seed test data (optional): `npm run db:seed`
- [ ] Verify pgvector extension is enabled

### Code Quality Checks

- [ ] TypeScript compilation: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in production build

### Security Review

- [ ] All API keys in environment variables
- [ ] No hardcoded secrets in code
- [ ] CORS properly configured
- [ ] Authentication working correctly
- [ ] RLS policies tested

## 🔧 Environment Variables

Create `.env.local` file with these variables:

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional - Features
OPENAI_API_KEY=sk-...                    # For AI matching
NEXT_PUBLIC_SENTRY_DSN=https://...       # Error tracking
NEXT_PUBLIC_SITE_URL=https://helloeveryone.fun  # Custom domain
```

## 📦 Deployment Options

### Option 1: Vercel (Recommended)

#### Via GitHub Integration

1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables
4. Deploy automatically

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Follow prompts to configure
```

### Option 2: Self-Hosted

```bash
# Build application
npm run build

# Start production server
NODE_ENV=production npm start

# Use PM2 for process management
pm2 start npm --name "helloeveryone" -- start
```

## ✅ Post-Deployment Verification

### 1. Functional Tests

```bash
# Check homepage
curl https://helloeveryone.vercel.app

# Check API health
curl https://helloeveryone.vercel.app/api/auth

# Test authentication flow
# 1. Register new user
# 2. Login/logout
# 3. Access protected routes
```

### 2. Performance Checks

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500KB (initial)
- [ ] PWA installable

### 3. Security Validation

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No exposed API keys
- [ ] Authentication required for protected routes
- [ ] Database queries use parameterization

## 🔍 Monitoring & Logging

### Vercel Dashboard

- Real-time function logs
- Performance metrics
- Error tracking
- Deployment history

### Custom Monitoring

```javascript
// Add to pages for error tracking
export function reportWebVitals(metric) {
  console.log(metric)
  // Send to analytics
}
```

### Database Monitoring

- Check Supabase dashboard for:
  - Query performance
  - Connection pool status
  - Storage usage
  - API request counts

## 🔄 Rollback Procedures

### Quick Rollback (Vercel)

1. Go to Vercel Dashboard > Deployments
2. Find previous stable deployment
3. Click "..." menu > "Promote to Production"
4. Verify rollback successful

### Git-Based Rollback

```bash
# Find last good commit
git log --oneline -10

# Revert to specific commit
git revert <commit-hash>

# Push to trigger redeploy
git push origin main
```

## 🚨 Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check for TypeScript errors
npm run type-check
```

### Runtime Errors

1. Check Vercel Function logs
2. Verify environment variables set
3. Test database connection
4. Review API route errors

### Database Issues

```sql
-- Check connection
SELECT NOW();

-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Test RLS policies
SELECT * FROM profiles LIMIT 1;
```

### Performance Issues

```bash
# Analyze bundle size
npm run analyze

# Check for large dependencies
npm list --depth=0

# Review image sizes
find public -type f -name "*.jpg" -o -name "*.png" | xargs ls -lh
```

## 📊 Performance Targets

| Metric       | Target  | Critical |
| ------------ | ------- | -------- |
| Build Time   | < 3 min | < 5 min  |
| Deploy Time  | < 2 min | < 5 min  |
| Cold Start   | < 3s    | < 5s     |
| API Response | < 200ms | < 500ms  |
| Page Load    | < 2s    | < 3s     |
| Lighthouse   | > 90    | > 80     |

## 🛠️ Maintenance Tasks

### Daily

- Monitor error rates
- Check performance metrics
- Review user feedback

### Weekly

- Update dependencies (patches)
- Database backup verification
- Performance analysis

### Monthly

- Security audit
- Dependency updates (minor)
- Cost optimization review
- User analytics review

## 📝 Deployment Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run lint         # Run linter
npm run type-check   # TypeScript check

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:watch   # Watch mode

# Database
npm run db:setup     # Initialize database
npm run db:seed      # Add sample data
npm run db:reset     # Reset database

# Production
npm run build        # Build for production
npm start           # Start production server
npm run analyze     # Bundle analysis

# Deployment
vercel              # Deploy preview
vercel --prod       # Deploy production
vercel logs         # View logs
vercel env pull     # Pull env vars
```

## 🆘 Emergency Contacts

- **Vercel Status**: https://www.vercel-status.com
- **Supabase Status**: https://status.supabase.com
- **GitHub Issues**: https://github.com/allan5050/helloeveryone/issues

## 📅 Deployment Schedule

- **Production Deploys**: Tuesday/Thursday mornings
- **Hotfixes**: As needed with approval
- **Maintenance Window**: Sunday 2-4 AM UTC

## ✨ Final Checklist

Before marking deployment complete:

- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Database queries succeed
- [ ] No console errors
- [ ] Performance targets met
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Documentation updated

---

**Last Updated**: January 2025 **Version**: 2.0 **Maintainer**: @allan5050
