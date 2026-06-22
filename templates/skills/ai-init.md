---
name: ai-init
description: Scan the codebase, curate the scaffold from the catalog, and generate the project-specific AI context (run once).
tier: deep
id: skill/ai-init
surface: skill
summary: Analyze a real codebase and concretize the generic scaffold into project-specific context
tags: [scaffold, onboarding]
rationale: The keystone bootstrap skill every project runs once; universal
seed: true
stability: stable
---

# Skill: ai-init

> **`/ai-init help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Scans the real codebase, curates which catalog entries (rules, skills, agents, MCP) the project needs, installs them, and rewrites the generic context (CLAUDE.md, rules, customizable skills) with project-specific content.
> - **When:** Once per project right after `ai-scaffold install` lays the seed; re-run after major changes (new stack, new workspace).
> - **Gates / asks:** One human ask-point — you confirm the curated install list before anything is written (ADR-015). The deep analysis and the file generation run without further confirmation.
> - **Output:** A curated, installed `.claude/` (only what the project needs), a populated CLAUDE.md (+ per-workspace CLAUDE.md in a monorepo), and concretized rules/skills.
> - **Chain:** Standalone keystone — run before using the chains seriously.
> - **Example:** `/ai-init`

`install` lays only a seed; **this skill turns it into a real scaffold.** It
reads the actual codebase, decides *with you* what to install from the catalog
(informed by a real scan, not a blind checklist), installs it, and fills the
generic templates with project-specific content.

**Quality bar:** the output must read like a deep project analysis written by
someone who understands how the project *works* and where it *bites* — not like
a form that was filled in. Inventory (what exists) is the floor; synthesis
(how it works, what is non-obvious, what is risky) is the actual deliverable.

**The flow you drive (ADR-017):**

```
Phase 1  Scan & analyze   → understand the codebase (the central artifact)
Phase 2  Profile          → write .scaffold/project-profile.json; run `npx github:jcuadros-achieve/ai-scaffold#${VERSION} suggest`
Phase 3  Curate           → rank/justify candidates, confirm with the human, run `npx github:jcuadros-achieve/ai-scaffold#${VERSION} apply`
Phase 4  Generate         → concretize the installed rules/skills + CLAUDE.md
Phase 5  Write            → write CLAUDE.md (+ nested per-workspace files)
```

The CLI is the only writer of payload (`apply`); you decide, it executes. The
three `.scaffold/*.json` files are ephemeral (gitignored) — re-running is safe,
and you remove the whole `.scaffold/` directory at the end of Phase 5 (ADR-022).

---

## Phase 1 — Scan & analyze (silent)

Do not produce output until this phase is complete. This is the **central
artifact** — every later phase (the justification in Phase 3, the files in
Phase 4) derives from it, so spend the effort here.

### 1a. Classify the project archetype

Before reading deeply, determine what kind of repo this is. The archetype
decides what to read, what "how it works" means, and which catalog entries apply.

**Monorepo detection (do this first).** Check for workspace markers:
`pnpm-workspace.yaml`, a `workspaces` field in package.json, `turbo.json`,
`nx.json`, `lerna.json` — and as a structural fallback, top-level dirs like
`apps/`, `packages/`, `libs/` whose children carry their own manifests. If the
repo is a monorepo, **classify the archetype of every workspace** (not just a
"dominant" one) and run the deep read per workspace; the analysis gains a
cross-cutting layer (Phase 2 below) and the profile becomes a `workspaces[]`
collection (ADR-020).

Pick the archetype from this **fixed vocabulary** — the slug you record in the
profile must be one of these exact strings, or the catalog filter will not match:

| Slug | What it is | Deep-read focus |
|------|-----------|-----------------|
| `service` | API server, backend, worker | Entry points, request/job lifecycle, error handling, data layer, test suite |
| `app` | Full-stack / server-rendered app with a backend | Routing, server/client boundary, data layer, auth, deploy |
| `frontend` | Browser-first SPA/UI (no owned backend) | Routing, state management, data fetching, build/deploy target |
| `library` | Library / SDK / package | Public API surface, versioning and release, compatibility, docs |
| `cli` | CLI tool | Command surface, flag parsing, distribution/packaging, exit codes |
| `iac` | Terraform, Helm, deploy CLIs, tenant configs | Deploy mechanics end-to-end, templating/substitution, env model, branch→env mapping, what executes on merge, blast radius, safety nets |
| `data-pipeline` | Ingestion / ETL / scheduled jobs | Sources and sinks, scheduling/orchestration, idempotency, backfill story |

When a repo blends two (e.g. a Next.js app with API routes), pick the slug that
matches its *primary* job; you can note the secondary nature in evidence.

### 1b. Universal checklist (every archetype)

- **Stack** — language(s), framework, runtime, build tooling.
- **Dependencies** — production and dev, **read verbatim from the manifest**
  (package.json, pyproject.toml, go.mod, Cargo.toml, …); note pinned/aging
  versions. These exact names drive the catalog match — record them precisely.
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
moving part capture **how it actually works**: the concrete mechanics (steps and
their order, decision logic, branch→environment mapping, failure paths), not
just its name. A list of components is raw material, not a result. Record real
quantities (~N clients, N actions, N packages, N endpoints) — they anchor the
reader and prove the analysis touched the code.

### 1d. Compose the analysis

In memory, compose the full analysis. At minimum:

1. **Overview** — what the repo is, its archetype, what happens when changes land.
2. **Structure** — annotated layout, with quantities.
3. **How it works** — the mechanics of the core flow(s) end-to-end.
4. **Business / decision logic** — what the code *decides*, not just what it is.
5. **Domain model** — the glossary, plus the *why* behind legacy/duplicate concepts.
6. **External integrations** — who calls whom; hard (failure blocks the flow) vs best-effort.
7. **Security posture** — authn/authz model, secrets, protections, safety nets.
8. **Non-obvious invariants & gotchas** — ordering constraints, size limits,
   in-place mutations, coexisting templating systems, implicit couplings.
9. **Observations & risks** — evidence-backed findings with judgment: missing
   validations, silent failure paths, drift-prone duplication, aging tooling.
10. **How to run locally** — real commands, real env vars, dry-run path if any.

Sections 8 and 9 are **mandatory** — they are where most of the value lives.

**Monorepo:** produce sections 1–10 *per workspace* (proportional to its
weight), plus a cross-cutting layer: workspace boundaries, the dependency graph
**between** workspaces, shared tooling/configs, blast radius of a shared-lib
change, and how releases/deploys relate.

**Parallel fan-out (ADR-014 — if your harness supports subagents):** run the
per-workspace deep read as parallel **read-only** subagents — one per
**top-level workspace** (`apps/x`, `packages/y`), never one per sub-library.
Each receives its workspace path, the universal checklist (1b), and its
archetype focus, and returns sections 1–10 + the raw facts for its profile entry
(1e). It writes nothing. Keep ~4–6 in flight. The main agent keeps the
cross-cutting layer and all of Phases 2–5. Without subagent support, do the same
work sequentially — identical output.

**Evidence rule:** every claim traces back to something read here — but
synthesis and judgment *from* that evidence are required, not optional. "There
is no PR-time validation" is a legitimate, evidence-backed finding even though no
file states it. Inventing facts is forbidden; drawing conclusions is mandatory.
Flag genuinely unverifiable points with `# TODO: verify this`.

When done, output exactly:

```
✓ Scan complete — [N] files scanned, [M] workspace(s), archetype(s): [...]. Curating the scaffold.
```

---

## Phase 2 — Profile (write the agent→CLI boundary)

Distill Phase 1's facts into `.scaffold/project-profile.json`. This is the
**only** thing you hand to the CLI — `suggest` trusts these facts and never
re-derives them, so they must be accurate. Schema:

```json
{
  "root": ".",
  "workspaces": [
    {
      "path": "services/api",
      "languages": ["typescript"],
      "deps": ["express", "pg", "kysely"],
      "frameworks": ["express"],
      "archetype": "service",
      "files": ["tsconfig.json", "Dockerfile"],
      "evidence": { "pg": "src/db/client.ts uses a pg Pool" }
    }
  ]
}
```

- **One workspace** for a single-project repo: `path: "."`. A monorepo lists one
  entry per workspace, each `path` relative to the repo root.
- **`deps`** — the exact dependency names from the manifest (prod + dev). The
  catalog matches on these literal strings (`pg`, `next`, `mysql2`, `@prisma/client`,
  `i18next`, …) — do not normalize or rename them.
- **`archetype`** — exactly one of the slugs in the 1a table.
- **`languages` / `frameworks`** — lowercase (`typescript`, `python`, `next`).
- **`files`** — optional; include manifest/config paths if a predicate might key
  off them. **`evidence`** — free-form, for your own justification later; the
  matcher ignores it. Never put secrets or file *contents* with credentials here.

Write the file, then run:

```
# Read the installed version (from .claude/scaffold-version.json)
VERSION=$(cat .claude/scaffold-version.json | jq -r '.version')
npx github:jcuadros-achieve/ai-scaffold#${VERSION} suggest
```

It writes `.scaffold/candidates.json` — `{ candidates: [{id, entry, workspaces}],
conflicts: [{workspace, ids}] }`. Read it; that is your menu for Phase 3.

---

## Phase 3 — Curate (decide *with* the human, then apply)

Turn the candidates into an install plan. The candidate list is mechanical
(everything whose `appliesWhen` matched); your job is to **rank, justify, and
confirm** — then let the CLI write.

1. **Split the candidates.**
   - **Universal** (no `appliesWhen` on the entry) — the baseline every project
     wants: the core rules and the work/context skill chains. Recommend
     installing all of them as one bundle; do not interrogate them one by one.
   - **Conditional** (matched via `appliesWhen`) — these earned their place from
     a real fact. For each, write a one-line **evidence-based justification**
     from Phase 1 (e.g. "`rule/stack-node-express` — `api` declares `express`",
     "`skill/migration` — `pg` + Kysely migrations in `services/api`"). Use the
     entry's `rationale` as the static *why*; your justification is the live
     evidence.

2. **Resolve conflicts.** For each `conflicts[]` entry (two candidates that clash
   **within one workspace**, e.g. two competing DB-pattern skills), pick one and
   say why. Conflicts across *different* workspaces are not conflicts — in a
   monorepo postgres and mysql legitimately coexist, each scoped by `Applies to`
   (ADR-020); keep both.

3. **Confirm with the human (the one ask-point, ADR-015).** Present the plan
   **grouped by workspace** (ADR-020 §6), not by surface — far more legible in a
   monorepo ("for the Postgres service `api`: …", "for the Next.js app `web`: …").
   An entry justified by N workspaces is shown **once**, with the workspace list
   as evidence — never confirmed N times. Use the harness's structured-question
   dialog; if it is unavailable, fall back to a plain numbered list and a typed
   reply. Offer: accept all, deselect specific entries, or add an unmatched
   catalog entry by id (the filtered set is the default view, not a wall —
   ADR-018 §4). The seed (`skill/ai-init`, `rule/context`) is already installed;
   never re-list it.

4. **Write the plan** to `.scaffold/install-plan.json`:

```json
{
  "items": [
    { "id": "rule/security",            "workspaces": ["."] },
    { "id": "rule/stack-node-express",  "workspaces": ["services/api"] },
    { "id": "mcp/github",               "workspaces": ["."] }
  ]
}
```

`id` is the catalog id; `workspaces` are the ones that justified it (drives the
`Applies to` scopes later). You may add a `"justification"` string per item for
your own record — the CLI ignores it.

5. **Apply** — hand the plan to the single writer:

```
# Use the same VERSION read in Phase 2
npx github:jcuadros-achieve/ai-scaffold#${VERSION} apply
```

It writes each entry to its install location, classifies three-way per id
(conflicts with a pre-existing local edit are never auto-overwritten), merges
any `mcp/*` entries add-only into `.mcp.json`, and records id-keyed state. Read
its output: the set of entries now actually installed is the input to Phase 4.

When done, output exactly:

```
✓ Curated — [K] entries installed across [M] workspace(s). Generating content.
```

---

## Phase 4 — Generate (concretize what was installed)

Derive every file below from the Phase 1 analysis. Only touch what `apply`
actually installed — never recreate an entry the curation left out.

### `CLAUDE.md`

The seed CLAUDE.md is a placeholder. The shipped sections are a **floor, not a
ceiling**: fill them all, then add whatever project-shaped sections the analysis
produced (deploy pipeline, trigger order, security posture, package graph…). The
"How it works", "Non-obvious invariants & gotchas" and "Observations & risks"
content from Phase 1 must land here — condensed, not dropped.

**Monorepo (ADR-013):** the root `CLAUDE.md` becomes the **repo map** — what each
workspace is and does, boundaries, the inter-workspace dependency graph, shared
conventions, how to run each. Then generate a **nested `CLAUDE.md` per top-level
workspace** (purpose, stack, how it works, invariants & risks, how to run) —
loaded on demand. A package with many internal libraries gets **one** file with a
library index inside, not one per lib (ADR-014). One level deep, no duplication.

### Installed rules

The core rules are **language-neutral principles**. For each rule `apply`
installed, make it concrete for this project's actual stack — turn each principle
into idiomatic, specific guidance for the language(s)/frameworks from Phase 1:
- TypeScript → "never use `any`; `unknown` + type guards", `import type` order.
- Python → typing/`mypy` strictness, `pydantic` validation, `ruff` rules.
- Go → `errcheck`, no `interface{}` leakage, error-wrapping conventions.

When a rule does not fit the archetype (e.g. `test-strategy` in an IaC repo with
no test runner), do **not** fill it with generic fluff: state the reality and
what replaces it ("no test runner; verification is `terraform plan` then a dev
apply") so the gap is a documented decision, not an omission.

**Stack rules & monorepo scope:** fill each installed stack rule's `Applies to`
line with the workspaces from its plan item (e.g. `Applies to: services/api`) —
the rule self-disables outside its scope. Concretize `verify`/`ci-gates` with
**per-workspace** commands (filtered turbo/nx/workspace runs), not one repo-wide
command. Concretize any installed conditional rule the same way
(`observability`, `resilience`, `api-contract`, `accessibility`, `i18n`,
`config-secrets`, `data-privacy`) — only the ones present.

### Installed customizable skills

Reinterpret each installed customizable skill to the archetype's natural unit of
work, keeping the skill name: for `iac`, `new-endpoint` becomes "add a new
resource/action"; for a `library`, "add a new public API". `test-gen` follows
whatever verification story Phase 1 found. Preserve frontmatter (`name`, `tier`);
adjust `description` only if the reinterpretation changes what the skill does.

**Leave as shipped** (flow definitions, not project content): `rule/context`, the
workflow skills (`ticket-create`, `ticket-clarify`, `task-plan`,
`task-implement`, `verify`, `pr-write`, `pr-review`), the context skills
(`adr-write`, `ai-log-write`, `context-update`), and `security-review`,
`refactor`, `migration`, `incident`. Only fill a rule's real facts where it has a
"Run ai-init to…" line.

When done, output exactly:

```
✓ Content generated. Writing files.
```

---

## Phase 5 — Write

- Write every generated file to its installed location (`CLAUDE.md`,
  `.claude/rules/`, `.claude/skills/`) — in a monorepo, also the nested
  per-workspace `CLAUDE.md` files (project content, never tracked by `update`).
- Do **not** duplicate the context into tool-specific files
  (`.github/copilot-instructions.md`, `AGENTS.md`) — the content lives in
  `CLAUDE.md` and `.claude/` only; a tool pointer is the team's to maintain.
- As the last action of the run, remove the `.scaffold/` directory (ADR-022).
  It is your ephemeral handoff workspace — not payload and not state. Nothing
  reads it after the run: `update`/`status`/`diff` key off
  `.claude/.scaffold-state.json`, and re-running ai-init regenerates it in
  Phase 1. If the run is interrupted before this step, the directory stays in
  place, so re-running `apply` mid-flow without re-scanning still works.

---

## Final output

Print a summary of: the entries installed in Phase 3 (grouped by workspace), the
files generated/written in Phases 4–5, and next steps for the human — review the
generated rules (especially "Observations & risks"), run `context-update`,
commit. If Phase 1 found a technology with **no matching catalog entry**
installed (e.g. a stack with no `stack-*` rule), say so and suggest re-running
`ai-init` (or asking for a catalog entry) once one exists.

---

## Rules

- Every claim traces back to something read in Phase 1; synthesis from that
  evidence is required, not optional (see the Evidence rule).
- The profile is the agent→CLI boundary — its `deps`/`archetype` must be exact,
  or the catalog match is wrong. Never invent a dependency to force a match.
- `apply` is the only writer of payload; never write a rule/skill the plan did
  not install, and never hand-edit `.claude/.scaffold-state.json`.
- Remove `.scaffold/` as the last action of Phase 5 (ADR-022). It is your
  ephemeral workspace, not durable state — the install state lives in
  `.claude/.scaffold-state.json`. Never clean it up earlier; mid-flow re-runs of
  `apply` depend on it being present.
- Curation has exactly one human ask-point (the plan confirmation); the scan and
  generation run without further confirmation. Flag anything unverifiable with
  `# TODO: verify this` rather than guessing.
- The template's sections are a minimum — add sections the project demands.
