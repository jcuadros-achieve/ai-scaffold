# Overview — what ai-scaffold establishes

This document explains, end to end, **what** `ai-scaffold` generates, **which
workflow** it sets up, and **which rules and skills** enforce it — and what each
of those guarantees. It is the conceptual companion to the `README.md` (usage)
and `CLAUDE.md` (working on the tool itself).

In one sentence: ai-scaffold gives any project a **disciplined AI workflow with
human gates and persistent memory**, driven from a single source of truth.

---

## 1. What it generates

Running `install` copies a standard AI-context structure into the target project:

```
.ai/            → configuration: rules + reusable skills
.context/       → project memory: decisions (ADRs) + AI log + index
CLAUDE.md       → symlink → .ai/AI_CONTEXT.md   (single source of truth)
.cursorrules    → symlink → .ai/AI_CONTEXT.md   (same content, no divergence)
.github/copilot-instructions.md → condensed context (<400 words)
.ai/.scaffold-version → version tracking, so updates are detectable
```

The core idea: **one source of truth** (`AI_CONTEXT.md`) that every AI tool
(Claude, Cursor, Copilot) consumes through symlinks, instead of N files that
drift out of sync.

**Core vs optional modules.** To stay agnostic across project types, the scaffold
ships everything but installs selectively. The **core** (universal rules + the
workflow/context chains) is always installed; **optional modules** —
project-shape-dependent templates like `migration` (needs a DB), `api-contract`
(needs an API), `observability`/`resilience` (needs a running/distributed
service) — are chosen at install time. A CLI or pure library installs only the
core. The selection is recorded so `update`/`diff`/`status` stay coherent.

---

## 2. The workflow it establishes

Two chains, with **human gates** between stages.

**Work chain (from ticket to PR):**

```
ticket-clarify → task-plan → task-implement → verify → pr-write → pr-review
   (brief)        (plan)      (TDD code+tests) (gates)   (PR)      (7 passes)
        ↑ human gate   ↑ human gate
```

- `ticket-clarify` — turns any input into a structured brief; **marks gaps** (❓)
  instead of asking; estimates complexity S/M/L. Does not read the codebase.
- `task-plan` — reads the real code and produces a file-level plan. Writes no
  implementation code.
- `task-implement` — executes the approved plan **test-first (TDD)**, with a
  **deviation protocol**: it stops if the code doesn't match the plan's
  assumptions.
- `verify` — runs the project's real gates (build, lint, tests, coverage,
  dependency audit) and proves the change works. Closes the "tests written ≠
  tests pass" gap before a PR exists.
- `pr-write` / `pr-review` — a conventional-commits PR, then a review in seven
  passes (scope, correctness, security, code rules, tests, performance, decision
  records & docs).

**On-demand engineering skills** (outside the linear chain): `security-review`
(threat-model-style deep pass), `refactor` (behavior-preserving), `migration`
(safe expand–contract DB changes), plus `new-endpoint`, `test-gen`, `review`,
`debug`.

**Context chain (persistent memory):**

```
adr-write → ai-log-write → context-update
 (decision)  (record of an    (rebuilds INDEX.md
              AI session)       from the sources)
```

Captures architectural decisions and per-session learnings, **append-only**.

**The keystone — `ai-init`:** analyzes the real codebase (Read → Generate →
Write) and **replaces the generic placeholders with project-specific content**.
Everything shipped under `templates/` is a starting point that `ai-init`
customizes.

---

## 3. The rules and skills — and what each guarantees

| Mechanism | Dimension | What it guarantees |
|-----------|-----------|--------------------|
| `rules/code-style.md` + `security.md` | Quality / Security | Technical consistency (no `any`, validate input, no hardcoded secrets), applied during `task-implement` and `pr-review` |
| `rules/test-strategy.md` + `task-implement` TDD | Quality | Test-first development, coverage of changed code, behavior-not-implementation tests, no flaky tolerance |
| `verify` skill | Quality / Integrity | The change is proven against real gates before a PR — "done" means "passes" |
| `rules/ci-gates.md` | Quality (enforcement) | At least one **machine** gate that fails the build — rules become enforced, not advisory |
| `rules/dependency.md` | Security | Vetted, audited, licensed dependencies; reproducible lockfile — supply-chain surface controlled |
| `security-review` skill | Security | Threat-model-style pass (authz/IDOR, injection, SSRF, secrets, crypto) beyond the line-by-line checklist |
| `rules/no-touch.md` + `migration` skill | Integrity | Protected zones untouched without approval; migrations are reversible, backward-compatible, data-safe |
| `rules/resilience.md` | Integrity / Scalability | Timeouts, idempotency, transactions, graceful degradation across boundaries |
| `rules/performance.md` + review pass | Scalability | No N+1s, unbounded queries, or complexity cliffs on user-scaled data |
| `rules/api-contract.md` | Scalability / Maintainability | Backward compatibility, versioning, and deprecation — consumers don't break silently |
| `rules/observability.md` | Maintainability | Structured logs, metrics, tracing — failures are diagnosable in production |
| `rules/docs.md` + `refactor` skill | Maintainability | Docs stay in sync with changes; structure improves without behavior drift |
| `rules/git-workflow.md` | Integrity | Small reviewable PRs, conventional commits, no force-push to shared history |
| `rules/context.md` | Traceability | The AI reads `INDEX.md` and relevant ADRs **before** proposing, and never repeats a rejected approach |
| Human gates between skills | Process | Understanding is validated **before** planning, and the plan **before** coding |
| ADR "Context for AI assistants" (mandatory, complete) | Traceability | Decisions are recorded fully and not re-litigated in future sessions |
| AI-log "Patterns missed" (must carry a concrete action) | Continuous improvement | The AI's mistakes turn into **rule improvements**, not just observations |
| `INDEX.md` always regenerated from sources | Integrity | Project memory can't be corrupted by manual edits |

---

## 4. Why this matters

The combination delivers three properties that ad-hoc AI usage does not:

- **Consistency** — every change passes the same rules and the same review.
- **Traceability** — decisions and AI sessions are recorded and queryable.
- **Continuous improvement** — missed patterns feed back into the rules.

All of it from a single source of truth, kept in sync by symlinks rather than
manual duplication.
