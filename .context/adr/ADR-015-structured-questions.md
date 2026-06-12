# ADR-015: Human ask-points use structured question dialogs

**Date:** 2026-06-12
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Improvement proposal (2026-06-12). Work-chain questions
(elicitation, hand-offs, deviation choices) are asked as free text; Claude
Code offers an option-based question dialog (as in plan mode) that makes
answering a tap instead of a written reply.

## Context

The chain has well-defined ask-points: `ticket-create`'s elicitation rounds,
every Hand-off (an approve/adjust/stop decision), `task-implement`'s deviation
protocol (choose A/B/other direction), and `pr-write`'s filing approval. All
are currently free-text. A skill cannot technically *force* a harness tool
choice — but a procedural instruction at the exact ask-point is followed
reliably, and the ADR-014 degradation pattern covers harnesses without the
tool.

## Decision

1. **Every defined ask-point instructs the agent to use the harness's
   structured question tool when available** (option dialogs with a free-text
   "Other"), falling back to plain text otherwise. The sequential/text path
   remains the contract; the dialog is the preferred presentation.
2. **Ask-points and their shapes:**
   - `ticket-create` elicitation: one dialog call per batch (group up to ~4
     questions), each offering **best-guess options derived from the prompt**
     plus "Other"; an unanswered question records `⚠ NOT PROVIDED`.
   - **Hand-offs** (all work-chain skills): options
     `Approve — continue with <next>` / `Adjust first` / `Stop here`.
   - `task-implement` deviation protocol: the A/B options as choices, plus
     free-text for a third direction.
   - `verify` red path: `Return to task-implement with the failures` / `Stop`.
   - `pr-write` filing (MCP): `File it` / `Edit first` / `Don't file`.
   - `pr-review` end of chain: `Return to task-implement with findings` /
     `Done — merge decision is mine`.
3. **No enforcement mechanism beyond the instruction.** Hooks cannot force
   tool selection; a lint-like check would inspect conversation behavior, not
   payload content. Rejected as out of scope — instruction-level mandate is
   the mechanism.
4. Context-capture steps stay ungated and dialog-free (ADR-003/004): memory
   writes are not questions.

## Consequences

**Positive:**
- Gates become one-tap decisions; elicitation rounds become forms instead of
  essay prompts — lower friction exactly where the chain demands human input.
- Best-guess options make `ticket-create` faster for the requester (confirm
  instead of compose) without weakening the no-invention rule (`⚠ NOT
  PROVIDED` when skipped).

**Negative / tradeoffs:**
- Option lists can anchor the human; mitigated by always including free-text
  "Other" and never pre-marking a recommended option on direction-setting
  decisions.
- One more recurring paragraph in the skills.

## Alternatives considered

### Hard enforcement via hooks
Rejected: hooks observe/permit tool calls; they cannot substitute a text
question with a dialog. The instruction at the ask-point is the only real
lever.

### A single ambient rule ("always use dialogs for questions")
Rejected: ambient rules dilute in long sessions (same reasoning as ADR-003);
the instruction belongs procedurally at each ask-point.

## Context for AI assistants

- When executing these skills in a harness with an option-dialog tool, using
  it at the marked ask-points is mandatory, not stylistic.
- Always include a free-text escape ("Other"); never invent an answer from an
  unanswered dialog.
- Do not add dialogs to context-capture steps — they are ungated by design.
