---
name: openapi
description: Keep the OpenAPI spec the source of truth — generate-from-code or stub-and-build, validate it, drift-check against impl, regenerate typed clients.
tier: deep
id: skill/openapi
surface: skill
summary: Keep OpenAPI the source of truth (generate/validate/drift-check/regenerate clients), gated by the openapi-contract rule
tags: [api, openapi, contract]
appliesWhen:
  any:
    - file: "**/openapi.yaml"
    - file: "**/openapi.json"
    - file: "**/swagger.yaml"
    - file: "**/swagger.json"
    - contains: "openapi"
rationale: Runs the openapi-contract rule into practice; only useful where an OpenAPI spec exists or is being introduced
stability: stable
---

# Skill: openapi

> **`/openapi help`** — if the invocation argument is `help` (or `--help`),
> print this card verbatim and stop; do not run the skill.
>
> - **What:** Keeps the OpenAPI spec the source of truth — generate-from-code or stub-and-build, validate, drift-check against the impl, regenerate typed clients.
> - **When:** An API has (or is getting) an OpenAPI spec — the contract must not drift from the implementation.
> - **Gates / asks:** Confirms the spec workflow (code-first vs spec-first) if not recorded.
> - **Output:** An updated, valid spec (or generated code) + regenerated clients + a drift report, on a branch.
> - **Chain:** API chain — gated by the `openapi-contract` rule; stays in sync with the generic `api-contract` rule.
> - **Example:** `/openapi` after adding the /payments endpoint

The `openapi-contract` rule says the spec is the source of truth and must not
drift from the implementation. This skill **runs** that: it picks the project's
workflow (generate the spec from code, or stub-and-build code from the spec),
validates, drift-checks, and regenerates clients. A spec that's out of sync with
the code is worse than no spec — it's a lie consumers build against.

---

## Phase 1 — Align the workflow

`ai-init` records the project's OpenAPI workflow. If not recorded, determine it
once:

- **Code-first** — annotations/generators produce the spec from the handlers
  (swag/oapi-codegen/fastapi). The code is the source; the spec is generated.
- **Spec-first** — the spec is authored; stubs/clients are generated from it.
  The spec is the source; the code conforms.

The rest of the skill follows the chosen direction — never mix the two on one API.

---

## Phase 2 — Update & generate

- **Code-first:** apply the change in the handlers + annotations; regenerate the
  spec. The spec reflects what's actually implemented, by construction.
- **Spec-first:** edit the spec (additive, backward-compatible — see `api-contract`);
  regenerate the server stubs/typed clients. The code conforms to the spec.
- **Clients:** regenerate any typed clients (TS/Go/Python) so consumers compile
  against the current contract. A stale client is a silent breakage.

---

## Phase 3 — Validate & drift-check

- **Validate** the spec (`redocly lint` / `spectral` / the project's linter) — a
  structurally invalid spec fails here.
- **Drift-check** against the implementation: for code-first, confirm the
  generated spec matches the routes/handlers actually wired; for spec-first,
  confirm the handlers match the spec. Any drift is a finding to fix, not ignore.
- **Backward-compat** — flag any removal/rename/type-tightening as a breaking
  change (see `api-contract`); breaking changes need a version bump + deprecation.

---

## Hand-off

> Spec updated ([code-first / spec-first]): [N] endpoints, validated, no drift.
> Clients regenerated ([TS/Go/Python]). [If breaking: ⚠ needs version bump +
> deprecation.] Branch/draft PR ready.

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — open the draft PR` / `Adjust first` / `Stop here`.

---

## Rules

- The spec is the source of truth; pick code-first or spec-first per API and don't
  mix them.
- Always regenerate typed clients when the spec changes — a stale client is a
  silent breakage.
- Validate the spec (structural lint) and drift-check against the impl; drift is a
  finding to fix, never ignored.
- Changes are additive/backward-compatible unless explicitly breaking — breaking
  needs a version bump + deprecation (see `api-contract`).
- Never hand-edit a generated artifact; edit the source (code or spec) and
  regenerate.
