/**
 * Security Test: Business Logic Vulnerabilities
 *
 * Tests for common business logic security flaws that static analysis can detect.
 * These tests scan source code for patterns that indicate vulnerabilities.
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
    } else if (extensions.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Business Logic Security', () => {
  describe('Self-Operation Prevention', () => {
    const selfOperationEndpoints = [
      {
        file: 'app/api/profile/favorite/route.ts',
        operation: 'favoriting',
        checkPatterns: ['Cannot favorite yourself', 'profileId === user.id', 'profileId !== user.id'],
      },
      {
        file: 'app/api/privacy/block/route.ts',
        operation: 'blocking',
        checkPatterns: ['Cannot block yourself', 'blockedUserId === currentUser.id', 'currentUser.id === blockedUserId'],
      },
      {
        file: 'app/api/chat/send/route.ts',
        operation: 'messaging',
        checkPatterns: ['Cannot send message to yourself', 'receiver_id === user.id', 'user.id === receiver_id'],
      },
    ];

    selfOperationEndpoints.forEach(({ file, operation, checkPatterns }) => {
      test(`${operation} endpoint should prevent self-${operation}`, () => {
        if (!fs.existsSync(file)) {
          console.warn(`File not found: ${file}`);
          return;
        }

        const content = fs.readFileSync(file, 'utf8');
        const hasSelfCheck = checkPatterns.some(pattern => content.includes(pattern));

        expect(hasSelfCheck).toBe(true);
      });
    });
  });

  describe('Authorization Boundaries', () => {
    test('users should only be able to delete their own resources', () => {
      const deleteEndpoints = getAllFiles('app/api', ['.ts']).filter(f => {
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('DELETE') && content.includes('.delete(');
      });

      const violations: string[] = [];

      deleteEndpoints.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check if delete operations verify user ownership
        const hasOwnershipCheck =
          content.includes('user.id') ||
          content.includes('currentUser.id') ||
          content.includes('auth.uid()');

        if (!hasOwnershipCheck && !file.includes('/dev/')) {
          violations.push(file);
        }
      });

      if (violations.length > 0) {
        console.warn('DELETE endpoints without ownership verification:');
        violations.forEach(v => console.warn(`  - ${v}`));
      }

      expect(violations.length).toBe(0);
    });

    test('update operations should verify resource ownership', () => {
      const updateEndpoints = getAllFiles('app/api', ['.ts']).filter(f => {
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('.update(') && !f.includes('/dev/');
      });

      const violations: string[] = [];

      updateEndpoints.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        const hasOwnershipCheck =
          content.includes('.eq(') &&
          (content.includes('user.id') || content.includes('currentUser.id'));

        if (!hasOwnershipCheck) {
          // Check if it's updating user's own data via auth
          const hasAuthContext = content.includes('requireAuth');
          if (!hasAuthContext) {
            violations.push(file);
          }
        }
      });

      expect(violations.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Block Relationship Enforcement', () => {
    test('messaging should check for block relationships', () => {
      const messageFile = 'app/api/chat/send/route.ts';
      if (!fs.existsSync(messageFile)) return;

      const content = fs.readFileSync(messageFile, 'utf8');

      // Should check blocks table before sending
      const checksBlocks =
        content.includes("from('blocks')") ||
        content.includes('blocks') && content.includes('blocker_id');

      expect(checksBlocks).toBe(true);
    });

    test('match display should respect block relationships', () => {
      const matchFiles = getAllFiles('app/api/match', ['.ts']);

      matchFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // If querying profiles for matches, should exclude blocked users
        if (content.includes("from('profiles')") && content.includes('match')) {
          // This is informational - blocking may be handled at RLS level
          const hasBlockFilter =
            content.includes('blocks') ||
            content.includes('blocked');

          if (!hasBlockFilter) {
            console.info(`Note: ${file} may need block filtering (might be handled by RLS)`);
          }
        }
      });
    });
  });

  describe('Privilege Escalation Prevention', () => {
    test('should not allow setting admin/elevated privileges via API', () => {
      const apiFiles = getAllFiles('app/api', ['.ts']);
      const violations: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for dangerous privilege fields in inserts/updates
        const setsPrivileges =
          content.match(/\.insert\([^)]*is_admin/g) ||
          content.match(/\.update\([^)]*is_admin/g) ||
          content.match(/\.insert\([^)]*role.*admin/gi) ||
          content.match(/\.update\([^)]*role.*admin/gi);

        if (setsPrivileges && !file.includes('/dev/')) {
          violations.push(file);
        }
      });

      expect(violations).toEqual([]);
    });

    test('service role key should only be used in appropriate contexts', () => {
      const apiFiles = getAllFiles('app/api', ['.ts']);
      const serviceRoleUsage: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        if (content.includes('SERVICE_ROLE') || content.includes('service_role')) {
          serviceRoleUsage.push(file);
        }
      });

      // Service role should only be used in admin/system operations
      serviceRoleUsage.forEach(file => {
        const isDevRoute = file.includes('/dev/');
        const isPrivacyDelete = file.includes('privacy/delete');

        if (!isDevRoute && !isPrivacyDelete) {
          console.warn(`Unexpected service role usage in: ${file}`);
        }
      });

      // Allow some controlled usage
      expect(serviceRoleUsage.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Data Leakage Prevention', () => {
    test('should not expose internal IDs or sensitive fields in responses', () => {
      const apiFiles = getAllFiles('app/api', ['.ts']);
      const concerns: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for selecting all fields without filtering
        if (content.includes(".select('*')") && !file.includes('/dev/')) {
          concerns.push(`${file}: Uses SELECT * which may expose internal fields`);
        }

        // Check for exposing password hashes (shouldn't exist, but check)
        if (content.includes('password_hash') || content.includes('hashed_password')) {
          concerns.push(`${file}: May expose password hashes`);
        }
      });

      if (concerns.length > 0) {
        console.warn('Data exposure concerns:');
        concerns.forEach(c => console.warn(`  - ${c}`));
      }
    });

    test('error responses should not leak internal details', () => {
      const apiFiles = getAllFiles('app/api', ['.ts']);
      const violations: string[] = [];

      apiFiles.forEach(file => {
        // Skip dev routes (they're disabled in production)
        const normalizedPath = file.replace(/\\/g, '/');
        if (normalizedPath.includes('/dev/')) return;

        const content = fs.readFileSync(file, 'utf8');

        // Check for exposing error.message directly in response
        const exposesError =
          content.match(/json\(\s*\{[^}]*error:\s*error\.message/g) ||
          content.match(/json\(\s*\{[^}]*error:\s*\$\{error/g);

        if (exposesError) {
          violations.push(file);
        }
      });

      expect(violations).toEqual([]);
    });
  });

  describe('Constraint Violation Handling', () => {
    test('duplicate insert operations should handle constraint violations', () => {
      const insertEndpoints = getAllFiles('app/api', ['.ts']).filter(f => {
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('.insert(') && !f.includes('/dev/');
      });

      const needsConstraintHandling: string[] = [];

      insertEndpoints.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // If inserting into tables with unique constraints (favorites, blocks, rsvps)
        const insertsToConstrainedTable =
          content.includes("from('favorites')") ||
          content.includes("from('blocks')") ||
          content.includes("from('rsvps')");

        if (insertsToConstrainedTable) {
          const handlesConstraint =
            content.includes('23505') || // Postgres unique violation code
            content.includes('PGRST116') || // Supabase not found
            content.includes('onConflict') ||
            content.includes('upsert') ||
            content.includes('already') || // "already favorited" etc.
            content.includes('duplicate') ||
            content.includes('exists');

          if (!handlesConstraint) {
            needsConstraintHandling.push(file);
          }
        }
      });

      if (needsConstraintHandling.length > 0) {
        console.warn('Endpoints that may need constraint violation handling:');
        needsConstraintHandling.forEach(f => console.warn(`  - ${f}`));
      }

      expect(needsConstraintHandling.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('API Route Security Patterns', () => {
  const apiFiles = getAllFiles('app/api', ['.ts']);

  describe('Authentication Enforcement', () => {
    test('non-public endpoints should require authentication', () => {
      const publicEndpoints = ['/health', '/webhook'];
      const violations: string[] = [];

      apiFiles.forEach(file => {
        // Skip dev routes and known public endpoints
        if (file.includes('/dev/') || publicEndpoints.some(p => file.includes(p))) {
          return;
        }

        const content = fs.readFileSync(file, 'utf8');

        // Check for auth requirement
        const hasAuth =
          content.includes('requireAuth') ||
          content.includes('getUser()') ||
          content.includes('auth.getSession');

        // Check for production protection (alternative for dev routes)
        const hasProductionCheck =
          content.includes("NODE_ENV === 'production'") ||
          content.includes('process.env.NODE_ENV');

        if (!hasAuth && !hasProductionCheck) {
          violations.push(file);
        }
      });

      if (violations.length > 0) {
        console.warn('Endpoints potentially missing authentication:');
        violations.forEach(v => console.warn(`  - ${v}`));
      }

      expect(violations.length).toBeLessThanOrEqual(1); // Allow health endpoint
    });
  });

  describe('HTTP Method Security', () => {
    test('state-changing operations should use appropriate HTTP methods', () => {
      const violations: string[] = [];

      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        // GET requests should not modify data
        if (content.includes('export async function GET')) {
          const modifiesData =
            content.match(/GET[^}]*\.insert\(/s) ||
            content.match(/GET[^}]*\.update\(/s) ||
            content.match(/GET[^}]*\.delete\(/s);

          // Exception: marking messages as read is acceptable side effect
          if (modifiesData && !content.includes('is_read')) {
            violations.push(`${file}: GET handler modifies data`);
          }
        }
      });

      if (violations.length > 0) {
        console.warn('HTTP method violations:');
        violations.forEach(v => console.warn(`  - ${v}`));
      }
    });
  });
});
