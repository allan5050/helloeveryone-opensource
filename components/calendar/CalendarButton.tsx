'use client'

import { Calendar, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface CalendarButtonProps {
  eventId: string
  eventName: string
  userRsvpStatus?: 'going' | 'maybe' | 'not_going' | null
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function CalendarButton({
  eventId,
  eventName,
  userRsvpStatus,
  className,
  variant = 'outline',
  size = 'md',
}: CalendarButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (userRsvpStatus !== 'going') {
      toast.error('Please RSVP as "Going" to add this event to your calendar')
      return
    }

    setIsDownloading(true)

    try {
      const response = await fetch(`/api/calendar/event/${eventId}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate calendar file')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Calendar file downloaded! Check your downloads folder.')

      // Track calendar download for analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        ;(window as any).gtag('event', 'calendar_download', {
          event_category: 'engagement',
          event_label: eventId,
        })
      }
    } catch (error) {
      console.error('Calendar download error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to download calendar file'
      )
    } finally {
      setIsDownloading(false)
    }
  }

  const isDisabled = userRsvpStatus !== 'going' || isDownloading

  return (
    <Button
      onClick={handleDownload}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={className}
    >
      {isDownloading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Calendar className="mr-2 h-4 w-4" />
      )}
      {isDownloading ? 'Generating...' : 'Add to Calendar'}
    </Button>
  )
}

// Helper component for quick calendar download with icon only
export function CalendarIconButton({
  eventId,
  eventName,
  userRsvpStatus,
  className,
}: CalendarButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (userRsvpStatus !== 'going') {
      toast.error('RSVP as "Going" to add to calendar')
      return
    }

    setIsDownloading(true)

    try {
      const response = await fetch(`/api/calendar/event/${eventId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate calendar file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Added to calendar!')
    } catch {
      toast.error('Failed to download calendar file')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={userRsvpStatus !== 'going' || isDownloading}
      variant="ghost"
      size="sm"
      className={className}
      title={
        userRsvpStatus === 'going'
          ? 'Add to calendar'
          : 'RSVP as "Going" to add to calendar'
      }
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  )
}
