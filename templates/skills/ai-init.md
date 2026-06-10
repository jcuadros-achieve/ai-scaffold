---
name: ai-init
description: Analyze the codebase and generate the project-specific AI context (run once).
---

# Skill: ai-init

Analyze an existing codebase and populate the installed AI context files
(`CLAUDE.md`, `.claude/rules/`, the customizable skills) with content derived
from the real project. This is the skill that turns
the generic scaffold into a project-specific one.

**Quality bar:** the output must read like a deep project analysis written by
someone who understands how the project *works* and where it *bites* — not like
a form that was filled in. Inventory (what exists) is the floor; synthesis
(how it works, what is non-obvious, what is risky) is the actual deliverable.

Run all four phases in order, without asking for confirmation between them.
Overwrite existing files without asking.

---

## Phase 1 — Read (silent)

Do not produce any output until this phase is complete.

### 1a. Classify the project archetype

Before reading deeply, determine what kind of repo this is. The archetype
decides what to read, what "how it works" means, and which generated artifacts
apply. In a monorepo, classify each package and treat the dominant one as
primary.

| Archetype | Deep-read focus |
|-----------|-----------------|
| **App / service** (API server, web app, worker) | Entry points, request/job lifecycle, error handling, data layer, test suite |
| **Library / SDK** | Public API surface, versioning and release process, compatibility guarantees, docs conventions |
| **CLI tool** | Command surface, flag parsing, distribution/packaging, exit codes |
| **IaC / configuration** (Terraform, deploy CLIs, Helm, tenant configs) | Deploy mechanics end-to-end, templating/substitution layers, environment model and branch→environment mapping, what executes on merge, blast radius, safety nets |
| **Data pipeline / jobs** | Sources and sinks, scheduling/orchestration, idempotency, backfill story |
| **Frontend app** | Routing, state management, data fetching, build/deploy target |

### 1b. Universal checklist (every archetype)

- **Stack** — language(s), framework, runtime, build tooling.
- **Dependencies** — production and dev, from the manifest (package.json,
  pyproject.toml, go.mod, etc.); note pinned or aging versions.
- **Folder structure** — top-level layout and what each folder holds.
- **External APIs / integrations** — databases, queues, third-party services,
  and *which side depends on which*.
- **CI/CD** — provider, pipeline shape, what runs on PR vs merge vs release.
- **Secrets handling** — where credentials live and how they reach runtime.
- **Domain terms** — recurring nouns that form the project's vocabulary.
- **Conventions** — naming, casing, file layout, test naming (where present).
- **Risky files** — migrations, generated code, config, anything that should be
  a no-touch zone.

### 1c. Archetype-specific deep read

For the archetype identified, read its deep-read focus areas — and for each
moving part, capture **how it actually works**: the concrete mechanics (steps
and their order, decision logic, branch→environment mapping, failure paths),
not just its name. A list of components is Phase 1 raw material, not a result.

Record real quantities as you go (~N clients, N actions, N packages, N
endpoints) — they anchor the reader and prove the analysis touched the code.

When done, output exactly:

```
✓ Read complete — [N] files scanned, archetype: [archetype]. Starting analysis.
```

---

## Phase 2 — Analyze (in memory, no files yet)

Compose a full project analysis. This is the **central artifact** — every file
written in later phases is derived from it, so spend the effort here. It must
contain at minimum:

1. **Overview** — what the repo is, its archetype, what happens when changes
   land (merge/deploy semantics).
2. **Structure** — annotated layout, with quantities.
3. **How it works** — the mechanics of the core flow(s) end-to-end. For an app:
   request/job lifecycle. For IaC: the deploy pipeline step by step. For a
   library: how a consumer uses it and how a release ships.
4. **Business / decision logic** — what the code *decides*, not just what it is
   (e.g. "denies registration when X is unavailable", not "handles registration").
5. **Domain model** — the glossary, plus the *why* behind legacy/duplicate
   concepts when the code reveals it.
6. **External integrations** — who calls whom, which dependencies are hard
   (failure blocks the flow) vs best-effort.
7. **Security posture** — where relevant: authn/authz model, secrets, attack
   protections, deletion/rollback safety nets.
8. **Non-obvious invariants & gotchas** — things that would bite a newcomer:
   ordering constraints, size limits, in-place mutations, coexisting templating
   systems, implicit couplings.
9. **Observations & risks** — evidence-backed findings with judgment: missing
   validations, silent failure paths, drift-prone duplication, refs that diverge
   between environments, aging pinned tooling.
10. **How to run locally** — real commands, real env vars, including any
    non-destructive dry-run path.

Sections 8 and 9 are **mandatory** and are where most of the value lives. An
analysis without them is incomplete — go back and derive them from what was read.

