# Streamlined Asylum Admin

HOF form for the steamlined asylum service (SAA)

## Dependabot auto-merge

Dependabot uses the standard branch-name structure with a hyphen separator
(`dependabot-npm_and_yarn-patch-and-minor-<hash>`) because
`dependabot/fetch-metadata` requires the `dependabot` prefix when parsing updates.
The auto-merge job accepts both `dependabot-...` and `dependabot/...` branches.
Branch names are capped at 60 characters using `pull-request-branch-name.max-length`;
Dependabot shortens longer names with a hash suffix.
The `deps` commit-message prefix is independent of branch naming and is retained.

This setting applies to newly created PRs; existing `deps-...` branches must be
reviewed and merged manually. The auto-merge job skips these legacy branches
instead of trying to parse unsupported metadata.

The workflow uses `pull_request_target`, so the guard must be merged into
`master` before it takes effect. Existing failed runs remain failed; a new
supported PR event (such as closing and reopening the PR) is needed to evaluate
the updated guard.
