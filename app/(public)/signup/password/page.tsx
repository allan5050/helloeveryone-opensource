'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft } from 'lucide-react'

export default function SignUpPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { signUp } = useAuth()
  
  const [email, setEmail] = useState('')

  // Development mode flag - set to true for local testing without Supabase
  const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem('signup-email')
    if (!storedEmail) {
      // If no email, redirect back to signup
      router.push('/signup')
    } else {
      setEmail(storedEmail)
    }
  }, [router])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Development mode - skip actual signup
    if (DEV_MODE) {
      console.log('DEV MODE: Would create account with:', { email, password: '***' })
      setMessage('DEV MODE: Account created! Redirecting...')
      sessionStorage.removeItem('signup-email')
      sessionStorage.setItem('dev-user-email', email)
      setTimeout(() => {
        router.push('/profile/setup')
      }, 1500)
      return
    }

    // Production mode - actual signup
    const { error } = await signUp(email, password)

    if (error) {
      // Check for CORS error
      if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
        setError('Connection error. Please check LOCAL_AUTH_SETUP.md for Supabase configuration.')
        console.error('CORS Error: Make sure to add localhost URLs to Supabase redirect URLs.')
        console.log('Quick fix: Go to https://app.supabase.com/project/amarmxbvuzxakjzvntzv/auth/url-configuration')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      setMessage('Check your email to verify your account!')
      // Clear session storage
      sessionStorage.removeItem('signup-email')
      // After signup, redirect to login
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }

  const handleBack = () => {
    router.push('/signup')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center">
            <Heart className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              HelloEveryone
            </span>
          </Link>
        </div>

        {/* Back button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>

        {/* Main Form */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create a password
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Make it at least 6 characters
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {message && (
              <p className="mt-2 text-sm text-green-600">{message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 6}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Email display */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Creating account for: <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* Dev mode indicator */}
        {DEV_MODE && (
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 text-center">
            DEV MODE: Auth bypass enabled
          </div>
        )}
      </div>
    </div>
  )
}