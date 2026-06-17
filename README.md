# ai-scaffold

Installs and manages the AI workflow structure (`CLAUDE.md`, `.claude/` and
`.context/`) in any project. One command to get a team working with AI
consistently.

---

## What it establishes

ai-scaffold gives a project a **disciplined AI workflow with human gates and
persistent memory**, driven from a single source of truth (`CLAUDE.md` +
`.claude/`). Claude Code is the primary target: skills install as native
Claude skills under `.claude/skills/`, which GitHub Copilot and Cursor also
read natively.

It sets up two chains of skills:

- **Work chain** — `ticket-create → ticket-clarify → task-plan →
  task-implement → verify → pr-write → pr-review`, with human approval gates
  between understanding, planning, and coding, TDD during implementation, and
  a `verify` gate that runs the real build/tests/lint/audit before a PR.
  `ticket-create` is the entry point when starting from a rough idea (it asks
  What/Why/How/Context and can file the ticket via a tracker MCP); with an
  existing ticket, enter at `ticket-clarify`.
- **Context chain** — `adr-write → ai-log-write → context-update`, an
  append-only project memory of decisions and AI sessions, with a regenerated
  `INDEX.md`.

Each work-chain skill ends with a **hand-off** that proposes the next step —
the human approves with a yes/no instead of remembering what comes next
(presented as a plan-mode-style option dialog where the harness supports it,
as are `ticket-create`'s questions and deviation choices). And
the chain writes project memory automatically: approving the plan fixes the
decision, so `task-implement` drafts any required ADR **before writing code**
(step 0), logs the session at its close, and `pr-write` verifies the ADR still
matches the implementation and refreshes the index.

On-demand engineering skills (`security-review`, `refactor`, `migration`,
`new-endpoint`, `test-gen`, `review`, `debug`) cover deeper or recurring tasks.

Shipped rules enforce technical consistency, protected zones, and "read the
memory before proposing": `code-style`, `security`, `no-touch`, `context`,
`test-strategy` (TDD + coverage), `dependency`, `ci-gates`, `performance`,
`observability`, `resilience`, `api-contract`, `docs`, `git-workflow`. The
keystone skill `ai-init` analyzes the real codebase and fills the generic
rules with project-specific facts.

→ Full conceptual breakdown — what it generates, the flow, and what each rule
guarantees — in [`docs/OVERVIEW.md`](docs/OVERVIEW.md).

---

## Usage

> **Preview / demo** — this runs straight from the private GitHub repo. You need
> read access to the repo and git/SSH configured for `github.com`.

```bash
# 1. Lay the seed (the minimum for ai-init to run — no checklist)
npx github:jcuadros-achieve/ai-scaffold install

# 2. In your AI agent, run ai-init — it scans the project and curates the
#    scaffold WITH you. Under the hood it calls:
npx github:jcuadros-achieve/ai-scaffold suggest   # match the catalog to the scan
npx github:jcuadros-achieve/ai-scaffold apply     # write the curated plan

# Later: keep installed entries current with the latest catalog
npx github:jcuadros-achieve/ai-scaffold update    # shows diff, never overwrites conflicts
npx github:jcuadros-achieve/ai-scaffold diff      # what changed vs latest
npx github:jcuadros-achieve/ai-scaffold status    # installed entries + drift
```

> **Future (company distribution):** once published to Artifactory/jfrog under the
> `@achieve` scope, the same commands become `npx @achieve/ai-scaffold <command>`.

### How "what to install" is decided

The selection is **inverted**: it happens *after* a real scan, not as a blind
checklist. `install` lays only a minimal **seed** (`CLAUDE.md`, the `ai-init`
skill, the context rule, an empty `.context/`). Then `ai-init` reads the actual
codebase, the CLI's `suggest` mechanically filters the catalog with declarative
`appliesWhen` predicates (so a Postgres service is never offered MySQL rules),
and `ai-init` ranks, justifies, and confirms the short list with you before
`apply` writes it. So you choose from what the project plausibly needs, with
evidence — not from the whole catalog up front.

Each installed entry is tracked by id in `.claude/.scaffold-state.json` (with the
per-entry catalog version + hash, and the workspaces that justified it). `update`
re-applies the installed entries against the latest catalog: clean changes
fast-forward, files you customized are left alone, and conflicts are never
auto-applied.

### Monorepos

One scaffold per repo, installed at the root — process (chains, rules) is
shared. Context is local: `ai-init` detects workspaces (pnpm/yarn workspaces,
turbo, nx, or `apps/`/`packages/` structure), classifies **each** workspace's
archetype, turns the root `CLAUDE.md` into the repo map, and writes a nested
`CLAUDE.md` per workspace (Claude Code loads it on demand when working in that
subtree — sessions opened at the root or inside a package both work).
Decisions and AI logs go to the **nearest** `.context/` — workspace-local ones
get their own `<workspace>/.context/` with independent ADR numbering;
cross-cutting ones stay at the root, whose `INDEX.md` aggregates. Stack rules
carry an `Applies to:` scope that `ai-init` fills with the matching
workspaces. `suggest` filters **per workspace** and installs the curated
**union** at the root (Postgres *and* MySQL rules can coexist when different
workspaces need them — each scoped by `Applies to:`).

### MCP servers (catalog entries)

The catalog includes **verified MCP servers** that `ai-init` can add to your
project's `.mcp.json` (Claude Code's project-scope MCP config) — GitHub and
Atlassian/Jira apply broadly; Datadog applies to services/apps/pipelines via its
`appliesWhen`. They are offered alongside rules and skills during curation.

