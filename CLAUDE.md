# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ai-scaffold` is a CLI that installs a standardized AI workflow structure
(`.ai/` and `.context/`) into **other** projects. One command gives any repo a
consistent set of context files, rules, and reusable skill templates for
AI-assisted development.

This repo is the tool itself. The files under `templates/` are **not** this
project's own config — they are the payload copied into target projects.

> Note: in a *target* project, `CLAUDE.md` is installed as a symlink to
> `.ai/AI_CONTEXT.md`. This file (the one you are reading) is a real file
> documenting the tool's own codebase, not that symlink.

## Commands

```bash
npm install            # install deps
npm run build          # tsc → compiles src/ to dist/
npm run dev            # node --watch dist/cli.js  (build first)

# Run a command locally after building:
node dist/cli.js install   # also: update | diff | status

# Verify the package contents (run after any structural change):
npm pack && tar -tzf achieve-ai-scaffold-*.tgz   # then rm the .tgz
```

There is **no test runner and no linter** configured. Verification is manual:
install into a throwaway dir and inspect the result.

```bash
# Manual end-to-end check:
mkdir /tmp/t && cd /tmp/t && git init
node /ABS/PATH/ai-scaffold/dist/cli.js install
```

## Architecture

Two layers, deliberately separated:

- **`src/installer.ts` — pure logic, no UI.** `planInstall(root)` walks
  `templates/` recursively and, for each file, emits a `FileAction`
  (`create` / `update` / `skip` / `symlink`) by diffing the template against the
  target. `applyAction()` executes one action. `writeVersionFile()` /
  `readVersionFile()` manage `.ai/.scaffold-version`. No prompts, no `console`.
- **`src/commands/*.ts` — UI / orchestration.** Each command calls
  `planInstall()`, renders with `src/differ.ts`, drives `prompts`, then calls
  `applyAction()`. `update` is the same flow as `install`; `diff` is a dry run;
  `status` compares installed vs current `SCAFFOLD_VERSION`.
- **`src/cli.ts`** routes `argv[2]` to one of the four commands.

When adding behavior, keep planning/applying in `installer.ts` and all
user interaction in `commands/`.

## Critical, non-obvious invariants

These caused real bugs and are easy to reintroduce:

1. **Template paths map verbatim to the target.** `planInstall` copies
   `templates/<rel>` → `<projectRoot>/<rel>` with no transformation. That is why
   the template directories are **dot-prefixed on disk**: `templates/.ai/`,
   `templates/.context/`, `templates/.github/`. Renaming them to `ai/` etc.
   would install non-dotted folders and break the symlink targets. Keep the dots.

2. **`SCAFFOLD_VERSION` lives in `src/installer.ts`.** Bump it whenever you change
   anything under `templates/`, or `status`/`update` won't signal the change to
   installed projects.

3. **Symlink targets are hardcoded** in `installer.ts` (`planInstall`):
   `CLAUDE.md` and `.cursorrules` → `.ai/AI_CONTEXT.md`. They must point at a
   template that actually exists.

4. **Build output must not equal source.** `tsconfig.json` uses
   `rootDir: ./src`, `outDir: ./dist`. Do not set `outDir` to `./src` — tsc
   auto-excludes the outDir and the build fails with `TS18003`.

5. **`TEMPLATES_DIR` assumes `dist/` is a sibling of `templates/`.**
   `installer.ts` resolves `path.resolve(__dirname, '../templates')`, i.e.
   `dist/installer.js` → `../templates`. Changing `outDir` breaks this path.

## Packaging & distribution

- **`package.json` `files: ["dist", "templates"]`** is the publish whitelist.
  `templates` MUST stay in it, including its dot-directories — otherwise `install`
  copies nothing. The `files` whitelist intentionally overrides `.gitignore`
  (which excludes `dist/`). Re-verify with `npm pack` after structural changes.
- **`prepare: tsc`** builds on install. This is what makes
  `npx github:<owner>/ai-scaffold` work: npm clones the repo, runs `prepare` to
  compile, then runs the `bin` (`dist/cli.js`).
- **Current distribution (private demo):**
  `npx github:jcuadros-achieve/ai-scaffold <command>`.
- **Future (company):** publish to Artifactory/jfrog under the `@achieve` scope →
  `npx @achieve/ai-scaffold <command>`. The package `name` is already
  `@achieve/ai-scaffold`; the README keeps the jfrog form as a "Future" note.

## The `templates/` payload

Generic placeholders, not finished content. The keystone is
`templates/.ai/skills/ai-init.md`: a three-phase skill (Read → Generate → Write)
meant to be run by an AI agent **inside a target project** to analyze that
codebase and replace the generic templates with project-specific versions. When
editing templates, preserve that intent — they are starting points `ai-init`
customizes, not final docs.

`templates/.context/` holds the append-only project-memory structure (ADRs +
AI interaction log + a regenerated `INDEX.md`); its rules live in
`templates/.ai/rules/context.md`.

## Rules for changes in this repo

These are binding for any work done here. They are repo-specific, not generic
advice.

1. **Document every change in the same commit that makes it.** A change is not
   done until its documentation is updated alongside it:
   - Touched architecture, the build, or one of the invariants above → update
     this `CLAUDE.md`.
   - Touched user-facing behavior or commands → update `README.md`.
   - Touched anything under `templates/` → bump `SCAFFOLD_VERSION` in
     `src/installer.ts` (otherwise `status`/`update` can't detect the change).
   - Commit messages use conventional-commits (`type(scope): summary`) and state
     **what** changed and **why** — never "modified file X". Undocumented changes
     should be rejected in review.

2. **Follow good development practices, enforced concretely.**
   - Preserve the layer split: planning/applying stays in `installer.ts`, all
     user interaction stays in `commands/`. Do not leak `console`/`prompts` into
     `installer.ts`.
   - The rules this tool ships in `templates/.ai/rules/code-style.md` and
     `security.md` (no `any`, small focused functions, validate external input,
     no hardcoded secrets) apply to this repo's own `src/` too — dogfood them.
   - Verify before committing: install into a throwaway dir, and run `npm pack`
     to confirm the tarball still contains `templates/` (with its dot-dirs)
     after any structural change.

3. **New skills and rules must fit a correct flow and be justified.** Anything
   added under `templates/.ai/skills/` or `templates/.ai/rules/`:
   - Must slot into an existing chain rather than duplicate or bypass it — the
     workflow chain (`ticket-clarify → task-plan → task-implement → pr-write →
     pr-review`) or the context chain (`adr-write` / `ai-log-write` /
     `context-update`). State which chain it belongs to.
   - Must carry an explicit justification: what gap it fills and why the existing
     skills don't cover it. "It was convenient" is not a justification.
   - Must preserve the placeholder intent — a generic starting point that
     `ai-init` customizes per project, not finished project-specific content.
   - For a cross-cutting addition, capture the reasoning where it belongs: an ADR
     in the target's `.context/adr/` is the model this tool itself promotes.
