# ADR index

This repo dogfoods the decision-record model it ships in its payload. ADRs here
document decisions about **this tool**; they are not installed into targets.

| ADR | Title | Date | Status | Decision summary |
|-----|-------|------|--------|-----------------|
| [ADR-001](ADR-001-development-flow.md) | Development flow for payload, installer, and releases | 2026-06-10 | Accepted | Change-type-specific flow with decision gate, deliberate core/optional classification, four verification gates, docs in the same commit, semver releases. |
| [ADR-002](ADR-002-claude-first-logical-templates.md) | Claude Code as primary target, logical template layout, install-time generation | 2026-06-10 | Accepted | Canonical skills/rules in `.claude/` (Copilot reads them natively); `templates/` in logical layout with a mapping table in the installer; derived files generated at install time; adapters and `.ai/` removed; breaking 2.0.0. |
| [ADR-003](ADR-003-chain-transitions-context-merge.md) | Explicit chain transitions; context capture at work-chain edges | 2026-06-10 | Accepted¹ | Every work-chain skill ends with a Hand-off proposing the next step (human decides); `task-implement` logs the session and the chain captures context automatically at its edges. |
| [ADR-004](ADR-004-decision-capture-at-plan-approval.md) | Decision capture at plan approval, before implementation | 2026-06-10 | Accepted | `task-implement` step 0 drafts any required ADR right after plan approval, before code; the session log stays retrospective at its close; `pr-write`'s ADR step becomes verify/update, not authorship. |
| [ADR-006](ADR-006-update-ai-init-layering.md) | Base-aware updates — reconciling `update` with `ai-init` customization | 2026-06-10 | Accepted | Three-way classification per file using the recorded base hash: customized + upstream-unchanged skips silently, unmodified fast-forwards, customized + upstream-changed is a never-auto-applied conflict. |
| [ADR-007](ADR-007-template-catalog.md) | Template catalog with per-template versioning, mechanically enforced | 2026-06-10 | Accepted | `scaffold.manifest.json` catalogs every template (version, date, sha256, kind, tags); a dev script maintains it and a test fails on drift; installs record their base versions in `.scaffold-version` — the raw material for ADR-006. |

¹ Decision 2's ADR-drafting timing superseded by ADR-004.

## Pending decisions (agreed direction, ADR to be written before implementing)

From the design reviews of 2026-06-10:

- **ADR-005 — Model tiers as skill metadata.** Skills declare effort semantics
  (`tier: fast | deep`), never model IDs; install-time generation concretizes
  the tier per tool where the tool supports it.
- **ADR-008 — MCP base configurations, linked to optional modules.** Ship
  project-scoped MCP server configs (`.mcp.json`) for common integrations
  (GitHub, Jira, …), with env-var placeholders only — never credentials.
  Optional modules may declare suggested MCP servers (e.g. `observability` →
  Datadog | Prometheus | Google Cloud Logging) offered as a choice at install
  time; requires a JSON-merge install action, not file copy.
