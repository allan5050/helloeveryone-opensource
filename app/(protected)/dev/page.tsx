'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2, LogOut, UserPlus, Database } from 'lucide-react'

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
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
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
        body: JSON.stringify({ userId: user.id })
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Developer Tools</h1>
        <p className="text-gray-600 mb-8">Testing utilities for development</p>

        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Session</h2>
          {user ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">User ID:</span> {user.id}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Provider:</span> {user.app_metadata?.provider || 'email'}</p>
            </div>
          ) : (
            <p className="text-gray-500">Not logged in</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Authentication</h3>
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

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Database</h3>
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

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <a href="/signup" className="block text-blue-600 hover:underline">→ Signup Page</a>
              <a href="/login" className="block text-blue-600 hover:underline">→ Login Page</a>
              <a href="/profile/setup" className="block text-blue-600 hover:underline">→ Profile Setup</a>
              <a href="https://app.supabase.com/project/amarmxbvuzxakjzvntzv/auth/users" target="_blank" className="block text-blue-600 hover:underline">→ Supabase Users</a>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}