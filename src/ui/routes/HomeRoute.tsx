import { useState } from 'react'
import { useNavigate } from 'react-router'
import { isCrewPlayAvailable } from '../../firebase/configured.ts'
import type { GameStore } from '../../store/game-store.ts'
import { rememberName } from '../crew-ui.ts'
import GameScreen from '../screens/GameScreen.tsx'
import HomeScreen from '../screens/HomeScreen.tsx'
import { abandonSoloGame, resumeSoloGame, SOLO_PLAYER_ID, startSoloGame } from '../solo-game.ts'

export default function HomeRoute() {
  const navigate = useNavigate()
  // A solo game still running when the page reloaded picks up where it left off.
  const [store, setStore] = useState<GameStore | null>(resumeSoloGame)

  if (!store) {
    return (
      <HomeScreen
        crewAvailable={isCrewPlayAvailable()}
        onPlaySolo={(difficultyId) => setStore(startSoloGame(difficultyId))}
        onHost={async (name, difficultyId) => {
          rememberName(name)
          // Loaded only when someone hosts or joins, so solo play never downloads Firebase.
          const { createCrew } = await import('../../store/room.ts')
          const code = await createCrew(name, difficultyId)
          navigate(`/c/${code}`)
        }}
        onJoin={(code, name) => {
          rememberName(name)
          navigate(`/c/${code}`, { state: { joinAs: name } })
        }}
      />
    )
  }

  const { seed, startedAt, difficultyId } = store.getState()
  return (
    <GameScreen
      key={`${seed}-${startedAt}`}
      store={store}
      playerId={SOLO_PLAYER_ID}
      onPlayAgain={() => setStore(startSoloGame(difficultyId))}
      onExit={() => {
        abandonSoloGame()
        setStore(null)
      }}
    />
  )
}
