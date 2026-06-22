---
name: e2e-test-gen
description: Generate end-to-end tests for a critical user flow — happy path, then the failure modes that matter — stable and resilient against flake.
tier: deep
id: skill/e2e-test-gen
surface: skill
summary: Generate E2E tests for a critical user flow (happy path + failure modes), stable and anti-flake
tags: [testing, e2e]
appliesWhen:
  any:
    - archetype: app
    - archetype: service
    - contains: "e2e"
    - contains: "playwright"
    - contains: "cypress"
rationale: E2E authoring for the critical flows only useful where there is a runnable user-facing surface; complements unit test-gen, doesn't replace it
stability: stable
---

# Skill: e2e-test-gen

> **`/e2e-test-gen help`** — if the invocation argument is `help` (or `--help`),
> print this card verbatim and stop; do not run the skill.
>
> - **What:** Generates end-to-end tests for a critical user flow — happy path first, then the failure modes that matter.
> - **When:** A critical user flow needs E2E coverage (checkout, login, the core happy path).
> - **Gates / asks:** Confirms the flow + the failure modes before writing; asks for the framework if undetectable.
> - **Output:** E2E tests in the project's framework (Playwright/Cypress/…), stable and anti-flake, on a branch.
> - **Chain:** Test authoring; runs under the `test-strategy` rule. Complements unit-level `test-gen`.
> - **Example:** `/e2e-test-gen` the guest checkout flow

E2E tests catch what unit tests can't: the wiring across the whole flow. They're
also the most expensive and flake-prone tests in the suite, so this skill writes
**few, high-value** tests for critical flows — not a blanket cover-every-button
sweep — and bakes in anti-flake from the start. A flaky E2E test is worse than no
test; it erodes trust in the whole suite.

---

## Phase 1 — Scope (the flow + failure modes)

E2E is for **critical user flows**, not unit cases. Identify:

- **The flow** — the end-to-end happy path a user actually takes (e.g. guest
  checkout: land → cart → fill → pay → confirm). One flow per invocation.
- **The failure modes that matter at this level** — the cross-cutting failure
  paths E2E is uniquely positioned to catch (expired session mid-flow, a
  downstream 500 surfaced to the user, a stale state race). Not every unit-level
  failure — only what survives the whole flow.
- **The framework** — detect from the repo (Playwright/Cypress/Cypress-style);
  if undetectable, ask once (ADR-015).

Confirm the flow + failure modes before writing — E2E on the wrong flow is
wasted effort.

---

## Phase 2 — Author (happy path first, then failures)

Write the **happy path first**, run it green, then layer the failure modes:

- **Stable selectors** — test by role/label/stable test-id, never by brittle CSS
  class or generated DOM position. A selector that breaks on a style tweak is a
  flake source.
- **Resilient waits** — wait for the observable state (the element is visible, the
  network settled, the URL changed), never a fixed `sleep`. Sleeps are flakes.
- **Independent & idempotent** — each test sets up its own data and cleans up; no
  shared mutable state between tests. Run in any order, in parallel, repeatedly.
- **Realistic data** — use the project's test-data fixtures/seeding; avoid
  hard-coded values that drift from production shape.

Failure-mode tests get the same treatment — they assert the **user-visible**
outcome (the error is shown, the flow recovers), not internal state.

---

## Phase 3 — Verify it's not flaky

A new E2E test must prove it's stable before it lands:

- Run it **repeatedly** (e.g. 5×) and in **parallel**; any failure disqualifies it.
- If it flakes, fix the test (selector/wait/isolation), not by retrying it away.
- A test that can't be made stable is removed — a skipped-flaky test still rots
  trust; don't leave it disabled.

---

## Hand-off

> E2E test[s] for [flow]: happy path + [N] failure modes. Verified stable (5×
> runs, parallel). Branch/draft PR ready.

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — open the draft PR` / `Adjust first` / `Stop here`.

---

## Rules

- E2E is for critical user flows only — not blanket coverage; one flow per pass.
- Happy path first, run green, then the failure modes that matter at this level.
- Stable selectors (role/label/test-id) and resilient waits (state, never sleep);
  no brittle CSS or fixed sleeps.
- Independent, idempotent, parallel-safe — each test seeds and cleans its own data.
- A new E2E test must pass repeatedly (5×) and in parallel before it lands; a flaky
  test is removed, not skipped.
- Complements `test-gen` (unit) — don't push unit-level cases down to E2E.
