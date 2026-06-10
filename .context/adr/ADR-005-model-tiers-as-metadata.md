# ADR-005: Model tiers as skill metadata, never model IDs

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-10. The original suggestion was
to generate "prompts with specific models" so different skills run on
different models. The agreed direction: encode the *effort semantics*, not the
model — model IDs deprecate within months and break the tool-agnostic promise;
ai-scaffold is the base, not the orchestrator.

## Context

Skills differ in how much judgment they need: writing a session log is
mechanical; planning a task or reviewing security is judgment-heavy. Tools can
exploit that (cheaper/faster models for mechanical work), but only if the
payload expresses it in a stable, tool-neutral form.

## Decision

1. **Every skill declares `tier: fast | deep` in its frontmatter.**
   - `fast` — mechanical, pattern-following, low ambiguity: `ai-log-write`,
     `context-update`, `verify`, `pr-write`, `new-endpoint`, `test-gen`,
     `review`.
   - `deep` — judgment-heavy, analysis or safety-critical: `ai-init`,
     `ticket-clarify`, `task-plan`, `task-implement`, `pr-review`, `debug`,
     `security-review`, `refactor`, `adr-write`, `migration`, `incident`.
   - A missing tier is treated as `deep` (conservative default).
2. **No model IDs anywhere in the payload.** The tier is the stable contract;
   mapping tier → concrete model/settings is each tool's concern.
3. **Install-time generation surfaces the tier** in the generated pointers
   (Copilot instructions and the Cursor rule annotate each skill), so humans
   and tools can route work without opening every playbook. When a target tool
   gains native per-skill model settings, the mapping is added to
   `generatedFiles()`/the installer — never to the skill content.
4. `ai-init` must preserve frontmatter (`name`, `description`, `tier`) when it
   customizes a skill, adjusting `description` only.
5. A test enforces that every skill template declares a valid tier.

## Consequences

**Positive:**
- The cost/latency intent survives model churn and tool churn; nothing in the
  payload rots when a model is deprecated.
- One judgment call per skill, made once, enforced by a test.

**Negative / tradeoffs:**
- Two coarse tiers can't express fine gradations (deliberate: more tiers =
  more taxonomy debates for marginal benefit; revisit only with evidence).
- Until tools expose per-skill model settings, the tier is informational —
  the value lands when the mapping point exists, and the mapping point
  (install-time generation) is already where it will live.

## Alternatives considered

### Model IDs in skill frontmatter or generated adapters
Rejected: IDs deprecate within months across ~40 installed targets that
update irregularly; and it couples the payload to one provider.

### Per-tool orchestration (subagents with different models)
Out of scope by design: ai-scaffold is the base layer, not the orchestrator;
multi-model execution belongs to each tool's harness.

### Three or more tiers
Rejected for now: no evidence two is insufficient, and each extra tier adds a
classification debate to every new skill.

## Context for AI assistants

- Never write a model ID (`claude-*`, `gpt-*`, etc.) into anything under
  `templates/`.
- New skills must declare `tier`; choose `deep` when unsure.
- Tool-specific tier→model mapping belongs in the installer's generation step,
  not in skill content.
