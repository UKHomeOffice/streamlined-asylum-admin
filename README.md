# Streamlined Asylum Admin

HOF form for the steamlined asylum service (SAA)

## Dependabot auto-merge

Dependabot uses short, meaningful branch names such as `deps-hof-<hash>` and
`deps-patch-minor-<hash>`. Group hashes are appended automatically by Dependabot.
Branch names are capped at 27 characters using `pull-request-branch-name.max-length`.
This leaves room for the longest Kubernetes resource prefix with `APP_NAME=saa`,
keeping branch-derived names within 63 characters. Longer names are shortened
with a hash; exceptionally long dependency names may become hash-only branches
and are not eligible for auto-merge.
The `deps` commit-message prefix is independent of branch naming and is retained.

The auto-merge job accepts `deps-...`, `dependabot-...`, and `dependabot/...`
branches authored by Dependabot. For `deps-...` branches, it provides a temporary
event file with a standard `dependabot/npm_and_yarn/...` branch name to
`dependabot/fetch-metadata`. The official action bundle is checked out at a pinned
commit without persisted credentials (no PR code is checked out) and run in a
shell process that sets `GITHUB_EVENT_PATH` after the runner has initialised the
step. A step-level override is insufficient because the runner restores this
reserved variable before launching actions. This adapter assumes npm updates at
the repository root; update it if more ecosystems or directories are added. The actual PR,
commit SHA, and signature verification are unchanged. Approval still requires
patch/minor metadata with no maintainer changes.

Drone accepts `deps-*` branches. Deployment retains general sanitisation for
engineering branches but no longer rewrites Dependabot-specific names. New
Dependabot group names survive sanitisation unchanged. Configuration changes
apply to newly created branches; existing long branches are not renamed.
Tear down deployments created with the old `dependabot-pr-...` rewrite before
adopting the updated deployment script; otherwise they need manual cleanup
under their original resource names.

The workflow uses `pull_request_target`, so the guard must be merged into
`master` before it takes effect. Existing failed runs remain failed; a new
supported PR event (such as closing and reopening the PR) is needed to evaluate
the updated guard.

## E2E Allure Reports

Install dependencies with `yarn install`. Generating and opening Allure reports
requires Java 8 or newer on your PATH (or configured through `JAVA_HOME`).

```sh
yarn allure:clean
yarn test:e2e
yarn allure:generate
yarn allure:open
```

Playwright writes Allure results to `allure-results/` alongside the existing HTML
and console reports. Run the generate command even if tests fail to inspect their
results. Videos for failed tests are attached as evidence in the generated Allure
report, which is written to `allure-report/`.

Run `yarn allure:clean` before a new test run to avoid combining previous results.
Both output directories are ignored by Git. For CI, retain `allure-results/` as an
artifact and generate the report in a job with Java installed.

## E2E Page Objects

The evidence tests follow the LMR page-object model, with `fixtures/` named
according to this repository's Playwright instructions:

```text
e2e-tests/
	features/        Gherkin scenarios and existing acceptance criteria
	fixtures/       Test-scoped page objects and evidence journey fixture
	pages/          Page locators, browser actions and assertions
	steps/          Step definitions using createBdd(test) from the shared fixture
	utility-helper/ Route constants and ordered HOF journey navigation
```

`fixtures/fixtures.ts` provides `pages` and `journey` to each scenario. All step
files import its `test` instance. Page objects extend `BasePage` to reuse common
navigation, radio questions, errors, back links, feedback and header/footer checks.

`EvidenceJourney` follows the start page, before-you-start page, claimant
details, and claim-decision question before submitting `SAA_TEST_EMAIL` (falling
back to `SKIP_EMAIL` or the shared test address). It follows the configured
`token=skip` test link and enters the form before completing preceding steps in
order. It keeps the original setup answers: Yes to sending evidence, No to
adding/removing a dependant, and No to violent or upsetting images when
traversing those pages. Scenario answers are not overwritten when continuing
from the evidence question to the final check-your-answers page. The evidence
summary (`/changes/check-your-answers-evidence`) and final application summary
(`/changes/confirm`) remain separate page objects.

Validate step bindings with `yarn test:e2e:generate`, then run journeys with
`yarn test:e2e`. Local runs require the service's normal HOF/Redis setup, including
a 32-byte `SESSION_SECRET`. Set `PLAYWRIGHT_BASE_URL` to test an already running
service instead of starting one through Playwright.

Existing `fixme` steps remain in place for upload controls, evidence summary
editing and other service behaviour that is not implemented yet. The refactor
does not enable these scenarios or change their feature wording.
