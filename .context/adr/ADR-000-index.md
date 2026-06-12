# ADR index

This repo dogfoods the decision-record model it ships in its payload. ADRs here
document decisions about **this tool**; they are not installed into targets.

| ADR | Title | Date | Status | Decision summary |
|-----|-------|------|--------|-----------------|
| [ADR-001](ADR-001-development-flow.md) | Development flow for payload, installer, and releases | 2026-06-10 | Accepted | Change-type-specific flow with decision gate, deliberate core/optional classification, four verification gates, docs in the same commit, semver releases. |
| [ADR-002](ADR-002-claude-first-logical-templates.md) | Claude Code as primary target, logical template layout, install-time generation | 2026-06-10 | Accepted | Canonical skills/rules in `.claude/` (Copilot reads them natively); `templates/` in logical layout with a mapping table in the installer; derived files generated at install time; adapters and `.ai/` removed; breaking 2.0.0. |
| [ADR-003](ADR-003-chain-transitions-context-merge.md) | Explicit chain transitions; context capture at work-chain edges | 2026-06-10 | Accepted¹ | Every work-chain skill ends with a Hand-off proposing the next step (human decides); `task-implement` logs the session and the chain captures context automatically at its edges. |
| [ADR-004](ADR-004-decision-capture-at-plan-approval.md) | Decision capture at plan approval, before implementation | 2026-06-10 | Accepted | `task-implement` step 0 drafts any required ADR right after plan approval, before code; the session log stays retrospective at its close; `pr-write`'s ADR step becomes verify/update, not authorship. |
| [ADR-005](ADR-005-model-tiers-as-metadata.md) | Model tiers as skill metadata, never model IDs | 2026-06-10 | Accepted | Every skill declares `tier: fast \| deep` in frontmatter; no model IDs in the payload; generated pointers surface the tier and tool-specific mapping lives in the installer's generation step. |
| [ADR-006](ADR-006-update-ai-init-layering.md) | Base-aware updates — reconciling `update` with `ai-init` customization | 2026-06-10 | Accepted | Three-way classification per file using the recorded base hash: customized + upstream-unchanged skips silently, unmodified fast-forwards, customized + upstream-changed is a never-auto-applied conflict. |
| [ADR-007](ADR-007-template-catalog.md) | Template catalog with per-template versioning, mechanically enforced | 2026-06-10 | Accepted | `scaffold.manifest.json` catalogs every template (version, date, sha256, kind, tags); a dev script maintains it and a test fails on drift; installs record their base versions in `.scaffold-version` — the raw material for ADR-006. |
| [ADR-008](ADR-008-mcp-module-linked.md) | MCP server catalog, linked to optional modules | 2026-06-10 | Accepted | Verified MCP server catalog in the manifest (base: GitHub, Atlassian; module-linked: observability → Datadog); add-only merge into the user-owned `.mcp.json`; OAuth/env placeholders only; selection recorded for update. |
| [ADR-009](ADR-009-stack-modules.md) | Technology stack modules as optional modules (`kind: stack`) | 2026-06-10 | Accepted | Curated tech expertise ships as optional `kind: stack` modules (never core); rules not skills; durable conventions only, version range in header, owner per module. Pilots: `stack-nextjs`, `stack-node-express` (portfolio survey: 7 and 6 projects). |
| [ADR-010](ADR-010-drop-cursor-artifacts.md) | Drop Cursor-specific artifacts — Cursor consumes `.claude/` natively | 2026-06-10 | Accepted² | Verified in the ffn-resiliency test: Cursor reads `.claude/` directly, so the generated Cursor rule and the `.cursorrules` symlink are removed (and with them the `symlink` action type). |
| [ADR-011](ADR-011-claude-only-no-generated-pointers.md) | Claude-only payload — no per-tool generated artifacts at all | 2026-06-10 | Accepted | The installer generates nothing: the payload is exactly `CLAUDE.md` + `.claude/` + `.context/`. Other tools' compatibility comes from reading `.claude/`; tool-specific pointers are user content. |
| [ADR-012](ADR-012-ticket-create-entry-point.md) | `ticket-create` — an authoring entry point for the work chain | 2026-06-12 | Accepted | New core workflow skill upstream of `ticket-clarify`: elicits What/Why/How/Context/Scope by asking (the deliberate inverse of clarify's no-questions rule), composes a paste-ready ticket, optionally files it via a configured tracker MCP after approval. |
| [ADR-013](ADR-013-monorepo-support.md) | Monorepo support — process at the root, context nearest to what it describes | 2026-06-12 | Accepted | One scaffold per repo; `ai-init` monorepo mode (multi-marker detection, per-workspace archetypes, root map + nested `CLAUDE.md`); memory resolves to the nearest `.context/` with per-workspace ADR numbering; stack rules carry an `Applies to` scope. Pilot: `ffn-cxt-packages`. |
| [ADR-014](ADR-014-parallel-fanout-in-skills.md) | Parallel subagent fan-out as skill content, with graceful degradation | 2026-06-12 | Accepted | Fan-out directives in `ai-init` (per top-level workspace, never per sub-library), `pr-review` and `security-review` (per pass/dimension); subagents are read-only analysts, ~4–6 in flight; sequential path remains the contract; no agents/workflow artifacts. |
| [ADR-015](ADR-015-structured-questions.md) | Human ask-points use structured question dialogs | 2026-06-12 | Accepted | Elicitation rounds, Hand-offs, deviation choices and filing approvals instruct the agent to use the harness's option-dialog tool (free-text "Other" always included), degrading to plain text; no enforcement beyond the procedural instruction. |
| [ADR-016](ADR-016-skill-help-cards.md) | Self-documenting skills — a `help` invocation card in every skill | 2026-06-12 | Accepted | `/<name> help` prints a standardized card (What/When/Gates/Output/Chain/Example) and stops; the card lives inside the skill file, so it ships, versions and updates with it — no doc files installed into targets. |

² Decision 1 (keeping the Copilot pointer) superseded by ADR-011.

¹ Decision 2's ADR-drafting timing superseded by ADR-004.

## Pending decisions

None — the 2026-06-10 design-review backlog is fully decided (ADR-001 through
ADR-011). New decisions start from a fresh review.
