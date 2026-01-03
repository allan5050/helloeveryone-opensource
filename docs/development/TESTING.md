# Testing Documentation

## Overview

HelloEveryone uses a comprehensive testing strategy with multiple types of tests to ensure code quality and reliability.

## Testing Stack

- **Unit Tests**: Jest with @testing-library/react
- **Integration Tests**: Jest with API route testing
- **End-to-End Tests**: Playwright
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier

## Test Scripts

```bash
# Unit and Integration Tests
npm run test              # Run all Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:integration  # Run only integration tests

# End-to-End Tests
npm run test:e2e          # Run Playwright E2E tests

# Code Quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues automatically
npm run type-check        # Run TypeScript type checking
npm run format            # Format code with Prettier
npm run format:check      # Check if code is formatted
```

## Test Structure

```
project/
├── __tests__/           # Unit tests (components, utilities)
│   ├── components/      # Component tests
│   ├── hooks/          # Custom hook tests
│   ├── lib/            # Library function tests
│   └── utils/          # Utility function tests
├── tests/
│   ├── integration/    # API route integration tests
│   └── e2e/           # Playwright end-to-end tests
├── jest.config.js      # Jest configuration
├── playwright.config.ts # Playwright configuration
└── setupTests.ts       # Jest setup file
```

## Unit Testing

### Testing Components

```typescript
// __tests__/components/MatchCard.test.tsx
import { render, screen } from '@testing-library/react'
import { MatchCard } from '@/components/matching/MatchCard'

const mockMatch = {
  id: '123',
  first_name: 'John',
  age: 28,
  match_score: 85,
  shared_interests: ['hiking', 'photography'],
  bio: 'Love outdoor adventures',
  photos: ['photo1.jpg']
}

describe('MatchCard', () => {
  it('displays match information correctly', () => {
    render(<MatchCard match={mockMatch} />)
    
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('85% Match')).toBeInTheDocument()
    expect(screen.getByText('hiking, photography')).toBeInTheDocument()
  })

  it('handles favorite toggle', async () => {
    const mockToggleFavorite = jest.fn()
    render(<MatchCard match={mockMatch} onToggleFavorite={mockToggleFavorite} />)
    
    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    await userEvent.click(favoriteButton)
    
    expect(mockToggleFavorite).toHaveBeenCalledWith('123')
  })
})
```

### Testing Hooks

```typescript
// __tests__/hooks/useMatching.test.ts
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMatching } from '@/hooks/useMatching'

// Mock API calls
jest.mock('@/lib/api/matching', () => ({
  calculateMatches: jest.fn(),
  getMatches: jest.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useMatching', () => {
  it('calculates matches successfully', async () => {
    const mockMatches = [mockMatch]
    const mockCalculateMatches = require('@/lib/api/matching').calculateMatches
    mockCalculateMatches.mockResolvedValue({ matches: mockMatches })

    const { result } = renderHook(() => useMatching(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.calculateMatches()
    })

    expect(result.current.matches).toEqual(mockMatches)
    expect(result.current.isLoading).toBe(false)
  })
})
```

### Testing Utilities

```typescript
// __tests__/lib/matching/score.test.ts
import { calculateCompatibilityScore } from '@/lib/matching/score'

describe('calculateCompatibilityScore', () => {
  const user1 = {
    age: 28,
    interests: ['hiking', 'photography', 'travel'],
    bio: 'Love outdoor adventures and capturing memories',
    location: { lat: 40.7128, lng: -74.0060 }
  }

  const user2 = {
    age: 26,
    interests: ['photography', 'travel', 'cooking'],
    bio: 'Passionate about exploring new places and cuisines',
    location: { lat: 40.7589, lng: -73.9851 }
  }

  it('calculates score correctly', () => {
    const score = calculateCompatibilityScore(user1, user2)
    
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns higher scores for similar users', () => {
    const similarUser = {
      ...user2,
      age: 28,
      interests: ['hiking', 'photography', 'travel'],
    }

    const similarScore = calculateCompatibilityScore(user1, similarUser)
    const baseScore = calculateCompatibilityScore(user1, user2)

    expect(similarScore).toBeGreaterThan(baseScore)
  })
})
```

## Integration Testing

### Testing API Routes

```typescript
// tests/integration/api/match.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/match/calculate/route'
import { createServerClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

describe('/api/match/calculate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calculates matches for authenticated user', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' }
    const mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: mockUser } }
        })
      },
      rpc: jest.fn().mockResolvedValue({
        data: [{ id: 'match1', match_score: 85 }]
      })
    }
    
    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

    const { req, res } = createMocks({
      method: 'POST',
      body: { limit: 10 }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.matches).toHaveLength(1)
    expect(data.matches[0].match_score).toBe(85)
  })

  it('returns 401 for unauthenticated requests', async () => {
    const mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null }
        })
      }
    }
    
    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

    const { req, res } = createMocks({
      method: 'POST',
      body: { limit: 10 }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
  })
})
```

### Testing Database Operations

```typescript
// tests/integration/database/profiles.test.ts
import { createClient } from '@supabase/supabase-js'
import { createProfile, updateProfile } from '@/lib/supabase/profiles'

// Use test Supabase instance
const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
)

describe('Profile Operations', () => {
  let testUserId: string

  beforeEach(async () => {
    // Create test user
    const { data, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testpass123'
    })
    
    if (error) throw error
    testUserId = data.user!.id
  })

  afterEach(async () => {
    // Cleanup test data
    await supabase.auth.admin.deleteUser(testUserId)
  })

  it('creates profile successfully', async () => {
    const profileData = {
      first_name: 'Test',
      last_name: 'User',
      age: 28,
      bio: 'Test bio',
      interests: ['testing']
    }

    const profile = await createProfile(testUserId, profileData)

    expect(profile.id).toBe(testUserId)
    expect(profile.first_name).toBe('Test')
    expect(profile.interests).toEqual(['testing'])
  })
})
```

