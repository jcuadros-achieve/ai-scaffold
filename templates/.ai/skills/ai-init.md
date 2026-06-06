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
- `skills/new-endpoint.md`
- `skills/test-gen.md`
- `skills/review.md`
- `skills/debug.md`
- `full-context.md` (all of the above composed into one file)

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
