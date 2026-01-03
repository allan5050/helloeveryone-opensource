'use client'

import { Trash2, LogOut, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function DevToolsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogout = async () => {
    setLoading(true)
    await signOut()
    router.push('/')
  }

  const clearSession = () => {
    // Clear all session storage
    sessionStorage.clear()
    // Clear all local storage
    localStorage.clear()
    // Clear cookies
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
    })
    setMessage('All local data cleared! Refreshing...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const createTestProfile = async () => {
    if (!user) {
      setMessage('No user logged in')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/dev/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        setMessage('Test profile created! Redirecting to profile...')
        setTimeout(() => {
          router.push('/profile')
        }, 1000)
      } else {
        const error = await response.text()
        setMessage(`Error: ${error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Developer Tools
        </h1>
        <p className="mb-8 text-gray-600">Testing utilities for development</p>

        {/* Current User Info */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Current Session</h2>
          {user ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">User ID:</span> {user.id}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Provider:</span>{' '}
                {user.app_metadata?.provider || 'email'}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Not logged in</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold">Authentication</h3>
            <div className="space-y-3">
              <Button
                onClick={handleLogout}
                disabled={loading || !user}
                className="w-full justify-start"
                variant="outline"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout (to test signup flow)
              </Button>

              <Button
                onClick={clearSession}
                disabled={loading}
                className="w-full justify-start"
                variant="outline"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Local Data
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold">Database</h3>
            <div className="space-y-3">
              <Button
                onClick={createTestProfile}
                disabled={loading || !user}
                className="w-full justify-start"
                variant="outline"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Test Profile
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <a href="/signup" className="block text-blue-600 hover:underline">
                → Signup Page
              </a>
              <a href="/login" className="block text-blue-600 hover:underline">
                → Login Page
              </a>
              <a
                href="/profile/setup"
                className="block text-blue-600 hover:underline"
              >
                → Profile Setup
              </a>
              <a
                href="https://app.supabase.com/project/amarmxbvuzxakjzvntzv/auth/users"
                target="_blank"
                className="block text-blue-600 hover:underline"
              >
                → Supabase Users
              </a>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
