# Skill: ai-init

Analyze an existing codebase and generate the complete `.ai/` folder structure,
filled with content derived from the real project. This is the skill that turns
the generic scaffold into a project-specific one.

Run all three phases in order, without asking for confirmation between them.
Overwrite existing files without asking.

---

## Phase 1 — Read (silent)

Do not produce any output until this phase is complete. Read the codebase and
collect:

- **Entry point** — main file(s) the app boots from.
- **Folder structure** — top-level layout and what each folder holds.
- **Stack** — language, framework, runtime, build tooling.
- **Dependencies** — production and dev, from the manifest (package.json,
  pyproject.toml, go.mod, etc.).
- **External APIs / integrations** — databases, queues, third-party services.
- **Error handling patterns** — how the codebase reports and recovers from
  errors (Result types, exceptions, error middleware).
- **Naming conventions** — casing, file naming, test naming.
- **Test framework** — what is used, where tests live, how they are named.
- **Risky files** — migrations, generated code, config, anything that should be
  a no-touch zone.
- **Domain terms** — recurring nouns that form the project's vocabulary.

When done, output exactly:

```
✓ Read complete — [N] files scanned. Starting generation.
```

---

## Phase 2 — Generate (in memory, no files yet)

Generate the content for every file below in memory, composed from what was read
in Phase 1. Do not write to disk yet.

- `AI_CONTEXT.md`
- `rules/code-style.md`
- `rules/security.md`
- `rules/no-touch.md`
- `rules/test-strategy.md` (real framework, coverage threshold, test layout)
- `rules/dependency.md` (real audit command, license policy, lockfile)
- `rules/ci-gates.md` (real CI provider, hook setup, check commands)
- `rules/performance.md` (real budgets and hot paths)
- `rules/observability.md` (real logger, metrics, tracing/error tools)
- `rules/resilience.md` (real timeout/retry policy, critical dependencies)
- `rules/api-contract.md` (real API style and versioning scheme)
- `rules/docs.md` (where docs live, doc-comment style)
- `rules/git-workflow.md` (branching model, PR norms, merge strategy)
- `skills/new-endpoint.md`
- `skills/test-gen.md`
- `skills/review.md`
- `skills/debug.md`
- `full-context.md` (all of the above composed into one file)

Leave `rules/context.md` and the `skills/workflow/`, `skills/context/`,
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

## Phase 3 — Write

- Create the `.ai/` structure and write every generated file.
- Create the symlinks: `CLAUDE.md` → `.ai/AI_CONTEXT.md`,
  `.cursorrules` → `.ai/AI_CONTEXT.md`.
- Create `.github/copilot-instructions.md` — a condensed version of the context,
  under 400 words.

---

## Final output

Print a summary of every file created and linked, followed by next steps the
human should take (review generated rules, run `context-update`, commit).

---

## Rules

- Never invent content. Everything must trace back to something read in Phase 1.
- Flag anything unclear with `# TODO: verify this` rather than guessing.
- Run all three phases without asking for confirmation between them.
- Overwrite existing files without asking.
