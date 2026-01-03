#!/usr/bin/env node
/**
 * Comprehensive Security Scanner
 * Runs all security checks and generates a report
 *
 * Usage:
 *   node scripts/security-scan.js           # Run all checks
 *   node scripts/security-scan.js --quick   # Run quick checks only (for pre-commit)
 *   node scripts/security-scan.js --ci      # CI mode (returns exit code)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isCI = args.includes('--ci');

const results = {
  passed: [],
  warnings: [],
  failed: [],
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.cyan + colors.bold);
  log('='.repeat(60), colors.cyan);
}

function pass(check, message = '') {
  results.passed.push({ check, message });
  log(`  ✅ ${check}${message ? ': ' + message : ''}`, colors.green);
}

function warn(check, message) {
  results.warnings.push({ check, message });
  log(`  ⚠️  ${check}: ${message}`, colors.yellow);
}

function fail(check, message) {
  results.failed.push({ check, message });
  log(`  ❌ ${check}: ${message}`, colors.red);
}

// Helper to get all files
function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'coverage') {
        files = files.concat(getAllFiles(fullPath, extensions));
      }
    } else if (extensions.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

// ==================== CHECKS ====================

function checkSecrets() {
  logSection('Secret Detection');

  const patterns = [
    { regex: /sk-[A-Za-z0-9]{32,}/g, name: 'OpenAI API Key' },
    { regex: /sk-ant-[A-Za-z0-9_-]{32,}/g, name: 'Anthropic API Key' },
    { regex: /eyJ[A-Za-z0-9_-]{100,}/g, name: 'JWT Token (potential service key)' },
    { regex: /-----BEGIN (RSA |DSA )?PRIVATE KEY-----/g, name: 'Private Key' },
  ];

  const ignoreFiles = ['env.example', '.env.example', 'check-secrets.js', 'security-scan.js'];
  const sourceFiles = getAllFiles('app').concat(getAllFiles('lib')).concat(getAllFiles('components'));

  let secretsFound = 0;

  sourceFiles.forEach(file => {
    if (ignoreFiles.some(f => file.includes(f))) return;

    const content = fs.readFileSync(file, 'utf8');
    patterns.forEach(({ regex, name }) => {
      const matches = content.match(regex);
      if (matches) {
        // Filter out placeholders
        const realSecrets = matches.filter(m =>
          !m.includes('your-') &&
          !m.includes('example') &&
          !m.includes('placeholder')
        );
        if (realSecrets.length > 0) {
          fail('Secrets', `Found ${name} in ${file}`);
          secretsFound++;
        }
      }
    });
  });

  if (secretsFound === 0) {
    pass('No hardcoded secrets detected');
  }
}

function checkAuthPatterns() {
  logSection('Authentication Patterns');

  const apiFiles = getAllFiles('app/api');
  let unprotectedRoutes = 0;

  apiFiles.forEach(file => {
    // Skip dev, health, and webhook routes
    if (file.includes('/dev/') || file.includes('/health') || file.includes('/webhook')) {
      return;
    }

    const content = fs.readFileSync(file, 'utf8');

    const hasAuth =
      content.includes('requireAuth') ||
      content.includes('getUser()') ||
      content.includes("NODE_ENV === 'production'");

    if (!hasAuth) {
      warn('Auth', `${file} may lack authentication`);
      unprotectedRoutes++;
    }
  });

  if (unprotectedRoutes === 0) {
    pass('All API routes have authentication');
  }
}

function checkSelfOperations() {
  logSection('Self-Operation Prevention');

  const checks = [
    { file: 'app/api/profile/favorite/route.ts', pattern: /Cannot favorite yourself|profileId\s*===?\s*user\.id/ },
    { file: 'app/api/privacy/block/route.ts', pattern: /Cannot block yourself|blockedUserId\s*===?\s*currentUser\.id/ },
    { file: 'app/api/chat/send/route.ts', pattern: /Cannot send message to yourself|receiver_id\s*===?\s*user\.id/ },
  ];

  checks.forEach(({ file, pattern }) => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (pattern.test(content)) {
        pass(`Self-operation check in ${path.basename(file)}`);
      } else {
        fail('Self-operation', `${file} missing self-operation prevention`);
      }
    }
  });
}

function checkBlockRelationships() {
  logSection('Block Relationship Enforcement');

  const chatFile = 'app/api/chat/send/route.ts';
  if (fs.existsSync(chatFile)) {
    const content = fs.readFileSync(chatFile, 'utf8');
    if (content.includes("from('blocks')") || content.includes('blocker_id')) {
      pass('Chat endpoint checks block relationships');
    } else {
      fail('Block check', 'Chat endpoint missing block relationship check');
    }
  }
}

function checkRateLimiting() {
  logSection('Rate Limiting');

  const sensitiveEndpoints = [
    'app/api/match/calculate/route.ts',
    'app/api/match/generate-embeddings/route.ts',
    'app/api/privacy/delete/route.ts',
    'app/api/chat/send/route.ts',
  ];

  sensitiveEndpoints.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('checkRateLimit')) {
        pass(`Rate limiting in ${path.basename(file)}`);
      } else {
        warn('Rate limiting', `${file} missing rate limiting`);
      }
    }
  });
}

function checkDevRoutes() {
  logSection('Development Route Protection');

  const devFiles = getAllFiles('app/api/dev');

  devFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes("NODE_ENV === 'production'")) {
      pass(`Production check in ${path.basename(file)}`);
    } else {
      fail('Dev route', `${file} missing production environment check`);
    }
  });
}

function checkServerClient() {
  logSection('Server-Side Supabase Client Usage');

  const apiFiles = getAllFiles('app/api');
  let violations = 0;

  apiFiles.forEach(file => {
    if (file.includes('/dev/')) return;

    const content = fs.readFileSync(file, 'utf8');
    if (content.includes("from '@/lib/supabase/client'") ||
        content.includes('from "@/lib/supabase/client"')) {
      warn('Client usage', `${file} uses browser Supabase client in API route`);
      violations++;
    }
  });

  if (violations === 0) {
    pass('All API routes use server-side Supabase client');
  }
}

function checkInputValidation() {
  logSection('Input Validation');

  const apiFiles = getAllFiles('app/api');
  let missingValidation = 0;

  apiFiles.forEach(file => {
    if (file.includes('/dev/') || file.includes('/health')) return;

    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('request.json()')) {
      const hasValidation =
        content.includes('zod') ||
        content.includes('.parse(') ||
        content.includes('.safeParse(');

      if (!hasValidation) {
        warn('Validation', `${file} may lack input validation`);
        missingValidation++;
      }
    }
  });

  if (missingValidation === 0) {
    pass('All API routes with JSON input have validation');
  }
}

function checkSecurityHeaders() {
  logSection('Security Headers');

  if (fs.existsSync('vercel.json')) {
    const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const headers = JSON.stringify(config.headers || []);

    const requiredHeaders = [
      { name: 'X-Content-Type-Options', check: 'nosniff' },
      { name: 'X-Frame-Options', check: 'DENY' },
      { name: 'Strict-Transport-Security', check: 'max-age' },
      { name: 'Content-Security-Policy', check: 'default-src' },
    ];

    requiredHeaders.forEach(({ name, check }) => {
      if (headers.includes(check)) {
        pass(`${name} header configured`);
      } else {
        warn('Headers', `${name} header may be missing or misconfigured`);
      }
    });

    // Check CORS
    if (headers.includes('Access-Control-Allow-Origin') && !headers.includes('"*"')) {
      pass('CORS properly restricted');
    } else if (headers.includes('"*"')) {
      fail('CORS', 'CORS allows all origins (*)');
    }
  }
}

function runNpmAudit() {
  if (isQuick) return;

  logSection('Dependency Vulnerabilities');

  try {
    execSync('npm audit --json', { encoding: 'utf8' });
    pass('No known vulnerabilities in dependencies');
  } catch (error) {
    try {
      const auditResult = JSON.parse(error.stdout || '{}');
      const vulns = auditResult.metadata?.vulnerabilities || {};
      const critical = vulns.critical || 0;
      const high = vulns.high || 0;

      if (critical > 0) {
        fail('npm audit', `${critical} critical vulnerabilities found`);
      } else if (high > 0) {
        warn('npm audit', `${high} high severity vulnerabilities found`);
      } else {
        pass('No critical/high vulnerabilities');
      }
    } catch {
      warn('npm audit', 'Could not parse audit results');
    }
  }
}

// ==================== MAIN ====================

function main() {
  log(`\n${colors.bold}${colors.blue}🔐 Security Scan${colors.reset}`);
  log(`Mode: ${isQuick ? 'Quick' : 'Full'} | CI: ${isCI}`);

  // Run checks
  checkSecrets();
  checkAuthPatterns();
  checkSelfOperations();
  checkBlockRelationships();
  checkRateLimiting();
  checkDevRoutes();
  checkServerClient();
  checkInputValidation();
  checkSecurityHeaders();
  runNpmAudit();

  // Summary
  logSection('Summary');
  log(`  Passed:   ${results.passed.length}`, colors.green);
  log(`  Warnings: ${results.warnings.length}`, colors.yellow);
  log(`  Failed:   ${results.failed.length}`, colors.red);

  if (results.failed.length > 0) {
    log(`\n${colors.red}${colors.bold}❌ Security scan FAILED${colors.reset}`);
    log('\nFailed checks:', colors.red);
    results.failed.forEach(f => log(`  - ${f.check}: ${f.message}`, colors.red));

    if (isCI) process.exit(1);
    return 1;
  } else if (results.warnings.length > 0) {
    log(`\n${colors.yellow}${colors.bold}⚠️  Security scan passed with warnings${colors.reset}`);
    return 0;
  } else {
    log(`\n${colors.green}${colors.bold}✅ Security scan PASSED${colors.reset}`);
    return 0;
  }
}

process.exit(main());
