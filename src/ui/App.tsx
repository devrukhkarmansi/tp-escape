import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import HomeRoute from './routes/HomeRoute.tsx'
import { unlockAudio } from './sound.ts'

// Crew play pulls in Firebase; loading it only on /c/… keeps solo play small and offline-friendly.
const CrewRoute = lazy(() => import('./routes/CrewRoute.tsx'))

export default function App() {
  // Browsers block sound until the player taps or types, so switch it on at the first one.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, { passive: true })
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/c/:code" element={<CrewRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
