'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PrivacySettings {
  showBio: boolean
  showInterests: boolean
  showAge: boolean
  showLocation: boolean
  showAvailability: boolean
}

const privacyOptions = [
  {
    key: 'showBio' as keyof PrivacySettings,
    title: 'Bio',
    description: 'Let others see your profile description and personality',
    mutualInfo: 'You can only filter matches by bio if you share your own bio',
  },
  {
    key: 'showInterests' as keyof PrivacySettings,
    title: 'Interests',
    description: 'Show your hobbies and interests to potential matches',
    mutualInfo:
      'You can only filter by interests if you share your own interests',
  },
  {
    key: 'showAge' as keyof PrivacySettings,
    title: 'Age',
    description: 'Display your age on your profile',
    mutualInfo: 'You can only filter matches by age if you share your own age',
  },
  {
    key: 'showLocation' as keyof PrivacySettings,
    title: 'Location',
    description: 'Share your general location for local event matching',
    mutualInfo:
      'You can only see matches in your area if you share your location',
  },
  {
    key: 'showAvailability' as keyof PrivacySettings,
    title: 'Availability',
    description: "Show when you're available to attend events",
    mutualInfo:
      'You can only filter by availability if you share your own schedule',
  },
]

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    showBio: true,
    showInterests: true,
    showAge: true,
    showLocation: true,
    showAvailability: true,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = (key: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API call to save privacy settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Placeholder
      console.log('Privacy settings saved:', settings)
    } catch (error) {
      console.error('Error saving privacy settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-md px-4 py-4 sm:max-w-2xl md:max-w-4xl lg:max-w-7xl">
          <div className="flex items-center">
            <Link
              href="/settings"
              className="-ml-2 mr-4 rounded-full p-2 transition-colors duration-150 hover:bg-gray-100"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Privacy Settings
              </h1>
              <p className="text-sm text-gray-600">
                Control what others can see
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl md:max-w-4xl lg:max-w-7xl">
        {/* Mutual Visibility Explanation */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-blue-900">
            Mutual Visibility Rule
          </h3>
          <p className="text-sm text-blue-700">
            You can only search or filter matches by information that you also
            share. This ensures fairness and encourages authentic profiles.
          </p>
        </div>

        {/* Privacy Options */}
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
          {privacyOptions.map(option => (
            <div key={option.key} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {option.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {option.description}
                  </p>
                  <p className="mt-2 text-xs italic text-gray-500">
                    {option.mutualInfo}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle(option.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings[option.key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        settings[option.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-150 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {isSaving ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
