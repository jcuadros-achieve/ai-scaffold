# ADR index

This repo dogfoods the decision-record model it ships in its payload. ADRs here
document decisions about **this tool**; they are not installed into targets.

| ADR | Title | Date | Status | Decision summary |
|-----|-------|------|--------|-----------------|
| [ADR-001](ADR-001-development-flow.md) | Development flow for payload, installer, and releases | 2026-06-10 | Accepted | Change-type-specific flow with decision gate, deliberate core/optional classification, four verification gates, docs in the same commit, semver releases. |
| [ADR-002](ADR-002-claude-first-logical-templates.md) | Claude Code as primary target, logical template layout, install-time generation | 2026-06-10 | Accepted | Canonical skills/rules in `.claude/` (Copilot reads them natively); `templates/` in logical layout with a mapping table in the installer; derived files generated at install time; adapters and `.ai/` removed; breaking 2.0.0. |

## Pending decisions (agreed direction, ADR to be written before implementing)

From the design reviews of 2026-06-10:

- **ADR-003 — Explicit chain transitions; context chain merged at work-chain
  edges.** Each work-chain skill ends by proposing the next step (human
  decides); `task-implement` / `pr-write` close by invoking the context skills
  so memory persists at every gate instead of depending on a manual final step.
- **ADR-004 — Model tiers as skill metadata.** Skills declare effort semantics
  (`tier: fast | deep`), never model IDs; install-time generation concretizes
  the tier per tool where the tool supports it.
- **ADR-005 — Update vs ai-init layering.** Resolve the conflict between
  template updates and `ai-init` personalization (generic layer vs project
  layer, or 3-way merge via recorded per-template version/hash — depends on
  ADR-006). Optional modules are update-friendly as-is; the core files
  `ai-init` rewrites are the problem.
- **ADR-006 — Template catalog: per-template versioning and enriched
  metadata.** Evolve `scaffold.manifest.json` into a catalog listing *every*
  template (core and optional) with version, last-updated date, content hash,
  kind, scope, and tags/technologies. A check script (verification gate)
  fails when a template's content no longer matches its recorded hash, forcing
  the version/date bump mechanically instead of by discipline. Feeds ADR-005
  (per-file versions recorded in the target enable 3-way update).
- **ADR-007 — MCP base configurations, linked to optional modules.** Ship
  project-scoped MCP server configs (`.mcp.json`) for common integrations
  (GitHub, Jira, …), with env-var placeholders only — never credentials.
  Optional modules may declare suggested MCP servers (e.g. `observability` →
  Datadog | Prometheus | Google Cloud Logging) offered as a choice at install
  time; requires a JSON-merge install action, not file copy.
