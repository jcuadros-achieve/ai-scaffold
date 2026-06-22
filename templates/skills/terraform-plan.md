---
name: terraform-plan
description: Run terraform fmt/validate/plan safely and report the plan for human review before any apply.
tier: fast
id: skill/terraform-plan
surface: skill
summary: Run terraform fmt/validate/plan safely and report the plan for human review
tags: [terraform, iac, planning]
appliesWhen:
  any:
    - file: "**/*.tf"
    - file: "**/*.tf.json"
rationale: IaC changes need a reviewed plan; only relevant where Terraform exists
stability: stable
---

# Skill: terraform-plan

> **`/terraform-plan help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Formats, validates, and plans a Terraform change, then reports the
>   plan for a human to read.
> - **When:** You've changed `.tf` and need to know the real impact before
>   proposing an apply.
> - **Gates / asks:** Selects the workspace/env with your approval; **never
>   applies** — `apply` is a separate, explicitly-approved action.
> - **Output:** A plan summary calling out creates, **in-place updates**,
>   **replaces (+/-)**, and **destroys (-)**, with the risky lines highlighted.
> - **Chain:** On-demand; pairs with `terraform-reviewer` (read the plan) and the
>   work chain if a fix is needed.
> - **Example:** `/terraform-plan` after editing `main.tf`

Produce a safe, reviewed plan. The plan is the unit of truth for an IaC change —
the `.tf` diff hides destroys and force-replaces that the plan reveals.

---

## Phase 1 — Scope the run

Find the module root (the directory with the backend block or the nearest
`.terraform/`). Confirm the **workspace / environment** with the user before
running anything — `terraform plan` is environment-scoped, and the wrong
workspace is the most common mistake here. Never assume prod.

If the working tree is dirty in unrelated files, scope the plan to the changed
module rather than running across the repo.

---

## Phase 2 — Format and validate

1. `terraform fmt -check -diff` on the changed files; `terraform fmt` to fix
   formatting if you are allowed to write.
2. `terraform init` if providers/modules changed (with approval — it can mutate
   `.terraform/`).
3. `terraform validate`. A validation failure is a hard stop — report it, don't
   paper over it.

`fmt` and `validate` are machine-enforced gates; failing either blocks the PR.

---

## Phase 3 — Plan

Run `terraform plan -out=<file>` against the confirmed workspace and capture the
human-readable plan. Do **not** pipe it through anything that drops the
`+/-`/`-` markers.

Read the plan and classify every action:

- **Create (+)** — low risk; note any that bring cost or new IAM.
- **Update (~)** — in-place; note field changes to things that can't change
  without disruption.
- **Replace (+/-)** — **the danger zone.** Resource destroyed and recreated. Call
  out each by name and why (which argument forced it).
- **Destroy (-)** — explicit-decision territory. Never let a destroy pass
  unremarked.

---

## Phase 4 — Report

Present:

- the env/workspace planned;
- counts by action;
- every **replace** and **destroy** with a one-line reason and the forcing
  argument;
- any new IAM, public exposure, or cost-bearing resource.

---

## Hand-off

> Plan ready for **<env>**: N create, M update, R replace, D destroy (R/D listed
> above). `terraform apply` is a separate action that needs your explicit
> approval — proceed, adjust, or stop?

The skill never applies. Present this Hand-off as a structured question where the
harness supports option dialogs (ADR-015): `Approve apply` / `Adjust first` /
`Plan only — stop`. If approved, `apply` the saved plan file (`-out=`), not a
fresh run.

---

## Rules

- Confirm the workspace/env before planning — the wrong one is the #1 mistake.
- The plan, not the `.tf` diff, is the review unit; destroys/replaces are called
  out by name.
- `fmt`/`validate` are hard gates.
- Never `apply` without explicit human approval, and apply the reviewed plan
  file, not a new run.
- Secrets never appear in plan output in plaintext; if they do, flag it as a
  config bug.
