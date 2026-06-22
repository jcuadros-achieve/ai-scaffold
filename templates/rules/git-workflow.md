---
id: rule/git-workflow
surface: rule
title: Git workflow rules
summary: Branch per change, conventional commits, small reviewable PRs, no force-push to shared branches
tags: [git, workflow]
rationale: Version-control discipline applies to every project; universal
stability: stable
---

# Git workflow rules

> Generic defaults. Run `ai-init` to align with the team's branching model.

## Branches & commits

- Work on a branch, never directly on the default branch. Name it for the work:
  `type/short-description` (e.g. `feat/order-export`, `fix/null-cart`).
- Commits are small and coherent — one logical change each. A commit should build
  and pass tests on its own.
- **Conventional commits:** `type(scope): summary`. The body says what and why,
  not "modified file X" (see `pr-write`).

## Pull requests

- **Keep PRs small and reviewable.** A PR that touches dozens of files for
  unrelated reasons should be split. Large diffs hide bugs.
- One PR, one concern. Don't bundle a refactor with a feature — land the refactor
  first (see `refactor`).
- A PR merges only when required gates pass (see [[ci-gates]]) and review has no
  open blockers (see `pr-review`).

## History hygiene

- **Never force-push a shared branch** (default branch or anything others have
  pulled).
- Don't commit generated artifacts, secrets, or local config (see [[security]]).
- Rebase/squash to keep history readable per the team's convention; don't rewrite
  published history.

> Run ai-init to record the branching model, PR size norms, and merge strategy.