## End-to-End Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can sign up and login', async ({ page }) => {
    // Sign up
    await page.goto('/signup')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'testpass123')
    await page.fill('[data-testid="first-name"]', 'Test')
    await page.fill('[data-testid="last-name"]', 'User')
    await page.fill('[data-testid="age"]', '28')
    await page.click('[data-testid="signup-button"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome Test')).toBeVisible()

    // Sign out
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="sign-out"]')

    // Should redirect to home
    await expect(page).toHaveURL('/')

    // Sign in
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'testpass123')
    await page.click('[data-testid="login-button"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })
})

// tests/e2e/matching.spec.ts
test.describe('Matching System', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'testuser@example.com')
    await page.fill('[data-testid="password"]', 'testpass123')
    await page.click('[data-testid="login-button"]')
  })

  test('user can view matches', async ({ page }) => {
    await page.goto('/matches')
    
    // Wait for matches to load
    await expect(page.locator('[data-testid="match-card"]').first()).toBeVisible()
    
    // Check match information is displayed
    const firstMatch = page.locator('[data-testid="match-card"]').first()
    await expect(firstMatch.locator('[data-testid="match-name"]')).toBeVisible()
    await expect(firstMatch.locator('[data-testid="match-score"]')).toBeVisible()
  })

  test('user can favorite a match', async ({ page }) => {
    await page.goto('/matches')
    
    const firstMatch = page.locator('[data-testid="match-card"]').first()
    const favoriteButton = firstMatch.locator('[data-testid="favorite-button"]')
    
    await favoriteButton.click()
    
    // Should show favorited state
    await expect(favoriteButton).toHaveClass(/favorited/)
    
    // Should appear in favorites page
    await page.goto('/favorites')
    await expect(page.locator('[data-testid="match-card"]').first()).toBeVisible()
  })
})
```

## Test Data Management

### Mock Data

```typescript
// __tests__/mocks/data.ts
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  age: 28,
  bio: 'Test bio',
  interests: ['testing', 'coding'],
  photos: ['test.jpg']
}

export const mockEvent = {
  id: 'event-123',
  title: 'Test Event',
  description: 'A test event',
  event_date: '2024-12-01T19:00:00Z',
  venue_name: 'Test Venue',
  venue_address: '123 Test St',
  capacity: 50,
  attendee_count: 25
}

export const mockMatch = {
  id: 'match-123',
  first_name: 'Jane',
  age: 26,
  match_score: 85,
  shared_interests: ['hiking', 'photography'],
  bio: 'Love outdoor adventures',
  photos: ['jane.jpg']
}
```

### Test Database Setup

```typescript
// tests/helpers/database.ts
import { createClient } from '@supabase/supabase-js'

export const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!
)

export async function createTestUser(userData: Partial<User> = {}) {
  const { data, error } = await testSupabase.auth.admin.createUser({
    email: `test-${Date.now()}@example.com`,
    password: 'testpass123',
    email_confirm: true,
    user_metadata: userData
  })

  if (error) throw error
  return data.user
}

export async function cleanupTestUser(userId: string) {
  await testSupabase.auth.admin.deleteUser(userId)
}
```

## CI/CD Testing

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_API_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npm run type-check
    
    - name: Lint
      run: npm run lint
    
    - name: Unit tests
      run: npm run test:coverage
    
    - name: Build
      run: npm run build
    
    - name: E2E tests
      run: npm run test:e2e
```

## Testing Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
test('should calculate match score', () => {
  // Arrange
  const user1 = { interests: ['hiking'] }
  const user2 = { interests: ['hiking', 'reading'] }
  
  // Act
  const score = calculateMatch(user1, user2)
  
  // Assert
  expect(score).toBeGreaterThan(0)
})
```

### 2. Descriptive Test Names

```typescript
// Good
test('should return 404 when event does not exist')
test('should calculate higher score for users with shared interests')

// Bad
test('event test')
test('matching works')
```

### 3. Mock External Dependencies

```typescript
// Mock API calls
jest.mock('@/lib/api/openai', () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3])
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))
```

### 4. Test Data Isolation

```typescript
describe('User Profile Tests', () => {
  let testUser: User
  
  beforeEach(async () => {
    testUser = await createTestUser()
  })
  
  afterEach(async () => {
    await cleanupTestUser(testUser.id)
  })
  
  // Tests here use isolated test data
})
```

### 5. Error Case Testing

```typescript
test('should handle API failures gracefully', async () => {
  // Mock API failure
  jest.mocked(api.getMatches).mockRejectedValue(new Error('API Error'))
  
  const { result } = renderHook(() => useMatching())
  
  await act(async () => {
    await result.current.calculateMatches()
  })
  
  expect(result.current.error).toBe('Failed to calculate matches')
  expect(result.current.matches).toEqual([])
})
```

## Coverage Requirements

- **Minimum Coverage**: 80%
- **Critical Paths**: 95% (authentication, matching algorithms)
- **UI Components**: 70%
- **Utility Functions**: 90%

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './lib/matching/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
}
```

## Running Tests Locally

### Prerequisites

1. Install dependencies: `npm install`
2. Set up test environment variables in `.env.test.local`
3. Ensure test database is running

### Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- MatchCard.test.tsx

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Debug E2E tests
npx playwright test --debug
```

### Debugging Tests

```bash
# Debug Jest tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug with VS Code
# Add breakpoints and use VS Code's Jest extension

# Debug Playwright tests
npx playwright test --debug

# Generate Playwright test report
npx playwright show-report
```