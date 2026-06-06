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

---

## 2. The workflow it establishes

Two chains, with **human gates** between stages.

**Work chain (from ticket to PR):**

```
ticket-clarify → task-plan → task-implement → pr-write → pr-review
   (brief)        (plan)       (code + tests)   (PR)       (5 passes)
        ↑ human gate   ↑ human gate
```

- `ticket-clarify` — turns any input into a structured brief; **marks gaps** (❓)
  instead of asking; estimates complexity S/M/L. Does not read the codebase.
- `task-plan` — reads the real code and produces a file-level plan. Writes no
  implementation code.
- `task-implement` — executes the approved plan, with a **deviation protocol**:
  it stops if the code doesn't match the plan's assumptions.
- `pr-write` / `pr-review` — a conventional-commits PR, then a review in five
  passes (scope, correctness, security, code rules, tests).

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

| Mechanism | What it guarantees |
|-----------|--------------------|
| `rules/code-style.md` + `security.md` | Technical consistency (no `any`, validate input, no hardcoded secrets), applied during `task-implement` and `pr-review` |
| `rules/no-touch.md` | Protected zones (migrations, `.env`) are never changed without human approval |
| `rules/context.md` | The AI reads `INDEX.md` and relevant ADRs **before** proposing, and never repeats a rejected approach |
| Human gates between skills | Understanding is validated **before** planning, and the plan **before** coding |
| ADR "Context for AI assistants" (mandatory) | Decisions are not re-litigated in future sessions |
| AI-log "Patterns missed" (must carry a concrete action) | The AI's mistakes turn into **rule improvements**, not just observations |
| `INDEX.md` always regenerated from sources | Project memory can't be corrupted by manual edits |

---

## 4. Why this matters

The combination delivers three properties that ad-hoc AI usage does not:

- **Consistency** — every change passes the same rules and the same review.
- **Traceability** — decisions and AI sessions are recorded and queryable.
- **Continuous improvement** — missed patterns feed back into the rules.

All of it from a single source of truth, kept in sync by symlinks rather than
manual duplication.
