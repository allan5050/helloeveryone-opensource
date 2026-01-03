'use client'

import { useRouter } from 'next/navigation'

import { useAuth } from '@/app/contexts/AuthContext'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function LogoutButton({
  className = '',
  children = 'Sign out',
}: LogoutButtonProps) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <button onClick={handleSignOut} className={className}>
      {children}
    </button>
  )
}
