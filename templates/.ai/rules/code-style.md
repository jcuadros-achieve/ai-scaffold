# Code style rules

> Generic defaults. Run `ai-init` to replace these with rules derived from your
> actual codebase.

## TypeScript usage
- Never use `any`. Use `unknown` and narrow with type guards.
- Prefer explicit return types on exported functions.
- Prefer `type` aliases for unions and `interface` for object shapes.

## Error handling
- Choose one strategy per layer and stay consistent: `Result<T, E>` for
  expected/recoverable failures, `throw` for truly exceptional cases.
- Do not mix both styles within the same module.
- Never swallow errors silently — log or propagate.

## Function size
- Keep functions under 30 lines. If a function grows past that, extract a
  helper with a descriptive name.
- One function, one responsibility.

## Import ordering
Order imports in three groups, separated by a blank line:
1. External packages
2. Internal modules
3. Types (use `import type`)

## Naming conventions
- `camelCase` for variables and functions.
- `PascalCase` for types, interfaces, and classes.
- `UPPER_SNAKE_CASE` for constants.
- Booleans read as predicates: `isReady`, `hasAccess`, `canRetry`.
- Avoid abbreviations unless they are domain-standard.

> Run ai-init to replace these with rules derived from your actual codebase.
