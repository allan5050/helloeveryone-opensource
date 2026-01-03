import { Metadata } from 'next'

import { EventForm } from '@/components/admin/EventForm'

export const metadata: Metadata = {
  title: 'Create Event - HelloEveryone.fun',
  description: 'Create a new event for the HelloEveryone platform community.',
}

export default function CreateEventPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
        <p className="mt-2 text-gray-600">
          Fill out the form below to create a new event for the platform.
        </p>
      </div>

      <EventForm />
    </div>
  )
}
