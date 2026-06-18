---
name: tenant-build
description: Onboard a new tenant end-to-end — config, isolation wiring, provisioning, verification — under the multi-tenant rule, gated before the tenant goes live.
tier: deep
id: skill/tenant-build
surface: skill
summary: Onboard a new tenant end-to-end (config, isolation, provisioning, verify) under the multi-tenant rule
tags: [multi-tenant, provisioning]
appliesWhen:
  any:
    - contains: "tenant"
    - contains: "multi-tenant"
    - contains: "onboard"
rationale: Provisioning op of the multi-tenant chain; runs the multi-tenant rule into the concrete act of standing up a tenant safely
stability: stable
---

# Skill: tenant-build

> **`/tenant-build help`** — if the invocation argument is `help` (or `--help`),
> print this card verbatim and stop; do not run the skill.
>
> - **What:** Onboards a new tenant end-to-end — config, isolation wiring, provisioning, verification.
> - **When:** A new tenant needs to be stood up (customer onboarding, a new environment).
> - **Gates / asks:** Confirms the isolation model + the tenant's config before provisioning; go-live is a human gate.
> - **Output:** A provisioned, verified tenant + the config/provisioning changes, on a branch/PR.
> - **Chain:** Multi-tenant chain — gated by the `multi-tenant` rule; the isolation it wires respects `config-secrets`.
> - **Example:** `/tenant-build` for customer Acme (EU region)

The `multi-tenant` rule says tenant isolation is a first-class property and a
shared-system bug is every tenant's incident. This skill **stands up a new
tenant** under that bar: it wires the isolation model, provisions the tenant's
config and resources, and verifies the tenant is correctly fenced before it ever
goes live. A mis-provisioned tenant (cross-tenant leak, wrong region, missing
keys) is a production incident waiting — so go-live is a human gate.

---

## Phase 1 — Align the isolation model

`ai-init` records the project's tenant model. If not recorded, confirm once:

- **Isolation model** — shared DB with tenant-id discriminator, schema-per-tenant,
  or DB-per-tenant. This skill wires exactly that, no improvising.
- **Tenant config shape** — the tenant's identity (id/slug), region, feature flags,
  limits, and the secrets/keys it needs (referenced, never inlined — see
  `config-secrets`).
- **Provisioning path** — config file / DB row / IaC / an internal API; whichever
  the project uses.

---

## Phase 2 — Provision

Apply the tenant's config through the project's provisioning path:

- **Isolation wiring** — set the tenant-id/scope everywhere it must be enforced
  (DB discriminator, key namespace, cache prefix, storage prefix). No
  shared-default fallback that could cross tenants.
- **Config & limits** — region, feature flags, rate/quotas per the tenant's tier.
- **Secrets/keys** — reference the secret manager; never inline a key in config.
- **Idempotent** — provisioning the same tenant twice yields the same tenant, not
  duplicates; re-running is safe.

---

## Phase 3 — Verify (before go-live)

Prove the tenant is correctly fenced:

- **Isolation check** — the tenant sees only its own data; a request scoped to
  tenant A cannot read tenant B (the shared-system-leak check the `multi-tenant`
  rule exists for).
- **Config check** — region/flags/limits take effect; the tenant's keys resolve.
- **Smoke** — the tenant's core flow works end-to-end in the target environment.

---

## Hand-off

> Tenant [id] provisioned ([isolation model], [region]): isolation verified
> (no cross-tenant access), config applied, smoke green. Ready for go-live on
> your approval.

The skill proposes; the human decides. **Go-live is a human gate** — present this
Hand-off as a structured question when your harness supports option dialogs
(ADR-015): `Approve — go live` / `Adjust first` / `Hold`.

---

## Rules

- Wire exactly the project's isolation model (`ai-init`); don't improvise a
  different model per tenant.
- Isolation is verified before go-live: a request scoped to one tenant cannot read
  another — the shared-system-leak check.
- Secrets/keys are referenced from the secret manager, never inlined in config
  (see `config-secrets`).
- Provisioning is idempotent — re-running yields the same tenant, not duplicates.
- Go-live is a human gate, never auto-applied by the skill.
