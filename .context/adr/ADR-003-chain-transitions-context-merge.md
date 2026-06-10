# ADR-003: Explicit chain transitions; context capture at work-chain edges

**Date:** 2026-06-10
**Status:** Accepted — decision 2's ADR-drafting timing superseded by ADR-004
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-10. Two reliability gaps in the
shipped workflow: (1) advancing the work chain depends on the human remembering
which skill comes next; (2) writing project memory (`ai-log`, ADRs, INDEX)
depends on someone manually running the context skills at the end of a session
— exactly the step that gets skipped.

## Context

The work chain's human gates (understanding approved before planning, plan
before code) are the product's core value and must stay. But a gate is a
yes/no decision — it should not require the human to also recall and type the
next command. Separately, the context chain is append-only memory with no
direction-setting decisions in it; gating it adds friction without adding
control, and in practice means the memory never gets written.

## Decision

1. **Every work-chain skill ends with a `Hand-off` section** that names the
   next skill and asks for approval: the skill *proposes*, the human *decides*.
   The gates remain — they become "answer yes/no" instead of "remember what
   comes next". No skill ever starts the next work-chain skill without that
   approval.
2. **Context capture runs automatically at the work chain's edges** — it is a
   closing *step* of the work skills, not a separate thing to remember:
   - `task-implement` closes by writing the session log (the `ai-log-write`
     playbook) before proposing `verify`.
   - `pr-write` closes by evaluating the ADR triggers (from `adr-write`) and
     drafting an ADR when one applies, then refreshing the index
     (`context-update`), before proposing `pr-review`.
3. The context skills remain standalone and invocable on their own — the work
   chain *calls* them at its edges; it does not absorb them.

## Consequences

**Positive:**
- Project memory is persisted at every gate as a side effect of working, not
  as an act of discipline; the "run the log at session end" failure mode
  disappears for chain-driven work.
- Transitions are uniform and discoverable: the human always sees what comes
  next and approves it explicitly.

**Negative / tradeoffs:**
- Work-chain skill runs get slightly longer (log write, index refresh).
- Memory capture is only guaranteed for work that flows through the chain;
  ad-hoc sessions still rely on the `context` rule. Enforcement-grade capture
  (tool hooks, e.g. Claude Code session-end hooks) is deliberately deferred to
  a future optional module because it is tool-specific.

## Alternatives considered

### Context chain as a rule ("always log at session end")
Rejected as the primary mechanism: rules are ambient suggestions and dilute in
long sessions — the log is forgotten precisely when the context window is most
saturated. A procedural step inside the work skills is followed; an
exhortation alongside them is not.

### Fully automating the work chain (no gates)
Rejected: the human gates between understanding, planning, and coding are the
product's value proposition, not overhead.

### Tool-native hooks for context capture
Strongest enforcement, but tool-specific (Claude Code hooks). Deferred to a
future optional module rather than rejected; it complements, not replaces,
the edge-merge.

## Context for AI assistants

- Do not remove or weaken the `Hand-off` gates: a work-chain skill may
  propose the next skill, never start it unapproved.
- Do not gate the context steps inside `task-implement`/`pr-write` — they are
  automatic closing steps by design.
- Keep the context skills independently invocable; do not inline their content
  into the work skills (reference the playbooks instead).