**Evidence rule:** every claim must trace back to something read in Phase 1 —
but synthesis and judgment *from* that evidence are required, not optional.
"There is no PR-time validation" is a legitimate, evidence-backed finding even
though no file states it. Inventing facts is forbidden; drawing conclusions is
mandatory. Flag genuinely unverifiable points with `# TODO: verify this`.

When done, output exactly:

```
✓ Analysis complete. Generating files.
```

---

## Phase 3 — Generate (in memory, no files yet)

Derive every file below from the Phase 2 analysis. Do not write to disk yet.

### `CLAUDE.md`

The shipped template's sections are a **floor, not a ceiling**. Fill them all,
then add whatever project-shaped sections the analysis produced (deploy
pipeline, actions/trigger order, security posture, package graph…). The
"How it works", "Non-obvious invariants & gotchas" and "Observations & risks"
content from Phase 2 must land here — condensed, not dropped.

### Rules

The shipped core rules are **language-neutral principles**. Make them concrete
for this project's actual stack — turn each principle into idiomatic, specific
guidance for the language(s) and frameworks found in Phase 1. Examples:
- TypeScript → "never use `any`; use `unknown` + type guards", `import type` order.
- Python → typing/`mypy` strictness, `pydantic` for validation, `ruff` rules.
- Go → `errcheck`, no `interface{}` leakage, error-wrapping conventions.

When a rule does not apply to the archetype (e.g. `test-strategy` in an IaC
repo with no test runner), do **not** fill it with generic fluff: state the
reality and what replaces it ("There is no test runner; verification is a dev
deploy via `make deploy ENV=dev` — see ci-gates") so the gap is a documented
decision, not an omission.

- `.claude/rules/code-style.md`
- `.claude/rules/security.md`
- `.claude/rules/no-touch.md`
- `.claude/rules/test-strategy.md` (real framework, coverage threshold, test layout)
- `.claude/rules/dependency.md` (real audit command, license policy, lockfile)
- `.claude/rules/ci-gates.md` (real CI provider, hook setup, check commands)
- `.claude/rules/performance.md` (real budgets and hot paths)
- `.claude/rules/observability.md` (real logger, metrics, tracing/error tools)
- `.claude/rules/resilience.md` (real timeout/retry policy, critical dependencies)
- `.claude/rules/api-contract.md` (real API style and versioning scheme)
- `.claude/rules/docs.md` (where docs live, doc-comment style)
- `.claude/rules/git-workflow.md` (branching model, PR norms, merge strategy)

### Skills

Reinterpret each to the archetype's natural unit of work, keeping the skill
name: for IaC, `new-endpoint` becomes "add a new resource/action"; for a
library, "add a new public API". `test-gen` follows whatever verification story
Phase 2 found.

- `.claude/skills/new-endpoint/SKILL.md`
- `.claude/skills/test-gen/SKILL.md`
- `.claude/skills/review/SKILL.md`
- `.claude/skills/debug/SKILL.md`

### Composition

- `.claude/full-context.md` (all of the above composed into one file)

Leave `.claude/rules/context.md`, the workflow skills (`ticket-clarify`,
`task-plan`, `task-implement`, `verify`, `pr-write`, `pr-review`), the context
skills (`adr-write`, `ai-log-write`, `context-update`), and the
`security-review`, `refactor`, `migration`, and `incident` skills as shipped —
they are flow definitions, not project-specific content. Only fill in a
project's real facts where a rule has a "Run ai-init to…" line — including any
**optional-module rules that were installed** (`observability`, `resilience`,
`api-contract`, `accessibility`, `i18n`, `config-secrets`, `data-privacy`).
Customize only rules that are actually present; never recreate ones the project
chose not to install.

When done, output exactly:

```
✓ Content generated. Writing files.
```

---

## Phase 4 — Write

- Write every generated file to its installed location (`CLAUDE.md`,
  `.claude/rules/`, `.claude/skills/`).
- Ensure the `.cursorrules` symlink → `CLAUDE.md` exists (the installer
  normally creates it).
- Do **not** duplicate context into `.github/copilot-instructions.md` — it is
  an installer-generated pointer at `CLAUDE.md` and `.claude/rules/`; the
  content must live in one place.

---

## Final output

Print a summary of every file created and linked, followed by next steps the
human should take (review generated rules — especially "Observations & risks",
run `context-update`, commit).

---

## Rules

- Every claim must trace back to something read in Phase 1; synthesis from that
  evidence is required, not optional (see the Evidence rule in Phase 2).
- Flag anything unverifiable with `# TODO: verify this` rather than guessing.
- The template's sections are a minimum — add sections the project demands.
- Run all four phases without asking for confirmation between them.
- Overwrite existing files without asking.
