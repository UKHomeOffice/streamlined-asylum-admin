# E2E Tests

This folder contains the end-to-end test suite for the Landlords Make a Report (LMR) application.
The tests use Playwright Test together with `playwright-bdd` and feature files written in Gherkin.

For the implementation details, diagrams and a step-by-step guide to adopting this structure in another service, see the [Playwright framework blueprint](PLAYWRIGHT-FRAMEWORK-GUIDE.md).

For repeatable AI-assisted implementation in another service, use the [portable Copilot skill](../.github/skills/lmr-playwright-framework/README.md).

## Folder structure

- `features/`
  - Gherkin `.feature` files that describe the user journeys and validation scenarios.
- `steps/`
  - Step definition files that map feature steps to Playwright actions.
- `fixture/`
  - Test fixture setup, including the shared `pages` fixture for page objects.
- `pages/`
  - Page object classes for the app pages under test.
- `utility-helper/`
  - Shared utilities and constants used by the step definitions and page actions.

## Main test files

- `playwright.config.ts`
  - Playwright configuration for test behavior, browser project setup, web server startup, timeouts, and reporting.
  - It uses `defineBddConfig` from `playwright-bdd` to load feature files and step definitions.
- `package.json`
  - Defines scripts for running the E2E tests via `yarn`.

## Tools used

- Node.js (project requires Node `>=24.22.2 <25.0.0`)
- Yarn
- Playwright Test (`@playwright/test`)
- playwright-bdd
- @cucumber/cucumber
- dotenv

## How the tests are organised

- `features/*.feature` contains BDD scenarios.
- `steps/*.step.ts` contains step implementations.
- `fixture/fixtures.ts` wires Playwright test fixtures with page object instances.
- `pages/*` contains page object classes that encapsulate selectors and user interactions.
- `utility-helper/constants-lib.ts` holds shared test data and values used by scenarios.

## Playwright configuration highlights

- `baseURL` is set from `PLAYWRIGHT_BASE_URL`, or defaults to `http://localhost:${PLAYWRIGHT_PORT || 8080}`.
- A local web server is launched with `yarn start:dev` unless `PLAYWRIGHT_BASE_URL` is provided.
- Tests run headed locally and headless when `CI` is set.
- The Chromium project uses a maximized window and no fixed viewport.
- Screenshots are captured on failure; Chromium video and traces are recorded on the first retry.
- Retry and worker behavior changes when `CI` is set.

## Running the tests

### Install dependencies

```powershell
yarn install
```

### Install Playwright browsers

```powershell
npx playwright install chromium
```

Or to install all browsers:

```powershell
npx playwright install
```

### Run the default E2E suite

```powershell
yarn test:e2e
```

This script runs:

1. `bddgen` to generate the BDD test scaffolding.
2. `playwright test` to execute the Playwright suite.

### Useful scripts

- `yarn test:e2e:headed`
  - Runs the suite with a visible browser window.
- `yarn test:e2e:debug`
  - Runs Playwright in debug mode.
- `yarn test:e2e:report`
  - Opens the Playwright HTML report.
- `yarn test:e2e:smoke`
  - Runs tests while excluding `@history` tagged scenarios.
- `yarn test:e2e:history`
  - Runs only scenarios tagged with `@history`.

## Environment variables

- `PLAYWRIGHT_BASE_URL`
  - If set, Playwright will use this URL instead of launching the local dev server.
- `PLAYWRIGHT_PORT`
  - Default port used when the local `yarn start:dev` server is launched (defaults to `8080`).
- `CI`
  - When set, the config adjusts retries and worker count for CI-friendly execution.
- `SAS_HOF_EMAIL`
  - Required approved test recipient, resolved when the shared constants module is imported.

## Notes

- Keep `features/`, `steps/`, and `pages/` aligned: step text must match the feature file scenario text.
- The BDD setup creates a `pages` fixture that exposes page objects to step definitions.
- The page object classes use Playwright locators and helper methods to interact with the app.
- If you want to run tests against an already-running app, set `PLAYWRIGHT_BASE_URL` before running the test script.
- Current reports use Playwright HTML/list reporters, with JSON for nightly CI; Allure adoption is an optional extension described in the blueprint.
