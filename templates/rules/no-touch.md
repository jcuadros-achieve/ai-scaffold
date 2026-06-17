---
id: rule/no-touch
surface: rule
title: No-touch zones
summary: Files that must not change without explicit human approval — secrets, lockfiles, generated, state
tags: [no-touch, safety]
rationale: Protected-zone safety baseline every project needs; universal
stability: stable
---

# No-touch zones

Files and folders that must not be modified without explicit human approval.

- migrations/        — database/data migrations; changes require team review
- .env*              — environment files; never commit secrets
- lockfiles          — package-lock.json, poetry.lock, go.sum, Cargo.lock, …;
                       managed by your package manager, never hand-edited
- generated/         — generated or vendored code; regenerate, don't edit

> Run ai-init to add project-specific no-touch zones.
