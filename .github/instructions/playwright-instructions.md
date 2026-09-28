---
applyTo: "playwright.config.ts,e2e-tests/**/*.ts,e2e-tests/**/*.feature"
---

# Playwright tests

This repository is intended to use Playwright BDD with Gherkin feature files and TypeScript step definitions.

Before creating or updating Playwright tests:

- Inspect `playwright.config.ts`, `package.json`, existing features, step definitions, fixtures, and helpers.
- Do not assume missing Playwright dependencies, scripts, fixtures, helpers, or test data exist.
- Follow established repository patterns. Do not introduce a second test structure or testing style.
- Use the git diff and changed behaviour to identify the smallest user-facing coverage gap.
- Prefer updating an existing scenario over adding duplicate coverage.
- Do not refactor or reorganise unrelated tests.

## Test structure

- Store Gherkin features under `e2e-tests/features/**/*.feature`.
- Store TypeScript step definitions under `e2e-tests/steps/**/*.step.ts`.
- Store shared Playwright fixtures under `e2e-tests/fixtures/`.
- Keep feature scenarios declarative and focused on user behaviour and outcomes.
- Keep browser operations, selectors, setup, and implementation details in step definitions or fixtures.
- Reuse existing steps when wording and behaviour match. Do not create near-duplicate steps.
- Keep scenarios independent. Do not depend on scenario order or shared mutable state.
- Use fixtures for repeatable setup, authentication, test data, and cleanup.

## Coverage

- Add or update tests for relevant user-visible changes to journeys, navigation, forms, validation, permissions, errors, rendered API responses, and accessibility behaviour.
- Cover the primary successful path and changed failure or validation paths.
- Assert observable user outcomes, not internal implementation details.
- Do not add browser tests for comments, formatting, infrastructure-only changes, or behaviour already covered.
- If expected behaviour or test setup cannot be determined with confidence, make no speculative test change and report the missing information.

## Playwright practices

- Prefer locators based on accessible role, label, name, placeholder, or visible text.
- Use test IDs only when no stable user-facing locator exists.
- Avoid XPath, DOM structure-dependent CSS selectors, and selectors tied to styling.
- Use Playwright assertions and automatic waiting.
- Never use arbitrary sleeps such as `waitForTimeout`.
- Wait for observable page state, navigation, responses, or element conditions when explicit waiting is necessary.
- Keep tests deterministic. Control test data and isolate external dependencies through existing repository mechanisms.
- Use unique test data when parallel execution can cause collisions.
- Keep assertions specific enough to explain failures.

## Validation

- Run the smallest existing lint, type-check, BDD generation, and Playwright commands that cover the changed tests.
- Do not invent package scripts or claim validation passed when required tooling is unavailable.
- Fix failures caused by the test change.
- Report commands run, results, and any validation that could not run.
