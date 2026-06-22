---
id: rule/openapi-contract
surface: rule
title: "OpenAPI: contract"
summary: The OpenAPI spec is the source of truth — never drifts from the implementation, breaking changes are versioned, clients regenerated
tags: [api, openapi, contract]
appliesWhen:
  any:
    - file: "**/openapi.yaml"
    - file: "**/openapi.json"
    - file: "**/swagger.yaml"
    - file: "**/swagger.json"
rationale: Specializes the generic api-contract rule for OpenAPI; applies wherever an OpenAPI spec exists
stability: stable
---

# OpenAPI contract rules

> Generic defaults. Run `ai-init` to record the OpenAPI workflow
> (code-first vs spec-first) and the generators/clients in use.

The OpenAPI spec *is* the API contract. Other teams generate clients from it,
build integrations against it, and trust it. A spec that drifts from the
implementation is worse than no spec — it's a lie that breaks consumers silently.
This rule specializes the generic `api-contract` rule for projects that ship an
OpenAPI spec.

## The spec is the source of truth

- **Pick one direction per API and don't mix it** (recorded by `ai-init`):
  - **Code-first** — the spec is generated from the handlers/annotations; the code
    is the source.
  - **Spec-first** — the spec is authored; stubs/clients are generated from it; the
    spec is the source.
- **Never hand-edit a generated artifact.** Edit the source (code or spec) and
  regenerate. A hand-patched generated spec drifts on the next generation.
- **Never let the spec drift from the implementation.** For code-first, the spec is
  regenerated whenever handlers change; for spec-first, the code is regenerated
  whenever the spec changes. Drift is a bug, not a deferred task.

## Backward compatibility

- **Additive changes are safe** (new optional field, new endpoint); **removals,
  renames, type-changes, and tightened validation are breaking.**
- A breaking change needs a version bump (or new versioned route) + a deprecation
  window + a note in the PR. A cross-cutting contract change warrants an ADR
  (`adr-write`). See `api-contract`.
- **Regenerate typed clients (TS/Go/Python) whenever the spec changes.** A stale
  client is a silent breakage; the build/CI must regenerate, not rely on someone
  remembering.

## Hygiene

- **Validate the spec** structurally (`redocly`/`spectral`) — an invalid spec fails
  the gate, like a failing lint.
- **Errors are part of the contract** — documented error shapes/codes, not ad-hoc
  strings consumers parse.
- **Drift-check in CI** — confirm the spec matches the implementation on every PR;
  drift fails the build (see `ci-gates`).

> Run ai-init to record the OpenAPI workflow and the generators/clients in use.
