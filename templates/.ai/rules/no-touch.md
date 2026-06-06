# No-touch zones

Files and folders that must not be modified without explicit human approval.

- db/migrations/     — database migrations; changes require team review
- .env*              — environment files; never commit secrets
- package-lock.json  — managed by npm; do not edit manually

> Run ai-init to add project-specific no-touch zones.
