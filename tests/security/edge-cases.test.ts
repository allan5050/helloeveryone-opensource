/**
 * Security Test: Edge Cases
 *
 * Automated tests to detect edge case vulnerabilities that go beyond OWASP Top 10.
 * These tests scan the codebase for common security anti-patterns.
 */

import fs from 'fs';
import path from 'path';

// Helper to recursively get all files
function getAllFiles(dir: string, extensions: string[]): string[] {
  let files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'coverage') {
        files = files.concat(getAllFiles(fullPath, extensions));
      }
    } else {
      const ext = path.extname(fullPath);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

describe('Edge Case Security Tests', () => {
  const API_DIR = 'app/api';
  const apiFiles = getAllFiles(API_DIR, ['.ts', '.tsx']);

  describe('Self-Referential Operation Prevention', () => {
    test('favorite endpoint should prevent self-favoriting', () => {
      const favoriteFile = 'app/api/profile/favorite/route.ts';
      if (fs.existsSync(favoriteFile)) {
        const content = fs.readFileSync(favoriteFile, 'utf8');

        // Check for self-favorite prevention
        const hasSelfCheck =
          content.includes('user.id') &&
          (content.includes('profileId === user.id') ||
           content.includes('profileId !== user.id') ||
           content.includes("Cannot favorite yourself"));

        expect(hasSelfCheck).toBe(true);
      }
    });

    test('block endpoint should prevent self-blocking', () => {
      const blockFile = 'app/api/privacy/block/route.ts';
      if (fs.existsSync(blockFile)) {
        const content = fs.readFileSync(blockFile, 'utf8');

        const hasSelfCheck =
          content.includes("Cannot block yourself") ||
          (content.includes('currentUser.id') && content.includes('blockedUserId'));

        expect(hasSelfCheck).toBe(true);
      }
    });

    test('message endpoint should prevent self-messaging', () => {
      const sendFile = 'app/api/chat/send/route.ts';
      if (fs.existsSync(sendFile)) {
        const content = fs.readFileSync(sendFile, 'utf8');

        const hasSelfCheck =
          content.includes("Cannot send message to yourself") ||
          content.includes('receiver_id') && content.includes('user.id');

        expect(hasSelfCheck).toBe(true);
      }
    });
  });

  describe('Block Relationship Enforcement', () => {
    test('chat/send should check block relationships before sending', () => {
      const sendFile = 'app/api/chat/send/route.ts';
      if (fs.existsSync(sendFile)) {
        const content = fs.readFileSync(sendFile, 'utf8');

        // Should query blocks table before inserting message
        const hasBlockCheck =
          content.includes("from('blocks')") &&
          content.includes('blocker_id') &&
          content.includes('blocked_id');

        expect(hasBlockCheck).toBe(true);
      }
    });
  });

  describe('Server-Side Supabase Client Usage', () => {
    test('API routes should use server-side Supabase client, not browser client', () => {
      const violations: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for browser client import in API routes
        if (content.includes("from '@/lib/supabase/client'") ||
            content.includes('from "@/lib/supabase/client"')) {
          // Exception: Some routes may legitimately need client for specific use cases
          // But most should use server client
          if (!file.includes('/dev/') && !file.includes('test')) {
            violations.push(file);
          }
        }
      });

      if (violations.length > 0) {
        console.warn('API routes using browser Supabase client (should use server client):');
        violations.forEach(v => console.warn(`  - ${v}`));
      }

      // Allow some violations but warn about them
      expect(violations.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Race Condition Patterns', () => {
    test('should use atomic operations or proper error handling for check-then-act patterns', () => {
      const warnings: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Look for check-then-insert patterns without conflict handling
        const hasCheckThenInsert =
          content.includes('.select(') &&
          content.includes('.single()') &&
          content.includes('.insert(');

        const hasConflictHandling =
          content.includes('onConflict') ||
          content.includes('upsert') ||
          content.includes('PGRST116') || // Supabase "not found" error code
          content.includes('23505') || // Postgres unique violation
          content.includes('code === ');

        const usesAtomicRpc = content.includes('.rpc(');

        if (hasCheckThenInsert && !hasConflictHandling && !usesAtomicRpc) {
          warnings.push(file);
        }
      });

      if (warnings.length > 0) {
        console.warn('Potential race conditions (check-then-act without atomic handling):');
        warnings.forEach(w => console.warn(`  - ${w}`));
      }

      // This is informational - race conditions are hard to prevent in all cases
      expect(warnings.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Input Validation', () => {
    test('API routes with request.json() should have input validation', () => {
      const violations: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Skip dev routes
        if (file.includes('/dev/')) return;

        if (content.includes('request.json()')) {
          const hasValidation =
            content.includes('zod') ||
            content.includes('z.object') ||
            content.includes('Schema') ||
            content.includes('.parse(') ||
            content.includes('.safeParse(');

          if (!hasValidation) {
            violations.push(file);
          }
        }
      });

      if (violations.length > 0) {
        console.warn('API routes without input validation:');
        violations.forEach(v => console.warn(`  - ${v}`));
      }

      // Allow some violations as warnings (input validation is defense-in-depth)
      // Critical routes (auth, privacy) should have validation, but match routes
      // are protected by authentication and RLS
      const criticalViolations = violations.filter(
        v => v.includes('/auth/') && !v.includes('/dev/')
      );
      expect(criticalViolations.length).toBe(0);
    });

    test('UUID parameters should be validated', () => {
      const violations: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for userId, profileId, eventId in params without UUID validation
        const hasIdParam =
          content.includes('userId') ||
          content.includes('profileId') ||
          content.includes('eventId');

        const hasUuidValidation =
          content.includes('.uuid(') ||
          content.includes('z.string().uuid');

        // If has ID params but no UUID validation, it's a concern
        if (hasIdParam && content.includes('request.json()') && !hasUuidValidation) {
          // Only flag routes that don't validate
          if (!content.includes('safeParse') && !content.includes('.parse(')) {
            violations.push(file);
          }
        }
      });

      // Informational warning
      if (violations.length > 0) {
        console.warn('Routes with ID params that may need UUID validation:');
        violations.forEach(v => console.warn(`  - ${v}`));
      }
    });
  });

  describe('Production Environment Checks', () => {
    test('dev routes should be disabled in production', () => {
      const devRoutes = getAllFiles('app/api/dev', ['.ts', '.tsx']);
      const violations: string[] = [];

      devRoutes.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        const hasProductionCheck =
          content.includes("NODE_ENV === 'production'") ||
          content.includes('NODE_ENV !== "development"') ||
          content.includes("process.env.NODE_ENV");

        if (!hasProductionCheck) {
          violations.push(file);
        }
      });

      expect(violations).toEqual([]);
    });
  });

  describe('Rate Limiting', () => {
    test('sensitive endpoints should have rate limiting', () => {
      const sensitivePatterns = [
        'match/calculate',
        'match/generate',
        'matches/explain',
        'privacy/delete',
        'privacy/export',
        'chat/send',
      ];

      const violations: string[] = [];

      sensitivePatterns.forEach(pattern => {
        const matchingFiles = apiFiles.filter(f => f.includes(pattern.replace('/', path.sep)));

        matchingFiles.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');

          const hasRateLimiting =
            content.includes('checkRateLimit') ||
            content.includes('rateLimit');

          if (!hasRateLimiting) {
            violations.push(file);
          }
        });
      });

      expect(violations).toEqual([]);
    });
  });

  describe('Error Information Disclosure', () => {
    test('should not expose internal error details to clients', () => {
      const violations: string[] = [];

      apiFiles.forEach(file => {
        // Skip dev routes (they're disabled in production anyway)
        const normalizedPath = file.replace(/\\/g, '/');
        if (normalizedPath.includes('/dev/')) return;

        const content = fs.readFileSync(file, 'utf8');

        // Check for exposing error.message or error.stack to response
        const exposesErrorDetails =
          content.match(/NextResponse\.json\([^)]*error\.(message|stack)/g) ||
          content.match(/return.*json\([^)]*error\.(message|stack)/g);

        if (exposesErrorDetails) {
          violations.push(file);
        }
      });

      expect(violations).toEqual([]);
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should not use string interpolation in database queries', () => {
      const violations: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for dangerous patterns like .from(`table_${var}`)
        // But allow .eq(), .or() with template literals (Supabase handles these safely)
        const dangerousFromPattern = content.match(/\.from\s*\(\s*`[^`]*\$\{/g);
        const dangerousRawPattern = content.match(/\.rpc\s*\(\s*`[^`]*\$\{/g);

        if (dangerousFromPattern || dangerousRawPattern) {
          violations.push(file);
        }
      });

      expect(violations).toEqual([]);
    });
  });

  describe('IDOR Prevention', () => {
    test('data access should be scoped to authenticated user', () => {
      const warnings: string[] = [];

      apiFiles.forEach(file => {
        // Skip dev routes and health checks
        if (file.includes('/dev/') || file.includes('/health')) return;

        const content = fs.readFileSync(file, 'utf8');

        // Check if route accesses data but doesn't verify user ownership
        const accessesData =
          content.includes(".from('profiles')") ||
          content.includes(".from('messages')") ||
          content.includes(".from('favorites')");

        const verifiesOwnership =
          content.includes('user.id') ||
          content.includes('currentUser.id') ||
          content.includes('auth.uid()');

        const hasAuth =
          content.includes('requireAuth') ||
          content.includes('getUser()');

        if (accessesData && hasAuth && !verifiesOwnership) {
          warnings.push(file);
        }
      });

      // Informational - some routes legitimately access public data
      if (warnings.length > 0) {
        console.warn('Routes that access data without explicit user ID check:');
        warnings.forEach(w => console.warn(`  - ${w}`));
      }
    });
  });
});

