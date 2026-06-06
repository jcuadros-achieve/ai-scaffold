# HANDOFF — ai-scaffold

This document contains the full context of the design session for `ai-scaffold`.
Read this file completely before doing anything else.

---

## What this project is

`ai-scaffold` is a CLI tool that installs a standardized AI workflow structure
into any existing project. One command gives any repo a consistent set of
context files, rules, and reusable skill templates for AI-assisted development.

```bash
npx github:your-org/ai-scaffold install
```

---

## Repo structure (already created)

```
ai-scaffold/
  src/
    cli.ts                        # entry point — routes to 4 commands
    installer.ts                  # planInstall() + applyAction() — no UI
    differ.ts                     # colored diff rendering with chalk
    commands/
      install.ts                  # main command — diff, confirm, apply, commit
      update.ts                   # alias of install (same flow)
      diff.ts                     # dry run — show what would change
      status.ts                   # show installed version + file state
  templates/                      # EMPTY — needs to be populated (see below)
  package.json
  tsconfig.json
  README.md
```

The `src/` files are complete and working. The `templates/` folder is empty
and needs to be populated with all the .md files described below.

---

## What install does

1. Walks `templates/` recursively
2. Compares each file against the target project
3. Produces a colored diff for files that differ
4. Shows summary: N to create, N with changes, N symlinks, N unchanged
5. Asks global confirm, then per-file for changed files: apply / keep
6. Creates symlinks: `CLAUDE.md` → `.ai/AI_CONTEXT.md`, `.cursorrules` → `.ai/AI_CONTEXT.md`
7. Writes `.ai/.scaffold-version` with version + timestamp
8. Offers to create initial git commit

---

## What gets installed into target projects

Two folders + symlinks + copilot file:

```
.ai/
  AI_CONTEXT.md                   # source of truth — filled by ai-init skill
  .scaffold-version               # version tracking
  rules/
    code-style.md
    security.md
    no-touch.md
    context.md                    # rules for reading/writing .context/
  skills/
    ai-init.md                    # skill: analyze codebase, generate all context
    workflow/
      ticket-clarify.md
      task-plan.md
      task-implement.md
      pr-write.md
      pr-review.md
    context/
      adr-write.md
      ai-log-write.md
      context-update.md
    new-endpoint.md               # generic — ai-init customizes per project
    test-gen.md
    review.md
    debug.md

.context/
  INDEX.md                        # auto-generated central reference
  adr/
    ADR-000-index.md
  ai-log/
    .gitkeep

CLAUDE.md                         # symlink → .ai/AI_CONTEXT.md
.cursorrules                      # symlink → .ai/AI_CONTEXT.md
.github/
  copilot-instructions.md         # condensed context, <400 words
```

---

## Template files to create

Every file below goes inside `templates/` at the path shown.
The content for each was designed in the session — create them from
the descriptions and formats specified.

### `templates/ai/AI_CONTEXT.md`

Placeholder file. Content:

```markdown
# AI_CONTEXT.md

> This file is the single source of truth for AI tools working on this project.
> Run `ai-init` in your AI agent to populate it with real project content.

## Project purpose
TODO: run ai-init

## Stack
TODO: run ai-init

## Folder structure
TODO: run ai-init

## External integrations
TODO: run ai-init

## Domain glossary
TODO: run ai-init

## How to run locally
TODO: run ai-init
```

---

### `templates/ai/rules/code-style.md`

Rules for code style — generic placeholder. Key sections:
- TypeScript usage (no any, use unknown + type guards)
- Error handling (Result<T,E> vs throw)
- Function size (max 30 lines)
- Import ordering (external → internal → types)
- Naming conventions

Include note: "Run ai-init to replace these with rules derived from your actual codebase."

---

### `templates/ai/rules/security.md`

Security rules — generic placeholder. Key rules:
- Never hardcode secrets or API keys
- Validate all external input (suggest zod)
- Use parameterized queries
- Apply security headers (suggest helmet)
- Log errors, not stack traces to client

---

### `templates/ai/rules/no-touch.md`

No-touch zones — generic placeholder. Content:

