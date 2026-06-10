# API & contract rules

> Generic defaults. Run `ai-init` to align with the project's API style and
> consumers.

A published interface is a promise. Other code — and other teams — depend on it.

## Backward compatibility

- **Additive changes are safe; removals and renames are breaking.** Adding an
  optional field or a new endpoint is fine. Removing/renaming a field, tightening
  validation, or changing a type is a breaking change.
- A breaking change requires: a version bump (or a new versioned route), a
  deprecation path, and a note in the PR. A cross-cutting contract change
  warrants an ADR (see `adr-write`).

## Versioning & deprecation

- Follow the project's versioning scheme consistently (semver for libraries,
  versioned routes for HTTP APIs).
- Deprecate before removing: mark, announce, give consumers a migration window,
  then remove. Never break consumers silently.

## Contract hygiene

- Validate inputs and shape outputs at the boundary; the contract is enforced,
  not assumed (see [[security]]).
- Keep the contract documented and in sync with the implementation
  (see [[docs]]). The schema/spec is the source of truth.
- Errors are part of the contract: stable error shapes and codes, not ad-hoc
  messages consumers must parse.

> Run ai-init to record the API style, versioning scheme, and consumer surface.
