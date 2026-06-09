# No-touch zones

Files and folders that must not be modified without explicit human approval.

- migrations/        — database/data migrations; changes require team review
- .env*              — environment files; never commit secrets
- lockfiles          — package-lock.json, poetry.lock, go.sum, Cargo.lock, …;
                       managed by your package manager, never hand-edited
- generated/         — generated or vendored code; regenerate, don't edit

> Run ai-init to add project-specific no-touch zones.