```markdown
# No-touch zones

Files and folders that must not be modified without explicit human approval.

- db/migrations/     — database migrations; changes require team review
- .env*              — environment files; never commit secrets
- package-lock.json  — managed by npm; do not edit manually

> Run ai-init to add project-specific no-touch zones.
```

---

### `templates/ai/rules/context.md`

Rules governing how the AI reads and writes `.context/`. Key rules:

1. Always read `.context/INDEX.md` before starting any task
2. If ADRs exist for the task area, read them before proposing approaches
3. Read "Context for future sessions" from recent AI log entries for the same area
4. Never propose an approach explicitly rejected in an ADR
5. After generating committed code, run `ai-log-write`
6. An ADR is required when introducing or changing a cross-cutting pattern
7. Never update INDEX.md manually — always use `context-update`
8. `.context/` is append-only — never delete or rewrite ADRs
9. AI log entries are permanent — corrections go in new entries, not edits

---

### `templates/ai/skills/ai-init.md`

The most important skill. Analyzes an existing codebase and generates
the complete `.ai/` folder structure. Three phases:

**Phase 1 — Read** (silent, no output until complete)
Collects: entry point, folder structure, stack, dependencies, external APIs,
error handling patterns, naming conventions, test framework, risky files,
domain terms.
Output when done: `✓ Read complete — [N] files scanned. Starting generation.`

**Phase 2 — Generate** (in memory, no files yet)
Generates: AI_CONTEXT.md, rules/code-style.md, rules/security.md,
rules/no-touch.md, skills/new-endpoint.md, skills/test-gen.md,
skills/review.md, skills/debug.md, full-context.md (all composed).
Output when done: `✓ Content generated. Writing files.`

**Phase 3 — Write**
Creates `.ai/` structure, creates symlinks, creates `.github/copilot-instructions.md`
(condensed, <400 words).

Final output: summary of all files created/linked + next steps.

Rules: never invent content, flag unclear things with `# TODO: verify this`,
run all three phases without asking for confirmation between them,
overwrite existing files without asking.

---

### `templates/ai/skills/workflow/ticket-clarify.md`

Converts any input (ticket, Slack message, verbal description) into a
structured technical brief. Does NOT ask clarifying questions — marks
gaps explicitly instead.

Output format sections:
- `## Brief: [title]`
- `### What` — observable behavior, not implementation
- `### Why` — mark as `⚠ NOT STATED` if absent
- `### Scope` — In: / Out of scope:
- `### Acceptance criteria` — `- [ ]` checkboxes, observable + testable
- `### Complexity estimate` — S/M/L with one-sentence reasoning
  - S = isolated, one module, clear pattern
  - M = 2–3 modules, some ambiguity
  - L = cross-cutting, multiple unknowns
- `### Open questions` — format: `❓ [Question] — needed before: [planning/implementation/PR]`

Rules:
- Produce brief from input alone — do not read codebase
- Acceptance criteria must be observable without reading code
- Never start task-plan automatically — wait for human approval

---

### `templates/ai/skills/workflow/task-plan.md`

Takes an approved ticket-clarify brief and produces a file-level technical plan.
Does NOT write implementation code.

Requires: brief must be approved, no unresolved ❓ marked "needed before: planning".

**Phase 1 — Read** (silent)
Reads: affected files, closest existing similar feature, error handling in nearby code,
test file for similar feature, `.ai/AI_CONTEXT.md`, `.ai/rules/`.
Output: `✓ Codebase read. Producing plan.`

Output format sections:
- `## Plan: [title]`
- `### Complexity confirmation` — confirm or revise S/M/L with reason
- `### Files to change` — table: file | change type | what changes
- `### Files to create` — table: file | purpose
- `### Pattern to follow` — must reference a real existing file, not generic description
- `### Implementation steps` — ordered, each independently verifiable
- `### Edge cases to handle` — specific case → how to handle
- `### Risks` — what could go wrong → mitigation
- `### What NOT to touch` — file → reason
- `### Open questions resolved` — from brief, now answered by reading code
- `### Remaining open questions` — if none: "None — ready to implement"