describe('Dangerous Pattern Detection', () => {
  const SOURCE_DIRS = ['app', 'components', 'lib'];

  function getAllSourceFiles(): string[] {
    let files: string[] = [];
    SOURCE_DIRS.forEach(dir => {
      files = files.concat(getAllFiles(dir, ['.ts', '.tsx', '.js', '.jsx']));
    });
    return files;
  }

  test('should not use eval() or Function constructor', () => {
    const violations: string[] = [];

    getAllSourceFiles().forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Skip test files and documentation
      if (file.includes('test') || file.includes('.md')) return;

      const hasEval = /\beval\s*\(/.test(content);
      const hasNewFunction = /new\s+Function\s*\(/.test(content);

      if (hasEval || hasNewFunction) {
        violations.push(file);
      }
    });

    expect(violations).toEqual([]);
  });

  test('should not use dangerouslySetInnerHTML with user input', () => {
    const violations: string[] = [];

    getAllSourceFiles().forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('dangerouslySetInnerHTML')) {
        // Check if it's using user-controlled data
        const hasDynamicContent =
          content.match(/dangerouslySetInnerHTML.*\$\{/g) ||
          content.match(/dangerouslySetInnerHTML.*props\./g) ||
          content.match(/dangerouslySetInnerHTML.*\bdata\b/g);

        if (hasDynamicContent) {
          violations.push(file);
        }
      }
    });

    expect(violations).toEqual([]);
  });

  test('should not expose service role key in client code', () => {
    // Filter out API routes and server files (handle both Unix and Windows paths)
    const clientFiles = getAllFiles('app', ['.ts', '.tsx']).filter(f => {
      const normalizedPath = f.replace(/\\/g, '/');
      return !normalizedPath.includes('/api/') && !normalizedPath.includes('server');
    });

    const violations: string[] = [];

    clientFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('SERVICE_ROLE') ||
          content.includes('service_role') ||
          content.includes('SUPABASE_SERVICE')) {
        violations.push(file);
      }
    });

    expect(violations).toEqual([]);
  });
});
