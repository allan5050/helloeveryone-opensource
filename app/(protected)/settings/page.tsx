'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import Link from 'next/link'
import {
  UserCircle,
  ShieldCheck,
  Bell,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const settingSections = [
  {
    title: 'Account',
    items: [
      {
        name: 'Profile Settings',
        description: 'Update your profile information',
        href: '/profile/edit',
        icon: UserCircle,
      },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      {
        name: 'Privacy Settings',
        description: 'Control what others can see',
        href: '/settings/privacy',
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        name: 'Notifications',
        description: 'Manage your notification preferences',
        href: '/settings/notifications',
        icon: Bell,
      },
    ],
  },
  {
    title: 'About',
    items: [
      {
        name: 'About HelloEveryone',
        description: 'Version 1.0.0 • Terms & Privacy',
        href: '/about',
        icon: Info,
      },
    ],
  },
]

export default function SettingsPage() {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl md:max-w-4xl lg:max-w-7xl">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Signed in as {user?.email}
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl md:max-w-4xl lg:max-w-7xl">
        <div className="space-y-6">
          {settingSections.map(section => (
            <div key={section.title}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                {section.title}
              </h2>
              <div className="divide-y divide-gray-100 rounded-lg border bg-white shadow-sm">
                {section.items.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center p-4 transition-colors duration-150 hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0">
                      <item.icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 transition-colors duration-150 hover:bg-red-100"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
