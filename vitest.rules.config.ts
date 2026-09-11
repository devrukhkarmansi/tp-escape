import { defineConfig } from 'vitest/config'

// Security-rule tests talk to the Firestore emulator, so they run separately: npm run test:rules
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
