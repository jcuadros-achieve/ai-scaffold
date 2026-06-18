---
id: rule/stack-python
surface: rule
title: "Stack: Python"
summary: Idiomatic Python — packaging, explicit typing, dependency hygiene, dependency injection at boundaries
tags: [stack, python]
appliesWhen:
  any:
    - file: "**/pyproject.toml"
    - file: "**/requirements.txt"
    - file: "**/setup.py"
    - lang: python
rationale: Python-specific conventions the core rules can't carry generically; applies wherever Python exists
stability: stable
---

# Stack: Python rules

> Generic defaults. Run `ai-init` to record the Python version, packaging tool
> (pip/poetry/uv), web framework (if any), and the test runner.

Python's flexibility cuts both ways — the conventions around typing, packaging,
and dependencies are what keep a Python codebase maintainable and deployable.

## Typing & style

- **Type hints on public functions and module boundaries.** Internal helpers can
  be untyped, but anything imported or called across modules is annotated.
- Validate untrusted input at the boundary with a schema (pydantic, attrs), not
  ad-hoc — typed internally, validated at the edge.
- `ruff`/`black` formatting is machine-enforced; `mypy`/`pyright` is a gate on
  the annotated surface.

## Packaging & dependencies

- One declared tool: `pyproject.toml` (modern) or `requirements.txt` pinned with
  a lockfile. Don't mix `pip install` ad-hoc with a declared manifest — pick one
  source of truth.
- Pin deliberately; a floating top-level dep is a reproducibility bug. Keep the
  lockfile honest — `ai-init` records the tool.
- Environments are isolated (venv/virtualenv/uv); never "works on my machine"
  against the system interpreter.

## Structure

- A clear entry point (`__main__.py`, a `main()`), thin at the edges. Logic in
  modules with explicit imports, not `from x import *`.
- Exceptions: catch what you handle, at the right layer; never a bare `except:`
  that swallows everything. Re-raise or convert to a domain error.

## Tooling

- `ruff` (lint+format) is the modern gate; `mypy`/`pyright` on annotated code.
- `pytest` is the default test runner. Coverage is a floor on changed code.

> Run ai-init to record the Python version, packaging tool, framework, and test
> runner.
