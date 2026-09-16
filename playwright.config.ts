import { defineConfig, devices } from '@playwright/test'

const PORT = 5173

/**
 * End-to-end tests play a real crew game in two browsers. `npm run dev:crew` starts the Firebase
 * emulators and Vite together, so nothing touches the real project.
 */
export default defineConfig({
  testDir: './e2e',
  // A crew game involves two browsers talking through Firestore, so give each test room to breathe.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev:crew',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