- **Add-only:** existing `.mcp.json` entries are never updated or removed —
  your entry always wins, and the file is yours.
- **No credentials:** entries use OAuth-based remote servers or `${ENV_VAR}`
  placeholders only.

---

## What install does

`install` lays only the **seed** — a bootstrap, not a usable scaffold:

1. `CLAUDE.md` (placeholder for `ai-init` to populate)
2. the `ai-init` skill and the context rule
3. an empty `.context/` (INDEX + adr/ + ai-log/)
4. `.claude/.scaffold-state.json` recording the seed, then offers a git commit

Then you run **`ai-init`** in your AI agent: it scans the project, curates the
catalog with you (`suggest` → `apply`), and fills `CLAUDE.md` with real content.

Nothing else is generated — the payload is exactly `CLAUDE.md` + `.claude/` +
`.context/`. Tools other than Claude Code (Copilot, Cursor) read `.claude/`
natively; if your team wants a tool-specific pointer file (`AGENTS.md`,
`.github/copilot-instructions.md`), write it yourselves pointing at
`CLAUDE.md` — it's your file, the scaffold won't touch it.

---

## The catalog payload

`install` lays only the **seed** (marked ⊙ below); everything else is a catalog
entry that `ai-init` curates and `apply` writes when the project needs it.

```
CLAUDE.md                   ⊙ seed — single source of truth, filled in by ai-init

.claude/
  rules/
    code-style.md
    security.md
    no-touch.md
    context.md              ⊙ seed — rules for reading/writing .context/
    test-strategy.md        ← TDD + coverage
    dependency.md           ← supply chain
    ci-gates.md             ← machine-enforced checks
    performance.md
    docs.md
    git-workflow.md
    observability.md        ← curated by ai-init
    resilience.md           ← curated by ai-init
    api-contract.md         ← curated by ai-init
    accessibility.md        ← curated by ai-init
    i18n.md                 ← curated by ai-init
    config-secrets.md       ← curated by ai-init
    data-privacy.md         ← curated by ai-init
    stack-nextjs.md         ← curated by ai-init (stack)
    stack-node-express.md   ← curated by ai-init (stack)
  skills/                   ← native Claude skills, one folder per skill
    ticket-create/SKILL.md
    ticket-clarify/SKILL.md
    task-plan/SKILL.md
    task-implement/SKILL.md ← TDD
    verify/SKILL.md         ← runs build/tests/lint/audit before PR
    pr-write/SKILL.md
    pr-review/SKILL.md
    adr-write/SKILL.md
    ai-log-write/SKILL.md
    context-update/SKILL.md
    ai-init/SKILL.md        ⊙ seed — run once to scan, curate, and populate
    new-endpoint/SKILL.md   ← generic, ai-init will customize
    test-gen/SKILL.md
    review/SKILL.md
    debug/SKILL.md
    security-review/SKILL.md  ← threat-model-style deep pass
    refactor/SKILL.md         ← behavior-preserving
    migration/SKILL.md        ← curated by ai-init (safe DB/data migrations)
    incident/SKILL.md         ← curated by ai-init (incident/hotfix/rollback)
  agents/                   ← read-only specialists (ADR-019), curated by ai-init
    typescript-reviewer.md  ← curated by ai-init (TS/JS projects)
    code-explorer.md        ← curated by ai-init (universal)
  .scaffold-state.json      ← installed entries tracked by id (version/hash/workspaces)

.context/                   ⊙ seed — empty project-memory scaffold
  INDEX.md
  adr/
    ADR-000-index.md
  ai-log/
    .gitkeep

mcp/  (catalog source only — github / atlassian / datadog merged into .mcp.json)
```

