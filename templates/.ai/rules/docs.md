# Documentation rules

> Generic defaults. Run `ai-init` to align with the project's docs layout.

Code says *what*; docs say *why* and *how to use it*. Out-of-date docs are worse
than none.

## Keep in sync with the change

- A change to user-facing behavior, setup, or commands updates the `README` in
  the **same** change — never "later".
- A change to a public interface updates its contract/API docs (see
  [[api-contract]]).
- A significant technical decision is recorded as an ADR via `adr-write`, and
  the change references it. Decisions live in `.context/adr/`, not in commit
  messages that no one re-reads.

## Inline documentation

- Document the **non-obvious**: why this approach, what invariant must hold, what
  the gotcha is. Don't narrate what the code already says.
- Public functions/modules carry a short doc comment describing intent, inputs,
  and failure modes.
- A `# TODO` / `# FIXME` includes context and, ideally, a tracking reference —
  not a bare marker.

## Project memory

- `.context/INDEX.md` is the map; keep it current via `context-update` (never by
  hand). After any session that generated committed code, run `ai-log-write`
  (see [[context]]).

> Run ai-init to record where docs live and the project's doc-comment style.
