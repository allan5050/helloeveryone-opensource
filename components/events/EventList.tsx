'use client'

import { useState } from 'react'
import { EventWithRSVP } from '@/types/events'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface EventListProps {
  events: EventWithRSVP[]
  loading?: boolean
  showRSVP?: boolean
}

export function EventList({
  events,
  loading,
  showRSVP = false,
}: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventWithRSVP | null>(null)

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
          <EventCard
            key={event.id}
            event={event}
            onViewDetails={setSelectedEvent}
            showRSVP={showRSVP}
          />
        ))}
      </div>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={open => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
