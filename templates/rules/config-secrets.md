# Configuration & secrets rules

> Optional module — relevant to projects with runtime configuration or secrets.
> Run `ai-init` to align with the project's config and secret tooling.

Config is not code. It changes per environment and must never leak.

## Configuration

- Read config from the environment (or a config service), not from literals in
  code. Same artifact runs in every environment.
- **Validate config at startup** against a schema; fail fast with a clear message
  on missing/invalid values rather than crashing later.
- Provide a checked-in **`.env.example`** (or equivalent) documenting every
  variable — names and shapes, never real values.
- Sensible, safe defaults for non-secret config; no default for secrets.

## Secrets

- **Secrets come from a manager / injected env**, never committed, never logged
  (see [[security]], [[observability]]).
- Different secrets per environment; least privilege per service.
- Support **rotation** — code reads the current value, doesn't pin it; rotating a
  secret must not require a code change.
- Scan for committed secrets in CI (see [[ci-gates]]); a leaked secret is rotated,
  not just removed from the diff.

> Run ai-init to record the config loader, secret manager, and env var list.