---

## Using the skills

Skills are native Claude skills; Copilot and Cursor discover the same files
(`.claude/`) natively:

| Tool | How to invoke | Example |
|------|---------------|---------|
| **Claude Code** | `/<name>` | `/ticket-clarify` |
| **Copilot (CLI, cloud, VS Code)** | discovered from `.claude/skills/`; ask by name | "run verify" |
| **Cursor** | reads `.claude/` natively; ask by name | "run task-plan" |

Every skill is self-documenting: **`/<name> help`** prints its usage card
(what, when, gates, output, chain position, example) without running it.

→ **Full usage guide** — where to enter the chain, what each skill asks and
produces, what you approve at each gate, FAQ: [`docs/SKILLS.md`](docs/SKILLS.md).

## After installing

Run `ai-init` first to analyze the codebase and populate `CLAUDE.md` with
real content — **until you do, the context files are generic placeholders** and
the tools have little project-specific guidance.

```
/ai-init            # Claude Code
```

This fills in the generic templates with project-specific content —
stack, conventions, patterns, domain glossary.

---

## Updating templates

When new skills or rules are added to this repo:

```bash
npx github:jcuadros-achieve/ai-scaffold update
```

The updater compares each file **three ways** — your local copy, the installed
base (recorded per file at install time), and the incoming template:

- **Customized, upstream unchanged** (the normal post-`ai-init` state) —
  skipped silently. No diff walls for files only *you* changed.
- **Unmodified, upstream changed** — a safe fast-forward, applied on confirm
  (or automatically with `--yes`).
- **Customized AND changed upstream** — a conflict: shown with its diff,
  default is *keep current*, and it is **never** applied automatically, not
  even with `--yes`. Merge manually if you want both sides.

Files you've customized are never silently overwritten.

---

## Repo structure

```
ai-scaffold/
  src/
    cli.ts                  ← entry point (install/suggest/apply/update/diff/status)
    installer.ts            ← seed install, single writer (apply), reconcile, state
    catalog.ts              ← pure appliesWhen matcher (suggest/detectConflicts)
    differ.ts               ← colored diff rendering
    commands/
      install.ts  suggest.ts  apply.ts
      update.ts   diff.ts     status.ts
  templates/                ← logical layout; the installer maps it to targets
    CLAUDE.md               → CLAUDE.md
    rules/                  → .claude/rules/
    skills/                 → .claude/skills/<name>/SKILL.md
    agents/                 → .claude/agents/ (read-only specialists, ADR-019)
    mcp/                    → catalog source for .mcp.json entries
    context/                → .context/
  test/                     ← node --test unit tests (installer/catalog/payload)
  scripts/
    build-catalog.mjs       ← compiles frontmatter → catalog.index.json (dev-only)
  catalog.index.json        ← compiled catalog (the entries suggest filters)
  package.json
  tsconfig.json
```

---

## Adding a new skill or rule

1. Add the `.md` file under `templates/skills/` or `templates/rules/` — skills
   need `name`/`description`/`tier` frontmatter (`tier: fast` for mechanical
   work, `deep` for judgment-heavy; never a model ID) **and a help card**
   right after the title (`/<name> help` prints it and stops). The test suite
   rejects skills missing either.
2. Add the catalog frontmatter envelope (`id`, `surface`, `rationale`,
   `stability`, and `appliesWhen` unless it is universal). Mark `seed: true`
   only for the ADR-017 bootstrap.
3. Run `node scripts/build-catalog.mjs` (compiles the entry into
   `catalog.index.json` — the test suite fails if you skip this), then `npm test`
4. Commit and push — projects using `ai-scaffold update` will see the diff
