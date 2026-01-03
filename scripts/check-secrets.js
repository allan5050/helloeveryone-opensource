#!/usr/bin/env node
/**
 * Pre-commit hook: Secret Scanner
 * Prevents committing sensitive data like API keys, passwords, and tokens
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Secret patterns to detect
const SECRET_PATTERNS = [
  // API Keys
  {
    pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?eyJ[A-Za-z0-9_-]{100,}["']?/gi,
    name: 'Supabase Service Role Key',
    severity: 'CRITICAL',
  },
  {
    pattern: /OPENAI_API_KEY\s*=\s*["']?sk-[A-Za-z0-9]{32,}["']?/gi,
    name: 'OpenAI API Key',
    severity: 'CRITICAL',
  },
  {
    pattern: /ANTHROPIC_API_KEY\s*=\s*["']?sk-ant-[A-Za-z0-9_-]{32,}["']?/gi,
    name: 'Anthropic API Key',
    severity: 'CRITICAL',
  },
  {
    pattern: /DB_PASSWORD\s*=\s*["']?[^"'\s]{8,}["']?/gi,
    name: 'Database Password',
    severity: 'HIGH',
  },
  {
    pattern: /GOOGLE_CLIENT_SECRET\s*=\s*["']?[A-Za-z0-9_-]{20,}["']?/gi,
    name: 'Google OAuth Secret',
    severity: 'HIGH',
  },
  
  // Generic patterns
  {
    pattern: /-----BEGIN (RSA |DSA )?PRIVATE KEY-----/gi,
    name: 'Private Key',
    severity: 'CRITICAL',
  },
  {
    pattern: /(password|passwd|pwd)\s*=\s*["'][^"'\s]{8,}["']/gi,
    name: 'Hardcoded Password',
    severity: 'HIGH',
  },
  {
    pattern: /['"]?[A-Za-z0-9]{40,}['"]?\s*:\s*['"][A-Za-z0-9+/=]{40,}['"]?/g,
    name: 'Potential Secret Pair',
    severity: 'MEDIUM',
  },
  
  // Supabase URLs with project IDs
  {
    pattern: /https:\/\/[a-z]{20}\.supabase\.co/gi,
    name: 'Supabase Project URL (may expose project ID)',
    severity: 'LOW',
  },
];

// Files/patterns to ignore
const IGNORE_PATTERNS = [
  '.env.example',
  'env.example',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/',
  'tests/',
  'scripts/check-secrets.js', // This file itself
  '.claude/agents/',
  'node_modules/',
  '.git/',
];

// Safe placeholder patterns that are OK
const SAFE_PLACEHOLDERS = [
  'your-key-here',
  'your-api-key',
  'sk-your-',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Standard JWT header
  'your-project-ref',
  'YOUR_',
  'sk-ant-your-',
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function isSafePlaceholder(match) {
  return SAFE_PLACEHOLDERS.some(placeholder => 
    match.toLowerCase().includes(placeholder.toLowerCase())
  );
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error(`${colors.red}Error getting staged files:${colors.reset}`, error.message);
    return [];
  }
}

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  SECRET_PATTERNS.forEach(({ pattern, name, severity }) => {
    const matches = content.matchAll(pattern);
    
    for (const match of matches) {
      // Skip safe placeholders
      if (isSafePlaceholder(match[0])) {
        continue;
      }

      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      findings.push({
        file: filePath,
        line: lineNumber,
        name,
        severity,
        match: match[0].substring(0, 50) + '...', // Truncate for safety
      });
    }
  });

  return findings;
}

function main() {
  console.log(`\n${colors.blue}${colors.bold}🔒 Running Secret Scanner...${colors.reset}\n`);

  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log(`${colors.yellow}No staged files to scan.${colors.reset}\n`);
    return 0;
  }

  console.log(`Scanning ${stagedFiles.length} staged files...\n`);

  let allFindings = [];

  for (const file of stagedFiles) {
    if (shouldIgnoreFile(file)) {
      continue;
    }

    const findings = scanFile(file);
    allFindings = allFindings.concat(findings);
  }

  if (allFindings.length === 0) {
    console.log(`${colors.green}${colors.bold}✓ No secrets detected!${colors.reset}\n`);
    return 0;
  }

  // Report findings
  console.log(`${colors.red}${colors.bold}✗ SECRETS DETECTED!${colors.reset}\n`);
  console.log(`Found ${allFindings.length} potential secret(s):\n`);

  const criticalFindings = allFindings.filter(f => f.severity === 'CRITICAL');
  const highFindings = allFindings.filter(f => f.severity === 'HIGH');
  const mediumFindings = allFindings.filter(f => f.severity === 'MEDIUM');
  const lowFindings = allFindings.filter(f => f.severity === 'LOW');

  const printFindings = (findings, color) => {
    findings.forEach(({ file, line, name, severity, match }) => {
      console.log(`  ${color}[${severity}]${colors.reset} ${name}`);
      console.log(`    File: ${file}:${line}`);
      console.log(`    Match: ${match}`);
      console.log();
    });
  };

  if (criticalFindings.length > 0) {
    console.log(`${colors.red}CRITICAL:${colors.reset}`);
    printFindings(criticalFindings, colors.red);
  }
  
  if (highFindings.length > 0) {
    console.log(`${colors.red}HIGH:${colors.reset}`);
    printFindings(highFindings, colors.red);
  }

  if (mediumFindings.length > 0) {
    console.log(`${colors.yellow}MEDIUM:${colors.reset}`);
    printFindings(mediumFindings, colors.yellow);
  }

  if (lowFindings.length > 0) {
    console.log(`${colors.blue}LOW:${colors.reset}`);
    printFindings(lowFindings, colors.blue);
  }

  console.log(`${colors.red}${colors.bold}❌ COMMIT BLOCKED${colors.reset}`);
  console.log(`\nTo fix:`);
  console.log(`  1. Remove the secrets from the files above`);
  console.log(`  2. Use environment variables instead (.env.local)`);
  console.log(`  3. If this is a false positive, update scripts/check-secrets.js\n`);
  console.log(`${colors.yellow}IMPORTANT:${colors.reset} If you already committed secrets:`);
  console.log(`  1. Revoke/rotate all exposed credentials immediately`);
  console.log(`  2. See SECURITY.md for incident response steps\n`);

  return 1; // Exit with error to block commit
}

process.exit(main());
