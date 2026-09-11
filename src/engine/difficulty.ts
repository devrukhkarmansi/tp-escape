export type DifficultyId = 'quick' | 'full' | 'deep'

export type Difficulty = {
  id: DifficultyId
  name: string
  systems: number
  minutes: number
}

// About 75 seconds per system in every mode, so all three feel equally tense.
export const DIFFICULTIES: readonly Difficulty[] = [
  { id: 'quick', name: 'Quick Run', systems: 5, minutes: 6 },
  { id: 'full', name: 'Full Shift', systems: 8, minutes: 10 },
  { id: 'deep', name: 'Deep Space', systems: 12, minutes: 16 },
]
