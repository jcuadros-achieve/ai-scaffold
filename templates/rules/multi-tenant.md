---
id: rule/multi-tenant
surface: rule
title: "Multi-tenant"
summary: Tenant isolation is first-class — no shared-default cross-tenant leak, scope enforced everywhere, isolation tested as a gate
tags: [multi-tenant, security, architecture]
appliesWhen:
  any:
    - contains: "tenant"
    - contains: "multi-tenant"
    - contains: "workspac" 
rationale: Applies wherever more than one tenant shares a system; a shared-system isolation bug is every tenant's incident
stability: stable
---

# Multi-tenant rules

> Generic defaults. Run `ai-init` to record the isolation model
> (tenant-id discriminator / schema-per-tenant / db-per-tenant) and the tenant
> config source.

In a multi-tenant system, every data access is scoped to a tenant. A single
missing scope is a cross-tenant leak — and because the system is shared, one leak
is *every* tenant's incident. Isolation isn't a feature you add once; it's a
property you enforce on every query, every key, every cache entry, every test.

## Isolation is enforced, not assumed

- **Every data access carries the tenant scope.** A query without a tenant-id
  filter, a cache key without the tenant prefix, a storage path without the tenant
  namespace — each is a cross-tenant leak waiting. There is no "default tenant"
  fallback; an unscoped access fails closed, not open.
- **The isolation model is one, and explicit** (recorded by `ai-init`): a shared
  store with a tenant-id discriminator, schema-per-tenant, or db-per-tenant. Don't
  mix models; don't improvise per request.
- **Tenant context propagates** with the request/trace; a flow that drops tenant
  context mid-request and falls back to a shared default is the classic leak.

## Secrets, config, limits

- **Tenant secrets are isolated** — keys/namespaces per tenant, referenced from the
  secret manager, never a shared key across tenants (see `config-secrets`).
- **Tenant config & limits are explicit** — region, feature flags, rate/quotas per
  tier; no tenant silently inherits another's config.
- **Provisioning is idempotent** — standing up a tenant twice yields one tenant,
  not duplicates or overlapping scopes.

## Isolation is tested

- **Isolation is a test gate, not a hope.** There is a test that proves a request
  scoped to tenant A cannot read tenant B's data — the shared-system-leak check —
  and it runs in CI. A multi-tenant system without this test is unproven.
- A change that touches data access runs the isolation test; a failure blocks the
  merge (see `ci-gates`).

> Run ai-init to record the isolation model and the tenant config source.
