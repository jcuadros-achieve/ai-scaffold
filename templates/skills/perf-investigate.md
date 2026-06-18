---
name: perf-investigate
description: Investigate a performance regression or complaint — reproduce, isolate the hotspot with profiling, find root cause, quantify, and hand off the fix.
tier: deep
id: skill/perf-investigate
surface: skill
summary: Investigate a perf regression/complaint — reproduce, profile, isolate root cause, quantify, hand off the fix
tags: [performance, observability]
appliesWhen:
  any:
    - archetype: service
    - archetype: app
    - archetype: data-pipeline
    - contains: "slow"
    - contains: "latency"
    - contains: "regression"
rationale: Investigate op of the performance chain; activates the performance rule into a reproducible method, only for runtimes
stability: stable
---

# Skill: perf-investigate

> **`/perf-investigate help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Investigates a performance regression/complaint — reproduce, isolate the hotspot with profiling, find root cause, quantify the impact.
> - **When:** A path is slow, a metric regressed, or a budget is blown.
> - **Gates / asks:** Asks for the repro/signal if absent (max 1 round); never "optimizes" without a measured hotspot.
> - **Output:** A quantified finding (before/after, root cause, evidence) that hands off to a fix via `ticket-from-finding`.
> - **Chain:** Performance chain — gated by the `performance` rule; hands findings to `ticket-from-finding` (and `perf-budget` to set/adjust budgets).
> - **Example:** `/perf-investigate login p95 went 120ms → 800ms after deploy`

The `performance` rule says never ship a known scalability cliff and that budget
regressions need a conscious decision. This skill **investigates** when one is
suspected — and its core discipline is **measure before optimize**: no change is
made without a measured, isolated hotspot. Guessing at perf produces slower code
and harder bugs.

---

## Phase 1 — Reproduce & quantify

Establish the signal before touching code:

- **The metric** — what regressed (p50/p95/p99 latency, throughput, memory, CPU,
  bundle size, query count). State the before/after with the source (APM, load
  test, benchmark). No metric, no investigation.
- **The repro** — the smallest path that exhibits it. If you can't reproduce it,
  you can't prove the fix.
- **The budget** — compare against the project's recorded budget (`perf-budget` /
  `ai-init`). Is this a regression or a long-standing gap?

If the signal/repro is absent, ask **once**, batched (~2 questions), structured
(ADR-015). Don't investigate a vibe.

---

## Phase 2 — Isolate (profile)

Find the **hotspot**, not the suspicion. Use the project's profiler (`ai-init`
records it — pprof/trace for Go, cProfile/py-spy for Python, the browser/Node
profiler, APM flame graphs):

- Profile the repro; identify where time/memory actually goes.
- Distinguish **real** hotspots from noise — a function at 40% of wall time is a
  hotspot; one at 0.5% is not, no matter how ugly it looks.
- Map to the `performance` rule's failure modes: N+1 access, unpaginated lists,
  sequential I/O that could be parallel, unbounded payloads in memory, missing
  index, a cache without invalidation.

---

## Phase 3 — Root cause & quantify

State the root cause precisely and quantify the expected impact of fixing it:

- **Root cause** — the specific code path + the rule violation (e.g. "N+1: query
  in loop at handler.go:88, one round-trip per item").
- **Evidence** — the profile output / flame graph / before-after metric. The
  finding's proof.
- **Expected gain** — the quantified delta the fix should recover (e.g. "~600ms
  of the 680ms regression").

Don't implement the fix here — that's `task-plan` + the builder, gated. This skill
produces a **finding**.

---

## Phase 4 — Hand off

Convert the finding to a remediation ticket via `ticket-from-finding`, preserving
the metric and evidence verbatim. If the regression exposes a missing/wrong
budget, hand off to `perf-budget`.

## Finding: [path] [metric] regression

- **Signal:** [metric] [before] → [after] (source: [APM/load-test])
- **Repro:** [smallest path]
- **Budget:** [within / over — by how much]
- **Hotspot:** [profiled location, % wall/memory]
- **Root cause:** [code path + rule violation]
- **Evidence:** [profile/flame-graph link]
- **Expected gain:** [quantified delta]

---

## Hand-off

> Root cause isolated ([expected gain]). Convert to a remediation ticket via
> `ticket-from-finding`? [If budget gap: also set/adjust the budget via
> `perf-budget`?]

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with ticket-from-finding` / `Adjust first` / `Stop here`.

---

## Rules

- Measure before optimize — no change without a profiled, isolated hotspot; a vibe
  is not a regression.
- Quantify before/after with a real source; no metric, no investigation.
- Distinguish real hotspots from noise; don't chase the 0.5% because it looks bad.
- Map to the `performance` rule's failure modes; name the violation.
- This skill produces a finding, not a fix — implementation goes through
  `task-plan` + the builder, gated.
- Preserve the metric and evidence into the ticket (`ticket-from-finding`).
