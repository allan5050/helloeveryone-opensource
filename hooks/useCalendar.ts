'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  downloadCalendarFile,
  canDownloadCalendar,
  trackCalendarDownload,
  getRecommendedCalendarApps,
} from '@/lib/calendar'

interface UseCalendarOptions {
  onSuccess?: (eventId: string) => void
  onError?: (error: string, eventId: string) => void
  showToasts?: boolean
}

export function useCalendar(options: UseCalendarOptions = {}) {
  const { onSuccess, onError, showToasts = true } = options
  const [downloadingEvents, setDownloadingEvents] = useState<Set<string>>(
    new Set()
  )

  const downloadEvent = useCallback(
    async (
      eventId: string,
      eventName: string,
      userRsvpStatus?: string | null
    ) => {
      // Check if user can download
      if (!canDownloadCalendar(userRsvpStatus)) {
        const errorMessage =
          'Please RSVP as "Going" to add this event to your calendar'
        if (showToasts) {
          toast.error(errorMessage)
        }
        onError?.(errorMessage, eventId)
        return false
      }

      // Check if already downloading
      if (downloadingEvents.has(eventId)) {
        return false
      }

      setDownloadingEvents(prev => new Set(prev).add(eventId))

      try {
        await downloadCalendarFile(
          eventId,
          eventName,
          () => {
            if (showToasts) {
              toast.success(
                'Calendar file downloaded! Check your downloads folder.'
              )
            }
            trackCalendarDownload(eventId, eventName)
            onSuccess?.(eventId)
          },
          error => {
            if (showToasts) {
              toast.error(error)
            }
            onError?.(error, eventId)
          }
        )

        return true
      } catch (error) {
        console.error('Calendar download error:', error)
        return false
      } finally {
        setDownloadingEvents(prev => {
          const newSet = new Set(prev)
          newSet.delete(eventId)
          return newSet
        })
      }
    },
    [downloadingEvents, onSuccess, onError, showToasts]
  )

  const isDownloading = useCallback(
    (eventId: string) => {
      return downloadingEvents.has(eventId)
    },
    [downloadingEvents]
  )

  const getCalendarApps = useCallback(() => {
    return getRecommendedCalendarApps()
  }, [])

  const canDownload = useCallback((userRsvpStatus?: string | null) => {
    return canDownloadCalendar(userRsvpStatus)
  }, [])

  return {
    downloadEvent,
    isDownloading,
    canDownload,
    getCalendarApps,
    downloadingEvents: Array.from(downloadingEvents),
  }
}
