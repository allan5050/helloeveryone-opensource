'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EventWithRSVP } from '@/types/event'

import RSVPButton from './RSVPButton'

// Demo component showcasing RSVP functionality
export function RSVPDemo() {
  // Sample events with different states
  const [events, setEvents] = useState<EventWithRSVP[]>([
    {
      id: 'demo-event-1',
      title: 'Available Event',
      description:
        'An event with plenty of spots available for RSVP demonstration.',
      location: 'Demo Venue 1',
      date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      capacity: 20,
      attendee_count: 5,
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      spots_remaining: 15,
      is_full: false,
      tags: ['demo', 'networking'],
    },
    {
      id: 'demo-event-2',
      title: 'Nearly Full Event',
      description: 'This event is almost at capacity - only a few spots left!',
      location: 'Demo Venue 2',
      date_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      capacity: 10,
      attendee_count: 8,
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      spots_remaining: 2,
      is_full: false,
      tags: ['demo', 'workshop'],
    },
    {
      id: 'demo-event-3',
      title: 'Full Event',
      description:
        'This event has reached capacity and is no longer accepting RSVPs.',
      location: 'Demo Venue 3',
      date_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      capacity: 15,
      attendee_count: 15,
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      spots_remaining: 0,
      is_full: true,
      tags: ['demo', 'meetup'],
    },
    {
      id: 'demo-event-4',
      title: 'Past Event',
      description:
        'This event has already occurred and RSVPs are no longer available.',
      location: 'Demo Venue 4',
      date_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      capacity: 25,
      attendee_count: 12,
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      spots_remaining: 13,
      is_full: false,
      tags: ['demo', 'social'],
    },
    {
      id: 'demo-event-5',
      title: "Event You're Attending",
      description: 'You have already RSVPd to this event.',
      location: 'Demo Venue 5',
      date_time: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
      capacity: 30,
      attendee_count: 18,
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      spots_remaining: 12,
      is_full: false,
      tags: ['demo', 'conference'],
      user_rsvp: {
        id: 'demo-rsvp-1',
        event_id: 'demo-event-5',
        user_id: 'demo-user',
        status: 'attending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ])

  const resetDemo = () => {
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">RSVP System Demo</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          This demo showcases the complete RSVP functionality including
          optimistic updates, capacity management, different event states, and
          error handling.
        </p>
        <Button onClick={resetDemo} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Demo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {events.map(event => {
          const isAttending = event.user_rsvp?.status === 'attending'
          const isPast = new Date(event.date_time) < new Date()
          const isFull = event.is_full

          let statusBadge
          if (isPast) {
            statusBadge = <Badge variant="secondary">Past Event</Badge>
          } else if (isAttending) {
            statusBadge = <Badge variant="default">Attending</Badge>
          } else if (isFull) {
            statusBadge = <Badge variant="destructive">Full</Badge>
          } else if (event.spots_remaining <= 5) {
            statusBadge = <Badge variant="outline">Few Spots Left</Badge>
          } else {
            statusBadge = <Badge variant="outline">Available</Badge>
          }

          return (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  {statusBadge}
                </div>
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow space-y-4">
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Location:</strong> {event.location}
                  </div>
                  <div>
                    <strong>Capacity:</strong> {event.attendee_count} /{' '}
                    {event.capacity}
                  </div>
                  <div>
                    <strong>Available:</strong> {event.spots_remaining} spots
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    {isPast ? 'Past' : isFull ? 'Full' : 'Available'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {event.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <RSVPButton
                  eventId={event.id}
                  capacity={event.capacity}
                  initialAttendeeCount={event.attendee_count}
                  initialHasRsvp={event.user_rsvp?.status === 'attending'}
                  onRsvpChange={(hasRsvp: boolean, newCount: number) => {
                    setEvents(prev =>
                      prev.map(e =>
                        e.id === event.id
                          ? {
                              ...e,
                              attendee_count: newCount,
                              spots_remaining: e.capacity - newCount,
                              is_full: newCount >= e.capacity,
                              user_rsvp: hasRsvp
                                ? {
                                    id: 'demo-rsvp',
                                    event_id: event.id,
                                    user_id: 'demo-user',
                                    status: 'attending' as const,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                  }
                                : undefined,
                            }
                          : e
                      )
                    )
                  }}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Demo Features</CardTitle>
          <CardDescription>
            This demo showcases all RSVP system capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">✅ Optimistic Updates</h4>
              <p>Immediate visual feedback when clicking RSVP buttons</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">⚡ Real-time Counts</h4>
              <p>Attendee counts update instantly with each interaction</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">🚫 Capacity Limits</h4>
              <p>Events become unavailable when full</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">⚠️ Smart Warnings</h4>
              <p>Users see warnings when few spots remain</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">🔄 Error Recovery</h4>
              <p>Failed requests rollback optimistic changes</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">📱 Mobile Responsive</h4>
              <p>Optimized for all screen sizes and touch devices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
