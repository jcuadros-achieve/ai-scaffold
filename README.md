# ai-scaffold

Installs and manages the AI workflow structure (`.ai/` and `.context/`)
in any project. One command to get a team working with AI consistently.

---

## What it establishes

ai-scaffold gives a project a **disciplined AI workflow with human gates and
persistent memory**, driven from a single source of truth (`.ai/AI_CONTEXT.md`,
which `CLAUDE.md`, `.cursorrules`, and Copilot all read).

It sets up two chains of skills:

- **Work chain** — `ticket-clarify → task-plan → task-implement → verify →
  pr-write → pr-review`, with human approval gates between understanding,
  planning, and coding, TDD during implementation, and a `verify` gate that runs
  the real build/tests/lint/audit before a PR.
- **Context chain** — `adr-write → ai-log-write → context-update`, an
  append-only project memory of decisions and AI sessions, with a regenerated
  `INDEX.md`.

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
`.ai/.scaffold-version`.

---

## What install does

1. Installs core templates + the optional modules you selected
2. Creates symlinks: `CLAUDE.md` and `.cursorrules` → `.ai/AI_CONTEXT.md`
3. Shows a colored diff for any files that already exist
4. Asks you to decide per file: apply incoming or keep current
5. Records the selected modules and offers an initial git commit

---

## What gets installed

```
.ai/
  AI_CONTEXT.md             ← fill this in with ai-init
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
  skills/
    workflow/
      ticket-clarify.md
      task-plan.md
      task-implement.md     ← TDD
      verify.md             ← runs build/tests/lint/audit before PR
      pr-write.md
      pr-review.md
    context/
      adr-write.md
      ai-log-write.md
      context-update.md
    new-endpoint.md         ← generic, ai-init will customize
    test-gen.md
    review.md
    debug.md
    security-review.md      ← threat-model-style deep pass
    refactor.md             ← behavior-preserving
    migration.md            ← optional module (safe DB/data migrations)

.context/
  INDEX.md
  adr/
    ADR-000-index.md
  ai-log/
    .gitkeep

CLAUDE.md                   ← symlink → .ai/AI_CONTEXT.md
.cursorrules                ← symlink → .ai/AI_CONTEXT.md
.github/
  copilot-instructions.md

.ai/.scaffold-version       ← tracks installed version
```

---

## After installing

Run `ai-init` in your AI agent to analyze the codebase and populate
`AI_CONTEXT.md` with real content.

```
ai-init
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
    installer.ts            ← file planning and applying
    differ.ts               ← colored diff rendering
    commands/
      install.ts
      update.ts
      diff.ts
      status.ts
  templates/                ← everything that gets copied to target
    .ai/
      AI_CONTEXT.md
      rules/
      skills/
    .context/
      INDEX.md
      adr/
      ai-log/
    .github/
      copilot-instructions.md
  package.json
  tsconfig.json
```

---

## Adding a new skill or rule

1. Add the `.md` file to the relevant `templates/` subdirectory
2. Bump the version in `src/installer.ts` (`SCAFFOLD_VERSION`)
3. Commit and push — projects using `ai-scaffold update` will see the diff
