import { describe, expect, it } from 'vitest'
import { morseSteps } from './morse-timing.ts'

describe('morseSteps', () => {
  it('turns dots, dashes and letter gaps into on/off steps', () => {
    // "A N" = ".-" then "-."
    expect(morseSteps('.- -.', 100)).toEqual([
      { on: true, ms: 100 },
      { on: false, ms: 100 },
      { on: true, ms: 300 },
      { on: false, ms: 100 },
      { on: false, ms: 200 },
      { on: true, ms: 300 },
      { on: false, ms: 100 },
      { on: true, ms: 100 },
      { on: false, ms: 100 },
      { on: false, ms: 700 },
    ])
  })

  it('never flashes faster than twice a second at the default speed', () => {
    const steps = morseSteps('.... .... ....')
    for (let i = 0; i < steps.length - 1; i++) {
      if (steps[i]!.on) expect(steps[i]!.ms + steps[i + 1]!.ms).toBeGreaterThanOrEqual(500)
    }
  })
})
