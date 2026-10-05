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
`dependabot/fetch-metadata`. This adapter assumes npm updates at the repository
root; update it if more ecosystems or directories are added. The actual PR,
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
