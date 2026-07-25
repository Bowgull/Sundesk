import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5175',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5175',
      reuseExistingServer: true,
      url: 'http://127.0.0.1:5175',
    },
    {
      command: 'VITE_SUNDESK_ALLOWED_EMAILS=approved@example.invalid npm run dev -- --host 127.0.0.1 --port 5176',
      reuseExistingServer: true,
      url: 'http://127.0.0.1:5176',
    },
    {
      command: 'VITE_SUNDESK_ALLOWED_EMAILS= VITE_SUNDESK_FIRESTORE_WRITES= VITE_SUNDESK_FIRESTORE_WRITE_APPROVAL= npm run build && npm run preview -- --host 127.0.0.1 --port 5177',
      reuseExistingServer: true,
      url: 'http://127.0.0.1:5177',
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
