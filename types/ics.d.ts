declare module 'ics' {
  export interface EventAttributes {
    start: [number, number, number, number, number]
    end: [number, number, number, number, number]
    title: string
    description?: string
    location?: string
    url?: string
    uid?: string
    geo?: { lat: number; lon: number }
    categories?: string[]
    status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
    busyStatus?: 'FREE' | 'BUSY' | 'TENTATIVE' | 'OOF'
    organizer?: { name?: string; email?: string }
    attendees?: Array<{ name?: string; email?: string }>
  }

  export function createEvent(
    attributes: EventAttributes,
    callback: (error: Error | null, value?: string) => void
  ): void

  export function createEvent(attributes: EventAttributes): {
    error: Error | null
    value?: string
  }
}
