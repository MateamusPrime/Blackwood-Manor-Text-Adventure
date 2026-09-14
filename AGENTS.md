<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git

Fetch with `--prune`, or set `git config fetch.prune true` once so every fetch
does it. This repo deletes head branches automatically when a PR merges, so
remote-tracking refs for them go stale locally as soon as the branch is gone.
