# ADR-012: `ticket-create` — an authoring entry point for the work chain

**Date:** 2026-06-12
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Post-rollout feedback (2026-06-12). Work often starts
from a rough idea ("we need X"), not from an existing ticket. `ticket-clarify`
deliberately never asks — it converts *existing* input into a brief, marking
gaps. Nothing in the chain authors the ticket itself.

## Context

The work chain starts at `ticket-clarify`, which has a hard no-questions rule
(marking gaps beats a question round-trip when input already exists). When the
input is a prompt-level idea, somebody must ask What/Why/How/Context before a
ticket exists — today that interrogation happens nowhere, so tickets arrive
incomplete and `ticket-clarify` just marks the holes.

## Decision

1. **New core workflow skill `ticket-create`**, upstream of `ticket-clarify`:
   `ticket-create → ticket-clarify → task-plan → …`. It is the *inverse* of
   `ticket-clarify` by design: **asking is its job** — it elicits What, Why,
   How (constraints only, no solutioning), Context, Scope, acceptance
   criteria, priority and dependencies, in batched rounds, then composes a
   paste-ready ticket with an Overview.
2. **Core, not optional:** every project files tickets; the skill is
   tool-agnostic (the output is markdown).
3. **Optional MCP filing:** if a tracker MCP (e.g. `atlassian`, ADR-008) is
   configured in `.mcp.json`, the skill offers to file the ticket directly —
   only after showing the final text and getting explicit approval (filing is
   outward-facing).
4. Standard Hand-off: proposes `ticket-clarify` next; the human decides.
   Entering the chain at `ticket-clarify` with an existing ticket remains the
   normal path — `ticket-create` is an entry point, not a new gate.

## Consequences

**Positive:**
- Ideas become complete tickets through interrogation instead of arriving as
  holes for `ticket-clarify` to mark; the two skills cover both starting
  states (idea vs existing input) with opposite, explicit asking rules.
- First chain skill that exercises the ADR-008 MCP integration.

**Negative / tradeoffs:**
- Two adjacent skills with opposite asking rules can confuse — mitigated by
  each skill stating the contrast explicitly.
- One more core skill in every install.

## Alternatives considered

### Relax `ticket-clarify` to ask when input is thin
Rejected: its no-questions rule is load-bearing (fast flow on existing
tickets); mixing both behaviors in one skill makes the asking rule ambiguous.

### Ship as an optional module
Rejected: ticket authoring is universal, not project-shape-dependent.

## Context for AI assistants

- Do not weaken `ticket-clarify`'s no-questions rule to compensate for thin
  input — route rough ideas through `ticket-create` instead.
- `ticket-create` never files a ticket without showing the final text and
  receiving explicit approval.
