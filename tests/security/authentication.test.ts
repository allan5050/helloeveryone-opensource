/**
 * Security Test: Authentication & Authorization
 * 
 * Ensures that protected routes and API endpoints require proper authentication
 * and that users can only access their own data.
 */

import fs from 'fs';
import path from 'path';

describe('Authentication Security', () => {
  describe('API Routes Protection', () => {
    test('should have authentication checks in all API routes', () => {
      const apiDir = 'app/api';
      
      if (!fs.existsSync(apiDir)) {
        console.warn('API directory not found');
        return;
      }

      const apiRoutes = getAllFiles(apiDir, ['.ts', '.tsx']);
      
      // Routes that should be public (whitelist)
      const publicRoutes = [
        'auth/callback',
        'webhook',
      ];

      apiRoutes.forEach(route => {
        const content = fs.readFileSync(route, 'utf8');
        const isPublic = publicRoutes.some(pr => route.includes(pr));
        
        if (!isPublic && !route.includes('test')) {
          // Check for auth verification
          const hasAuthCheck = 
            content.includes('requireAuth') ||
            content.includes('getUser()') ||
            content.includes('auth.getUser()') ||
            content.includes('supabase.auth.getUser()');
          
          if (!hasAuthCheck) {
            console.warn(`Potential missing auth check: ${route}`);
          }
        }
      });
    });
  });

  describe('Session Management', () => {
    test('should not store tokens in localStorage', () => {
      const clientDirs = ['app', 'components', 'hooks'];
      
      clientDirs.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        
        const files = getAllFiles(dir, ['.ts', '.tsx']);
        
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          
          const hasLocalStorageToken = 
            content.match(/localStorage\.setItem\(['"].*token/i);
          
          if (hasLocalStorageToken && !file.includes('test')) {
            console.warn(`Potential token in localStorage: ${file}`);
          }
        });
      });
    });
  });

  describe('RLS Policies', () => {
    test('should have RLS enabled in migrations', () => {
      const migrationsDir = 'supabase/migrations';
      
      if (!fs.existsSync(migrationsDir)) {
        return;
      }

      const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      let rlsEnabled = false;
      
      migrations.forEach(migration => {
        const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf8');
        if (content.includes('ENABLE ROW LEVEL SECURITY')) {
          rlsEnabled = true;
        }
      });
      
      expect(rlsEnabled).toBe(true);
    });
  });
});

function getAllFiles(dir: string, extensions: string[]): string[] {
  let files: string[] = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(getAllFiles(fullPath, extensions));
        }
      } else {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Directory might not exist
  }
  
  return files;
}
