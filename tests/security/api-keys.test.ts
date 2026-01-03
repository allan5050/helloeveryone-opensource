/**
 * Security Test: API Key Exposure
 * 
 * Ensures that sensitive API keys and credentials are never exposed
 * in the codebase, client-side code, or API responses.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('API Key Security', () => {
  describe('Environment Variables', () => {
    test('should not have real API keys in .env.example', () => {
      const envExample = fs.readFileSync('env.example', 'utf8');
      
      // Check for real Supabase service role keys (start with eyJ and are very long)
      expect(envExample).not.toMatch(/eyJ[A-Za-z0-9_-]{100,}/);
      
      // Check for real OpenAI keys
      expect(envExample).not.toMatch(/sk-[A-Za-z0-9]{32,}/);
      
      // Check for real Anthropic keys
      expect(envExample).not.toMatch(/sk-ant-[A-Za-z0-9_-]{32,}/);
      
      // Should contain placeholders instead (various placeholder patterns)
      expect(envExample).toMatch(/your-.*-key|your-key-here/);
    });

    test('should have .env.local in .gitignore', () => {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      expect(gitignore).toMatch(/\.env\.local/);
      // Use multiline flag and handle both \n and \r\n line endings
      expect(gitignore).toMatch(/^\.env\r?$/m);
    });

    test('should not have committed .env files', () => {
      const gitFiles = execSync('git ls-files', { encoding: 'utf8' });
      expect(gitFiles).not.toContain('.env.local');
      expect(gitFiles).not.toContain('.env\n');
    });
  });

  describe('Source Code Scanning', () => {
    const SOURCE_DIRS = ['app', 'components', 'lib', 'pages'];
    
    test('should not have hardcoded Supabase service role keys', () => {
      SOURCE_DIRS.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        
        const files = getAllFiles(dir, ['.ts', '.tsx', '.js', '.jsx']);
        
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for service role key pattern
          const serviceRoleMatch = content.match(/eyJ[A-Za-z0-9_-]{100,}/g);
          if (serviceRoleMatch && !file.includes('test')) {
            expect(serviceRoleMatch).toBeNull();
          }
        });
      });
    });

    test('should not have hardcoded OpenAI API keys', () => {
      SOURCE_DIRS.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        
        const files = getAllFiles(dir, ['.ts', '.tsx', '.js', '.jsx']);
        
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for OpenAI key pattern (sk-...)
          const openAIMatch = content.match(/['"]sk-[A-Za-z0-9]{32,}['"]/g);
          if (openAIMatch && !file.includes('test') && !isPlaceholder(openAIMatch[0])) {
            fail(`Found potential OpenAI API key in ${file}: ${openAIMatch[0].substring(0, 20)}...`);
          }
        });
      });
    });

    test('should not have hardcoded passwords', () => {
      SOURCE_DIRS.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        
        const files = getAllFiles(dir, ['.ts', '.tsx', '.js', '.jsx']);
        
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          
          // Look for common password patterns
          const passwordPatterns = [
            /password\s*=\s*['"][^'"]{8,}['"]/gi,
            /passwd\s*=\s*['"][^'"]{8,}['"]/gi,
            /pwd\s*=\s*['"][^'"]{8,}['"]/gi,
          ];
          
          passwordPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches && !file.includes('test')) {
              // Exclude common test passwords and placeholder
              const realPasswords = matches.filter(m => 
                !m.includes('password123') &&
                !m.includes('test') &&
                !m.includes('example') &&
                !m.includes('your-')
              );
              
              expect(realPasswords.length).toBe(0);
            }
          });
        });
      });
    });
  });

  describe('API Response Security', () => {
    test('should not include SUPABASE_SERVICE_ROLE_KEY in environment', () => {
      // This key should NEVER be in client-side env vars
      expect(process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    });

    test('should not include OpenAI key in public env', () => {
      expect(process.env.NEXT_PUBLIC_OPENAI_API_KEY).toBeUndefined();
    });

    test('should not include Anthropic key in public env', () => {
      expect(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY).toBeUndefined();
    });

    test('should not include database password in public env', () => {
      expect(process.env.NEXT_PUBLIC_DB_PASSWORD).toBeUndefined();
    });
  });

  describe('Configuration Files', () => {
    test('should not have secrets in package.json', () => {
      const packageJson = fs.readFileSync('package.json', 'utf8');
      
      // Check for common secret patterns
      expect(packageJson).not.toMatch(/sk-[A-Za-z0-9]{32,}/);
      expect(packageJson).not.toMatch(/eyJ[A-Za-z0-9_-]{100,}/);
    });

    test('should not have secrets in next.config.js', () => {
      if (fs.existsSync('next.config.js')) {
        const nextConfig = fs.readFileSync('next.config.js', 'utf8');
        
        expect(nextConfig).not.toMatch(/sk-[A-Za-z0-9]{32,}/);
        expect(nextConfig).not.toMatch(/eyJ[A-Za-z0-9_-]{100,}/);
      }
    });
  });
});

// Helper functions

function getAllFiles(dir: string, extensions: string[]): string[] {
  let files: string[] = [];
  
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
  
  return files;
}

function isPlaceholder(match: string): boolean {
  const placeholders = [
    'your-key-here',
    'your-api-key',
    'sk-your-',
    'sk-ant-your-',
    'example',
    'test',
    'demo',
  ];
  
  return placeholders.some(p => match.toLowerCase().includes(p));
}
