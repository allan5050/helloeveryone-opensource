# Progressive Web App (PWA) Documentation

## Overview

HelloEveryone is built as a Progressive Web App (PWA) to provide a native app-like experience on
mobile and desktop devices. The PWA implementation focuses on performance, offline capabilities, and
user engagement.

## PWA Features

### Core PWA Components

1. **Web App Manifest** (`public/manifest.json`)
2. **Service Worker** (via next-pwa)
3. **Responsive Design** (mobile-first)
4. **Installation Prompts**
5. **Update Notifications**
6. **Offline Support**

## Manifest Configuration

**Location:** `public/manifest.json`

```json
{
  "name": "HelloEveryone - Smart Social Matching",
  "short_name": "HelloEveryone",
  "description": "Find meaningful connections at local events through intelligent matching",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en",
  "dir": "ltr",
  "categories": ["social", "lifestyle", "entertainment"],
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Events",
      "short_name": "Events",
      "description": "Browse upcoming events",
      "url": "/events",
      "icons": [{ "src": "/shortcuts/events.png", "sizes": "96x96" }]
    },
    {
      "name": "Matches",
      "short_name": "Matches",
      "description": "View your matches",
      "url": "/matches",
      "icons": [{ "src": "/shortcuts/matches.png", "sizes": "96x96" }]
    }
  ]
}
```

### Manifest Properties Explained

- **`display: "standalone"`** - Removes browser UI for native app feel
- **`start_url: "/"`** - Entry point when launching from home screen
- **`theme_color`** - Colors the status bar on mobile devices
- **`orientation: "portrait-primary"`** - Optimized for mobile portrait mode
- **`shortcuts`** - Quick actions from app icon on Android

## Service Worker Implementation

### Next-PWA Configuration

**Location:** `next.config.js`

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10, // Fall back to cache if network is slow
      },
    },
  ],
})

module.exports = withPWA({
  // Next.js config
})
```

### Caching Strategies

1. **CacheFirst** - For static assets (fonts, icons)
2. **StaleWhileRevalidate** - For images and dynamic content
3. **NetworkFirst** - For API calls with offline fallback

## Installation Components

### PWA Install Prompt

**Location:** `components/PWAInstallPrompt.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Install HelloEveryone</h3>
          <p className="text-sm opacity-90">Get the full app experience</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="px-3 py-1 text-sm bg-blue-700 rounded"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1 text-sm bg-white text-blue-600 rounded font-semibold"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
```

### PWA Update Prompt

**Location:** `components/PWAUpdatePrompt.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

export function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdatePrompt(true)
      })

      // Check for updates periodically
      const checkForUpdate = () => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update()
          }
        })
      }

      const interval = setInterval(checkForUpdate, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [])

  const handleReload = () => {
    window.location.reload()
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Update Available</h3>
          <p className="text-sm opacity-90">A new version of the app is ready</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpdatePrompt(false)}
            className="px-3 py-1 text-sm bg-green-700 rounded"
          >
            Later
          </button>
          <button
            onClick={handleReload}
            className="px-3 py-1 text-sm bg-white text-green-600 rounded font-semibold"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
```

## Offline Capabilities

### Offline Pages

The app provides graceful offline experiences:

1. **Cached Content** - Previously viewed pages work offline
2. **Offline Indicators** - UI shows when app is offline
3. **Background Sync** - Queue actions for when online
4. **Fallback Pages** - Custom offline page for uncached routes

### Network Status Detection

```typescript
// hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Usage in Components

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function NetworkIndicator() {
  const isOnline = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="bg-yellow-500 text-white text-center py-2 text-sm">
      You're offline. Some features may not work.
    </div>
  )
}
```

## Performance Optimizations

### Lighthouse Scores Target

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 90+
- **SEO**: 90+
- **PWA**: 100

### Optimization Strategies

1. **Image Optimization**
   - Next.js Image component with automatic WebP conversion
   - Responsive images with proper sizing
   - Lazy loading for below-the-fold content

2. **Code Splitting**
   - Route-based code splitting (automatic with App Router)
   - Component-level code splitting with dynamic imports
   - Vendor chunk splitting

3. **Font Optimization**
   - Google Fonts with display swap
   - Font preloading for critical text
   - System font fallbacks

4. **Bundle Size**
   - Bundle analysis with @next/bundle-analyzer
   - Tree shaking for unused code
   - Dynamic imports for heavy components

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze

# Check bundle composition
npx next build --debug
```

