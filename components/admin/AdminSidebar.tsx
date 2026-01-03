'use client'

import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Plus,
  Home,
  Menu,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Create Event', href: '/admin/events/create', icon: Plus },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5',
                  isActive
                    ? 'text-blue-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/dashboard"
          onClick={() => setIsMobileMenuOpen(false)}
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <Home className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          Back to App
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed left-0 top-0 z-50 w-full border-b bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-white shadow-lg lg:block">
        <SidebarContent />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
