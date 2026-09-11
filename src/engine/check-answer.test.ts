import { describe, expect, it } from 'vitest'
import { checkAnswer, normalizeAnswer } from './check-answer.ts'

describe('normalizeAnswer', () => {
  it.each([
    ['Keyboard', 'keyboard'],
    ['  KEY   board ', 'key board'],
    ['The keyboard!', 'keyboard'],
    ['a keyboard', 'keyboard'],
    ['an airlock', 'airlock'],
    ['space-station', 'space station'],
    ['1,024', '1024'],
    ['Café', 'cafe'],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected)
  })

  it('only strips an article at the start', () => {
    expect(normalizeAnswer('theatre')).toBe('theatre')
    expect(normalizeAnswer('open the door')).toBe('open the door')
  })
})

describe('checkAnswer', () => {
  const puzzle = { answer: 'keyboard', altAnswers: ['keypad'] }

  it('accepts the answer however it is typed', () => {
    expect(checkAnswer(puzzle, 'A Keyboard.')).toBe(true)
  })

  it('accepts listed alternatives', () => {
    expect(checkAnswer(puzzle, 'keypad')).toBe(true)
  })

  it('rejects wrong and partial answers', () => {
    expect(checkAnswer(puzzle, 'board')).toBe(false)
    expect(checkAnswer(puzzle, 'keyboards')).toBe(false)
  })

  it('rejects empty input, including input that is only punctuation', () => {
    expect(checkAnswer(puzzle, '')).toBe(false)
    expect(checkAnswer(puzzle, ' ?! ')).toBe(false)
  })
})
