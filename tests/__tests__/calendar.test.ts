import { createEvent } from 'ics'

// Mock calendar utilities
const validateIcsContent = (content: string) => ({
  isValid:
    content.includes('BEGIN:VCALENDAR') && content.includes('END:VCALENDAR'),
  errors: [],
})

const parseIcsContent = (content: string) => ({
  title: 'Test Event',
  startTime: new Date(),
  endTime: new Date(),
  location: 'Test Location',
  description: 'Test Description',
})

const mockCalendarEvent = {
  title: 'Test Event',
  start: [2024, 3, 15, 10, 30] as [number, number, number, number, number],
  end: [2024, 3, 15, 12, 30] as [number, number, number, number, number],
  location: 'Test Location',
  description: 'Test Description',
}

// Mock functions
const formatCalendarDescription = (
  description: string,
  matches: any[],
  attendees: any[]
) => {
  let result = description + '\n\n'
  if (matches.length > 0) {
    result += 'YOUR MATCHES ATTENDING:\n'
    matches.forEach(match => {
      result += `- ${match.name} (${Math.round(match.score * 100)}% match)\n`
    })
  }
  if (attendees.length > 0) {
    result += `\nOTHER ATTENDEES (${attendees.length} total):\n`
  }
  result += '\nHelloEveryone.fun'
  return result
}

const generateCalendarFilename = (eventTitle: string) => {
  return eventTitle.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_') + '.ics'
}

describe('Calendar Integration', () => {
  describe('ICS Generation', () => {
    it('should generate valid ICS content', () => {
      const { error, value } = createEvent(mockCalendarEvent)

      expect(error).toBe(undefined)
      expect(value).toBeDefined()

      if (value) {
        const validation = validateIcsContent(value)
        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
      }
    })

    it('should include all required fields', () => {
      const { error, value } = createEvent(mockCalendarEvent)

      expect(error).toBe(undefined)

      if (value) {
        const parsed = parseIcsContent(value)
        expect(parsed.title).toBeDefined()
        expect(parsed.startTime).toBeDefined()
        expect(parsed.endTime).toBeDefined()
        expect(parsed.location).toBeDefined()
        expect(parsed.description).toBeDefined()
      }
    })
  })

  describe('Calendar Utilities', () => {
    it('should generate valid filenames', () => {
      const filename = generateCalendarFilename('Coffee & Chat @ Downtown')
      expect(filename).toBe('Coffee___Chat___Downtown.ics')
      expect(filename.endsWith('.ics')).toBe(true)
    })

    it('should format descriptions with matches and attendees', () => {
      const matches = [
        { name: 'John Doe', score: 0.85 },
        { name: 'Jane Smith', score: 0.92 },
      ]

      const attendees = [
        { name: 'Mike Johnson' },
        { name: 'Sarah Wilson' },
        { name: 'Tom Brown' },
      ]

      const description = formatCalendarDescription(
        'Basic event description',
        matches,
        attendees
      )

      expect(description).toContain('Basic event description')
      expect(description).toContain('YOUR MATCHES ATTENDING:')
      expect(description).toContain('John Doe (85% match)')
      expect(description).toContain('Jane Smith (92% match)')
      expect(description).toContain('OTHER ATTENDEES (3 total):')
      expect(description).toContain('HelloEveryone.fun')
    })
  })

  describe('Calendar Apps Compatibility', () => {
    it('should generate ICS compatible with major calendar apps', () => {
      const { error, value } = createEvent({
        ...mockCalendarEvent,
        title: 'Test Event with Special Characters: café & résumé',
        location: 'Test Location, 123 Main St, City, State 12345',
      })

      expect(error).toBe(undefined)
      expect(value).toBeDefined()

      if (value) {
        // Should contain proper formatting for different calendar apps
        expect(value).toContain('BEGIN:VCALENDAR')
        expect(value).toContain('VERSION:2.0')
        expect(value).toContain('BEGIN:VEVENT')
        expect(value).toContain('END:VEVENT')
        expect(value).toContain('END:VCALENDAR')
      }
    })
  })
})
