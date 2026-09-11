export type DifficultyId = 'quick' | 'full' | 'deep'

export type Difficulty = {
  id: DifficultyId
  name: string
  systems: number
  minutes: number
}

export const DIFFICULTIES: readonly Difficulty[] = [
  { id: 'quick', name: 'Quick Run', systems: 5, minutes: 12 },
  { id: 'full', name: 'Full Shift', systems: 8, minutes: 20 },
  { id: 'deep', name: 'Deep Space', systems: 12, minutes: 32 },
]
