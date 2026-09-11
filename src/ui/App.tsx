import { useState } from 'react'
import type { GameStore } from '../store/game-store.ts'
import GameScreen from './screens/GameScreen.tsx'
import HomeScreen from './screens/HomeScreen.tsx'
import { abandonSoloGame, resumeSoloGame, startSoloGame } from './solo-game.ts'

export default function App() {
  // A game still running when the page reloaded picks up where it left off.
  const [store, setStore] = useState<GameStore | null>(resumeSoloGame)

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
