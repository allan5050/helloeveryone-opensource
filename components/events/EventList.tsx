'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { Event } from '@/types/event'

import EventCard from './EventCard'

interface EventListProps {
  events: Event[]
  loading?: boolean
  showRSVP?: boolean
}

export function EventList({
  events,
  loading,
  showRSVP: _showRSVP = false,
}: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">No events found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting your search criteria
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <div key={event.id} onClick={() => setSelectedEvent(event)}>
            <EventCard event={event} />
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open: boolean) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedEvent && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              {selectedEvent.description && (
                <p className="text-gray-600">{selectedEvent.description}</p>
              )}
              <p className="text-sm text-gray-500">
                Location: {selectedEvent.location}
              </p>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
