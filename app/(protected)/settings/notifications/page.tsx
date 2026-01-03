'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface NotificationSettings {
  newMatches: boolean
  messages: boolean
  eventReminders: boolean
  eventUpdates: boolean
  marketingEmails: boolean
  pushNotifications: boolean
}

interface FrequencySettings {
  matchDigest: 'immediate' | 'daily' | 'weekly'
  eventReminders: '1hour' | '2hours' | '1day'
}

const notificationOptions = [
  {
    key: 'newMatches' as keyof NotificationSettings,
    title: 'New Matches',
    description: 'Get notified when you have new potential matches',
    category: 'Matching',
  },
  {
    key: 'messages' as keyof NotificationSettings,
    title: 'Messages',
    description: 'Receive notifications for new chat messages',
    category: 'Communication',
  },
  {
    key: 'eventReminders' as keyof NotificationSettings,
    title: 'Event Reminders',
    description: "Reminders for events you've RSVP'd to",
    category: 'Events',
  },
  {
    key: 'eventUpdates' as keyof NotificationSettings,
    title: 'Event Updates',
    description: "Updates about events you're interested in",
    category: 'Events',
  },
  {
    key: 'pushNotifications' as keyof NotificationSettings,
    title: 'Push Notifications',
    description: 'Receive push notifications on your device',
    category: 'General',
  },
  {
    key: 'marketingEmails' as keyof NotificationSettings,
    title: 'Marketing Emails',
    description: 'Tips, success stories, and platform updates',
    category: 'Marketing',
  },
]

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    newMatches: true,
    messages: true,
    eventReminders: true,
    eventUpdates: true,
    marketingEmails: false,
    pushNotifications: true,
  })

  const [frequency, setFrequency] = useState<FrequencySettings>({
    matchDigest: 'daily',
    eventReminders: '2hours',
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleFrequencyChange = (
    key: keyof FrequencySettings,
    value: string
  ) => {
    setFrequency(prev => ({
      ...prev,
      [key]: value as any,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Placeholder
      console.log('Notification settings saved:', { settings, frequency })
    } catch (error) {
      console.error('Error saving notification settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const groupedOptions = notificationOptions.reduce(
    (acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = []
      }
      acc[option.category].push(option)
      return acc
    },
    {} as Record<string, typeof notificationOptions>
  )

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
                Notifications
              </h1>
              <p className="text-sm text-gray-600">Manage your preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl md:max-w-4xl lg:max-w-7xl">
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {/* Notification Options by Category */}
          <div className="space-y-6">
            {Object.entries(groupedOptions).map(([category, options]) => (
              <div key={category}>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  {category}
                </h2>
                <div className="divide-y divide-gray-100 rounded-lg border bg-white">
                  {options.map(option => (
                    <div key={option.key} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {option.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {option.description}
                          </p>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleToggle(option.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              settings[option.key]
                                ? 'bg-blue-600'
                                : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                settings[option.key]
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Frequency Settings */}
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
              Frequency
            </h2>
            <div className="divide-y divide-gray-100 rounded-lg border bg-white">
              <div className="p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-900">
                  Match Digest
                </h3>
                <p className="mb-3 text-sm text-gray-600">
                  How often to receive match notifications
                </p>
                <select
                  value={frequency.matchDigest}
                  onChange={e =>
                    handleFrequencyChange('matchDigest', e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="immediate">Immediately</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                </select>
              </div>
              <div className="p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-900">
                  Event Reminders
                </h3>
                <p className="mb-3 text-sm text-gray-600">
                  When to remind you about upcoming events
                </p>
                <select
                  value={frequency.eventReminders}
                  onChange={e =>
                    handleFrequencyChange('eventReminders', e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="1hour">1 hour before</option>
                  <option value="2hours">2 hours before</option>
                  <option value="1day">1 day before</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-150 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
