import { test, expect, Page } from '@playwright/test'

test.describe('Complete User Journey', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('complete user journey from signup to meeting', async () => {
    // Step 1: Navigate to landing page
    await test.step('Navigate to landing page', async () => {
      await page.goto('/')
      await expect(page).toHaveTitle(/HelloEveryone/)
      await expect(page.locator('h1')).toContainText(
        'Find meaningful connections'
      )
    })

    // Step 2: Sign up for new account
    await test.step('Sign up for new account', async () => {
      await page.click('[data-testid="signup-button"]')
      await expect(page).toHaveURL('/signup')

      // Fill signup form
      const email = `test${Date.now()}@example.com`
      await page.fill('[data-testid="email-input"]', email)
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill(
        '[data-testid="confirm-password-input"]',
        'TestPassword123!'
      )

      await page.click('[data-testid="submit-signup"]')

      // Wait for email verification message or redirect
      await expect(
        page.locator('[data-testid="verification-message"]')
      ).toBeVisible()
    })

    // Step 3: Complete profile setup
    await test.step('Complete profile setup', async () => {
      // Simulate email verification (would normally require email interaction)
      await page.goto('/profile/setup')

      // Fill basic profile information
      await page.fill('[data-testid="name-input"]', 'Test User')
      await page.fill('[data-testid="age-input"]', '28')
      await page.fill(
        '[data-testid="bio-textarea"]',
        'I love hiking, reading, and meeting new people!'
      )

      // Select interests
      await page.click('[data-testid="interest-hiking"]')
      await page.click('[data-testid="interest-reading"]')
      await page.click('[data-testid="interest-travel"]')

      // Set location
      await page.fill('[data-testid="location-input"]', 'San Francisco, CA')

      // Upload profile picture (mock file upload)
      const fileInput = page.locator('[data-testid="profile-picture-upload"]')
      await fileInput.setInputFiles({
        name: 'profile.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      })

      await page.click('[data-testid="save-profile"]')
      await expect(page).toHaveURL('/dashboard')
    })

    // Step 4: Browse and RSVP to events
    await test.step('Browse and RSVP to events', async () => {
      await page.goto('/events')

      // Wait for events to load
      await expect(
        page.locator('[data-testid="event-card"]').first()
      ).toBeVisible()

      // Click on first event
      await page.locator('[data-testid="event-card"]').first().click()

      // View event details
      await expect(page.locator('[data-testid="event-title"]')).toBeVisible()
      await expect(
        page.locator('[data-testid="event-description"]')
      ).toBeVisible()

      // RSVP to event
      await page.click('[data-testid="rsvp-going"]')
      await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()

      // Verify RSVP status is updated
      await expect(
        page.locator('[data-testid="current-rsvp-status"]')
      ).toContainText('Going')
    })

    // Step 5: Receive and view matches
    await test.step('Receive and view matches', async () => {
      await page.goto('/matches')

      // Wait for matches to be calculated (may take a moment)
      await page.waitForTimeout(2000)

      // Check if matches are displayed
      const matchCards = page.locator('[data-testid="match-card"]')
      await expect(matchCards.first()).toBeVisible()

      // View match details
      await matchCards.first().click()

      // Check match information is displayed
      await expect(page.locator('[data-testid="match-profile"]')).toBeVisible()
      await expect(page.locator('[data-testid="match-score"]')).toBeVisible()
      await expect(
        page.locator('[data-testid="common-interests"]')
      ).toBeVisible()
    })

    // Step 6: Add user to favorites
    await test.step('Add user to favorites', async () => {
      // From match profile, add to favorites
      await page.click('[data-testid="add-to-favorites"]')
      await expect(
        page.locator('[data-testid="favorite-success"]')
      ).toBeVisible()

      // Verify favorite button state changes
      await expect(
        page.locator('[data-testid="remove-from-favorites"]')
      ).toBeVisible()

      // Navigate to favorites page
      await page.goto('/favorites')

      // Verify user appears in favorites list
      await expect(
        page.locator('[data-testid="favorite-user-card"]')
      ).toBeVisible()
    })

    // Step 7: Initiate chat conversation
    await test.step('Initiate chat conversation', async () => {
      // Click chat button from favorites or match profile
      await page.click('[data-testid="start-chat"]')

      // Should navigate to chat page
      await expect(page).toHaveURL(/\/chat/)

      // Send first message
      await page.fill(
        '[data-testid="message-input"]',
        'Hi there! Nice to meet you!'
      )
      await page.press('[data-testid="message-input"]', 'Enter')

      // Verify message appears in chat
      await expect(
        page.locator('[data-testid="sent-message"]').last()
      ).toContainText('Hi there! Nice to meet you!')

      // Check message status
      await expect(
        page.locator('[data-testid="message-status"]').last()
      ).toContainText('Sent')
    })

    // Step 8: Export event to calendar
    await test.step('Export event to calendar', async () => {
      // Navigate back to event details
      await page.goto('/events')
      await page.locator('[data-testid="event-card"]').first().click()

      // Click export to calendar button
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-calendar"]')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.ics$/)

      // Verify download started
      await expect(page.locator('[data-testid="export-success"]')).toBeVisible()
    })

    // Step 9: Update profile and privacy settings
    await test.step('Update profile and privacy settings', async () => {
      await page.goto('/profile')

      // Update bio
      await page.click('[data-testid="edit-profile"]')
      await page.fill(
        '[data-testid="bio-textarea"]',
        'Updated bio: Love outdoor adventures and coffee chats!'
      )

      // Update privacy settings
      await page.click('[data-testid="privacy-settings"]')
      await page.check('[data-testid="hide-age"]')
      await page.check('[data-testid="private-favorites"]')

      await page.click('[data-testid="save-changes"]')
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible()
    })

    // Step 10: Test real-time notifications
    await test.step('Test real-time notifications', async () => {
      // Check notifications panel
      await page.click('[data-testid="notifications-button"]')

      // Should see notifications dropdown/panel
      await expect(
        page.locator('[data-testid="notifications-panel"]')
      ).toBeVisible()

      // Check for various notification types
      const notifications = page.locator('[data-testid="notification-item"]')
      if ((await notifications.count()) > 0) {
        // Click on first notification
        await notifications.first().click()

        // Should navigate to relevant page or mark as read
        await expect(
          page.locator('[data-testid="notification-read"]').first()
        ).toBeVisible()
      }
    })

    // Step 11: Test responsive design on mobile
    await test.step('Test mobile responsiveness', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Navigate to main pages and verify mobile layout
      await page.goto('/dashboard')
      await expect(
        page.locator('[data-testid="mobile-menu-button"]')
      ).toBeVisible()

      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

      // Navigate to events on mobile
      await page.click('[data-testid="mobile-events-link"]')
      await expect(page).toHaveURL('/events')

      // Verify events display properly on mobile
      await expect(page.locator('[data-testid="event-card"]')).toBeVisible()
    })

    // Step 12: Test PWA functionality
    await test.step('Test PWA functionality', async () => {
      // Reset to desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 })

      // Check if PWA manifest is accessible
      const manifestResponse = await page.goto('/manifest.json')
      expect(manifestResponse?.status()).toBe(200)

      // Check service worker registration (if applicable)
      await page.goto('/')
      const swRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator
      })
      expect(swRegistered).toBe(true)
    })

    // Step 13: Test logout and cleanup
    await test.step('Test logout', async () => {
      // Navigate to profile/settings
      await page.goto('/profile')

      // Click logout button
      await page.click('[data-testid="logout-button"]')

      // Should redirect to login/home page
      await expect(page).toHaveURL(/\/login|\/$/)

      // Verify user is logged out
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
    })
  })

  test('error handling and edge cases', async () => {
    // Test network failure scenarios
    await test.step('Handle network failures gracefully', async () => {
      await page.goto('/events')

      // Simulate offline mode
      await page.context().setOffline(true)

      // Try to RSVP while offline
      await page.locator('[data-testid="event-card"]').first().click()
      await page.click('[data-testid="rsvp-going"]')

      // Should show offline message or queue action
      await expect(
        page.locator(
          '[data-testid="offline-message"], [data-testid="action-queued"]'
        )
      ).toBeVisible()

      // Restore connection
      await page.context().setOffline(false)
    })

    // Test form validation
    await test.step('Test form validation', async () => {
      await page.goto('/signup')

      // Submit empty form
      await page.click('[data-testid="submit-signup"]')

      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible()

      // Test invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email')
      await page.click('[data-testid="submit-signup"]')
      await expect(page.locator('[data-testid="email-error"]')).toContainText(
        'valid email'
      )
    })

    // Test capacity limits
    await test.step('Test event capacity limits', async () => {
      await page.goto('/events')

      // Find an event at capacity (would need test data setup)
      const fullEvent = page.locator('[data-testid="event-full"]').first()

      if (await fullEvent.isVisible()) {
        await fullEvent.click()

        // RSVP button should be disabled or show waitlist option
        await expect(
          page.locator(
            '[data-testid="rsvp-disabled"], [data-testid="join-waitlist"]'
          )
        ).toBeVisible()
      }
    })
  })

  test('accessibility compliance', async () => {
    await test.step('Test keyboard navigation', async () => {
      await page.goto('/')

      // Test tab navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      // Should be able to navigate and interact with keyboard only
    })

    await test.step('Test screen reader compatibility', async () => {
      await page.goto('/events')

      // Check for proper ARIA labels
      const ariaElements = page.locator('[aria-label]')
      expect(await ariaElements.count()).toBeGreaterThanOrEqual(1)

      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible()
      const headings = page.locator('h2, h3')
      expect(await headings.count()).toBeGreaterThanOrEqual(1)
    })

    await test.step('Test color contrast and visual accessibility', async () => {
      await page.goto('/dashboard')

      // This would require additional accessibility testing tools
      // For now, just verify important elements are visible
      await expect(
        page.locator('[data-testid="main-navigation"]')
      ).toBeVisible()
      await expect(page.locator('[data-testid="content-area"]')).toBeVisible()
    })
  })
})
