export function calculateAgeScore(age1: number, age2: number): number {
  if (age1 === age2) {
    return 1.0
  }

  const ageDifference = Math.abs(age1 - age2)

  // Optimal range is ±5 years
  if (ageDifference <= 5) {
    return 1.0 - (ageDifference / 5) * 0.19 // Score 0.81-1.0 (ensures >0.8 for 5yr diff)
  }

  // Acceptable range is ±7 years
  if (ageDifference <= 7) {
    return 0.8 - ((ageDifference - 5) / 2) * 0.3 // Score 0.5-0.8
  }

  // Beyond 7 years, score drops rapidly
  if (ageDifference <= 15) {
    return 0.5 - ((ageDifference - 7) / 8) * 0.35 // Score 0.15-0.5
  }

  // Very large age gaps get very low scores  
  return Math.max(0.05, 0.15 - ((ageDifference - 15) / 20) * 0.1) // Score 0.05-0.15
}
