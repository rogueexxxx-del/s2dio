---
name: Git Release
description: Prepare release notes, version bumps, and GitHub releases
---

## Workflow

1. Summarize merged/committed changes since the previous tag (`git log --oneline <last-tag>..HEAD`).
2. Propose the next version (semver) and the release notes before changing anything.
3. Only after the user approves the version: update the changelog and version, create the tag.
4. Use `gh release create` (if available) for the GitHub release; otherwise print the exact commands to run.