Rules:
- Every file in "files to change" must exist in codebase
- "Pattern to follow" must reference a real file
- Never start task-implement automatically

---

### `templates/ai/skills/workflow/task-implement.md`

Executes an approved task-plan. Writes code + tests. Does NOT deviate silently.

Requires: plan approved, "Remaining open questions: None".

Deviation protocol — if a step turns out wrong, stop and output:
```
⚠ Deviation detected at step [N]
Expected: [what plan said]
Found: [what code shows]
Options: A) [safest] B) [alternative]
Waiting for direction.
```

Output format after completion:
- `## Implementation complete: [title]`
- `### What was done` — one sentence per step
- `### Files changed` — table: file | change
- `### Tests written` — list with what behavior each covers
- `### Verify manually` — things tests can't cover
- `### Did not touch` — as specified in plan
- `### Deviations from plan` — if any
- `### Ready for` — `pr-write`

Rules:
- Match pattern file style exactly
- Apply all rules from `.ai/rules/code-style.md` and `security.md`
- Never add features not in the plan
- Never skip tests
- Never modify files listed in "what NOT to touch"
- Never hardcode secrets

---

### `templates/ai/skills/workflow/pr-write.md`

Generates PR description from diff + brief. Ready to paste or open.

Output format:
- `**Title:**` — conventional commits format: `type(scope): description`
- `### What changed` — behavior description, not code mechanics
- `### Why` — business reason, reference ticket if available
- `### How` — optional, only if approach is non-obvious
- `### How to test` — concrete steps a reviewer can follow
- `### Checklist` — tests, no secrets, code style, no unintended files, AC met
- `### Linked ticket / context`
- `## Commit message (for squash merge)` — type(scope): short + 2-3 sentence body

Rules:
- Title must follow conventional commits
- "What changed" describes behavior, never "I modified file X"
- "How to test" must be actionable without reading code
- Flag out-of-scope changes with ⚠
- Keep under 400 words total

---

### `templates/ai/skills/workflow/pr-review.md`

Runs 5 structured review passes. Produces actionable findings, not opinions.

Five passes (run all, do not skip):
1. **Scope** — does diff match the brief? unmet acceptance criteria?
2. **Correctness** — edge cases, null guards, async issues, logic vs intent
3. **Security** — apply `rules/security.md` line by line
4. **Code rules** — apply `rules/code-style.md` line by line
5. **Tests** — new behavior untested, edge cases without tests, weak assertions

Output format:
- `## Review: [title]`
- `### Summary` — 2 sentences, overall + most important finding
- `### Findings`
  - `#### Blockers — must fix before merge` — table: # | pass | file | line | issue | suggestion
  - `#### Warnings — should fix, not blocking`
  - `#### Notes — informational`
- `### Acceptance criteria status` — [x] met / [ ] not met → finding #N
- `### Scope check`
- `### Verdict` — recommendation only, human decides

Rules:
- Every finding must have: pass, file, line number, specific issue, specific suggestion
- "Specific" = "line 42 returns undefined when result is empty"
- If a pass finds nothing: "Pass N: no issues found"
- No rewrites or suggestions outside PR scope
- Verdict is a recommendation

---

### `templates/ai/skills/context/adr-write.md`

Generates an ADR when a significant technical decision is made.
Updates ADR index automatically.

When to generate (at least one criterion must be true):
- Affects more than one module or service
- Introduces or changes a cross-cutting pattern
- Rejects a common alternative for a non-obvious reason
- Has significant tradeoffs future devs should understand
- Would be hard to reverse without significant rework

**Phase 1 — Read**
Reads: `.context/adr/ADR-000-index.md` for next number, `.ai/AI_CONTEXT.md`,
relevant source files.

ADR format:
```markdown
# ADR-[NNN]: [Title — decision as noun phrase, not question]

**Date:** YYYY-MM-DD
**Status:** Accepted
**Deciders:** [who]
**Ticket / context:** [what triggered this]

## Context
[2–4 sentences. The situation that made a decision necessary.]

## Decision
[1–3 sentences. What was decided. "We will use X" not "X is better."]

## Consequences
**Positive:** [list]
**Negative / tradeoffs:** [list]

## Alternatives considered
### [Alternative A]
[What it was and why rejected — one concrete reason.]

## Context for AI assistants
[Direct instructions for future AI sessions.
"Do not suggest X — it was evaluated and rejected because of Y."]
```

