import { describe, expect, it, vi } from 'vitest'
import { newTestGame, START } from '../engine/test-fixtures.ts'
import { createLocalStore } from './local-store.ts'

const hint = { type: 'hint', systemId: 'system-0', at: START + 1 } as const

describe('createLocalStore', () => {
  it('applies actions through the engine', () => {
    const store = createLocalStore(newTestGame())
    store.dispatch(hint)
    expect(store.getState().systems[0]!.hintsUsed).toBe(1)
  })

  it('tells subscribers and onChange about real changes', () => {
    const onChange = vi.fn()
    const listener = vi.fn()
    const store = createLocalStore(newTestGame(), onChange)
    store.subscribe(listener)

    store.dispatch(hint)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(store.getState())
  })

  it('stays quiet when an action changes nothing', () => {
    const onChange = vi.fn()
    const listener = vi.fn()
    const store = createLocalStore(newTestGame(), onChange)
    store.subscribe(listener)

    store.dispatch({ type: 'tick', at: START + 1 })

    expect(listener).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const store = createLocalStore(newTestGame())
    const unsubscribe = store.subscribe(listener)
    unsubscribe()
    store.dispatch(hint)
    expect(listener).not.toHaveBeenCalled()
  })
})
