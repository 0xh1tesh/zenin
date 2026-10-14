import { defineConfig, devices } from '@playwright/test'

// Locally we drive the installed Microsoft Edge (no browser download); CI uses bundled Chromium.
const channel = process.env.CI ? undefined : 'msedge'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], channel } }],
  // Tests run against the production bundle, the code that actually ships.
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
