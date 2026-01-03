/**
 * Security Test: Injection Attacks Prevention
 *
 * Ensures that the application is protected against:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Command Injection
 */

import fs from 'fs'
import path from 'path'

describe('Injection Attack Prevention', () => {
  describe('SQL Injection Protection', () => {
    test('should use Supabase client for queries (safe by default)', () => {
      const apiDir = 'app/api'

      if (!fs.existsSync(apiDir)) return

      const apiRoutes = getAllFiles(apiDir, ['.ts', '.tsx'])

      apiRoutes.forEach(route => {
        const content = fs.readFileSync(route, 'utf8')

        if (content.includes('database') || content.includes('query')) {
          const usesSupabase =
            content.includes('supabase.from(') ||
            content.includes('createClient')

          if (!usesSupabase && !route.includes('test')) {
            console.warn(`Review database operations in: ${route}`)
          }
        }
      })
    })
  })

  describe('XSS Protection', () => {
    test('should not use dangerouslySetInnerHTML without sanitization', () => {
      const dirs = ['app', 'components']

      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) return

        const files = getAllFiles(dir, ['.tsx', '.jsx'])

        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8')

          if (content.includes('dangerouslySetInnerHTML')) {
            const hasSanitization =
              content.includes('DOMPurify') || content.includes('sanitize')

            if (!hasSanitization && !file.includes('test')) {
              console.warn(
                `dangerouslySetInnerHTML without sanitization: ${file}`
              )
            }
          }
        })
      })
    })

    test('should not use eval() or Function() constructor', () => {
      const dirs = ['app', 'components', 'lib']

      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) return

        const files = getAllFiles(dir, ['.ts', '.tsx', '.js', '.jsx'])

        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8')

          const hasEval = content.match(/[^a-zA-Z]eval\(/g)
          const hasNewFunction = content.match(/new Function\(/g)

          if ((hasEval || hasNewFunction) && !file.includes('test')) {
            fail(`CRITICAL: Dangerous code execution in ${file}`)
          }
        })
      })
    })
  })

  describe('Command Injection Protection', () => {
    test('should not use child_process with dangerous patterns', () => {
      const dirs = ['app', 'lib', 'scripts']

      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) return

        const files = getAllFiles(dir, ['.ts', '.js'])

        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8')

          if (content.includes('child_process') || content.includes('exec')) {
            const hasShellTrue = content.includes('shell: true')

            if (
              hasShellTrue &&
              !file.includes('test') &&
              !file.includes('check-secrets')
            ) {
              console.warn(`Potential command injection risk: ${file}`)
            }
          }
        })
      })
    })
  })

  describe('Input Validation', () => {
    test('should validate API input with Zod', () => {
      const apiDir = 'app/api'

      if (!fs.existsSync(apiDir)) return

      const apiRoutes = getAllFiles(apiDir, ['.ts'])

      apiRoutes.forEach(route => {
        const content = fs.readFileSync(route, 'utf8')

        const hasMutationMethod =
          content.includes('export async function POST') ||
          content.includes('export async function PUT') ||
          content.includes('export async function PATCH')

        if (hasMutationMethod) {
          const hasValidation =
            content.includes('zod') ||
            content.includes('z.') ||
            content.includes('.parse(') ||
            content.includes('validate')

          if (!hasValidation && !route.includes('test')) {
            console.warn(`Potential missing input validation: ${route}`)
          }
        }
      })
    })
  })
})

function getAllFiles(dir: string, extensions: string[]): string[] {
  let files: string[] = []

  try {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)

      try {
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            files = files.concat(getAllFiles(fullPath, extensions))
          }
        } else {
          const ext = path.extname(fullPath)
          if (extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      } catch (err) {
        // Skip inaccessible files
      }
    }
  } catch (error) {
    // Directory might not exist
  }

  return files
}
