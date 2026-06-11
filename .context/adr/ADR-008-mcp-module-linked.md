# ADR-008: MCP server catalog, linked to optional modules

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Amends:** ADR-011 decision 1, narrowly — `.mcp.json` entries are
Claude-native *functional configuration* the human explicitly selects, not a
per-tool pointer duplicating canonical content. The Claude-only principle is
untouched: `.mcp.json` is precisely Claude Code's project-scope MCP format.
**Ticket / context:** Design review of 2026-06-10 (last pending item). A
complete setup includes the integrations an AI agent needs (GitHub, Jira), and
some integrations follow from module choices (observability → an
observability MCP). Server URLs verified against vendor docs on 2026-06-10.

## Context

MCP servers are how Claude Code reaches external systems. Today each team
hand-writes `.mcp.json`, rediscovering endpoints and auth quirks (e.g.
Atlassian's old SSE endpoint dies 2026-06-30). The scaffold can ship a small,
verified catalog — but `.mcp.json` may already exist and belongs to the team,
and credentials must never travel in a template.

## Decision

1. **`scaffold.manifest.json` gains an `mcp` catalog** (id → label,
   description, `docs` URL, Claude `.mcp.json` server config) and an
   `mcpBase` list of ids offered for every project. Optional modules may
   declare `mcp: [ids]` — selecting the module offers its servers (e.g.
   `observability` → `datadog`). Pilot catalog, every entry verified against
   vendor docs: `github` and `atlassian` (base, remote HTTP + OAuth),
   `datadog` (observability). Grows on demand, verified entries only — same
   policy as stack modules (ADR-009).
2. **`.mcp.json` is user-owned; the scaffold only ever ADDS.**
   `mergeMcpServers()` inserts the chosen servers into `mcpServers`, skipping
   any id that already exists (the team's entry always wins), never updating
   or removing, and leaving an unparseable file untouched. The file is not
   tracked by `diff`/`update` — it is not a template.
3. **Selection is explicit and remembered.** Interactive installs show a
   multiselect (base + selected modules' suggestions), defaulting to the
   previously chosen set (none on a fresh install — MCP servers are opt-in);
   `--mcp=a,b` selects non-interactively. The chosen ids are recorded in
   `.claude/.scaffold-version` (`mcp: [...]`) so `update` preselects them.
4. **No credentials, ever.** Configs use OAuth-based remote servers or
   `${ENV_VAR}` placeholders (Claude Code expands them); a test rejects
   credential-shaped strings anywhere in the catalog.

## Consequences

**Positive:**
- A new project gets working GitHub/Jira/observability integrations from the
  checklist instead of from tribal knowledge, with endpoints someone actually
  verified (and a `docs` link when they rot).
- Module-linked suggestions make the install coherent: choosing
  `observability` surfaces the matching integration.

**Negative / tradeoffs:**
- Remote MCP endpoints rot like any external URL; bounded by the
  verified-on-demand policy and the per-entry `docs` link, but not eliminated.
- Add-only merging means the scaffold can't fix a server entry the team
  already has (deliberate: their file, their entry).

## Alternatives considered

### Ship `.mcp.json` as a template
Rejected: the file is shared user space — template diffing would fight the
team's own servers, and ADR-006's classification is designed for files the
scaffold owns.

### Suggest servers in docs only (no merge)
Rejected: copy-paste setup is exactly the tribal-knowledge problem this
solves; the add-only merge is safe enough to automate.

### A large catalog up front
Rejected: unverified entries are worse than none (a broken endpoint config
fails opaquely); the ADR-009 on-demand policy applies.

## Context for AI assistants

- Never update or remove an existing `mcpServers` entry; add-only, the user's
  entry always wins.
- Never put a literal credential in the catalog — OAuth remotes or `${VAR}`
  refs only; the test enforces it.
- New catalog entries require verifying the endpoint against vendor docs and
  recording the `docs` URL.
