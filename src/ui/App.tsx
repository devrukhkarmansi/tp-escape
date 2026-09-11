import { useEffect, useState } from 'react'
import type { GameStore } from '../store/game-store.ts'
import GameScreen from './screens/GameScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'
import { abandonSoloGame, resumeSoloGame, startSoloGame } from './solo-game.ts'
import { unlockAudio } from './sound.ts'

export default function App() {
  // A game still running when the page reloaded picks up where it left off.
  const [store, setStore] = useState<GameStore | null>(resumeSoloGame)

  // Browsers block sound until the player taps or types, so switch it on at the first one.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, { passive: true })
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  if (!store)
    return <HomeScreen onPlaySolo={(difficultyId) => setStore(startSoloGame(difficultyId))} />

  const { seed, startedAt, difficultyId } = store.getState()
  return (
    <GameScreen
      key={`${seed}-${startedAt}`}
      store={store}
      onPlayAgain={() => setStore(startSoloGame(difficultyId))}
      onExit={() => {
        abandonSoloGame()
        setStore(null)
      }}
    />
  )
}
