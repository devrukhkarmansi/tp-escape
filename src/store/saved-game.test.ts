import { describe, expect, it } from 'vitest'
import { applyAction } from '../engine/game.ts'
import { newTestGame, solveEverything, START } from '../engine/test-fixtures.ts'
import { clearGame, loadGame, saveGame, type KeyValueStorage } from './saved-game.ts'

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

describe('saved games', () => {
  it('saves and restores a game in progress', () => {
    const storage = memoryStorage()
    const game = applyAction(newTestGame(), { type: 'hint', systemId: 'system-0', at: START + 1 })
    saveGame(storage, game)
    expect(loadGame(storage, START + 60_000)).toEqual(game)
  })

  it('ignores a game whose time has run out', () => {
    const storage = memoryStorage()
    const game = newTestGame()
    saveGame(storage, game)
    expect(loadGame(storage, game.endsAt)).toBeNull()
  })

  it('keeps a paused game, even after its original end time', () => {
    const storage = memoryStorage()
    const paused = applyAction(newTestGame(), { type: 'pause', at: START + 1_000 })
    saveGame(storage, paused)
    expect(loadGame(storage, paused.endsAt + 60 * 60_000)).toEqual(paused)
  })

  it('ignores a finished game', () => {
    const storage = memoryStorage()
    saveGame(storage, solveEverything(newTestGame()))
    expect(loadGame(storage, START + 2_000)).toBeNull()
  })

  it('ignores a save from an older version of the game', () => {
    const storage = memoryStorage()
    storage.setItem('tp-escape:solo-game', JSON.stringify({ version: 1, state: newTestGame() }))
    expect(loadGame(storage, START)).toBeNull()
  })

  it('ignores corrupted data instead of crashing', () => {
    const storage = memoryStorage()
    storage.setItem('tp-escape:solo-game', '{not json')
    expect(loadGame(storage, START)).toBeNull()
  })

  it('clears the save', () => {
    const storage = memoryStorage()
    saveGame(storage, newTestGame())
    clearGame(storage)
    expect(storage.data.size).toBe(0)
  })

  it('never throws when storage is blocked or missing', () => {
    expect(() => saveGame(brokenStorage, newTestGame())).not.toThrow()
    expect(loadGame(brokenStorage, START)).toBeNull()
    expect(() => clearGame(brokenStorage)).not.toThrow()
    expect(loadGame(undefined, START)).toBeNull()
  })
})
