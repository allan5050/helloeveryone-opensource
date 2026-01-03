'use client'

import { X, Download, Smartphone } from 'lucide-react'
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(isStandaloneMode)

    // Don't show prompt if already installed
    if (isStandaloneMode) {
      return
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)

      // Show the prompt after a delay to avoid being annoying
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed, dismissed, or no prompt available
  if (
    isStandalone ||
    !showPrompt ||
    !deferredPrompt ||
    sessionStorage.getItem('pwa-prompt-dismissed')
  ) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Install HelloEveryone
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Install our app for a better experience with offline access and
          notifications.
        </p>

        <div className="flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex flex-1 items-center justify-center space-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-sm text-gray-600 transition-colors duration-200 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