After writing: update `ADR-000-index.md` and `INDEX.md`.

Naming: `ADR-[NNN]-[slug].md` — zero-padded, max 5 words in slug.

Superseding: change old status to "Superseded by ADR-NNN", add "Supersedes: ADR-NNN" to new.

Rules:
- "Context for AI assistants" section is mandatory
- Never fabricate alternatives not actually considered
- Status is always "Accepted" on creation
- Title states decision, not question

---

### `templates/ai/skills/context/ai-log-write.md`

Logs any session where AI generated committed code.

When to generate:
- AI generated code that was committed or being committed
- AI generated code that was rejected (rejection is as valuable)
- AI made a deviation from plan during implementation
- AI produced a plan that shaped subsequent work

File naming: `.context/ai-log/YYYY-MM-DD-[slug].md`

Log format:
```markdown
# AI log: [Task description]

**Date:** YYYY-MM-DD
**Skill(s) used:** [list]
**Ticket / context:** [ticket ID or brief]
**Complexity:** [S/M/L]

## What was asked
[1–3 sentences. The intent, not the prompt.]

## What the AI generated
| File | Action | Summary |
|------|--------|---------|

## What was accepted
[Specific things used as-is or with minor edits.]

## What was rejected or modified
| Item | Why rejected / how modified |
|------|-----------------------------|

## Deviations from plan
[Any deviations and whether accepted. If none: "None."]

## Patterns confirmed
[Patterns AI correctly identified and followed.]

## Patterns missed or wrong
[Patterns AI got wrong — with mandatory action:
update rules/X.md | update AI_CONTEXT.md | no action needed]

## Context for future sessions
[1–2 direct instructions for future AI sessions working on this area.]
```

After writing: update `INDEX.md`.

Rules:
- "What was rejected" must be filled honestly — empty = review was skipped
- "Patterns missed" must include a concrete action, never just an observation
- "Context for future sessions" must be directive, not descriptive
- File naming uses date of session, not ticket date

---

### `templates/ai/skills/context/context-update.md`

Keeps `INDEX.md` in sync. Rebuilds from source files, never from memory.
Surfaces pending rule update actions from AI log entries.

INDEX.md structure it generates:
```markdown
# Project context index

Last updated: YYYY-MM-DD
Generated by: context-update skill

## Architecture decisions
| ADR | Title | Date | Status | Decision summary |

## AI interaction log
| Date | Task | Skills | Size | Summary |

## Pending rule updates
[Actions from AI log "Patterns missed" sections not yet resolved]
| Date | Source log | Pattern issue | Recommended action |

## Quick reference for AI sessions
[Auto-extracted from ADR "Context for AI assistants" and
log "Context for future sessions" sections — direct instructions only]
```

Rules:
- INDEX.md is always rebuilt from source — never edited manually
- "Quick reference" pulls exclusively from the two designated sections
- Pending rule updates surface even after multiple entries — don't expire
- Never update AI_CONTEXT.md automatically — surface what should change

---

### `templates/ai/skills/new-endpoint.md`

Generic template — ai-init will replace with project-specific version.

```markdown
# Skill: new-endpoint

Create [METHOD] [/route]
Input: { field: type, ... }
Validate input. Follow the pattern of [similar existing endpoint].
Include: handler, service, types, tests.
```

---

### `templates/ai/skills/test-gen.md`

Generic template — ai-init will replace with project-specific version.

```markdown
# Skill: test-gen

Write tests for [function/module].
Required cases: [happy path], [not found], [external error]
Required mocks: [external clients]
Follow the existing test structure and naming conventions.
```

---

### `templates/ai/skills/review.md`

Generic template — ai-init will replace with project-specific version.

```markdown
# Skill: review

Review this diff. Check for:
1. Project rule violations
2. Unhandled edge cases
3. Security issues (secrets, unvalidated input, unsafe queries)
4. Missing tests for new logic
5. Anything outside the stated scope
```

