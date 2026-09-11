/**
 * Whether this build can reach Firebase: real config present, or local emulators. Kept apart from
 * app.ts so the home screen can check it without downloading the Firebase SDK.
 */
export function isCrewPlayAvailable(): boolean {
  const env = import.meta.env
  return (
    env.VITE_USE_EMULATORS === 'true' ||
    Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID)
  )
}
