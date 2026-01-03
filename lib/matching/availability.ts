interface Availability {
  weekdays: string[]
  weekends: boolean
  evenings: boolean
}

export function calculateAvailabilityScore(
  avail1: Availability,
  avail2: Availability
): number {
  let overlapScore = 0
  let totalFactors = 0

  // Check weekday overlap
  if (avail1.weekdays?.length && avail2.weekdays?.length) {
    const weekdayOverlap = avail1.weekdays.filter(day =>
      avail2.weekdays.includes(day)
    ).length

    const maxWeekdays = Math.max(avail1.weekdays.length, avail2.weekdays.length)
    overlapScore += (weekdayOverlap / maxWeekdays) * 0.5
  }
  totalFactors += 0.5

  // Check weekend availability
  if (avail1.weekends === avail2.weekends && avail1.weekends) {
    overlapScore += 0.3
  } else if (avail1.weekends && avail2.weekends) {
    overlapScore += 0.3
  }
  totalFactors += 0.3

  // Check evening availability
  if (avail1.evenings === avail2.evenings && avail1.evenings) {
    overlapScore += 0.2
  } else if (avail1.evenings && avail2.evenings) {
    overlapScore += 0.2
  }
  totalFactors += 0.2

  return totalFactors > 0 ? overlapScore / totalFactors : 0
}