---

### `templates/ai/skills/debug.md`

Generic template — ai-init will replace with project-specific version.

```markdown
# Skill: debug

Bug: [current behavior]
Expected: [correct behavior]
Reproduction: [steps or failing test]
Context: [stack trace / relevant logs]
Analyze root cause before proposing a fix.
```

---

### `templates/context/INDEX.md`

Initial placeholder:

```markdown
# Project context index

Last updated: [run context-update to populate]

## Architecture decisions
No ADRs yet. Run `adr-write` after the first significant technical decision.

## AI interaction log
No entries yet. Run `ai-log-write` after any session where AI generated code.

## Quick reference for AI sessions
Nothing yet — this section is auto-populated by `context-update`.
```

---

### `templates/context/adr/ADR-000-index.md`

```markdown
# ADR index

| ADR | Title | Date | Status | Decision summary |
|-----|-------|------|--------|-----------------|

_No ADRs yet. Run `adr-write` after the first significant technical decision._
```

---

### `templates/context/ai-log/.gitkeep`

Empty file to keep the directory tracked in git.

---

### `templates/github/copilot-instructions.md`

Condensed context for VS Code Copilot and Copilot CLI. Under 400 words.

```markdown
# Copilot instructions

> Populated by ai-init. Until then, here are the defaults.

## Project
[Run ai-init to fill this in]

## Stack
[Run ai-init to fill this in]

## Key rules
- Do not use `any` — use `unknown` with type guards
- Follow existing error handling patterns — do not introduce new ones
- Validate all external input at entry points
- Never hardcode secrets or environment values
- Tests go next to the source file they test

## What not to touch
- `db/migrations/` — always requires human review
- Public interfaces of existing services

## How to run
[Run ai-init to fill this in]
```

---

## Key design decisions made in this session

| Decision | Choice | Reason |
|----------|--------|--------|
| Context folder name | `.context/` | Describes purpose clearly; `.ai/` is config not memory |
| Sync strategy | Symlinks for CLAUDE.md + .cursorrules | Single source of truth, no divergence |
| Tool-specific files | Compose with `make sync-ai` | full-context.md for tools that don't read multi-file |
| ticket-clarify gaps | Mark with ❓, don't ask questions | Faster in practice; questions slow the flow |
| Complexity estimate | Include in ticket-clarify + confirmed in task-plan | S/M/L with reasoning |
| ticket-clarify vs task-plan | Two separate skills with human gate between | Validate understanding before proposing approach |
| ADR "Context for AI" section | Mandatory in every ADR | Highest-value section for future sessions |
| AI log "Patterns missed" | Must include concrete action | Observations without follow-through are useless |
| Distribution | npm private via GitHub (npx github:org/repo) | No npm account needed, access control via GitHub |
| Existing files on install | Show diff, decide per file | Never silently overwrite; build trust |
| Post-install | Offer initial git commit | Reduces manual steps |

---

## Immediate next steps

1. Create all template files described above in `templates/`
2. Fix `package.json` bin entry to point to compiled output or use tsx for development
3. Add `templates/` to the installer walk (already implemented in `installer.ts`)
4. Test `install` command against a fresh empty directory
5. Test `diff` command against a directory with some files already present
6. Replace `your-org` placeholder in README and package.json with actual org name

---

## Commands to verify it works

```bash
# Install dependencies
npm install

# Run against a test directory
mkdir /tmp/test-project && cd /tmp/test-project && git init
npx tsx ../ai-scaffold/src/cli.ts install

# Check status
npx tsx ../ai-scaffold/src/cli.ts status

# See diff after modifying a template
npx tsx ../ai-scaffold/src/cli.ts diff
```

---

## Files already generated (download from this Claude session)

- `src/cli.ts`
- `src/installer.ts`
- `src/differ.ts`
- `src/commands/install.ts`
- `src/commands/update.ts`
- `src/commands/diff.ts`
- `src/commands/status.ts`
- `package.json`
- `tsconfig.json`
- `README.md`

All skill .md files are described above — create them from the specs in this document.
