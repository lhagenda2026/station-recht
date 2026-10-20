import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['iPhone 14'],
    browserName: 'webkit',
    baseURL: process.env.BASE_URL ?? 'http://localhost:4173/',
  },
  webServer: process.env.BASE_URL ? undefined : {
    command: 'node tools/serve.mjs 4173',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
  },
});
