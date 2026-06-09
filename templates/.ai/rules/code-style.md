# Code style rules

> Language-neutral principles. Run `ai-init` to turn these into concrete,
> idiomatic rules for this project's actual language(s).

## Type safety

- Use the strictest typing your language offers; avoid dynamic-typing escape
  hatches that defeat the checker (e.g. `any` in TypeScript, untyped `dict`
  payloads, `interface{}`/`reflect` in Go). Type values at the boundary, then
  trust them inward.
- Make illegal states unrepresentable where the language allows it.

## Error handling

- Pick one error strategy per layer and stay consistent (a result/either type,
  exceptions, or returned errors — whatever your language and codebase favor).
  Do not mix styles within a module.
- Never swallow an error silently — log it or propagate it.

## Function size

- Keep functions small and single-purpose. When one grows past what fits on a
  screen, extract a helper with a descriptive name.

## Module & import ordering

- Group imports/dependencies consistently (external → internal → types, or your
  language's convention) and keep the order stable across files.

## Naming

- Follow your language's idiomatic conventions consistently (e.g. `camelCase` vs
  `snake_case`). Booleans read as predicates (`isReady`, `has_access`). Avoid
  abbreviations unless domain-standard.

> Run ai-init to replace these principles with rules derived from your actual
> codebase and language idioms.
