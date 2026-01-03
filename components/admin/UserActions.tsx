'use client'

import { MoreHorizontal, Shield, Ban, Eye, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/profile'

interface UserActionsProps {
  user: Profile
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleToggleAdmin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !user.is_admin })
        .eq('id', user.id)

      if (error) throw error

      router.refresh()
      setShowMenu(false)
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSuspension = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !user.is_suspended })
        .eq('id', user.id)

      if (error) throw error

      router.refresh()
      setShowMenu(false)
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="rounded-md p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            <button
              onClick={() => {
                setShowMenu(false)
              }}
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </button>

            <button
              onClick={handleToggleAdmin}
              disabled={isLoading}
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {user.is_admin ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Remove Admin
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Make Admin
                </>
              )}
            </button>

            <button
              onClick={handleToggleSuspension}
              disabled={isLoading}
              className={`flex w-full items-center px-4 py-2 text-left text-sm disabled:opacity-50 ${
                user.is_suspended
                  ? 'text-green-700 hover:bg-green-50'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <Ban className="mr-2 h-4 w-4" />
              {user.is_suspended ? 'Unsuspend User' : 'Suspend User'}
            </button>
          </div>
        </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}
    </div>
  )
}
