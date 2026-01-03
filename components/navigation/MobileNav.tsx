'use client'

import { Calendar, Heart, MessageSquare, User, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: Home,
    activeIcon: Home,
  },
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

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white sm:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16">
        {navigation.map(item => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = isActive ? item.activeIcon : item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center px-2 py-2 text-xs font-medium transition-all duration-200 ease-in-out active:scale-95 ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100'
              } `}
              aria-label={`${item.name}${isActive ? ' (current page)' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`mb-1 h-6 w-6 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
                aria-hidden="true"
              />
              <span className="truncate text-center leading-tight">
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