## Mobile-First Design

### Responsive Breakpoints

```css
/* Tailwind CSS breakpoints used */
sm: 640px   /* Small devices (large phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Touch Interactions

- **44px minimum touch targets** for all interactive elements
- **Touch-friendly spacing** between clickable items
- **Swipe gestures** for navigation where appropriate
- **Pull-to-refresh** for data updates

### Mobile Navigation

```typescript
// Mobile-optimized navigation with drawer
export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 touch-manipulation" // Optimizes for touch
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        Menu
      </button>

      {/* Navigation drawer */}
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <NavigationItems />
      </Drawer>
    </>
  )
}
```

## App Store Integration

### Apple App Store

For iOS Safari, the PWA can be added to home screen with:

1. **Proper manifest configuration**
2. **Apple-specific meta tags**:

   ```html
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
   <meta name="apple-mobile-web-app-title" content="HelloEveryone" />
   ```

3. **Apple touch icons**:
   ```html
   <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
   ```

### Google Play Store

PWAs can be published to Google Play Store using:

1. **Trusted Web Activity (TWA)**
2. **PWABuilder** for automated packaging
3. **Bubblewrap** for custom builds

## Push Notifications

### Service Worker Registration

```typescript
// Register for push notifications
async function registerForPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.register('/sw.js')

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
```

### Push Notification Types

1. **Event Reminders** - 24h and 1h before events
2. **New Matches** - When high-compatibility matches are found
3. **Messages** - New chat messages
4. **RSVP Updates** - When event details change

## Testing PWA Features

### Manual Testing

1. **Installation**
   - Test install prompt on different devices
   - Verify app icon and splash screen
   - Test shortcuts functionality

2. **Offline Experience**
   - Disconnect network and test cached pages
   - Verify offline indicators work
   - Test background sync when reconnecting

3. **Performance**
   - Run Lighthouse audits
   - Test on slow networks (throttling)
   - Verify smooth scrolling and interactions

### Automated Testing

```javascript
// Playwright PWA testing
test('PWA should be installable', async ({ page, context }) => {
  await page.goto('/')

  // Check manifest
  const manifest = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]')
    return link?.href
  })
  expect(manifest).toBeTruthy()

  // Check service worker registration
  const swRegistered = await page.evaluate(() => {
    return 'serviceWorker' in navigator
  })
  expect(swRegistered).toBe(true)
})
```

## Deployment Considerations

### HTTPS Requirement

PWAs require HTTPS in production:

- Service workers only work over HTTPS
- Push notifications require secure context
- Some APIs (location, camera) require HTTPS

### CDN Configuration

```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.helloeveryone.fun' : '',

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
}
```

### Environment Variables

```env
# PWA Configuration
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Performance monitoring
NEXT_PUBLIC_WEB_VITALS_ENABLED=true
```

## Analytics and Monitoring

### PWA-Specific Metrics

Track these PWA metrics:

- **Installation rate** (install prompt acceptance)
- **Retention rate** (return visits after install)
- **Offline usage** (pages viewed offline)
- **Update adoption** (users who update the app)
- **Performance metrics** (Core Web Vitals)

### Implementation

```typescript
// Track PWA metrics
export function trackPWAInstall() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_install', {
      event_category: 'PWA',
      event_label: 'User installed PWA',
    })
  }
}

export function trackOfflineUsage() {
  if (!navigator.onLine && typeof gtag !== 'undefined') {
    gtag('event', 'offline_usage', {
      event_category: 'PWA',
      event_label: 'Page viewed offline',
    })
  }
}
```

## Future Enhancements

### Planned PWA Features

1. **Background Sync** - Queue actions for offline use
2. **Web Share API** - Native sharing functionality
3. **Contact Picker API** - Access device contacts
4. **Web Bluetooth** - Connect to fitness trackers
5. **Payment Request API** - Native payment experience
6. **Web Assembly** - For complex matching algorithms

### Platform-Specific Features

- **iOS**: App Store submission, Safari push notifications
- **Android**: Play Store submission, ambient badges, shortcuts
- **Windows**: Store submission, live tiles, taskbar integration
- **macOS**: Menu bar integration, dock badges
