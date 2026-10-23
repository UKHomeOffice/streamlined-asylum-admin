import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

//Note: The baseURL is set to the value of PLAYWRIGHT_BASE_URL from the .env file if it exists, otherwise it defaults to http://localhost:${port}.
const port = Number(process.env.PLAYWRIGHT_PORT || 8080);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;


const testDir = defineBddConfig({
  features: 'e2e-tests/features/**/*.feature',
  steps: [
    'e2e-tests/steps/**/*.step.ts',
    'e2e-tests/fixtures/fixtures.ts',
  ],
  outputDir: '.features-gen',
  matchKeywords: true,
});

export default defineConfig({
  testDir,
  timeout: 30000,
  expect: {
    timeout: 6000,
  },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],
  use: {
    baseURL,
    viewport: null,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    headless: !!process.env.CI,
  },

    webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      command: 'yarn start',
      port,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      // use: { ...devices['Desktop Chrome'],
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--start-maximized'],
        },
        video: 'retain-on-failure',
        screenshot: 'on', //Options => 'on', 'off', 'only-on-failure' or 'on-first-retry'
      },
    },
  ],
});
