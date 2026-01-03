import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

import DesktopNav from '@/components/navigation/DesktopNav'
import MobileNav from '@/components/navigation/MobileNav'
import { createClient } from '@/lib/supabase/server'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <div className="hidden sm:block">
        <DesktopNav />
      </div>

      {/* Main Content */}
      <main className="pb-16 sm:pb-0 sm:pt-0">{children}</main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
