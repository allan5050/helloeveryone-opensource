import { notFound } from 'next/navigation'

import { EventForm } from '@/components/admin/EventForm'
import { createClient } from '@/lib/supabase/server'

async function getEvent(id: string) {
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    return null
  }

  return event
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="mt-2 text-gray-600">Update the event details below.</p>
      </div>

      <EventForm event={event} isEdit />
    </div>
  )
}
