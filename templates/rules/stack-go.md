---
id: rule/stack-go
surface: rule
title: "Stack: Go"
summary: Idiomatic Go — error handling, concurrency, layout cmd/pkg, context propagation
tags: [stack, go]
appliesWhen:
  any:
    - file: "**/go.mod"
    - lang: go
rationale: Go-specific conventions the core rules can't carry generically; applies wherever Go exists
stability: stable
---

# Stack: Go rules

> Generic defaults. Run `ai-init` to record the module path, Go version, HTTP
> framework (if any), and the project's layout (cmd/pkg/internal).

Go's value is in its idioms — the language is small, but the conventions around
errors, concurrency, and structure are where a Go program becomes maintainable
or a liability.

## Errors

- **Errors are values, returned explicitly.** Check every error; never `_ =`. A
  swallowed error is a future debugging session.
- Wrap with context as you bubble up: `fmt.Errorf("doing X: %w", err)` — the `%w`
  preserves the chain for `errors.Is`/`errors.As`.
- Define sentinel errors (`var ErrFoo = errors.New(...)`) for cases callers
  branch on; prefer typed errors for richer cases. Don't string-compare errors.

## Concurrency

- **`context.Context` is the first argument** of any function that can be
  cancelled or time out; propagate it, don't store it in structs.
- Goroutines have an owner and a lifecycle — never launch a goroutine without
  knowing when it stops. Leaked goroutines leak resources.
- Protect shared state with channels or `sync` primitives; the race detector
  (`-race`) is a hard gate, not optional.

## Structure

- `cmd/<name>/main.go` is thin — parse flags, wire deps, run. Logic lives in
  `pkg/` (importable) or `internal/` (private to this module).
- Interfaces are defined by the **consumer**, kept small, and accepted as
  arguments — don't define an interface for every struct preemptively.
- Keep packages focused; avoid `util`/`common` grab-bags. A package name should
  describe what it provides.

## Tooling

- `gofmt`/`goimports` are non-negotiable and machine-enforced; a failing format
  check blocks the PR.
- `go vet` is a gate. Treat the race detector and `go test` as the contract.

> Run ai-init to record the module path, Go version, HTTP framework, and layout.
