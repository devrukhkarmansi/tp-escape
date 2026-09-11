import { describe, expect, it, vi } from 'vitest'
import { applyAction } from '../engine/game.ts'
import { newTestGame, START } from '../engine/test-fixtures.ts'
import { createCrewStore } from './crew-store.ts'

const hint = { type: 'hint', systemId: 'system-0', at: START + 1 } as const

describe('createCrewStore', () => {
  it('applies an action locally straight away and sends it to the server', () => {
    const send = vi.fn(() => Promise.resolve())
    const store = createCrewStore(newTestGame(), send, vi.fn())

    store.dispatch(hint)

    expect(store.getState().systems[0]!.hintsUsed).toBe(1)
    expect(send).toHaveBeenCalledWith(hint)
  })

  it("replaces its local guess with the server's state", () => {
    const store = createCrewStore(newTestGame(), () => Promise.resolve(), vi.fn())
    const listener = vi.fn()
    store.subscribe(listener)

    const fromServer = applyAction(newTestGame(), { type: 'pause', at: START + 5 })
    store.receive(fromServer)

    expect(store.getState()).toBe(fromServer)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('reports a failed send instead of throwing', async () => {
    const onError = vi.fn()
    const store = createCrewStore(
      newTestGame(),
      () => Promise.reject(new Error('offline')),
      onError,
    )

    store.dispatch(hint)
    await Promise.resolve()

    expect(onError).toHaveBeenCalled()
  })
})
