// Every sound is generated with the Web Audio API, so there are no audio files to load.
let context: AudioContext | null = null

/** Browsers (iPhones especially) only allow sound after a tap or key press, so call this from one. */
export function unlockAudio(): void {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
  } catch {
    // No Web Audio support: the game simply stays silent.
  }
}

type Beep = {
  frequency: number
  duration: number
  volume: number
  type: OscillatorType
  delay?: number
}

function beep({ frequency, duration, volume, type, delay = 0 }: Beep): void {
  if (!context || context.state !== 'running') return
  const start = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  // A very fast fade in and out stops the speaker "clicking" at the edges of the tone.
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

/** One clock tick. The last ten seconds are higher and sharper. */
export function playTick(urgent: boolean): void {
  beep(
    urgent
      ? { frequency: 1480, duration: 0.09, volume: 0.12, type: 'square' }
      : { frequency: 1040, duration: 0.06, volume: 0.07, type: 'triangle' },
  )
}

/** A held tone (fades in, holds, fades out), for Morse dashes that must sound long. */
function tone(frequency: number, start: number, duration: number, volume: number): void {
  if (!context || context.state !== 'running') return
  const at = context.currentTime + start
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, at)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.linearRampToValueAtTime(volume, at + 0.01)
  gain.gain.setValueAtTime(volume, at + duration - 0.01)
  gain.gain.linearRampToValueAtTime(0.0001, at + duration)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(at)
  oscillator.stop(at + duration + 0.02)
}

/** Beeps a Morse signal once, on the same timing as the beacon light. */
export function playMorse(steps: readonly { on: boolean; ms: number }[]): void {
  let at = 0
  for (const step of steps) {
    if (step.on) tone(700, at / 1000, step.ms / 1000, 0.1)
    at += step.ms
  }
}

/** Incoming transmission: three soft rising tones. */
export function playTransmission(): void {
  for (const [index, frequency] of [660, 880, 1320].entries()) {
    beep({ frequency, duration: 0.12, volume: 0.08, type: 'sine', delay: index * 0.11 })
  }
}

/** Time's up: three falling pulses. */
export function playTimeUp(): void {
  for (const [index, delay] of [0, 0.28, 0.56].entries()) {
    beep({ frequency: 330 - index * 60, duration: 0.24, volume: 0.14, type: 'sawtooth', delay })
  }
}

/** A system restored: two rising notes, like a panel coming back online. */
export function playSolved(): void {
  for (const [index, frequency] of [740, 1108].entries()) {
    beep({ frequency, duration: 0.16, volume: 0.1, type: 'triangle', delay: index * 0.1 })
  }
}

/** A refused answer: one short, low buzz. Quiet enough to be a nudge, not a telling-off. */
export function playWrong(): void {
  beep({ frequency: 180, duration: 0.16, volume: 0.09, type: 'sawtooth' })
}

/** The station moving to caution, then to critical: two pulses, lower and harder each time. */
export function playAlert(critical: boolean): void {
  const frequency = critical ? 320 : 440
  for (const delay of [0, 0.22]) {
    beep({ frequency, duration: 0.18, volume: critical ? 0.13 : 0.1, type: 'square', delay })
  }
}

/** The Escape Pod launching: a four-note climb. */
export function playLaunch(): void {
  for (const [index, frequency] of [523, 659, 784, 1047].entries()) {
    beep({ frequency, duration: 0.22, volume: 0.11, type: 'triangle', delay: index * 0.13 })
  }
}
