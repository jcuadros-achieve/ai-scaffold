---
name: perf-budget
description: Set, record, and enforce explicit performance budgets — response time, query count, bundle size — so regressions are a conscious decision, not a silent merge.
tier: fast
id: skill/perf-budget
surface: skill
summary: Set/record/enforce explicit perf budgets (latency, query count, bundle) so regressions are conscious, not silent
tags: [performance]
appliesWhen:
  any:
    - archetype: service
    - archetype: app
    - archetype: data-pipeline
    - contains: "budget"
rationale: Budget op of the performance chain; makes the performance rule's "respect budgets" clause concrete and enforceable
stability: stable
---

# Skill: perf-budget

> **`/perf-budget help`** — if the invocation argument is `help` (or `--help`),
> print this card verbatim and stop; do not run the skill.
>
> - **What:** Sets, records, and enforces explicit performance budgets — latency, query count, bundle size, memory.
> - **When:** Starting a project, adding a hot path, or after a regression exposes a missing/wrong budget.
> - **Gates / asks:** Confirms each budget value before recording it.
> - **Output:** A recorded budget block (in `ai-init`/project config) + an enforcement gate, so a regression is a conscious decision.
> - **Chain:** Performance chain — sets the bar that `perf-investigate` measures against and the `performance` rule enforces.
> - **Example:** `/perf-budget` for the checkout hot path

The `performance` rule says respect the project's budgets and that a regression
needs a conscious decision, not a silent merge. That clause is empty without an
**explicit, recorded budget**. This skill sets them — and wires the gate so a
breach fails CI rather than slipping in. Budgets that live only in someone's head
aren't budgets.

---

## Phase 1 — Scope the budget

Identify what to budget, from the user-facing hot paths (`ai-init` records known
ones; this skill fills gaps):

- **Latency** — p50/p95/p99 for the critical user paths (login, checkout, search,
  the API's hot endpoint). Percentile, not average.
- **Query count** — max DB/round-trips per request (the N+1 guardrail, made
  numeric).
- **Bundle size** — frontend asset budget (JS/CSS), for `app` archetypes.
- **Memory / throughput** — where relevant (a stream's max resident set, a job's
  rows/sec).

Scope to what you'd actually page on or defend to a user — don't budget a path
nobody cares about.

---

## Phase 2 — Set values (with the human)

Propose each value from current measurement, not a wish:

- Measure the **current** p95/query-count/bundle (from APM, a load test, the
  build). The budget starts from reality.
- Set the budget at or slightly above current for stable paths; tighter for a
  path you're actively improving. Present each as a structured question (ADR-015)
  with the measured value as the recommended option.

Record the agreed values in the project's budget block (`ai-init` location), so
every agent and the gate read the same source of truth.

## Budget block (recorded)

- **Path:** [hot path]
- **Latency p95:** [Xms] (measured: [Yms])
- **Query count:** [N] (measured: [M])
- **Bundle:** [Zkb] (measured: [Wkb]) — if frontend
- **Source:** [APM / load-test / build]

---

## Phase 3 — Enforce (the gate)

A budget without enforcement is a suggestion. Wire it so a breach is loud:

- **CI gate** — a budget check in the build (a benchmark step, a bundle-size
  check, a query-count assertion on a test path) that fails on breach. The
  `ci-gates` rule carries the pattern.
- **On breach** — the gate fails the PR; the regressor either fixes it, or
  **consciously raises the budget** (a recorded decision with a reason). A silent
  merge is the anti-pattern.

---

## Hand-off

> Budget recorded for [path]: [latency p95 Xms], [N queries][, Zkb bundle]. CI
> gate wired to fail on breach.

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — record & wire the gate` / `Adjust values first` / `Stop here`.

---

## Rules

- Budgets are explicit and recorded in one place (the `ai-init` location); a
  head-only budget isn't a budget.
- Values start from measured reality, not a wish — propose current as the floor.
- Percentiles (p95/p99), never averages, for latency.
- A budget is enforced by a CI gate that fails on breach; a breach is fixed or
  consciously raised with a recorded reason — never a silent merge.
- Scope to paths you'd page on or defend to a user; don't budget noise.
