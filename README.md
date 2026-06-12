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
# Fresh install in a project
npx github:jcuadros-achieve/ai-scaffold install

# Check what would change vs latest templates
npx github:jcuadros-achieve/ai-scaffold diff

# Pull latest templates (shows diff, asks per file)
npx github:jcuadros-achieve/ai-scaffold update

# Check installed version and file status
npx github:jcuadros-achieve/ai-scaffold status
```

> **Future (company distribution):** once published to Artifactory/jfrog under the
> `@achieve` scope, the same commands become `npx @achieve/ai-scaffold <command>`.

### Choosing what to install

The **core** (universal rules + the workflow/context chains) is always installed.
Project-shape-dependent templates are **optional modules** you select — so a CLI
or library doesn't get database or API rules it has no use for. **Stack
modules** (`kind: stack` — e.g. Next.js, Node + Express) are optional modules
carrying curated technology conventions and pitfalls; they state the version
range they cover and `ai-init` concretizes them like any optional rule.

- **Interactive** (a TTY) — `install` shows a checklist of optional modules to
  toggle.
- **Non-interactive** (CI, `--yes`, piped) — **core only** by default.
- **Flags:** `--all` (all optional), `--modules=migration,observability`
  (specific), `--core` (core only), `--yes` (no prompts).

`update` keeps the modules you previously chose (and lets you add more);
`diff`/`status` only consider what you installed. The selection — and the
installed base version of every template (per-file version + hash, from the
catalog in `scaffold.manifest.json`) — is recorded in
`.claude/.scaffold-version`.

Modules are added on demand, not up front. A backlog of candidate modules for
future phases is mapped in [`docs/CANDIDATE-MODULES.md`](docs/CANDIDATE-MODULES.md).

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
workspaces. Select the **union** of the modules your workspaces need.

### MCP servers (optional)

The installer can add **verified MCP servers** to your project's `.mcp.json`
(Claude Code's project-scope MCP config): a base set offered to every project
(GitHub, Atlassian/Jira) plus module-linked suggestions (selecting
`observability` offers Datadog). Interactive installs show a multiselect;
non-interactively use `--mcp=github,atlassian` (or `--mcp=none`).

- **Add-only:** existing `.mcp.json` entries are never updated or removed —
  your entry always wins, and the file is yours (it is not tracked by
  `diff`/`update`).
- **No credentials:** entries use OAuth-based remote servers or `${ENV_VAR}`
  placeholders only.
- Your selection is remembered in `.claude/.scaffold-version` and preselected
  on `update`.

---

## What install does

1. Installs core templates + the optional modules you selected, mapping them to
   their native locations (`.claude/skills/`, `.claude/rules/`, `.context/`)
2. Shows a colored diff for any files that already exist
3. Asks you to decide per file: apply incoming or keep current
4. Records the selected modules and offers an initial git commit

Nothing else is generated — the payload is exactly `CLAUDE.md` + `.claude/` +
`.context/`. Tools other than Claude Code (Copilot, Cursor) read `.claude/`
natively; if your team wants a tool-specific pointer file (`AGENTS.md`,
`.github/copilot-instructions.md`), write it yourselves pointing at
`CLAUDE.md` — it's your file, the scaffold won't touch it.

---

## What gets installed

```
CLAUDE.md                   ← single source of truth — fill it in with ai-init

.claude/
  rules/
    code-style.md
    security.md
    no-touch.md
    context.md              ← rules for reading/writing .context/
    test-strategy.md        ← TDD + coverage
    dependency.md           ← supply chain
    ci-gates.md             ← machine-enforced checks
    performance.md
    docs.md
    git-workflow.md
    observability.md        ← optional module
    resilience.md           ← optional module
    api-contract.md         ← optional module
    accessibility.md        ← optional module
    i18n.md                 ← optional module
    config-secrets.md       ← optional module
    data-privacy.md         ← optional module
    stack-nextjs.md         ← optional stack module
    stack-node-express.md   ← optional stack module
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
    ai-init/SKILL.md        ← run once to populate everything
    new-endpoint/SKILL.md   ← generic, ai-init will customize
    test-gen/SKILL.md
    review/SKILL.md
    debug/SKILL.md
    security-review/SKILL.md  ← threat-model-style deep pass
    refactor/SKILL.md         ← behavior-preserving
    migration/SKILL.md        ← optional module (safe DB/data migrations)
    incident/SKILL.md         ← optional module (incident/hotfix/rollback)
  .scaffold-version         ← tracks installed version + selected modules

.context/
  INDEX.md
  adr/
    ADR-000-index.md
  ai-log/
    .gitkeep

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
    cli.ts                  ← entry point
    installer.ts            ← planning, logical→target mapping, generation
    differ.ts               ← colored diff rendering
    commands/
      install.ts
      update.ts
      diff.ts
      status.ts
  templates/                ← logical layout; the installer maps it to targets
    CLAUDE.md               → CLAUDE.md
    rules/                  → .claude/rules/
    skills/                 → .claude/skills/<name>/SKILL.md
    context/                → .context/
  test/                     ← node --test unit tests (installer + catalog)
  scripts/
    update-catalog.mjs      ← maintains the per-template catalog (dev-only)
  scaffold.manifest.json    ← optional modules + per-template catalog
  package.json
  tsconfig.json
```

---

## Adding a new skill or rule

1. Add the `.md` file under `templates/skills/` or `templates/rules/` — skills
   need `name`/`description`/`tier` frontmatter (`tier: fast` for mechanical
   work, `deep` for judgment-heavy; never a model ID)
2. If it's optional, add its logical path to a module in `scaffold.manifest.json`
3. Run `node scripts/update-catalog.mjs` (registers/bumps the template in the
   catalog — the test suite fails if you skip this)
4. Bump the version in `src/installer.ts` (`SCAFFOLD_VERSION`) and run `npm test`
5. Commit and push — projects using `ai-scaffold update` will see the diff
