'use client'

import {
  Calendar,
  Heart,
  Star,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { useAuth } from '@/app/contexts/AuthContext'

const navigation = [
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
    activeIcon: Calendar,
  },
  {
    name: 'Matches',
    href: '/matches',
    icon: Heart,
    activeIcon: Heart,
  },
  {
    name: 'Favorites',
    href: '/favorites',
    icon: Star,
    activeIcon: Star,
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    activeIcon: MessageSquare,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    activeIcon: User,
  },
]

export default function DesktopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link
                href="/events"
                className="text-xl font-bold text-purple-600"
              >
                HelloEveryone
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map(item => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = isActive ? item.activeIcon : item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-purple-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
