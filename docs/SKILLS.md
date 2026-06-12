# Using the skills

A practical guide for developers working in a project where ai-scaffold is
installed. For what the scaffold *is*, see [`OVERVIEW.md`](OVERVIEW.md).

---

## Invocation

Skills are native Claude skills installed at `.claude/skills/<name>/SKILL.md`:

- **Claude Code** — type `/<name>` (e.g. `/ticket-clarify`). The `/` menu
  lists every installed skill with its description.
- **Copilot / Cursor** — both read `.claude/` natively; ask by name
  ("run verify").

Two things to know before your first skill:

1. **Run `/ai-init` once per project** (someone on the team, once). Until
   then, rules and context are generic placeholders and every skill has
   little project-specific guidance. If skills feel generic, this is why.
2. **Skills propose, you decide.** Every work-chain skill ends with a
   *Hand-off* — an option dialog (`Approve / Adjust first / Stop`) when the
   harness supports it. Nothing advances to the next stage without your
   explicit approval.

---

## The work chain — from idea to reviewed PR

```
ticket-create → ticket-clarify → task-plan → task-implement → verify → pr-write → pr-review
   (ticket)       (brief)          (plan)     (TDD code+tests)  (gates)    (PR)     (7 passes)
             ↑ gate          ↑ gate
```

**Where to enter:**

| You have… | Start at |
|-----------|----------|
| A rough idea ("we need X") | `/ticket-create` — it **asks** (What/Why/How/Context/Scope, as option dialogs) until the ticket stands on its own; can file it via a tracker MCP after your approval |
| An existing ticket / message / description | `/ticket-clarify` — it **never asks**; converts the input into a technical brief, marking gaps `❓` |

**Stage by stage — what each does and what you approve:**

- **`/ticket-clarify`** (deep) — produces the brief: what/why, scope in/out,
  acceptance criteria, S/M/L estimate, open questions. *You approve the
  understanding before any planning.*
- **`/task-plan`** (deep) — reads the real code; produces a file-level plan
  (files to change, pattern to follow, steps, edge cases, risks, no-touch
  list). Writes no code. *Approving the plan fixes the technical decision* —
  which is why the next skill records it first.
- **`/task-implement`** (deep) — step 0: drafts an ADR if the just-approved
  decision warrants one (before any code). Then executes the plan test-first
  (TDD). If reality contradicts the plan it **stops** and presents a
  deviation choice (A/B/other — your call). Closes by writing the session
  log automatically.
- **`/verify`** (fast) — runs the project's real gates: build, lint, tests,
  coverage, audit, plus the manual checks. Green → proposes `pr-write`.
  Red → stops and proposes returning to `task-implement`; it never continues
  on a red gate and never weakens a gate to pass.
- **`/pr-write`** (fast) — conventional-commits PR description + squash
  commit message. Closes by verifying the step-0 ADR still matches what was
  built and refreshing `.context/INDEX.md`.
- **`/pr-review`** (deep) — seven structured passes (scope, correctness,
  security, code rules, tests, performance, decision records & docs), run as
  parallel subagents where supported. Output: blockers / warnings / notes
  with file:line and a concrete suggestion each. The verdict is a
  recommendation — merging is yours.

**Memory is written for you** — you never have to remember it: the decision
ADR at plan approval, the session log at implementation close, the index at
PR time. In a monorepo each lands in the `.context/` nearest to what changed.

---

## The context chain — project memory on demand

These run automatically at the work chain's edges, but are also invocable
standalone:

| Skill | Tier | Use it when |
|-------|------|-------------|
| `/adr-write` | deep | A significant decision was made outside the chain (cross-cutting, hard to reverse, rejects an obvious alternative). In a monorepo it writes to the nearest `.context/` — workspace ADRs have their own numbering |
| `/ai-log-write` | fast | An AI session produced committed (or deliberately rejected) code outside the chain |
| `/context-update` | fast | `.context/INDEX.md` looks stale; rebuilds it from sources and surfaces unresolved "patterns missed" actions |

Before starting any task, read `.context/INDEX.md` (and the workspace's, in a
monorepo) — the `context` rule requires it, and it's where past decisions and
"context for future sessions" notes live.

---

## On-demand skills — outside the linear chain

| Skill | Tier | Reach for it when |
|-------|------|-------------------|
| `/ai-init` | deep | **Once per project**, after install — analyzes the codebase and rewrites the generic context/rules with project-specific content. In a monorepo: classifies every workspace (parallel subagents), root `CLAUDE.md` becomes the repo map, each workspace gets its own nested `CLAUDE.md` |
| `/new-endpoint` | fast | Adding an endpoint/resource following an existing pattern (`ai-init` reinterprets it per archetype: route, public API, resource…) |
| `/test-gen` | fast | Writing tests for existing code, following the project's test conventions |
| `/review` | fast | A quick diff review (rule violations, edge cases, security, tests) — lighter than `pr-review` |
| `/debug` | deep | Root-causing a bug before proposing a fix |
| `/security-review` | deep | Auth changes, new endpoints, data handling, trust boundaries — a threat-model pass, deeper than `pr-review`'s security pass |
| `/refactor` | deep | Improving structure without changing behavior, tests-first |
| `/migration` * | deep | Safe, reversible, expand–contract DB/data migrations |
| `/incident` * | deep | Production incident: mitigate first, then hotfix and postmortem |

\* Optional modules — present only if selected at install
(`ai-scaffold update` to add them).

**Tiers** (`fast` = mechanical, `deep` = judgment-heavy) are declared in each
skill's frontmatter — useful if your harness routes work across models.

---

## Updating without losing your customizations

`npx github:jcuadros-achieve/ai-scaffold update` compares three ways (your
file / the installed base / the incoming template): files only *you* changed
are skipped silently; unmodified files fast-forward; files changed on both
sides surface as conflicts that are **never** applied automatically. So run
`update` freely — `ai-init`'s rewrites survive it.

## FAQ

- **"The skills feel generic."** Run `/ai-init`. If they still feel generic
  afterward, that's a bug worth reporting — the analysis phases are designed
  to produce project-specific content.
- **"Can I edit an installed skill?"** Yes — it's your file. `update` will
  classify it as customized and protect it.
- **"Where did my decision/log go in the monorepo?"** Nearest `.context/` to
  the files touched; cross-workspace work goes to the root. The root
  `INDEX.md` lists workspace indexes.
- **"Why does `verify` refuse to continue?"** A gate is red. That's the
  point — fix the cause; never weaken the gate.
