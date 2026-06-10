# ai-scaffold

Installs and manages the AI workflow structure (`CLAUDE.md`, `.claude/` and
`.context/`) in any project. One command to get a team working with AI
consistently.

---

## What it establishes

ai-scaffold gives a project a **disciplined AI workflow with human gates and
persistent memory**, driven from a single source of truth (`CLAUDE.md`, which
Claude Code reads natively and `.cursorrules` / Copilot point at). Claude Code
is the primary target: skills install as native Claude skills under
`.claude/skills/`, which GitHub Copilot also discovers natively.

It sets up two chains of skills:

- **Work chain** — `ticket-clarify → task-plan → task-implement → verify → pr-write → pr-review`, 
  with human approval gates between understanding,
  planning, and coding, TDD during implementation, and a `verify` gate that runs
  the real build/tests/lint/audit before a PR.
- **Context chain** — `adr-write → ai-log-write → context-update`, an
  append-only project memory of decisions and AI sessions, with a regenerated
  `INDEX.md`.

Each work-chain skill ends with a **hand-off** that proposes the next step —
the human approves with a yes/no instead of remembering what comes next. And
the chain writes project memory at its edges automatically: `task-implement`
logs the session, `pr-write` drafts any required ADR and refreshes the index.

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
or library doesn't get database or API rules it has no use for.

- **Interactive** (a TTY) — `install` shows a checklist of optional modules to
  toggle.
- **Non-interactive** (CI, `--yes`, piped) — **core only** by default.
- **Flags:** `--all` (all optional), `--modules=migration,observability`
  (specific), `--core` (core only), `--yes` (no prompts).

`update` keeps the modules you previously chose (and lets you add more);
`diff`/`status` only consider what you installed. The selection is recorded in
`.claude/.scaffold-version`.

Modules are added on demand, not up front. A backlog of candidate modules for
future phases is mapped in [`docs/CANDIDATE-MODULES.md`](docs/CANDIDATE-MODULES.md).

---

## What install does

1. Installs core templates + the optional modules you selected, mapping them to
   their native locations (`.claude/skills/`, `.claude/rules/`, `.context/`)
2. Generates the tool pointers (`.github/copilot-instructions.md`,
   `.cursor/rules/ai-scaffold.mdc`) and the `.cursorrules` symlink → `CLAUDE.md`
3. Shows a colored diff for any files that already exist
4. Asks you to decide per file: apply incoming or keep current
5. Records the selected modules and offers an initial git commit

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
  skills/                   ← native Claude skills, one folder per skill
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

.cursorrules                ← symlink → CLAUDE.md
.github/
  copilot-instructions.md   ← generated pointer → CLAUDE.md + .claude/rules/
.cursor/
  rules/ai-scaffold.mdc     ← generated Cursor rule (maps skill names → SKILL.md)
```

> `.github/copilot-instructions.md` and `.cursor/rules/ai-scaffold.mdc` are
> **generated at install time** from the installed skills — don't edit them;
> the content lives in `CLAUDE.md` and the skills.

---

## Using the skills

Skills are native Claude skills; Copilot discovers the same files
(`.claude/skills/`) natively:

| Tool | How to invoke | Example |
|------|---------------|---------|
| **Claude Code** | `/<name>` | `/ticket-clarify` |
| **Copilot (CLI, cloud, VS Code)** | discovered from `.claude/skills/`; ask by name | "run verify" |
| **Cursor** | Reference the skill by name; it follows `.cursor/rules/ai-scaffold.mdc` | "run task-plan" |

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

The updater shows a colored diff for every changed file and lets you
decide per file whether to apply the incoming version or keep your current one.
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
  test/                     ← node --test unit tests for installer.ts
  scaffold.manifest.json    ← optional-module catalog
  package.json
  tsconfig.json
```

---

## Adding a new skill or rule

1. Add the `.md` file under `templates/skills/` or `templates/rules/` — skills
   need `name`/`description` frontmatter
2. If it's optional, add its logical path to a module in `scaffold.manifest.json`
3. Bump the version in `src/installer.ts` (`SCAFFOLD_VERSION`) and run `npm test`
4. Commit and push — projects using `ai-scaffold update` will see the diff
